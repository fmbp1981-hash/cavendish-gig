import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Loader2, Plus, BookOpen, ChevronRight, Users, CheckCircle2, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Politica,
  PoliticaCategoria,
  CATEGORIA_LABEL,
  STATUS_LABEL,
  STATUS_COR,
  PROXIMO_STATUS,
  usePoliticas,
  useCriarPolitica,
  useAtualizarPolitica,
  useAvancarStatusPolitica,
  useRevogarPolitica,
  usePoliticaAceites,
  usePoliticaAdesaoStats,
} from "@/hooks/usePoliticas";
import { useOrganizacoes } from "@/hooks/useConsultorData";
import { cn } from "@/lib/utils";

// ─── Form Dialog ──────────────────────────────────────────────────────────────

function PoliticaFormDialog({
  open,
  onOpenChange,
  organizacaoId,
  politica,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  organizacaoId: string;
  politica?: Politica | null;
}) {
  const isEdit = !!politica;
  const criar = useCriarPolitica();
  const atualizar = useAtualizarPolitica();
  const [titulo, setTitulo] = useState(politica?.titulo ?? "");
  const [categoria, setCategoria] = useState<PoliticaCategoria>(politica?.categoria ?? "conduta");
  const [conteudo, setConteudo] = useState(politica?.conteudo ?? "");
  const [vigenciaInicio, setVigenciaInicio] = useState(politica?.data_vigencia_inicio ?? "");

  const saving = criar.isPending || atualizar.isPending;

  const handleSave = async () => {
    if (!titulo.trim()) return;
    if (isEdit && politica) {
      await atualizar.mutateAsync({ id: politica.id, titulo, categoria, conteudo: conteudo || null });
    } else {
      await criar.mutateAsync({
        organization_id: organizacaoId,
        titulo,
        categoria,
        conteudo: conteudo || undefined,
        data_vigencia_inicio: vigenciaInicio || undefined,
      });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Política" : "Nova Política"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Título *</Label>
            <Input placeholder="Ex: Política Anticorrupção" value={titulo} onChange={e => setTitulo(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Categoria</Label>
            <Select value={categoria} onValueChange={v => setCategoria(v as PoliticaCategoria)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.entries(CATEGORIA_LABEL) as [string, string][]).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Conteúdo</Label>
            <Textarea
              placeholder="Descreva o conteúdo da política..."
              value={conteudo}
              onChange={e => setConteudo(e.target.value)}
              rows={6}
            />
          </div>
          {!isEdit && (
            <div className="space-y-1.5">
              <Label>Data de vigência</Label>
              <Input type="date" value={vigenciaInicio} onChange={e => setVigenciaInicio(e.target.value)} />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!titulo.trim() || saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {isEdit ? "Salvar" : "Criar política"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Detalhe Sheet ────────────────────────────────────────────────────────────

function PoliticaDetalheSheet({
  politica,
  organizacaoId,
  onClose,
}: {
  politica: Politica | null;
  organizacaoId: string;
  onClose: () => void;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const avancar = useAvancarStatusPolitica();
  const revogar = useRevogarPolitica();
  const { data: aceites, isLoading: loadAceites } = usePoliticaAceites(politica?.id ?? "");
  const { data: stats } = usePoliticaAdesaoStats(politica?.id ?? "", organizacaoId);

  if (!politica) return null;
  const proximo = PROXIMO_STATUS[politica.status];

  return (
    <>
      <Sheet open={!!politica} onOpenChange={v => !v && onClose()}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="mb-4">
            <div className="flex items-start justify-between gap-2">
              <SheetTitle className="text-base leading-snug pr-2">{politica.titulo}</SheetTitle>
              <Badge variant="outline" className={cn("text-xs shrink-0", STATUS_COR[politica.status])}>
                {STATUS_LABEL[politica.status]}
              </Badge>
            </div>
            <Badge variant="secondary" className="w-fit">{CATEGORIA_LABEL[politica.categoria]}</Badge>
          </SheetHeader>

          <div className="flex flex-wrap gap-2 mb-4">
            <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>Editar</Button>
            {proximo && (
              <Button
                size="sm"
                onClick={() => avancar.mutate({ id: politica.id, statusAtual: politica.status })}
                disabled={avancar.isPending}
              >
                <ArrowRight className="h-3.5 w-3.5 mr-1.5" />
                Mover para: {STATUS_LABEL[proximo]}
              </Button>
            )}
            {politica.status !== "revogado" && politica.status !== "rascunho" && (
              <Button
                size="sm" variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => { if (window.confirm("Revogar esta política?")) revogar.mutate(politica.id); }}
              >
                Revogar
              </Button>
            )}
          </div>

          {politica.conteudo && (
            <div className="mb-4 rounded-lg bg-muted/40 px-3 py-3 text-sm whitespace-pre-wrap">
              {politica.conteudo}
            </div>
          )}

          {/* Adesão */}
          {politica.status === "publicado" && stats && (
            <div className="mb-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Adesão dos colaboradores
              </p>
              <div className="flex items-center gap-3">
                <Progress value={stats.percentual} className="flex-1 h-2" />
                <span className="text-sm font-bold w-12 text-right">{stats.percentual}%</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.totalAceites} de {stats.totalMembros} membros aceitaram
              </p>
            </div>
          )}

          {/* Lista de aceites */}
          {politica.status === "publicado" && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Aceites registrados
              </p>
              {loadAceites ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : aceites && aceites.length > 0 ? (
                <ul className="space-y-1.5">
                  {aceites.map(a => (
                    <li key={a.id} className="flex items-center justify-between text-xs rounded-lg bg-muted/30 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                        <span>{(a as any).profiles?.nome ?? (a as any).profiles?.email ?? "—"}</span>
                      </div>
                      <span className="text-muted-foreground">
                        {format(new Date(a.aceito_em), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground italic">Nenhum aceite ainda.</p>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      <PoliticaFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        organizacaoId={organizacaoId}
        politica={politica}
      />
    </>
  );
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────

export function PoliticasTab() {
  const { data: orgs } = useOrganizacoes();
  const [selectedOrg, setSelectedOrg] = useState("");
  const [novaOpen, setNovaOpen] = useState(false);
  const [detalhe, setDetalhe] = useState<Politica | null>(null);

  const { data: politicas, isLoading } = usePoliticas(selectedOrg || undefined);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Select value={selectedOrg} onValueChange={setSelectedOrg}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Todas as organizações" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas as organizações</SelectItem>
            {(orgs ?? []).map((org: any) => (
              <SelectItem key={org.id} value={org.id}>{org.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button size="sm" onClick={() => setNovaOpen(true)} disabled={!selectedOrg}>
          <Plus className="h-4 w-4 mr-1.5" />Nova Política
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : !politicas || politicas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 gap-3 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm font-medium">Nenhuma política cadastrada</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              {selectedOrg ? "Clique em 'Nova Política' para criar." : "Selecione uma organização para ver políticas."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {politicas.map(p => (
            <Card
              key={p.id}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => setDetalhe(p)}
            >
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{p.titulo}</p>
                    <p className="text-xs text-muted-foreground">{CATEGORIA_LABEL[p.categoria]} · v{p.versao}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className={cn("text-xs", STATUS_COR[p.status])}>
                      {STATUS_LABEL[p.status]}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedOrg && (
        <PoliticaFormDialog
          open={novaOpen}
          onOpenChange={setNovaOpen}
          organizacaoId={selectedOrg}
        />
      )}

      <PoliticaDetalheSheet
        politica={detalhe}
        organizacaoId={selectedOrg}
        onClose={() => setDetalhe(null)}
      />
    </div>
  );
}
