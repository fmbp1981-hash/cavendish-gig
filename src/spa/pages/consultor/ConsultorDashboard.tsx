import { ConsultorLayout } from "@/components/layout/ConsultorLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useConsultorStats, useDocumentosPendentes } from "@/hooks/useConsultorData";
import { useProximasObrigacoes, isAtrasada, STATUS_COR } from "@/hooks/useComplianceCalendar";
import { DocumentStatusChart } from "@/components/analytics/DocumentStatusChart";
import { ProjectPhaseChart } from "@/components/analytics/ProjectPhaseChart";
import { TaskTimelineChart } from "@/components/analytics/TaskTimelineChart";
import { OrganizationGrowthChart } from "@/components/analytics/OrganizationGrowthChart";
import { Building2, FileText, FolderOpen, Clock, ArrowRight, CalendarCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

function ProximosVencimentosWidget() {
  const { data: obrigacoes, isLoading } = useProximasObrigacoes(undefined, 30);

  if (isLoading) return null;
  if (!obrigacoes || obrigacoes.length === 0) return null;

  return (
    <Card className="border-amber-200 dark:border-amber-800/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            Próximos Vencimentos Regulatórios
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/consultor/compliance-calendar">
              Ver calendário <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Link>
          </Button>
        </div>
        <CardDescription>Obrigações a vencer nos próximos 30 dias</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {obrigacoes.slice(0, 5).map(o => {
            const atrasada = isAtrasada(o);
            const diasRestantes = Math.ceil(
              (parseISO(o.proxima_data).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            );
            return (
              <div key={o.id} className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{o.titulo}</p>
                  <p className="text-xs text-muted-foreground">
                    {o.orgao_regulador ?? "Interno"} · {format(parseISO(o.proxima_data), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
                <span className={cn(
                  "text-xs font-medium shrink-0",
                  atrasada ? "text-red-600" :
                  diasRestantes <= 7 ? "text-orange-600" :
                  "text-muted-foreground"
                )}>
                  {atrasada
                    ? `${Math.abs(diasRestantes)}d atrasada`
                    : diasRestantes === 0
                    ? "Hoje"
                    : `${diasRestantes}d`}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

const faseLabels: Record<string, string> = {
  diagnostico: "Diagnóstico",
  implementacao: "Implementação",
  recorrencia: "Recorrência",
};

export default function ConsultorDashboard() {
  const { data: stats, isLoading: loadingStats } = useConsultorStats();
  const { data: documentosPendentes, isLoading: loadingDocs } = useDocumentosPendentes();

  return (
    <ConsultorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do sistema</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Organizações</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats?.totalOrganizacoes || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">Clientes ativos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Projetos</CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats?.totalProjetos || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">Em andamento</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Documentos Pendentes</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-amber-600">
                  {stats?.documentosPendentes || 0}
                </div>
              )}
              <p className="text-xs text-muted-foreground">Aguardando análise</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick actions */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
              <CardDescription>Acesse as principais funcionalidades</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Button asChild variant="outline" className="justify-start">
                <Link to="/consultor/clientes">
                  <Building2 className="mr-2 h-4 w-4" />
                  Ver Clientes
                  <ArrowRight className="ml-auto h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link to="/consultor/documentos">
                  <FileText className="mr-2 h-4 w-4" />
                  Analisar Documentos
                  {stats?.documentosPendentes ? (
                    <Badge variant="destructive" className="ml-auto">
                      {stats.documentosPendentes}
                    </Badge>
                  ) : (
                    <ArrowRight className="ml-auto h-4 w-4" />
                  )}
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Recent pending documents */}
          <Card>
            <CardHeader>
              <CardTitle>Documentos Recentes</CardTitle>
              <CardDescription>Últimos documentos enviados para análise</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingDocs ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : documentosPendentes && documentosPendentes.length > 0 ? (
                <div className="space-y-3">
                  {documentosPendentes.slice(0, 5).map((doc: any) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {doc.documentos_requeridos?.nome}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {doc.documentos_requeridos?.projetos?.organizacoes?.nome}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={doc.status === "enviado" ? "default" : "secondary"}>
                          {doc.status === "enviado" ? "Novo" : "Em análise"}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(doc.updated_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum documento pendente
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Próximos vencimentos regulatórios */}
        <ProximosVencimentosWidget />

        {/* Analytics Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          <DocumentStatusChart />
          <ProjectPhaseChart />
          <TaskTimelineChart />
          <OrganizationGrowthChart />
        </div>
      </div>
    </ConsultorLayout>
  );
}
