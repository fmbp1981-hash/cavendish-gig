import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  TrendingUp as LogoIcon,
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  Calendar,
  Settings,
  Bell,
  Search,
  ChevronDown,
  Plus,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  LogOut,
} from "lucide-react";

const Dashboard = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const navItems = [
    { icon: LayoutDashboard, label: "Visão Geral", href: "/dashboard", active: true },
    { icon: Users, label: "Clientes", href: "/dashboard/clients" },
    { icon: FileText, label: "Documentos", href: "/dashboard/documents" },
    { icon: BarChart3, label: "Governança", href: "/dashboard/governance" },
    { icon: Calendar, label: "Rituais", href: "/dashboard/rituals" },
    { icon: Settings, label: "Configurações", href: "/dashboard/settings" },
  ];

  const stats = [
    { label: "Clientes ativos", value: "24", change: "+3", icon: Users, color: "text-primary" },
    { label: "Atas este mês", value: "18", change: "+5", icon: FileText, color: "text-secondary" },
    { label: "Score médio", value: "78%", change: "+12%", icon: TrendingUp, color: "text-accent" },
    { label: "Reuniões pendentes", value: "7", change: "", icon: Clock, color: "text-muted-foreground" },
  ];

  const recentActivities = [
    { type: "success", title: "Ata gerada automaticamente", client: "Tech Solutions Ltda", time: "Há 2 horas" },
    { type: "warning", title: "Diagnóstico pendente de revisão", client: "Comércio ABC", time: "Há 4 horas" },
    { type: "success", title: "Novo cliente onboarded", client: "Indústria XYZ", time: "Há 1 dia" },
    { type: "info", title: "Reunião agendada", client: "Startup Beta", time: "Há 2 dias" },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`${sidebarCollapsed ? 'w-20' : 'w-64'} bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300`}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-sidebar-border px-4">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <LogoIcon className="w-5 h-5 text-sidebar-primary-foreground" />
            </div>
            {!sidebarCollapsed && (
              <span className="text-lg font-bold text-sidebar-foreground">
                Sistema<span className="text-sidebar-primary">GIG</span>
              </span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.label}>
                <Link
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${item.active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    }`}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* User */}
        <div className="p-3 border-t border-sidebar-border">
          <div className={`flex items-center gap-3 px-3 py-2 ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-sidebar-accent-foreground text-sm font-semibold">
              JS
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">João Silva</p>
                <p className="text-xs text-sidebar-foreground/60 truncate">Consultor Líder</p>
              </div>
            )}
          </div>
          <Link to="/" className={`flex items-center gap-3 px-3 py-2 mt-1 text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <LogOut className="w-4 h-4" />
            {!sidebarCollapsed && <span className="text-sm">Sair</span>}
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Search */}
            <div className="relative w-80 hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar clientes, documentos..."
                className="w-full h-10 pl-10 pr-4 rounded-lg bg-muted border-0 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-2 hover:bg-muted rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
            </button>
            <Button variant="hero" size="sm">
              <Plus className="w-4 h-4" />
              Novo Cliente
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-1">Visão Geral</h1>
            <p className="text-muted-foreground">Acompanhe todos os seus projetos de governança</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  {stat.change && (
                    <span className="text-xs font-medium text-secondary bg-secondary/10 px-2 py-1 rounded-full">
                      {stat.change}
                    </span>
                  )}
                </div>
                <p className="text-2xl font-bold text-foreground mb-1">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activities */}
            <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground">Atividades Recentes</h2>
                <Button variant="ghost" size="sm" className="text-primary">
                  Ver todas
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>

              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activity.type === 'success' ? 'bg-secondary/10 text-secondary' :
                        activity.type === 'warning' ? 'bg-accent/10 text-accent' :
                          'bg-primary/10 text-primary'
                      }`}>
                      {activity.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> :
                        activity.type === 'warning' ? <AlertCircle className="w-4 h-4" /> :
                          <Calendar className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.client}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{activity.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-6">Ações Rápidas</h2>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start" size="lg">
                  <Plus className="w-4 h-4 mr-3" />
                  Iniciar Onboarding
                </Button>
                <Button variant="outline" className="w-full justify-start" size="lg">
                  <FileText className="w-4 h-4 mr-3" />
                  Gerar Relatório
                </Button>
                <Button variant="outline" className="w-full justify-start" size="lg">
                  <Calendar className="w-4 h-4 mr-3" />
                  Agendar Reunião
                </Button>
                <Button variant="outline" className="w-full justify-start" size="lg">
                  <BarChart3 className="w-4 h-4 mr-3" />
                  Novo Diagnóstico
                </Button>
              </div>

              {/* Upcoming */}
              <div className="mt-8 pt-6 border-t border-border">
                <h3 className="text-sm font-semibold text-foreground mb-4">Próximas Reuniões</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="flex-1 truncate text-foreground">Tech Solutions - Kickoff</span>
                    <span className="text-muted-foreground text-xs">Hoje, 14h</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-accent" />
                    <span className="flex-1 truncate text-foreground">ABC Corp - Mensal</span>
                    <span className="text-muted-foreground text-xs">Amanhã, 10h</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
