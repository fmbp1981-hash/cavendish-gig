import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useBrandingContext } from "@/components/branding/TenantBrandingProvider";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { TutorialHelpButton } from "@/components/tutorial/TutorialHelpButton";
import { AgenteChat } from "@/components/agente/AgenteChat";
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Shield,
  AlertTriangle,
  CheckSquare,
  Sparkles,
  CalendarPlus,
  FileCheck,
  BarChart3,
  Calendar
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { IntelliXLogo } from "@/components/ui/IntelliXLogo";

interface ConsultorLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard",         href: "/consultor",              dataTour: "dashboard" },
  { icon: Users,           label: "Clientes",          href: "/consultor/clientes",     dataTour: "menu-organizacoes" },
  { icon: FileText,        label: "Documentos",        href: "/consultor/documentos",   dataTour: "menu-documentos" },
  { icon: CheckSquare,     label: "Tarefas",           href: "/consultor/tarefas",      dataTour: "menu-tarefas" },
  { icon: FileCheck,       label: "Adesão Ética",      href: "/consultor/adesao-etica", dataTour: "menu-adesao-etica" },
  { icon: BarChart3,       label: "Relatórios",        href: "/consultor/relatorios",   dataTour: "menu-relatorios" },
  { icon: CalendarPlus,    label: "Agendar Reunião",   href: "/consultor/agendamento",  dataTour: "menu-reunioes" },
  { icon: Calendar,        label: "Agenda",            href: "/consultor/agenda",       dataTour: "menu-agenda" },
  { icon: AlertTriangle,   label: "Denúncias",         href: "/consultor/denuncias",    dataTour: "menu-denuncias" },
  { icon: Sparkles,        label: "IA: Código de Ética", href: "/consultor/codigo-etica", dataTour: "menu-codigo-etica" },
  { icon: FileText,        label: "IA: Atas",          href: "/consultor/atas",         dataTour: "menu-atas" },
];

export function ConsultorLayout({ children }: ConsultorLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, profile, signOut, isAdmin } = useAuth();
  const { companyName, logoUrl } = useBrandingContext();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const getInitials = () => {
    if (profile?.nome) {
      return profile.nome.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return user?.email?.slice(0, 2).toUpperCase() || "US";
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-sidebar border-r border-sidebar-border transition-all duration-300 ${sidebarOpen ? "w-64" : "w-16"
          } flex flex-col`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
          {sidebarOpen && (
            <Link to="/consultor" className="flex items-center gap-2">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-8 h-8 object-contain rounded" />
              ) : (
                <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
                  <span className="text-sidebar-primary-foreground font-bold text-sm">GIG</span>
                </div>
              )}
              <span className="font-semibold text-sidebar-foreground text-sm">
                Sistema<span className="text-sidebar-primary">GIG</span>
                {companyName && <span className="text-sidebar-foreground opacity-60"> - {companyName}</span>}
              </span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="shrink-0 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href ||
              (item.href !== "/consultor" && location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                to={item.href}
                data-tour={item.dataTour}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                  : "text-sidebar-foreground opacity-80 hover:opacity-100 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }`}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-sidebar-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-3 px-3 py-2.5 h-auto text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                {sidebarOpen && (
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-sidebar-foreground truncate">
                      {profile?.nome || "Consultor"}
                    </p>
                    <p className="text-xs text-sidebar-foreground opacity-60 truncate">
                      {user?.email}
                    </p>
                  </div>
                )}
                {sidebarOpen && <ChevronDown className="h-4 w-4 text-sidebar-foreground opacity-60" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {isAdmin && (
                <>
                  <DropdownMenuItem onClick={() => navigate("/admin")}>
                    <Shield className="mr-2 h-4 w-4" />
                    Painel Admin
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={() => navigate("/consultor/configuracoes")}>
                <Settings className="mr-2 h-4 w-4" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* IntelliX.AI Logo - below user section */}
          {sidebarOpen && (
            <div className="mt-3 pt-3 border-t border-sidebar-border">
              <IntelliXLogo size="sm" />
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-16"}`}>
        {/* Header */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-foreground">Portal do Consultor</h1>
          </div>
          <div className="flex items-center gap-4">
            <TutorialHelpButton userRole="consultor" />
            <NotificationBell />
          </div>
        </header>

        {/* Page content */}
        <div className="p-6">
          {children}
        </div>
      </main>

      {/* IntelliX AI floating chat agent */}
      <AgenteChat />
    </div>
  );
}
