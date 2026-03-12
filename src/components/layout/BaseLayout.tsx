import { useState, ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useBrandingContext } from "@/components/branding/TenantBrandingProvider";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { TutorialHelpButton } from "@/components/tutorial/TutorialHelpButton";
import { AgenteChat } from "@/components/agente/AgenteChat";
import { IntelliXLogo } from "@/components/ui/IntelliXLogo";
import { cn } from "@/lib/utils";
import {
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  LucideIcon,
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

export interface NavItem {
  icon: LucideIcon;
  label: string;
  href: string;
  dataTour?: string;
}

interface BaseLayoutProps {
  children: ReactNode;
  navItems: NavItem[];
  homeHref: string;
  headerTitle: ReactNode;
  userRole: "admin" | "consultor" | "cliente" | "parceiro";
  settingsHref: string;
  /** Extra DropdownMenuItems rendered before Settings */
  extraMenuItems?: ReactNode;
  /** Renders AgenteChat trigger in the header (consultor layout) */
  showAgentChat?: boolean;
}

export function BaseLayout({
  children,
  navItems,
  homeHref,
  headerTitle,
  userRole,
  settingsHref,
  extraMenuItems,
  showAgentChat = false,
}: BaseLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
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
      return profile.nome.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return user?.email?.slice(0, 2).toUpperCase() || "US";
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col",
          sidebarOpen ? "w-64" : "w-16",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
          {sidebarOpen && (
            <Link to={homeHref} className="flex items-center gap-2 overflow-hidden">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-8 h-8 object-contain rounded shrink-0" />
              ) : (
                <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center shrink-0">
                  <span className="text-sidebar-primary-foreground font-bold text-xs">GIG</span>
                </div>
              )}
              <span className="font-semibold text-sidebar-foreground text-sm truncate">
                Sistema<span className="text-sidebar-primary">GIG</span>
                {companyName && (
                  <span className="text-sidebar-foreground opacity-60"> - {companyName}</span>
                )}
              </span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="shrink-0 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hidden lg:flex"
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(false)}
            className="shrink-0 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lg:hidden"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.href ||
              (item.href !== homeHref && location.pathname.startsWith(item.href + "/"));
            return (
              <Link
                key={item.href}
                to={item.href}
                data-tour={item.dataTour}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                    : "text-sidebar-foreground opacity-80 hover:opacity-100 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  !sidebarOpen && "justify-center px-2"
                )}
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
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 px-3 py-2.5 h-auto text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                {sidebarOpen && (
                  <div className="flex-1 text-left overflow-hidden">
                    <p className="text-sm font-medium text-sidebar-foreground truncate">
                      {profile?.nome || "Usuário"}
                    </p>
                    <p className="text-xs text-sidebar-foreground opacity-60 truncate">
                      {user?.email}
                    </p>
                  </div>
                )}
                {sidebarOpen && (
                  <ChevronDown className="h-4 w-4 text-sidebar-foreground opacity-60" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {extraMenuItems}
              <DropdownMenuItem onClick={() => navigate(settingsHref)}>
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

          {sidebarOpen && (
            <div className="mt-3 pt-3 border-t border-sidebar-border">
              <IntelliXLogo size="sm" />
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className={cn("flex-1 transition-all duration-300", sidebarOpen ? "ml-64" : "ml-16")}>
        {/* Header */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
            {headerTitle && (
              <div className="flex items-center gap-3">{headerTitle}</div>
            )}
          </div>
          <div className="flex items-center gap-4">
            {showAgentChat && <AgenteChat mode="header" />}
            <NotificationBell />
            <TutorialHelpButton userRole={userRole} />
          </div>
        </header>

        {/* Page content */}
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
