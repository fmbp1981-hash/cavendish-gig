import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useBrandingContext } from "@/components/branding/TenantBrandingProvider";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { TutorialHelpButton } from "@/components/tutorial/TutorialHelpButton";
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Building2,
  Database,
  UserCog,
  Users2,
  Plug,
  TrendingUp,
  Sparkles,
  Bug,
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
import { Badge } from "@/components/ui/badge";
import { IntelliXLogo } from "@/components/ui/IntelliXLogo";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard",       href: "/admin",                        dataTour: "admin-nav-dashboard" },
  { icon: Building2,      label: "Organizações",     href: "/admin/organizacoes",           dataTour: "admin-nav-organizacoes" },
  { icon: Users,          label: "Usuários",          href: "/admin/usuarios",               dataTour: "admin-nav-usuarios" },
  { icon: UserCog,        label: "Consultores",       href: "/admin/consultores",            dataTour: "admin-nav-consultores" },
  { icon: FileText,       label: "Documentos",        href: "/consultor/documentos",         dataTour: "admin-nav-documentos" },
  { icon: Database,       label: "Catálogo",          href: "/admin/catalogo",               dataTour: "admin-nav-catalogo" },
  { icon: FileText,       label: "Templates",         href: "/admin/templates",              dataTour: "admin-nav-templates" },
  { icon: TrendingUp,     label: "Relatórios",        href: "/admin/relatorios/historico",   dataTour: "admin-nav-relatorios" },
  { icon: Plug,           label: "Integrações",       href: "/admin/integracoes",            dataTour: "admin-nav-integracoes" },
  { icon: Sparkles,       label: "Branding",          href: "/admin/branding",               dataTour: "admin-nav-branding" },
  { icon: Bug,            label: "Logs do Sistema",   href: "/admin/logs",                   dataTour: "admin-nav-logs" },
  { icon: Settings,       label: "Configurações",     href: "/admin/configuracoes",          dataTour: "admin-nav-configuracoes" },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, profile, signOut } = useAuth();
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
    return user?.email?.slice(0, 2).toUpperCase() || "AD";
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
            <Link to="/admin" className="flex items-center gap-2">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-8 h-8 object-contain rounded" />
              ) : (
                <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
                  <span className="text-sidebar-primary-foreground font-bold text-xs">GIG</span>
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-semibold text-sidebar-foreground text-sm">
                  Sistema<span className="text-sidebar-primary">GIG</span>
                  {companyName && <span className="text-sidebar-foreground opacity-60"> - {companyName}</span>}
                </span>
                <Badge className="text-[10px] px-1 py-0 bg-sidebar-primary/20 text-sidebar-primary border-sidebar-primary/30">ADMIN</Badge>
              </div>
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
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href ||
              (item.href !== "/admin" && location.pathname.startsWith(item.href));
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
                      {profile?.nome || "Administrador"}
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
              <DropdownMenuLabel>Conta Admin</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/consultor")}>
                <Users2 className="mr-2 h-4 w-4" />
                Portal Consultor
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/admin/configuracoes")}>
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
            <h1 className="text-lg font-semibold text-foreground">Painel Administrativo</h1>
            <Badge variant="outline" className="text-amber-700 border-amber-600/40 bg-amber-50">
              Acesso Total
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <TutorialHelpButton userRole="admin" />
            <NotificationBell />
          </div>
        </header>

        {/* Page content */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
