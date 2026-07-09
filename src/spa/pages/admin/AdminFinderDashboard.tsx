import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Target, Users, MessageCircle, CheckCircle2, TrendingUp, CalendarClock } from "lucide-react";
import {
  useProspeccaoDashboardMes,
  useFunilAgregado,
  useReunioesFechamentoProximas,
} from "@/hooks/useProspeccaoDashboard";
import { useRepresentantes } from "@/hooks/useRepresentantes";
import { RankingRepresentantes } from "@/components/prospeccao/ranking-representantes";
import { MetasFormDialog } from "@/components/prospeccao/metas-form-dialog";
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Finder — Dashboard</h1>
            <p className="text-muted-foreground">Prospecção comercial e conversão de leads</p>
          </div>
          <div className="flex items-end gap-2">
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
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Leads prospectados</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {carregandoDashboard ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{totais?.leadsProspectados ?? 0}</div>}
              <p className="text-xs text-muted-foreground">No mês selecionado</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Responderam</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {carregandoDashboard ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{totais?.responderam ?? 0}</div>}
              <p className="text-xs text-muted-foreground">Leads com resposta no mês</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Convertidos</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {carregandoDashboard ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{totais?.convertidos ?? 0}</div>}
              <p className="text-xs text-muted-foreground">Organizações/parceiros criados</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Taxa de conversão</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {carregandoDashboard ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{totais?.taxaConversao ?? 0}%</div>}
              <p className="text-xs text-muted-foreground">Convertidos / prospectados</p>
            </CardContent>
          </Card>
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
                <p className="text-sm text-muted-foreground">Nenhum lead cadastrado ainda.</p>
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
              <p className="text-sm text-muted-foreground">Nenhuma reunião de fechamento agendada para os próximos 7 dias.</p>
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
