import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Plus, Shield, AlertTriangle, Bell, Loader2, Trash2, Pencil } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useOrganizacoes } from "@/hooks/useConsultorData";
import {
  useIncidentes,
  useCriarIncidente,
  useAtualizarIncidente,
  useExcluirIncidente,
  Incidente,
  IncidenteTipo,
  IncidenteSeveridade,
  IncidenteStatus,
  TIPO_LABEL,
  SEVERIDADE_LABEL,
  STATUS_LABEL,
  SEVERIDADE_COR,
  STATUS_COR,
} from "@/hooks/useIncidentes";

// ─── Novo Incidente Form ───────────────────────────────────────────────────────

interface NovoIncidenteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgs: Array<{ id: string; nome: string }>;
}

function NovoIncidenteDialog({ open, onOpenChange, orgs }: NovoIncidenteDialogProps) {
  const criar = useCriarIncidente();
  const [orgId, setOrgId] = useState("");
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState<IncidenteTipo>("outro");
  const [severidade, setSeveridade] = useState<IncidenteSeveridade>("media");
  const [dataOcorrencia, setDataOcorrencia] = useState("");
  const [descricao, setDescricao] = useState("");
  const [planoCorretivo, setPlanoCorretivo] = useState("");
  const [licoesAprendidas, setLicoesAprendidas] = useState("");
  const [notificacaoAnpd, setNotificacaoAnpd] = useState(false);

  const reset = () => {
    setOrgId(""); setTitulo(""); setTipo("outro"); setSeveridade("media");
    setDataOcorrencia(""); setDescricao(""); setPlanoCorretivo("");
    setLicoesAprendidas(""); setNotificacaoAnpd(false);
  };

  const handleSubmit = async () => {
    if (!orgId || !titulo || !dataOcorrencia || !descricao) return;
    await criar.mutateAsync({
      organization_id: orgId,
      titulo,
      tipo,
      severidade,
      data_ocorrencia: dataOcorrencia,
      descricao,
      plano_corretivo: planoCorretivo || null,
      licoes_aprendidas: licoesAprendidas || null,
      notificacao_anpd: notificacaoAnpd,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Incidente</DialogTitle>
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
            <Input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Título do incidente" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Tipo *</Label>
              <Select value={tipo} onValueChange={v => setTipo(v as IncidenteTipo)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(TIPO_LABEL) as IncidenteTipo[]).map(t => (
                    <SelectItem key={t} value={t}>{TIPO_LABEL[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Severidade *</Label>
              <Select value={severidade} onValueChange={v => setSeveridade(v as IncidenteSeveridade)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(SEVERIDADE_LABEL) as IncidenteSeveridade[]).map(s => (
                    <SelectItem key={s} value={s}>{SEVERIDADE_LABEL[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Data de Ocorrência *</Label>
            <Input type="date" value={dataOcorrencia} onChange={e => setDataOcorrencia(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Descrição *</Label>
            <Textarea value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Descreva o incidente em detalhes..." rows={4} />
          </div>
          <div className="space-y-1.5">
            <Label>Plano Corretivo</Label>
            <Textarea value={planoCorretivo} onChange={e => setPlanoCorretivo(e.target.value)} placeholder="Ações corretivas planejadas..." rows={3} />
          </div>
          <div className="space-y-1.5">
            <Label>Lições Aprendidas</Label>
            <Textarea value={licoesAprendidas} onChange={e => setLicoesAprendidas(e.target.value)} placeholder="O que aprendemos com esse incidente..." rows={3} />
          </div>
          {tipo === "vazamento_dados" && (
            <div className="flex items-center justify-between rounded-lg border p-3 bg-orange-50 dark:bg-orange-900/20">
              <div>
                <p className="text-sm font-medium">Notificar ANPD?</p>
                <p className="text-xs text-muted-foreground">Obrigatório para vazamentos de dados pessoais</p>
              </div>
              <Switch checked={notificacaoAnpd} onCheckedChange={setNotificacaoAnpd} />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onOpenChange(false); }}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={criar.isPending || !orgId || !titulo || !dataOcorrencia || !descricao}>
            {criar.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Registrar Incidente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Detalhe Sheet ────────────────────────────────────────────────────────────

interface DetalheSheetProps {
  incidente: Incidente | null;
  onClose: () => void;
}

function DetalheSheet({ incidente, onClose }: DetalheSheetProps) {
  const atualizar = useAtualizarIncidente();
  const excluir = useExcluirIncidente();
  const [editStatus, setEditStatus] = useState<IncidenteStatus | "">("");
  const [editPlano, setEditPlano] = useState("");
  const [editLicoes, setEditLicoes] = useState("");
  const [editing, setEditing] = useState(false);

  if (!incidente) return null;

  const handleEdit = () => {
    setEditStatus(incidente.status);
    setEditPlano(incidente.plano_corretivo ?? "");
    setEditLicoes(incidente.licoes_aprendidas ?? "");
    setEditing(true);
  };

  const handleSave = async () => {
    await atualizar.mutateAsync({
      id: incidente.id,
      status: editStatus as IncidenteStatus,
      plano_corretivo: editPlano || null,
      licoes_aprendidas: editLicoes || null,
    });
    setEditing(false);
  };

  const handleExcluir = async () => {
    if (!confirm("Confirma exclusão deste incidente?")) return;
    await excluir.mutateAsync(incidente.id);
    onClose();
  };

  return (
    <Sheet open={!!incidente} onOpenChange={open => !open && onClose()}>
      <SheetContent className="max-w-lg w-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-left">{incidente.titulo}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <div className="flex gap-2 flex-wrap">
            <Badge className={SEVERIDADE_COR[incidente.severidade]} variant="outline">
              {SEVERIDADE_LABEL[incidente.severidade]}
            </Badge>
            <Badge className={STATUS_COR[incidente.status]} variant="outline">
              {STATUS_LABEL[incidente.status]}
            </Badge>
            {incidente.notificacao_anpd && (
              <Badge variant="outline" className="bg-orange-50 text-orange-800 border-orange-300">
                <Bell className="h-3 w-3 mr-1" />ANPD
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Tipo</p>
              <p className="font-medium">{TIPO_LABEL[incidente.tipo]}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Data de Ocorrência</p>
              <p className="font-medium">{format(new Date(incidente.data_ocorrencia), "dd/MM/yyyy", { locale: ptBR })}</p>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-1">Descrição</p>
            <div className="bg-muted/50 rounded-lg p-3 text-sm whitespace-pre-wrap">{incidente.descricao}</div>
          </div>

          {editing ? (
            <div className="space-y-3 border-t pt-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={editStatus} onValueChange={v => setEditStatus(v as IncidenteStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STATUS_LABEL) as IncidenteStatus[]).map(s => (
                      <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Plano Corretivo</Label>
                <Textarea value={editPlano} onChange={e => setEditPlano(e.target.value)} rows={3} />
              </div>
              <div className="space-y-1.5">
                <Label>Lições Aprendidas</Label>
                <Textarea value={editLicoes} onChange={e => setEditLicoes(e.target.value)} rows={3} />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={atualizar.isPending}>
                  {atualizar.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Salvar
                </Button>
                <Button variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
              </div>
            </div>
          ) : (
            <>
              {incidente.plano_corretivo && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Plano Corretivo</p>
                  <div className="bg-muted/50 rounded-lg p-3 text-sm whitespace-pre-wrap">{incidente.plano_corretivo}</div>
                </div>
              )}
              {incidente.licoes_aprendidas && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Lições Aprendidas</p>
                  <div className="bg-muted/50 rounded-lg p-3 text-sm whitespace-pre-wrap">{incidente.licoes_aprendidas}</div>
                </div>
              )}
              <div className="flex gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" onClick={handleEdit}>
                  <Pencil className="h-4 w-4 mr-1" />Editar
                </Button>
                <Button variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-50" onClick={handleExcluir} disabled={excluir.isPending}>
                  <Trash2 className="h-4 w-4 mr-1" />Excluir
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────

export function IncidentesTab() {
  const { data: orgs, isLoading: orgsLoading } = useOrganizacoes();
  const [selectedOrg, setSelectedOrg] = useState("");
  // Auto-seleciona a primeira org se nenhuma selecionada
  useEffect(() => {
    if (!selectedOrg && orgs && orgs.length > 0) {
      setSelectedOrg(orgs[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgs]);

  const [novoOpen, setNovoOpen] = useState(false);
  const [detalhe, setDetalhe] = useState<Incidente | null>(null);

  const orgId = selectedOrg || undefined;
  const { data: incidentes, isLoading } = useIncidentes(orgId);

  const orgsOptions = (orgs ?? []) as Array<{ id: string; nome: string }>;

  const stats = {
    total:   incidentes?.length ?? 0,
    abertos: incidentes?.filter(i => i.status === "aberto").length ?? 0,
    criticos: incidentes?.filter(i => i.severidade === "critica").length ?? 0,
    anpd:    incidentes?.filter(i => i.notificacao_anpd && i.status !== "encerrado").length ?? 0,
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
        <Button onClick={() => setNovoOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />Novo Incidente
        </Button>
      </div>

      {/* Stat Cards */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start gap-4">
                <div className="h-11 w-11 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                  <Shield className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground mt-1">Total de Incidentes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start gap-4">
                <div className="h-11 w-11 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{stats.abertos}</p>
                  <p className="text-sm text-muted-foreground mt-1">Abertos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start gap-4">
                <div className="h-11 w-11 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600">{stats.criticos}</p>
                  <p className="text-sm text-muted-foreground mt-1">Críticos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start gap-4">
                <div className="h-11 w-11 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <Bell className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-600">{stats.anpd}</p>
                  <p className="text-sm text-muted-foreground mt-1">Notif. ANPD Pendentes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle>Incidentes Registrados</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <Skeleton key={i} className="h-14" />)}
            </div>
          ) : !incidentes?.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                <Shield className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm">Nenhum incidente registrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 pr-4 font-medium">Data</th>
                    <th className="text-left py-2 pr-4 font-medium">Título</th>
                    <th className="text-left py-2 pr-4 font-medium">Tipo</th>
                    <th className="text-left py-2 pr-4 font-medium">Severidade</th>
                    <th className="text-left py-2 pr-4 font-medium">Status</th>
                    <th className="text-left py-2 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {incidentes.map(inc => (
                    <tr key={inc.id} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                      <td className="py-3 pr-4 whitespace-nowrap">
                        {format(new Date(inc.data_ocorrencia), "dd/MM/yyyy", { locale: ptBR })}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="font-medium line-clamp-1">{inc.titulo}</div>
                        {inc.notificacao_anpd && (
                          <span className="text-xs text-orange-600 flex items-center gap-1 mt-0.5">
                            <Bell className="h-3 w-3" />ANPD
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-4 whitespace-nowrap">{TIPO_LABEL[inc.tipo]}</td>
                      <td className="py-3 pr-4">
                        <Badge className={SEVERIDADE_COR[inc.severidade]} variant="outline">
                          {SEVERIDADE_LABEL[inc.severidade]}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge className={STATUS_COR[inc.status]} variant="outline">
                          {STATUS_LABEL[inc.status]}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <Button variant="outline" size="sm" onClick={() => setDetalhe(inc)}>
                          Ver detalhes
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <NovoIncidenteDialog open={novoOpen} onOpenChange={setNovoOpen} orgs={orgsOptions} />
      <DetalheSheet incidente={detalhe} onClose={() => setDetalhe(null)} />
    </div>
  );
}
