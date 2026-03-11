/**
 * Parceiro: Compliance Calendar page
 * Re-uses the ComplianceCalendar content with ParceiroLayout
 */
import { useState } from "react";
import { ParceiroLayout } from "@/components/layout/ParceiroLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2, Plus, CalendarCheck, CheckCircle2, Trash2,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ComplianceObrigacao, Periodicidade, PERIODO_LABEL, STATUS_LABEL, STATUS_COR, isAtrasada,
  useComplianceObrigacoes, useCriarObrigacao, useConcluirObrigacao, useExcluirObrigacao,
} from "@/hooks/useComplianceCalendar";
import { useOrganizacoes } from "@/hooks/useConsultorData";
import { cn } from "@/lib/utils";

function ObrigacaoFormDialog({ open, onOpenChange, organizacaoId }: { open: boolean; onOpenChange: (v: boolean) => void; organizacaoId?: string; }) {
  const criar = useCriarObrigacao();
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [lei, setLei] = useState("");
  const [orgao, setOrgao] = useState("");
  const [periodicidade, setPeriodicidade] = useState<Periodicidade>("anual");
  const [proximaData, setProximaData] = useState("");

  const handleSave = async () => {
    if (!titulo.trim() || !proximaData) return;
    await criar.mutateAsync({
      organizacao_id: organizacaoId, titulo,
      descricao: descricao || undefined, lei_referencia: lei || undefined,
      orgao_regulador: orgao || undefined, periodicidade, proxima_data: proximaData,
    });
    setTitulo(""); setDescricao(""); setLei(""); setOrgao(""); setProximaData("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Nova Obrigação Regulatória</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5"><Label>Título *</Label><Input placeholder="Ex: Revisão anual do Código de Ética" value={titulo} onChange={e => setTitulo(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Periodicidade</Label>
              <Select value={periodicidade} onValueChange={v => setPeriodicidade(v as Periodicidade)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(PERIODO_LABEL).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Próximo vencimento *</Label><Input type="date" value={proximaData} onChange={e => setProximaData(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Lei/Norma</Label><Input placeholder="Ex: Lei 12.846/2013" value={lei} onChange={e => setLei(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Órgão Regulador</Label><Input placeholder="Ex: CGU, ANPD, CVM" value={orgao} onChange={e => setOrgao(e.target.value)} /></div>
          </div>
          <div className="space-y-1.5"><Label>Descrição</Label><Textarea placeholder="Detalhes da obrigação..." value={descricao} onChange={e => setDescricao(e.target.value)} rows={2} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!titulo.trim() || !proximaData || criar.isPending}>
            {criar.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Criar obrigação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ObrigacaoCard({ obrigacao, onConcluir, onExcluir }: { obrigacao: ComplianceObrigacao; onConcluir: () => void; onExcluir: () => void; }) {
  const atrasada = isAtrasada(obrigacao);
  const diasRestantes = Math.ceil((parseISO(obrigacao.proxima_data).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const urgente = diasRestantes >= 0 && diasRestantes <= 7;

  return (
    <Card className={cn("transition-colors", obrigacao.status === "concluida" && "opacity-60", atrasada && "border-red-400/50", urgente && !atrasada && "border-orange-400/40")}>
      <CardContent className="py-3 px-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium">{obrigacao.titulo}</p>
              {obrigacao.orgao_regulador && <Badge variant="secondary" className="text-[10px]">{obrigacao.orgao_regulador}</Badge>}
              <Badge variant="outline" className={cn("text-[10px]", STATUS_COR[obrigacao.status])}>{STATUS_LABEL[obrigacao.status]}</Badge>
            </div>
            {obrigacao.lei_referencia && <p className="text-xs text-muted-foreground">{obrigacao.lei_referencia}</p>}
            <div className="flex items-center gap-3 text-xs flex-wrap">
              <span className={cn("font-medium", atrasada ? "text-red-600" : urgente ? "text-orange-600" : "text-muted-foreground")}>
                {atrasada ? `⚠️ ${Math.abs(diasRestantes)}d atrasada` : diasRestantes === 0 ? "⚠️ Vence hoje" : `${diasRestantes}d restantes`}
              </span>
              <span className="text-muted-foreground">{format(parseISO(obrigacao.proxima_data), "dd/MM/yyyy", { locale: ptBR })}</span>
              <Badge variant="outline" className="text-[10px]">{PERIODO_LABEL[obrigacao.periodicidade]}</Badge>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {obrigacao.status !== "concluida" && (
              <Button size="sm" variant="outline" onClick={onConcluir} className="h-7 px-2 text-xs">
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />Concluir
              </Button>
            )}
            {obrigacao.organizacao_id && (
              <button onClick={onExcluir} className="text-muted-foreground hover:text-destructive transition-colors p-1" title="Remover">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ParceiroComplianceCalendar() {
  const { data: orgs } = useOrganizacoes();
  const [selectedOrg, setSelectedOrg] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<"todas" | "pendente" | "concluida" | "atrasada">("todas");
  const [filtroOrgao, setFiltroOrgao] = useState("");

  const { data: obrigacoes, isLoading } = useComplianceObrigacoes(selectedOrg || undefined);
  const concluir = useConcluirObrigacao();
  const excluir = useExcluirObrigacao();

  const obrigacoesFiltradas = (obrigacoes ?? []).filter(o => {
    if (filtroStatus !== "todas" && o.status !== filtroStatus) return false;
    if (filtroOrgao && o.orgao_regulador !== filtroOrgao) return false;
    return true;
  });

  const stats = {
    total: obrigacoes?.length ?? 0,
    pendentes: obrigacoes?.filter(o => o.status === "pendente").length ?? 0,
    atrasadas: obrigacoes?.filter(o => isAtrasada(o)).length ?? 0,
    concluidas: obrigacoes?.filter(o => o.status === "concluida").length ?? 0,
  };

  const orgaos = [...new Set((obrigacoes ?? []).map(o => o.orgao_regulador).filter(Boolean))] as string[];

  return (
    <ParceiroLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarCheck className="h-6 w-6 text-primary" />Calendário Regulatório
          </h1>
          <p className="text-muted-foreground">Agenda de obrigações legais e regulatórias com alertas de vencimento</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total", value: stats.total, cor: "" },
            { label: "Pendentes", value: stats.pendentes, cor: "text-slate-600" },
            { label: "Atrasadas", value: stats.atrasadas, cor: "text-red-600 dark:text-red-400" },
            { label: "Concluídas", value: stats.concluidas, cor: "text-green-600 dark:text-green-400" },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="p-4">
                <p className={cn("text-2xl font-bold", s.cor)}>{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Select value={selectedOrg || "__all__"} onValueChange={v => setSelectedOrg(v === "__all__" ? "" : v)}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="+ Obrig. específicas da org" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Apenas obrigações globais</SelectItem>
              {(orgs ?? []).map((org: any) => (<SelectItem key={org.id} value={org.id}>{org.nome}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={filtroStatus} onValueChange={v => setFiltroStatus(v as any)}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todos os status</SelectItem>
              <SelectItem value="pendente">Pendentes</SelectItem>
              <SelectItem value="atrasada">Atrasadas</SelectItem>
              <SelectItem value="concluida">Concluídas</SelectItem>
            </SelectContent>
          </Select>
          {orgaos.length > 0 && (
            <Select value={filtroOrgao || "__all__"} onValueChange={v => setFiltroOrgao(v === "__all__" ? "" : v)}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Filtrar órgão" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos os órgãos</SelectItem>
                {orgaos.map(o => (<SelectItem key={o} value={o}>{o}</SelectItem>))}
              </SelectContent>
            </Select>
          )}
          <Button size="sm" onClick={() => setFormOpen(true)}><Plus className="h-4 w-4 mr-1.5" />Nova obrigação</Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : obrigacoesFiltradas.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-12 gap-3 text-center">
              <CalendarCheck className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm font-medium">Nenhuma obrigação encontrada</p>
              <p className="text-xs text-muted-foreground">Ajuste os filtros ou adicione uma nova obrigação.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {obrigacoesFiltradas.map(o => (
              <ObrigacaoCard key={o.id} obrigacao={o} onConcluir={() => concluir.mutate(o)}
                onExcluir={() => { if (window.confirm(`Remover "${o.titulo}"?`)) excluir.mutate(o.id); }} />
            ))}
          </div>
        )}

        <ObrigacaoFormDialog open={formOpen} onOpenChange={setFormOpen} organizacaoId={selectedOrg || undefined} />
      </div>
    </ParceiroLayout>
  );
}
