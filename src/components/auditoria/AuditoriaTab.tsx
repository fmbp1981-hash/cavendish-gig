import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Plus,
  Search,
  ChevronDown,
  ChevronRight,
  Loader2,
  ClipboardList,
  Activity,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useOrganizacoes } from "@/hooks/useConsultorData";
import {
  useAuditorias,
  useCriarAuditoria,
  useAtualizarAuditoria,
  useNaoConformidades,
  useCriarNaoConformidade,
  AuditoriaInterna,
  AuditoriaStatus,
  NaoConformidadeGravidade,
  STATUS_LABEL,
  STATUS_COR,
  GRAVIDADE_LABEL,
  GRAVIDADE_COR,
  NC_STATUS_LABEL,
} from "@/hooks/useAuditorias";

// ─── Nova Auditoria Dialog ────────────────────────────────────────────────────

interface NovaAuditoriaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgs: Array<{ id: string; nome: string }>;
}

function NovaAuditoriaDialog({ open, onOpenChange, orgs }: NovaAuditoriaDialogProps) {
  const criar = useCriarAuditoria();
  const [orgId, setOrgId] = useState("");
  const [titulo, setTitulo] = useState("");
  const [auditor, setAuditor] = useState("");
  const [escopo, setEscopo] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [resultado, setResultado] = useState("");

  const reset = () => {
    setOrgId(""); setTitulo(""); setAuditor(""); setEscopo("");
    setDataInicio(""); setDataFim(""); setResultado("");
  };

  const handleSubmit = async () => {
    if (!orgId || !titulo || !auditor || !dataInicio) return;
    await criar.mutateAsync({
      organization_id: orgId,
      titulo,
      auditor,
      data_inicio: dataInicio,
      escopo: escopo || null,
      data_fim: dataFim || null,
      resultado: resultado || null,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Nova Auditoria Interna</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Organização *</Label>
            <Select value={orgId} onValueChange={setOrgId}>
              <SelectTrigger><SelectValue placeholder="Selecione a organização" /></SelectTrigger>
              <SelectContent>
                {orgs.map(o => <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Título *</Label>
            <Input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Auditoria de Conformidade LGPD" />
          </div>
          <div className="space-y-1.5">
            <Label>Auditor Responsável *</Label>
            <Input value={auditor} onChange={e => setAuditor(e.target.value)} placeholder="Nome do auditor" />
          </div>
          <div className="space-y-1.5">
            <Label>Escopo</Label>
            <Textarea value={escopo} onChange={e => setEscopo(e.target.value)} placeholder="Descreva o escopo da auditoria..." rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Data de Início *</Label>
              <Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Data de Conclusão</Label>
              <Input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Resultado</Label>
            <Textarea value={resultado} onChange={e => setResultado(e.target.value)} placeholder="Conclusões e resultado da auditoria..." rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onOpenChange(false); }}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={criar.isPending || !orgId || !titulo || !auditor || !dataInicio}>
            {criar.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Criar Auditoria
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── NC Row ──────────────────────────────────────────────────────────────────

function AddNCDialog({
  auditoriaId,
  open,
  onOpenChange,
}: {
  auditoriaId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const criar = useCriarNaoConformidade();
  const [descricao, setDescricao] = useState("");
  const [gravidade, setGravidade] = useState<NaoConformidadeGravidade>("menor");
  const [acaoCorretiva, setAcaoCorretiva] = useState("");
  const [prazo, setPrazo] = useState("");

  const reset = () => { setDescricao(""); setGravidade("menor"); setAcaoCorretiva(""); setPrazo(""); };

  const handleSubmit = async () => {
    if (!descricao) return;
    await criar.mutateAsync({
      auditoria_id: auditoriaId,
      descricao,
      gravidade,
      acao_corretiva: acaoCorretiva || null,
      prazo: prazo || null,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Não Conformidade</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Descrição *</Label>
            <Textarea value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Descreva a não conformidade..." rows={3} />
          </div>
          <div className="space-y-1.5">
            <Label>Gravidade *</Label>
            <Select value={gravidade} onValueChange={v => setGravidade(v as NaoConformidadeGravidade)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(GRAVIDADE_LABEL) as NaoConformidadeGravidade[]).map(g => (
                  <SelectItem key={g} value={g}>{GRAVIDADE_LABEL[g]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Ação Corretiva</Label>
            <Textarea value={acaoCorretiva} onChange={e => setAcaoCorretiva(e.target.value)} placeholder="Ação corretiva planejada..." rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label>Prazo</Label>
            <Input type="date" value={prazo} onChange={e => setPrazo(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onOpenChange(false); }}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={criar.isPending || !descricao}>
            {criar.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Auditoria Row com NC accordion ──────────────────────────────────────────

function AuditoriaRow({
  auditoria,
  onChangeStatus,
}: {
  auditoria: AuditoriaInterna;
  onChangeStatus: (id: string, status: AuditoriaStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const [addNCOpen, setAddNCOpen] = useState(false);
  const { data: ncs, isLoading: ncsLoading } = useNaoConformidades(auditoria.id);

  const periodo =
    auditoria.data_inicio
      ? format(new Date(auditoria.data_inicio), "dd/MM/yyyy", { locale: ptBR }) +
        (auditoria.data_fim
          ? " → " + format(new Date(auditoria.data_fim), "dd/MM/yyyy", { locale: ptBR })
          : " → em aberto")
      : "—";

  return (
    <div className="border rounded-lg">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center gap-4 p-4 hover:bg-muted/40 transition-colors text-left">
            {open ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-sm">{auditoria.titulo}</p>
                <Badge className={STATUS_COR[auditoria.status]} variant="outline">
                  {STATUS_LABEL[auditoria.status]}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Auditor: {auditoria.auditor} · {periodo}
              </p>
            </div>
            <div onClick={e => e.stopPropagation()} className="shrink-0">
              <Select
                value={auditoria.status}
                onValueChange={v => onChangeStatus(auditoria.id, v as AuditoriaStatus)}
              >
                <SelectTrigger className="w-36 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUS_LABEL) as AuditoriaStatus[]).map(s => (
                    <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-3 border-t pt-3">
            {auditoria.escopo && (
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Escopo:</span> {auditoria.escopo}
              </div>
            )}
            {auditoria.resultado && (
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Resultado:</span> {auditoria.resultado}
              </div>
            )}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Não Conformidades ({ncs?.length ?? 0})</p>
                <Button variant="outline" size="sm" onClick={() => setAddNCOpen(true)}>
                  <Plus className="h-3 w-3 mr-1" />Adicionar NC
                </Button>
              </div>
              {ncsLoading ? (
                <Skeleton className="h-12" />
              ) : !ncs?.length ? (
                <p className="text-xs text-muted-foreground py-2">Nenhuma não conformidade registrada.</p>
              ) : (
                <div className="space-y-2">
                  {ncs.map(nc => (
                    <div key={nc.id} className="rounded-lg border bg-muted/30 p-3 text-sm space-y-1">
                      <div className="flex items-start gap-2">
                        <Badge className={GRAVIDADE_COR[nc.gravidade]} variant="outline">
                          {GRAVIDADE_LABEL[nc.gravidade]}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {NC_STATUS_LABEL[nc.status]}
                        </Badge>
                        {nc.prazo && (
                          <span className="text-xs text-muted-foreground ml-auto">
                            Prazo: {format(new Date(nc.prazo), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        )}
                      </div>
                      <p className="text-sm">{nc.descricao}</p>
                      {nc.acao_corretiva && (
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">Ação:</span> {nc.acao_corretiva}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
      <AddNCDialog auditoriaId={auditoria.id} open={addNCOpen} onOpenChange={setAddNCOpen} />
    </div>
  );
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────

export function AuditoriaTab() {
  const { data: orgs } = useOrganizacoes();
  const [selectedOrg, setSelectedOrg] = useState("");
  // Auto-seleciona a primeira org se nenhuma selecionada
  useEffect(() => {
    if (!selectedOrg && orgs && orgs.length > 0) {
      setSelectedOrg(orgs[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgs]);

  const [novaOpen, setNovaOpen] = useState(false);
  const atualizar = useAtualizarAuditoria();

  const orgId = selectedOrg || undefined;
  const { data: auditorias, isLoading } = useAuditorias(orgId);

  const orgsOptions = (orgs ?? []) as Array<{ id: string; nome: string }>;

  // Count NCs aberta across all auditorias — we show it as a stat derived from loaded data
  // Since we can't know total NCs without loading all, we show count of auditorias in_progress
  const stats = {
    total:       auditorias?.length ?? 0,
    emAndamento: auditorias?.filter(a => a.status === "em_andamento").length ?? 0,
  };

  const handleChangeStatus = async (id: string, status: AuditoriaStatus) => {
    await atualizar.mutateAsync({ id, status });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Select value={selectedOrg || "__all__"} onValueChange={v => setSelectedOrg(v === "__all__" ? "" : v)}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Todas as organizações" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todas as organizações</SelectItem>
            {orgsOptions.map(o => <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={() => setNovaOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />Nova Auditoria
        </Button>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start gap-4">
                <div className="h-11 w-11 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                  <ClipboardList className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground mt-1">Total de Auditorias</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start gap-4">
                <div className="h-11 w-11 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                  <Activity className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">{stats.emAndamento}</p>
                  <p className="text-sm text-muted-foreground mt-1">Em Andamento</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start gap-4">
                <div className="h-11 w-11 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">
                    {auditorias?.filter(a => a.status !== "concluida").length ?? 0}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Não Concluídas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista */}
      <Card>
        <CardHeader>
          <CardTitle>Auditorias Internas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : !auditorias?.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm">Nenhuma auditoria registrada</p>
            </div>
          ) : (
            <div className="space-y-3">
              {auditorias.map(a => (
                <AuditoriaRow key={a.id} auditoria={a} onChangeStatus={handleChangeStatus} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <NovaAuditoriaDialog open={novaOpen} onOpenChange={setNovaOpen} orgs={orgsOptions} />
    </div>
  );
}
