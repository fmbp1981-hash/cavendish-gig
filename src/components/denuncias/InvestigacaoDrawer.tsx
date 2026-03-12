import { useState, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2, MessageSquare, Paperclip, ArrowRight, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Investigacao,
  InvestigacaoStatus,
  STATUS_LABEL,
  STATUS_COR,
  NIVEL_COR,
  proximoStatus,
  useInvestigacaoNotas,
  useInvestigacaoEvidencias,
  useAvancarInvestigacao,
  useAdicionarNota,
  useAdicionarEvidencia,
} from "@/hooks/useInvestigacoes";
import { cn } from "@/lib/utils";

interface Props {
  investigacao: Investigacao | null;
  onClose: () => void;
}

export function InvestigacaoDrawer({ investigacao, onClose }: Props) {
  const [novaNota, setNovaNota] = useState("");
  const [novaEvidDesc, setNovaEvidDesc] = useState("");
  const [conclusao, setConclusao] = useState(investigacao?.conclusao ?? "");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: notas, isLoading: loadNotas } = useInvestigacaoNotas(investigacao?.id ?? "");
  const { data: evidencias, isLoading: loadEvid } = useInvestigacaoEvidencias(investigacao?.id ?? "");
  const avancar = useAvancarInvestigacao();
  const adicionarNota = useAdicionarNota();
  const adicionarEvid = useAdicionarEvidencia();

  if (!investigacao) return null;

  const proximo = proximoStatus(investigacao.status);
  const isConcluindo = proximo === "concluida";

  const handleAvancar = async () => {
    if (!proximo) return;
    await avancar.mutateAsync({
      id: investigacao.id,
      status: proximo,
      conclusao: isConcluindo ? conclusao : undefined,
    });
  };

  const handleAdicionarNota = async () => {
    if (!novaNota.trim()) return;
    await adicionarNota.mutateAsync({ investigacaoId: investigacao.id, nota: novaNota.trim() });
    setNovaNota("");
  };

  const handleAdicionarEvidencia = async () => {
    if (!novaEvidDesc.trim()) return;

    let arquivoUrl: string | undefined;

    if (selectedFile) {
      setUploadingFile(true);
      try {
        const path = `investigacoes/${investigacao.id}/${Date.now()}-${selectedFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("documentos")
          .upload(path, selectedFile);
        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("documentos")
            .getPublicUrl(path);
          arquivoUrl = urlData?.publicUrl;
        }
      } catch {
        // silently continue without arquivo_url
      } finally {
        setUploadingFile(false);
      }
    }

    await adicionarEvid.mutateAsync({
      investigacaoId: investigacao.id,
      descricao: novaEvidDesc.trim(),
      arquivoUrl,
    });
    setNovaEvidDesc("");
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const denuncia = investigacao.denuncias as any;

  return (
    <Sheet open={!!investigacao} onOpenChange={v => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-base">
            Investigação — {denuncia?.ticket_id ?? investigacao.id.slice(0, 8)}
          </SheetTitle>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={cn("text-xs", STATUS_COR[investigacao.status])}>
              {STATUS_LABEL[investigacao.status]}
            </Badge>
            {investigacao.nivel_risco && (
              <Badge className={cn("text-xs", NIVEL_COR[investigacao.nivel_risco])}>
                Risco: {investigacao.nivel_risco}
              </Badge>
            )}
            {investigacao.categoria_triagem && (
              <Badge variant="secondary" className="text-xs">{investigacao.categoria_triagem}</Badge>
            )}
          </div>
        </SheetHeader>

        {/* Dados da denúncia */}
        {denuncia && (
          <div className="mb-4 rounded-lg bg-muted/40 px-3 py-3 space-y-1.5 text-sm">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Denúncia vinculada</p>
            <p><span className="text-muted-foreground">Categoria:</span> {denuncia.categoria}</p>
            <p className="text-xs text-muted-foreground line-clamp-3">{denuncia.descricao}</p>
          </div>
        )}

        {/* Avançar status */}
        {proximo && (
          <div className="mb-4 space-y-2">
            {isConcluindo && (
              <div className="space-y-1.5">
                <Label>Conclusão da investigação</Label>
                <Textarea
                  placeholder="Descreva os achados e a conclusão..."
                  value={conclusao}
                  onChange={e => setConclusao(e.target.value)}
                  rows={3}
                />
              </div>
            )}
            <Button
              size="sm"
              onClick={handleAvancar}
              disabled={avancar.isPending || (isConcluindo && !conclusao.trim())}
              className="w-full"
            >
              {avancar.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <ArrowRight className="h-3.5 w-3.5 mr-1.5" />}
              Mover para: {STATUS_LABEL[proximo]}
            </Button>
          </div>
        )}

        {investigacao.status === "concluida" && investigacao.conclusao && (
          <div className="mb-4 rounded-lg bg-green-50 dark:bg-green-900/20 px-3 py-2.5">
            <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">Conclusão</p>
            <p className="text-sm text-green-800 dark:text-green-300">{investigacao.conclusao}</p>
          </div>
        )}

        <Separator className="my-4" />

        {/* Notas internas */}
        <div className="space-y-3 mb-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" />
            Notas internas sigilosas ({notas?.length ?? 0})
          </p>

          {loadNotas ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : notas && notas.length > 0 ? (
            <ul className="space-y-2">
              {notas.map(n => (
                <li key={n.id} className="rounded-lg bg-muted/30 px-3 py-2 space-y-0.5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{(n as any).profiles?.nome ?? "—"}</span>
                    <span>{format(new Date(n.created_at), "dd/MM HH:mm", { locale: ptBR })}</span>
                  </div>
                  <p className="text-sm">{n.nota}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground italic">Nenhuma nota ainda.</p>
          )}

          <div className="flex gap-2">
            <Textarea
              placeholder="Adicionar nota interna..."
              value={novaNota}
              onChange={e => setNovaNota(e.target.value)}
              rows={2}
              className="flex-1 text-sm resize-none"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleAdicionarNota}
              disabled={!novaNota.trim() || adicionarNota.isPending}
              className="self-end"
            >
              {adicionarNota.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Salvar"}
            </Button>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Evidências */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <Paperclip className="h-3.5 w-3.5" />
            Evidências ({evidencias?.length ?? 0})
          </p>

          {loadEvid ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : evidencias && evidencias.length > 0 ? (
            <ul className="space-y-1.5">
              {evidencias.map(e => (
                <li key={e.id} className="flex items-start gap-2 rounded-lg bg-muted/30 px-3 py-2 text-sm">
                  <Paperclip className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p>{e.descricao}</p>
                    {e.arquivo_url && (
                      <a
                        href={e.arquivo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Ver arquivo
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground italic">Nenhuma evidência registrada.</p>
          )}

          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Descrição da evidência..."
                value={novaEvidDesc}
                onChange={e => setNovaEvidDesc(e.target.value)}
                className="flex-1 h-8 text-sm"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleAdicionarEvidencia}
                disabled={!novaEvidDesc.trim() || adicionarEvid.isPending || uploadingFile}
                className="h-8 px-3"
              >
                {adicionarEvid.isPending || uploadingFile
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : "Add"}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf,.doc,.docx"
                className="hidden"
                onChange={e => setSelectedFile(e.target.files?.[0] ?? null)}
              />
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-muted-foreground"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="h-3.5 w-3.5 mr-1" />
                {selectedFile ? selectedFile.name : "Anexar arquivo (opcional)"}
              </Button>
              {selectedFile && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-muted-foreground"
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                >
                  Remover
                </Button>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
