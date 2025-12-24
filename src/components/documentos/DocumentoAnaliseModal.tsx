import { useState } from "react";
import { CheckCircle2, XCircle, FileText, ExternalLink, Sparkles, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DocumentoPreviewButton } from "@/components/documentos/DocumentoPreviewButton";
import { GoogleDrivePreviewButton } from "@/components/documentos/GoogleDrivePreviewButton";
import { DocumentoHistorico } from "@/components/documentos/DocumentoHistorico";
import { useAIGenerate } from "@/hooks/useAIGenerate";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DocumentoInfo {
  id: string;
  nome: string;
  descricao?: string;
  criterios_aceitacao?: string;
}

interface StatusInfo {
  id: string;
  status: string;
  updated_at?: string;
}

interface DocumentoArquivoInfo {
  id: string;
  nome: string;
  url?: string | null;
  drive_file_id?: string | null;
  storage_path?: string | null;
}

interface DocumentoAnaliseModalProps {
  documento: DocumentoInfo;
  status: StatusInfo;
  documentoUrl?: string;
  documentoArquivo?: DocumentoArquivoInfo;
  open: boolean;
  onClose: () => void;
  onAprovar: () => Promise<void>;
  onRejeitar: (observacao: string) => Promise<void>;
  isLoading?: boolean;
}

