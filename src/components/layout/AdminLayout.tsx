import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { BaseLayout, NavEntry } from "./BaseLayout";
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
  ShieldCheck,
  User,
  Handshake,
  Library,
  Search,
  Kanban,
  ClipboardList,
  Megaphone,
  Gauge,
  Bot,
  UserCheck,
} from "lucide-react";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

// Menu organizado por módulos colapsáveis (acordeão — só um módulo aberto por vez, ver
// BaseLayout.tsx). Cada módulo de negócio vira um NavGroup; "Agentes de IA" do Finder mora no
// grupo Sistema junto de Configurações (é uma configuração do sistema, não uma etapa do fluxo de
// prospecção como Busca/Leads/Funil/Campanhas — pedido explícito do usuário).
const navItems: NavEntry[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin", dataTour: "admin-nav-dashboard" },
  {
    id: "clientes",
    icon: Building2,
    label: "Clientes",
    items: [
      { icon: Building2, label: "Organizações", href: "/admin/organizacoes", dataTour: "admin-nav-organizacoes" },
      { icon: Users,     label: "Usuários",     href: "/admin/usuarios",     dataTour: "admin-nav-usuarios" },
      { icon: UserCheck, label: "Clientes Convertidos", href: "/admin/clientes-convertidos", dataTour: "admin-nav-clientes-convertidos" },
    ],
  },
  {
    id: "finder",
    icon: Search,
    label: "Finder",
    items: [
      { icon: Gauge,         label: "Dashboard",  href: "/admin/finder",           dataTour: "admin-nav-finder-dashboard" },
      { icon: Search,        label: "Busca",      href: "/admin/finder/busca",     dataTour: "admin-nav-finder-busca" },
      { icon: ClipboardList, label: "Leads",      href: "/admin/finder/leads",     dataTour: "admin-nav-finder-leads" },
      { icon: Kanban,        label: "Funil",      href: "/admin/finder/funil",     dataTour: "admin-nav-finder-funil" },
      { icon: Megaphone,     label: "Campanhas",  href: "/admin/finder/campanhas", dataTour: "admin-nav-finder-campanhas" },
    ],
  },
  {
    id: "conteudo",
    icon: Library,
    label: "Conteúdo",
    items: [
      { icon: FileText, label: "Documentos", href: "/admin/documentos", dataTour: "admin-nav-documentos" },
      { icon: Database, label: "Catálogo",   href: "/admin/catalogo",   dataTour: "admin-nav-catalogo" },
      { icon: FileText, label: "Templates",  href: "/admin/templates",  dataTour: "admin-nav-templates" },
      { icon: Library,  label: "Biblioteca", href: "/admin/biblioteca", dataTour: "admin-nav-biblioteca" },
    ],
  },
  { icon: TrendingUp, label: "Relatórios", href: "/admin/relatorios/historico", dataTour: "admin-nav-relatorios" },
  {
    id: "sistema",
    icon: Settings,
    label: "Sistema",
    items: [
      { icon: Plug,        label: "Integrações",         href: "/admin/integracoes",          dataTour: "admin-nav-integracoes" },
      { icon: Bot,         label: "Agentes de IA (Finder)", href: "/admin/finder/configuracoes", dataTour: "admin-nav-finder-configuracoes" },
      { icon: Sparkles,    label: "Branding",            href: "/admin/branding",             dataTour: "admin-nav-branding" },
      { icon: Bug,         label: "Logs do Sistema",     href: "/admin/logs",                 dataTour: "admin-nav-logs" },
      { icon: ShieldCheck, label: "Audit Trail",         href: "/admin/audit-trail",          dataTour: "admin-nav-audit" },
      { icon: Settings,    label: "Configurações",       href: "/admin/configuracoes",        dataTour: "admin-nav-configuracoes" },
    ],
  },
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
      <DropdownMenuItem onClick={() => navigate("/parceiro")}>
        <Handshake className="mr-2 h-4 w-4" />
        Portal do Parceiro
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => navigate("/meu-projeto")}>
        <User className="mr-2 h-4 w-4" />
        Portal do Cliente
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
