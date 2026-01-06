import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useConsultorStats } from "@/hooks/useConsultorData";
import { useAdminStats } from "@/hooks/useAdminData";
import { useAuth } from "@/contexts/AuthContext";
import { DocumentStatusChart } from "@/components/analytics/DocumentStatusChart";
import { ProjectPhaseChart } from "@/components/analytics/ProjectPhaseChart";
import { TrainingCompletionChart } from "@/components/analytics/TrainingCompletionChart";
import { TaskTimelineChart } from "@/components/analytics/TaskTimelineChart";
import { OrganizationGrowthChart } from "@/components/analytics/OrganizationGrowthChart";
import {
  Building2,
  FileText,
  FolderOpen,
  Users,
  ArrowRight,
  Shield,
  UserCog,
  Database,
  Sparkles,
  Clock
} from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminDashboard() {
  const { data: stats, isLoading: loadingStats } = useConsultorStats();
  const { data: adminStats, isLoading: loadingAdmin } = useAdminStats();
  const { profile } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  const firstName = profile?.nome?.split(" ")[0] || "Administrador";

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header with Welcome */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              {getGreeting()}, {firstName}! <Sparkles className="h-5 w-5 text-primary" />
            </h1>
            <p className="text-muted-foreground">Controle total do Sistema GIG</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
              <p className="text-xs text-muted-foreground">Empresas cadastradas</p>
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
              <CardTitle className="text-sm font-medium">Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingAdmin ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{adminStats?.totalUsers || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">Cadastrados no sistema</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Consultores</CardTitle>
              <UserCog className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingAdmin ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{adminStats?.totalConsultores || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">Ativos</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick actions */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Usuários</CardTitle>
              <CardDescription>Gerencie usuários e permissões</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Button asChild variant="outline" className="justify-start">
                <Link to="/admin/usuarios">
                  <Users className="mr-2 h-4 w-4" />
                  Ver Todos Usuários
                  <ArrowRight className="ml-auto h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link to="/admin/consultores">
                  <UserCog className="mr-2 h-4 w-4" />
                  Gerenciar Consultores
                  <ArrowRight className="ml-auto h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gestão de Dados</CardTitle>
              <CardDescription>Organizações e catálogo</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Button asChild variant="outline" className="justify-start">
                <Link to="/admin/organizacoes">
                  <Building2 className="mr-2 h-4 w-4" />
                  Organizações
                  <ArrowRight className="ml-auto h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link to="/admin/catalogo">
                  <Database className="mr-2 h-4 w-4" />
                  Catálogo de Documentos
                  <ArrowRight className="ml-auto h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configurações</CardTitle>
              <CardDescription>Configurações avançadas do sistema</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Button asChild variant="outline" className="justify-start">
                <Link to="/admin/seguranca">
                  <Shield className="mr-2 h-4 w-4" />
                  Segurança
                  <ArrowRight className="ml-auto h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link to="/admin/configuracoes">
                  <FileText className="mr-2 h-4 w-4" />
                  Configurações Gerais
                  <ArrowRight className="ml-auto h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* System info */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">Status do Sistema</p>
                  <p className="text-xs text-muted-foreground">Operacional</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Banco de Dados</p>
                  <p className="text-xs text-muted-foreground">Multi-tenant ativo</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">RLS</p>
                  <p className="text-xs text-muted-foreground">Políticas ativas</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analytics Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          <DocumentStatusChart />
          <ProjectPhaseChart />
          <TrainingCompletionChart />
          <TaskTimelineChart />
          <OrganizationGrowthChart />
        </div>
      </div>
    </AdminLayout>
  );
}