export function DocumentoAnaliseModal({
  documento,
  status,
  documentoUrl,
  documentoArquivo,
  open,
  onClose,
  onAprovar,
  onRejeitar,
  isLoading = false,
}: DocumentoAnaliseModalProps) {
  const [showRejeicaoForm, setShowRejeicaoForm] = useState(false);
  const [observacao, setObservacao] = useState("");
  const [aiSugestao, setAiSugestao] = useState<{ tipo: "aprovar" | "rejeitar"; justificativa: string } | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  const { generate } = useAIGenerate();

  const handleDownload = async (storagePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage.from("documentos").download(storagePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading:", error);
      toast.error("Erro ao baixar documento");
    }
  };

  const handleAnaliseIA = async () => {
    setLoadingAI(true);
    setAiSugestao(null);

    const prompt = `Você é um especialista em Governança e Compliance analisando um documento enviado por um cliente.

**Documento:** ${documento.nome}
${documento.descricao ? `**Descrição:** ${documento.descricao}` : ""}
${documento.criterios_aceitacao ? `**Critérios de Aceitação:** ${documento.criterios_aceitacao}` : ""}

Com base nos critérios de aceitação e boas práticas, analise se este tipo de documento geralmente deve ser aprovado ou se há pontos de atenção comuns.

Responda APENAS no seguinte formato JSON (sem markdown, apenas o JSON puro):
{"tipo": "aprovar" ou "rejeitar", "justificativa": "Sua justificativa detalhada aqui"}

Se não houver critérios específicos, assuma que o documento deve ser aprovado se estiver legível e completo.`;

    try {
      const result = await generate({
        tipo: "analise_documento",
        input_data: { 
          prompt,
          documento_nome: documento.nome,
          criterios: documento.criterios_aceitacao
        },
        stream: false,
      });

      if (result.success && result.output) {
        try {
          // Try to parse the JSON response
          const jsonMatch = result.output.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            setAiSugestao({
              tipo: parsed.tipo === "rejeitar" ? "rejeitar" : "aprovar",
              justificativa: parsed.justificativa || "Análise concluída",
            });
          } else {
            // Fallback: assume approval if can't parse
            setAiSugestao({
              tipo: "aprovar",
              justificativa: result.output,
            });
          }
        } catch {
          setAiSugestao({
            tipo: "aprovar",
            justificativa: result.output,
          });
        }
      }
    } catch (error) {
      console.error("Error analyzing document:", error);
      toast.error("Erro ao analisar documento com IA");
    } finally {
      setLoadingAI(false);
    }
  };

  const handleAprovar = async () => {
    await onAprovar();
    onClose();
  };

  const handleRejeitar = async () => {
    if (!observacao.trim()) return;
    await onRejeitar(observacao);
    setObservacao("");
    setShowRejeicaoForm(false);
    onClose();
  };

  const handleClose = () => {
    setShowRejeicaoForm(false);
    setObservacao("");
    setAiSugestao(null);
    onClose();
  };

  const handleUseSugestao = () => {
    if (aiSugestao?.tipo === "rejeitar") {
      setObservacao(aiSugestao.justificativa);
      setShowRejeicaoForm(true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Analisar Documento</DialogTitle>
          <DialogDescription>{documento.nome}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Document Preview Link */}
          <div className="bg-muted rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-primary" />
                <div>
                  <p className="font-medium text-foreground">{documento.nome}</p>
                  {status.updated_at && (
                    <p className="text-sm text-muted-foreground">
                      Enviado em {new Date(status.updated_at).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {documentoArquivo?.id && (
                  <DocumentoHistorico
                    documentoId={documentoArquivo.id}
                    documentoNome={documentoArquivo.nome}
                  />
                )}

                {(documentoArquivo?.url || null) && (
                  <DocumentoPreviewButton
                    url={documentoArquivo?.url ?? null}
                    fileName={documentoArquivo?.nome ?? documento.nome}
                  />
                )}

                {(documentoArquivo?.drive_file_id || null) && (
                  <GoogleDrivePreviewButton
                    driveFileId={documentoArquivo?.drive_file_id ?? null}
                    fileName={documentoArquivo?.nome ?? documento.nome}
                  />
                )}

                {documentoArquivo?.storage_path && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(documentoArquivo.storage_path!, documentoArquivo.nome)}
                  >
                    Baixar
                  </Button>
                )}

                {!documentoArquivo?.url && !documentoArquivo?.drive_file_id && !documentoArquivo?.storage_path && documentoUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={documentoUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Abrir
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* AI Analysis Button */}
          {!showRejeicaoForm && !aiSugestao && (
            <Button
              variant="outline"
              onClick={handleAnaliseIA}
              disabled={loadingAI}
              className="w-full"
            >
              {loadingAI ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Analisando com IA...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Analisar com IA
                </>
              )}
            </Button>
          )}

          {/* AI Suggestion */}
          {aiSugestao && !showRejeicaoForm && (
            <Alert className={aiSugestao.tipo === "aprovar" ? "border-green-500" : "border-amber-500"}>
              <Sparkles className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Sugestão da IA:</span>
                    <Badge variant={aiSugestao.tipo === "aprovar" ? "default" : "destructive"}>
                      {aiSugestao.tipo === "aprovar" ? "Aprovar" : "Rejeitar"}
                    </Badge>
                  </div>
                  <ScrollArea className="max-h-32">
                    <p className="text-sm">{aiSugestao.justificativa}</p>
                  </ScrollArea>
                  {aiSugestao.tipo === "rejeitar" && (
                    <Button variant="outline" size="sm" onClick={handleUseSugestao}>
                      Usar sugestão como motivo
                    </Button>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Rejeição Form */}
          {showRejeicaoForm && (
            <div className="space-y-3">
              <Label htmlFor="observacao">Motivo da rejeição *</Label>
              <Textarea
                id="observacao"
                placeholder="Descreva o motivo da rejeição e o que precisa ser corrigido..."
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {showRejeicaoForm ? (
            <>
              <Button
                variant="outline"
                onClick={() => setShowRejeicaoForm(false)}
                disabled={isLoading}
              >
                Voltar
              </Button>
              <Button
                variant="destructive"
                onClick={handleRejeitar}
                disabled={!observacao.trim() || isLoading}
              >
                {isLoading ? "Processando..." : "Confirmar Rejeição"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                Cancelar
              </Button>
              <Button
                variant="outline"
                className="text-destructive border-destructive hover:bg-destructive/10"
                onClick={() => setShowRejeicaoForm(true)}
                disabled={isLoading}
              >
                <XCircle className="w-4 h-4 mr-1" />
                Rejeitar
              </Button>
              <Button onClick={handleAprovar} disabled={isLoading}>
                <CheckCircle2 className="w-4 h-4 mr-1" />
                {isLoading ? "Processando..." : "Aprovar"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}