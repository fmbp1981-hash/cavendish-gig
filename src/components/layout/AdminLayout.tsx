import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { BaseLayout, NavItem } from "./BaseLayout";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
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
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard",       href: "/admin",                       dataTour: "admin-nav-dashboard" },
  { icon: Building2,       label: "Organizações",    href: "/admin/organizacoes",          dataTour: "admin-nav-organizacoes" },
  { icon: Users,           label: "Usuários",         href: "/admin/usuarios",              dataTour: "admin-nav-usuarios" },
  { icon: UserCog,         label: "Consultores",      href: "/admin/consultores",           dataTour: "admin-nav-consultores" },
  { icon: FileText,        label: "Documentos",       href: "/admin/documentos",            dataTour: "admin-nav-documentos" },
  { icon: Database,        label: "Catálogo",         href: "/admin/catalogo",              dataTour: "admin-nav-catalogo" },
  { icon: FileText,        label: "Templates",        href: "/admin/templates",             dataTour: "admin-nav-templates" },
  { icon: TrendingUp,      label: "Relatórios",       href: "/admin/relatorios/historico",  dataTour: "admin-nav-relatorios" },
  { icon: Plug,            label: "Integrações",      href: "/admin/integracoes",           dataTour: "admin-nav-integracoes" },
  { icon: Sparkles,        label: "Branding",         href: "/admin/branding",              dataTour: "admin-nav-branding" },
  { icon: Bug,             label: "Logs do Sistema",  href: "/admin/logs",                  dataTour: "admin-nav-logs" },
  { icon: Settings,        label: "Configurações",    href: "/admin/configuracoes",         dataTour: "admin-nav-configuracoes" },
];

const headerTitle = (
  <>
    <h1 className="text-lg font-semibold text-foreground">Painel Administrativo</h1>
    <Badge variant="outline" className="text-amber-700 border-amber-600/40 bg-amber-50">
      Acesso Total
    </Badge>
  </>
);

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();

  const extraMenuItems = (
    <>
      <DropdownMenuItem onClick={() => navigate("/consultor")}>
        <Users2 className="mr-2 h-4 w-4" />
        Portal Consultor
      </DropdownMenuItem>
      <DropdownMenuSeparator />
    </>
  );

  return (
    <BaseLayout
      navItems={navItems}
      homeHref="/admin"
      headerTitle={headerTitle}
      userRole="admin"
      settingsHref="/admin/configuracoes"
      extraMenuItems={extraMenuItems}
      showAgentChat={true}
    >
      {children}
    </BaseLayout>
  );
}
