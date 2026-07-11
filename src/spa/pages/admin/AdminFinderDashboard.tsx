import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Target, Users, MessageCircle, CheckCircle2, TrendingUp, CalendarClock, Kanban, Gauge } from "lucide-react";
import {
  useProspeccaoDashboardMes,
  useFunilAgregado,
  useReunioesFechamentoProximas,
} from "@/hooks/useProspeccaoDashboard";
import { useRepresentantes } from "@/hooks/useRepresentantes";
import { RankingRepresentantes } from "@/components/prospeccao/ranking-representantes";
import { MetasFormDialog } from "@/components/prospeccao/metas-form-dialog";
import { KpiCard } from "@/components/prospeccao/kpi-card";
import { EmptyState } from "@/components/prospeccao/empty-state";
import { FinderPageHeader } from "@/components/prospeccao/finder-page-header";
import type { ProspeccaoStatus } from "@/types/prospeccao";

const STATUS_LABELS: Record<ProspeccaoStatus, string> = {
  novo: "Novo",
  contatado: "Contatado",
  qualificando: "Qualificando",
  qualificado: "Qualificado",
  proposta_enviada: "Proposta Enviada",
  negociando: "Negociando",
  convertido: "Convertido",
  perdido: "Perdido",
  sem_resposta: "Sem Resposta",
};

function periodoAtual(): string {
  const agora = new Date();
  return `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}`;
}

export default function AdminFinderDashboard() {
  const [periodoMes, setPeriodoMes] = useState(periodoAtual());
  const [metasAberto, setMetasAberto] = useState(false);

  const { data: representantes } = useRepresentantes();
  const { data: dashboard, isLoading: carregandoDashboard } = useProspeccaoDashboardMes(periodoMes);
  const { data: funil, isLoading: carregandoFunil } = useFunilAgregado();
  const { data: reunioes, isLoading: carregandoReunioes } = useReunioesFechamentoProximas();

  const totais = dashboard?.totais;
  const ranking = dashboard?.ranking ?? [];
  const maiorContagemFunil = Math.max(1, ...(funil ?? []).map((f) => f.total));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <FinderPageHeader
          icon={Gauge}
          title="Finder — Dashboard"
          subtitle="Prospecção comercial e conversão de leads"
          actions={
            <>
              <div>
                <Label htmlFor="periodo-mes" className="text-xs text-muted-foreground">
                  Mês de referência
                </Label>
                <Input
                  id="periodo-mes"
                  type="month"
                  value={periodoMes}
                  onChange={(e) => setPeriodoMes(e.target.value)}
                  className="w-40"
                />
              </div>
              <Button variant="outline" onClick={() => setMetasAberto(true)}>
                <Target className="h-4 w-4 mr-2" />
                Definir metas
              </Button>
            </>
          }
        />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-fade-in">
          <KpiCard
            icon={Users}
            tom="primary"
            label="Leads prospectados"
            value={totais?.leadsProspectados ?? 0}
            description="No mês selecionado"
            loading={carregandoDashboard}
          />
          <KpiCard
            icon={MessageCircle}
            tom="info"
            label="Responderam"
            value={totais?.responderam ?? 0}
            description="Leads com resposta no mês"
            loading={carregandoDashboard}
          />
          <KpiCard
            icon={CheckCircle2}
            tom="success"
            label="Convertidos"
            value={totais?.convertidos ?? 0}
            description="Organizações/parceiros criados"
            loading={carregandoDashboard}
          />
          <KpiCard
            icon={TrendingUp}
            tom="accent"
            label="Taxa de conversão"
            value={`${totais?.taxaConversao ?? 0}%`}
            description="Convertidos / prospectados"
            loading={carregandoDashboard}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Ranking por representante</CardTitle>
              <CardDescription>Leads, contatados e convertidos no mês, comparados com a meta</CardDescription>
            </CardHeader>
            <CardContent>
              {carregandoDashboard ? <Skeleton className="h-40 w-full" /> : <RankingRepresentantes ranking={ranking} />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Funil agregado</CardTitle>
              <CardDescription>Todos os leads ativos, por etapa do status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {carregandoFunil ? (
                <Skeleton className="h-40 w-full" />
              ) : (funil ?? []).length === 0 ? (
                <EmptyState icon={Kanban} title="Nenhum lead cadastrado ainda" />
              ) : (
                (funil ?? []).map((item) => (
                  <div key={item.status} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{STATUS_LABELS[item.status] ?? item.status}</span>
                      <span className="text-muted-foreground">{item.total}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(item.total / maiorContagemFunil) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4" />
              Reuniões de fechamento — próximos 7 dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            {carregandoReunioes ? (
              <Skeleton className="h-24 w-full" />
            ) : (reunioes ?? []).length === 0 ? (
              <EmptyState icon={CalendarClock} title="Nenhuma reunião de fechamento agendada" description="Próximos 7 dias." />
            ) : (
              <div className="space-y-3">
                {(reunioes ?? []).map((r) => (
                  <div key={r.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium">{r.leadNome ?? r.titulo}</p>
                      <p className="text-xs text-muted-foreground">Representante: {r.representanteNome ?? "—"}</p>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(r.dataInicio).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <MetasFormDialog
        open={metasAberto}
        onOpenChange={setMetasAberto}
        periodoMes={periodoMes}
        representantes={representantes ?? []}
        ranking={ranking}
      />
    </AdminLayout>
  );
}
