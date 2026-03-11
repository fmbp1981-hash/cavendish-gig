import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Plus,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useOrganizacoes } from "@/hooks/useConsultorData";
import {
  useRelatoriosRegulatorios,
  useCriarRelatorioReg,
  useAtualizarRelatorioReg,
  RelatorioRegulatorio,
  RelatorioRegTipo,
  RelatorioRegStatus,
  TIPO_LABEL,
  TIPO_COR,
  STATUS_LABEL,
  STATUS_COR,
} from "@/hooks/useRelatoriosRegulatorios";

// ─── Status Next Step ─────────────────────────────────────────────────────────

const NEXT_STATUS: Record<RelatorioRegStatus, RelatorioRegStatus | null> = {
  rascunho: "revisao",
  revisao:  "entregue",
  entregue: null,
};

const NEXT_LABEL: Record<RelatorioRegStatus, string> = {
  rascunho: "Enviar p/ Revisão",
  revisao:  "Marcar como Entregue",
  entregue: "",
};

// ─── Novo Relatório Dialog ─────────────────────────────────────────────────────

interface NovoRelatorioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgs: Array<{ id: string; nome: string }>;
}

function NovoRelatorioDialog({ open, onOpenChange, orgs }: NovoRelatorioDialogProps) {
  const criar = useCriarRelatorioReg();
  const [orgId, setOrgId] = useState("");
  const [tipo, setTipo] = useState<RelatorioRegTipo>("CGU");
  const [periodo, setPeriodo] = useState("");
  const [prazo, setPrazo] = useState("");
  const [protocolo, setProtocolo] = useState("");

  const reset = () => { setOrgId(""); setTipo("CGU"); setPeriodo(""); setPrazo(""); setProtocolo(""); };

  const handleSubmit = async () => {
    if (!orgId || !periodo) return;
    await criar.mutateAsync({
      organization_id: orgId,
      tipo,
      periodo_referencia: periodo,
      prazo_entrega: prazo || null,
      protocolo: protocolo || null,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Relatório Regulatório</DialogTitle>
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
            <Label>Órgão Regulador *</Label>
            <Select value={tipo} onValueChange={v => setTipo(v as RelatorioRegTipo)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(TIPO_LABEL) as RelatorioRegTipo[]).map(t => (
                  <SelectItem key={t} value={t}>{TIPO_LABEL[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Período de Referência *</Label>
            <Input value={periodo} onChange={e => setPeriodo(e.target.value)} placeholder="Ex: 2025, 1T2025, Jan/2025" />
          </div>
          <div className="space-y-1.5">
            <Label>Prazo de Entrega</Label>
            <Input type="date" value={prazo} onChange={e => setPrazo(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Protocolo</Label>
            <Input value={protocolo} onChange={e => setProtocolo(e.target.value)} placeholder="Número do protocolo (opcional)" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onOpenChange(false); }}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={criar.isPending || !orgId || !periodo}>
            {criar.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Criar Relatório
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Entrega Dialog ───────────────────────────────────────────────────────────

function EntregaDialog({
  relatorio,
  open,
  onOpenChange,
}: {
  relatorio: RelatorioRegulatorio;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const atualizar = useAtualizarRelatorioReg();
  const [dataEntrega, setDataEntrega] = useState(new Date().toISOString().split("T")[0]);
  const [protocolo, setProtocolo] = useState(relatorio.protocolo ?? "");

  const handleSubmit = async () => {
    await atualizar.mutateAsync({
      id: relatorio.id,
      status: "entregue",
      entregue_em: new Date(dataEntrega).toISOString(),
      protocolo: protocolo || null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Registrar Entrega</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Data de Entrega *</Label>
            <Input type="date" value={dataEntrega} onChange={e => setDataEntrega(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Número do Protocolo</Label>
            <Input value={protocolo} onChange={e => setProtocolo(e.target.value)} placeholder="Ex: 12345/2025" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={atualizar.isPending}>
            {atualizar.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Confirmar Entrega
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────

export function RelatoriosRegTab() {
  const { data: orgs } = useOrganizacoes();
  const [selectedOrg, setSelectedOrg] = useState("");
  const [novoOpen, setNovoOpen] = useState(false);
  const [entregaTarget, setEntregaTarget] = useState<RelatorioRegulatorio | null>(null);
  const atualizar = useAtualizarRelatorioReg();

  const orgId = selectedOrg || undefined;
  const { data: relatorios, isLoading } = useRelatoriosRegulatorios(orgId);

  const orgsOptions = (orgs ?? []) as Array<{ id: string; nome: string }>;

  const hoje = new Date();

  const urgentes = relatorios?.filter(r => {
    if (r.status === "entregue" || !r.prazo_entrega) return false;
    const dias = differenceInDays(parseISO(r.prazo_entrega), hoje);
    return dias <= 15;
  }) ?? [];

  const stats = {
    total:     relatorios?.length ?? 0,
    pendentes: relatorios?.filter(r => {
      if (r.status === "entregue" || !r.prazo_entrega) return false;
      const dias = differenceInDays(parseISO(r.prazo_entrega), hoje);
      return dias <= 30;
    }).length ?? 0,
    entregues: relatorios?.filter(r => r.status === "entregue").length ?? 0,
  };

  const handleAvancaStatus = async (r: RelatorioRegulatorio) => {
    const next = NEXT_STATUS[r.status];
    if (!next) return;
    if (next === "entregue") {
      setEntregaTarget(r);
      return;
    }
    await atualizar.mutateAsync({ id: r.id, status: next });
  };

  return (
    <div className="space-y-6">
      {/* Alerta de prazo */}
      {urgentes.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-4">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800 dark:text-red-300 text-sm">
              {urgentes.length} relatório{urgentes.length !== 1 ? "s" : ""} com prazo em até 15 dias!
            </p>
            <p className="text-xs text-red-700 dark:text-red-400 mt-0.5">
              {urgentes.map(r => `${TIPO_LABEL[r.tipo]} (${r.periodo_referencia})`).join(", ")}
            </p>
          </div>
        </div>
      )}

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
        <Button onClick={() => setNovoOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />Novo Relatório
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
                  <FileText className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground mt-1">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start gap-4">
                <div className="h-11 w-11 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-600">{stats.pendentes}</p>
                  <p className="text-sm text-muted-foreground mt-1">Pendentes (30d)</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start gap-4">
                <div className="h-11 w-11 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{stats.entregues}</p>
                  <p className="text-sm text-muted-foreground mt-1">Entregues</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle>Relatórios Regulatórios</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <Skeleton key={i} className="h-14" />)}
            </div>
          ) : !relatorios?.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm">Nenhum relatório registrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 pr-4 font-medium">Órgão</th>
                    <th className="text-left py-2 pr-4 font-medium">Período</th>
                    <th className="text-left py-2 pr-4 font-medium">Prazo</th>
                    <th className="text-left py-2 pr-4 font-medium">Status</th>
                    <th className="text-left py-2 pr-4 font-medium">Protocolo</th>
                    <th className="text-left py-2 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {relatorios.map(r => {
                    const diasRestantes = r.prazo_entrega && r.status !== "entregue"
                      ? differenceInDays(parseISO(r.prazo_entrega), hoje)
                      : null;
                    const isUrgente = diasRestantes !== null && diasRestantes <= 15;

                    return (
                      <tr key={r.id} className={`border-b last:border-0 transition-colors ${isUrgente ? "bg-red-50/50 dark:bg-red-900/10" : "hover:bg-muted/40"}`}>
                        <td className="py-3 pr-4">
                          <Badge className={TIPO_COR[r.tipo]} variant="outline">
                            {TIPO_LABEL[r.tipo]}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4 font-medium">{r.periodo_referencia}</td>
                        <td className="py-3 pr-4">
                          {r.prazo_entrega ? (
                            <div>
                              <p>{format(parseISO(r.prazo_entrega), "dd/MM/yyyy", { locale: ptBR })}</p>
                              {diasRestantes !== null && (
                                <p className={`text-xs ${isUrgente ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
                                  {diasRestantes < 0 ? `${Math.abs(diasRestantes)}d atrasado` : `${diasRestantes}d restantes`}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          <Badge className={STATUS_COR[r.status]} variant="outline">
                            {STATUS_LABEL[r.status]}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {r.protocolo ?? "—"}
                        </td>
                        <td className="py-3">
                          {NEXT_STATUS[r.status] && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAvancaStatus(r)}
                              disabled={atualizar.isPending}
                            >
                              {NEXT_LABEL[r.status]}
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <NovoRelatorioDialog open={novoOpen} onOpenChange={setNovoOpen} orgs={orgsOptions} />
      {entregaTarget && (
        <EntregaDialog
          relatorio={entregaTarget}
          open={!!entregaTarget}
          onOpenChange={open => !open && setEntregaTarget(null)}
        />
      )}
    </div>
  );
}
