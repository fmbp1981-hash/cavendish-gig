import { ReactNode, useState } from 'react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import { useBrandingContext } from '@/components/branding/TenantBrandingProvider';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { TutorialHelpButton } from '@/components/tutorial/TutorialHelpButton';
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ClipboardCheck,
  GraduationCap,
  ScrollText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IntelliXLogo } from '@/components/ui/IntelliXLogo';
import { cn } from '@/lib/utils';

interface ClienteLayoutProps {
  children: ReactNode;
}

const menuItems = [
  { title: 'Meu Projeto', url: '/meu-projeto', icon: LayoutDashboard, dataTour: 'dashboard' },
  { title: 'Diagnóstico', url: '/meu-projeto/diagnostico', icon: ClipboardCheck, dataTour: 'menu-diagnosticos' },
  { title: 'Treinamentos', url: '/meu-projeto/treinamentos', icon: GraduationCap, dataTour: 'menu-treinamentos' },
  { title: 'Código de Ética', url: '/meu-projeto/codigo-etica', icon: ScrollText },
  { title: 'Documentos Necessários', url: '/meu-projeto/documentos-necessarios', icon: FileText, badge: true, dataTour: 'menu-documentos-necessarios' },
  { title: 'Repositório', url: '/meu-projeto/documentos', icon: FolderOpen },
  { title: 'Configurações', url: '/meu-projeto/configuracoes', icon: Settings },
];

export function ClienteLayout({ children }: ClienteLayoutProps) {
  const { profile, signOut } = useAuth();
  const { companyName, logoUrl } = useBrandingContext();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:sticky top-0 left-0 z-50 h-screen bg-card border-r border-border flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border">
          {!collapsed && (
            <div className="flex items-center gap-2">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-8 h-8 object-contain rounded" />
              ) : (
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-xs">GIG</span>
                </div>
              )}
              <span className="font-semibold text-sm text-foreground">
                Sistema<span className="text-primary">GIG</span>
                {companyName && <span className="text-muted-foreground"> - {companyName}</span>}
              </span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex"
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(false)}
            className="lg:hidden"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <NavLink
              key={item.url}
              to={item.url}
              data-tour={item.dataTour}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors",
                collapsed && "justify-center px-2"
              )}
              activeClassName="bg-primary/10 text-primary font-medium"
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.title}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-border">
          <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-medium text-primary">
                {profile?.nome?.charAt(0) || 'U'}
              </span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {profile?.nome || 'Usuário'}
                </p>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              className={cn(collapsed && "hidden")}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>

          {/* IntelliX.AI Logo - below user name */}
          {!collapsed && (
            <div className="mt-3 pt-3 border-t border-border">
              <IntelliXLogo size="sm" />
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 flex items-center justify-between px-4 lg:px-6 border-b border-border bg-card">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <TutorialHelpButton userRole="cliente" />
            <NotificationBell />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
