import { useState } from "react";
import { ConsultorLayout } from "@/components/layout/ConsultorLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2, Plus, Link2, Copy, CheckCircle2, AlertTriangle,
  PresentationIcon, Clock, BarChart3,
} from "lucide-react";
import { format, parseISO, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useOrganizacoes } from "@/hooks/useConsultorData";
import { useRiscos } from "@/hooks/useRiscos";
import { useKPIsDenuncias } from "@/hooks/useInvestigacoes";
import { useESGIndicadores, calcularScorePilar, PILAR_LABEL, ESGPilar } from "@/hooks/useESG";
import {
  useBoardSnapshots,
  useGerarBoardSnapshot,
  BoardSnapshot,
} from "@/hooks/useESG";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Gerar Snapshot Dialog ────────────────────────────────────────────────────

function GerarSnapshotDialog({
  open, onOpenChange, organizacaoId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  organizacaoId: string;
}) {
  const gerar = useGerarBoardSnapshot();
  const [titulo, setTitulo] = useState(`Relatório Executivo — ${format(new Date(), "MMMM/yyyy", { locale: ptBR })}`);
  const [periodo, setPeriodo] = useState(new Date().getFullYear().toString());

  const { data: riscos } = useRiscos(organizacaoId);
  const { data: kpisDenuncias } = useKPIsDenuncias();
  const { data: esgIndicadores } = useESGIndicadores(organizacaoId);

  const handleGerar = async () => {
    if (!titulo.trim()) return;

    // Monta conteudo JSONB com snapshot dos dados atuais
    const conteudo = {
      periodo,
      gerado_em: new Date().toISOString(),
      riscos: {
        total: riscos?.length ?? 0,
        criticos: riscos?.filter(r => r.nivel_risco >= 17).length ?? 0,
        altos: riscos?.filter(r => r.nivel_risco >= 10 && r.nivel_risco < 17).length ?? 0,
      },
      denuncias: {
        total: kpisDenuncias?.total ?? 0,
        abertas: kpisDenuncias?.abertas ?? 0,
        tempo_medio_dias: kpisDenuncias?.tempoMedio ?? null,
      },
      esg: (["ambiental", "social", "governanca"] as ESGPilar[]).reduce((acc, p) => {
        const ind = (esgIndicadores ?? []).filter(i => i.pilar === p);
        acc[p] = { score: calcularScorePilar(ind), total_indicadores: ind.length };
        return acc;
      }, {} as Record<string, unknown>),
    };

    const snap = await gerar.mutateAsync({
      organizacaoId,
      titulo,
      periodoReferencia: periodo,
      conteudo,
    });

    // Copia link para clipboard
    const link = `${window.location.origin}/board/${snap.link_publico_token}`;
    await navigator.clipboard.writeText(link).catch(() => {});
    toast.success("Link copiado para o clipboard!");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gerar Relatório Executivo</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Alert className="border-blue-400/40 bg-blue-50 dark:bg-blue-900/20">
            <AlertDescription className="text-xs text-blue-800 dark:text-blue-300">
              Um snapshot dos dados atuais será salvo e um link público (válido por 30 dias) será gerado para compartilhar com a diretoria sem necessidade de login.
            </AlertDescription>
          </Alert>
          <div className="space-y-1.5">
            <Label>Título do relatório</Label>
            <Input value={titulo} onChange={e => setTitulo(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Período de referência</Label>
            <Input placeholder="Ex: 2026, Q1 2026, Jan-Mar 2026" value={periodo} onChange={e => setPeriodo(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleGerar} disabled={!titulo.trim() || gerar.isPending}>
            {gerar.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Link2 className="h-4 w-4 mr-2" />}
            Gerar e copiar link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Card de Snapshot ─────────────────────────────────────────────────────────

function SnapshotCard({ snap }: { snap: BoardSnapshot }) {
  const expirado = isPast(parseISO(snap.expira_em));
  const conteudo = snap.conteudo as any;

  const handleCopiarLink = async () => {
    const link = `${window.location.origin}/board/${snap.link_publico_token}`;
    await navigator.clipboard.writeText(link).catch(() => {});
    toast.success("Link copiado!");
  };

  return (
    <Card className={cn(expirado && "opacity-60")}>
      <CardContent className="py-3 px-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-medium">{snap.titulo}</p>
            <p className="text-xs text-muted-foreground">
              {snap.periodo_referencia} · Gerado em {format(parseISO(snap.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
            </p>
            <div className="flex items-center gap-2 flex-wrap text-xs">
              {conteudo?.riscos && (
                <Badge variant="outline" className="text-[10px]">
                  {conteudo.riscos.criticos} riscos críticos
                </Badge>
              )}
              {conteudo?.denuncias && (
                <Badge variant="outline" className="text-[10px]">
                  {conteudo.denuncias.abertas} denúncias abertas
                </Badge>
              )}
              {expirado ? (
                <span className="text-red-600">Link expirado</span>
              ) : (
                <span className="text-muted-foreground">
                  Expira em {format(parseISO(snap.expira_em), "dd/MM/yyyy", { locale: ptBR })}
                </span>
              )}
            </div>
          </div>
          {!expirado && (
            <Button size="sm" variant="outline" onClick={handleCopiarLink} className="shrink-0">
              <Copy className="h-3.5 w-3.5 mr-1.5" />Copiar link
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BoardDashboard() {
  const { data: orgs } = useOrganizacoes();
  const [selectedOrg, setSelectedOrg] = useState("");
  const [gerarOpen, setGerarOpen] = useState(false);

  const { data: snapshots, isLoading } = useBoardSnapshots(selectedOrg || undefined);
  const { data: riscos } = useRiscos(selectedOrg || undefined);
  const { data: kpis } = useKPIsDenuncias();
  const { data: esgIndicadores } = useESGIndicadores(selectedOrg || undefined);

  const riscoCriticos = (riscos ?? []).filter(r => r.nivel_risco >= 17).length;
  const riscoAltos = (riscos ?? []).filter(r => r.nivel_risco >= 10 && r.nivel_risco < 17).length;
  const esgGeral = esgIndicadores
    ? Math.round(
        (["ambiental", "social", "governanca"] as ESGPilar[]).reduce((s, p) => {
          return s + calcularScorePilar(esgIndicadores.filter(i => i.pilar === p));
        }, 0) / 3
      )
    : null;

  return (
    <ConsultorLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <PresentationIcon className="h-6 w-6 text-primary" />
              Board Reporting
            </h1>
            <p className="text-muted-foreground">
              Relatórios executivos para a diretoria com link público de 30 dias
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedOrg || "__all__"} onValueChange={v => setSelectedOrg(v === "__all__" ? "" : v)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Selecione a organização" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todas</SelectItem>
                {(orgs ?? []).map((org: any) => (
                  <SelectItem key={org.id} value={org.id}>{org.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={() => setGerarOpen(true)} disabled={!selectedOrg}>
              <Plus className="h-4 w-4 mr-1.5" />Gerar Relatório
            </Button>
          </div>
        </div>

        {/* KPIs resumo */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className={cn("text-2xl font-bold", riscoCriticos > 0 ? "text-red-600" : "text-green-600")}>
                {riscoCriticos}
              </p>
              <p className="text-sm text-muted-foreground">Riscos Críticos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className={cn("text-2xl font-bold", riscoAltos > 0 ? "text-orange-600" : "text-green-600")}>
                {riscoAltos}
              </p>
              <p className="text-sm text-muted-foreground">Riscos Altos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className={cn("text-2xl font-bold", (kpis?.abertas ?? 0) > 0 ? "text-yellow-600" : "text-green-600")}>
                {kpis?.abertas ?? "—"}
              </p>
              <p className="text-sm text-muted-foreground">Denúncias Abertas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className={cn(
                "text-2xl font-bold",
                esgGeral == null ? "" :
                esgGeral >= 80 ? "text-green-600" :
                esgGeral >= 60 ? "text-yellow-600" :
                "text-red-600"
              )}>
                {esgGeral != null ? `${esgGeral}` : "—"}
              </p>
              <p className="text-sm text-muted-foreground">Score ESG</p>
            </CardContent>
          </Card>
        </div>

        {/* Histórico de snapshots */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Relatórios Gerados</CardTitle>
            <CardDescription>
              Cada relatório tem um link público válido por 30 dias — compartilhe com a diretoria sem necessidade de login
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin" /></div>
            ) : !snapshots || snapshots.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                Nenhum relatório gerado ainda. Selecione uma organização e clique em "Gerar Relatório".
              </div>
            ) : (
              <div className="space-y-2">
                {snapshots.map(s => <SnapshotCard key={s.id} snap={s} />)}
              </div>
            )}
          </CardContent>
        </Card>

        {selectedOrg && (
          <GerarSnapshotDialog
            open={gerarOpen}
            onOpenChange={setGerarOpen}
            organizacaoId={selectedOrg}
          />
        )}
      </div>
    </ConsultorLayout>
  );
}
