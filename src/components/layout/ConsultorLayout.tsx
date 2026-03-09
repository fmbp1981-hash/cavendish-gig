import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { BaseLayout, NavItem } from "./BaseLayout";
import { AgenteChat } from "@/components/agente/AgenteChat";
import {
  LayoutDashboard,
  Users,
  FileText,
  Shield,
  AlertTriangle,
  CheckSquare,
  Sparkles,
  CalendarPlus,
  CalendarDays,
  FileCheck,
  BarChart3,
  BookOpen,
  Scale,
  ShieldCheck,
  TrendingUp,
  ClipboardList,
  Search,
} from "lucide-react";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard",           href: "/consultor",                    dataTour: "dashboard" },
  { icon: Users,           label: "Clientes",             href: "/consultor/clientes",           dataTour: "menu-organizacoes" },
  { icon: FileText,        label: "Documentos",           href: "/consultor/documentos",         dataTour: "menu-documentos" },
  { icon: CheckSquare,     label: "Tarefas",              href: "/consultor/tarefas",            dataTour: "menu-tarefas" },
  { icon: FileCheck,       label: "Adesão Ética",         href: "/consultor/adesao-etica",       dataTour: "menu-adesao-etica" },
  { icon: BookOpen,        label: "Políticas",            href: "/consultor/politicas",          dataTour: "menu-politicas" },
  { icon: AlertTriangle,   label: "Conflito Interesses",  href: "/consultor/conflitos",          dataTour: "menu-conflitos" },
  { icon: ShieldCheck,     label: "LGPD",                 href: "/consultor/lgpd",               dataTour: "menu-lgpd" },
  { icon: Scale,           label: "Riscos",               href: "/consultor/riscos",             dataTour: "menu-riscos" },
  { icon: ClipboardList,   label: "Due Diligence",        href: "/consultor/due-diligence",      dataTour: "menu-due-diligence" },
  { icon: TrendingUp,      label: "KPIs",                 href: "/consultor/kpis",               dataTour: "menu-kpis" },
  { icon: Shield,          label: "Incidentes",           href: "/consultor/incidentes",         dataTour: "menu-incidentes" },
  { icon: Search,          label: "Auditoria",            href: "/consultor/auditoria",          dataTour: "menu-auditoria" },
  { icon: FileText,        label: "Rel. Regulatórios",    href: "/consultor/relatorios-reg",     dataTour: "menu-relatorios-reg" },
  { icon: Search,          label: "Consulta CEIS",        href: "/consultor/ceis",               dataTour: "menu-ceis" },
  { icon: BarChart3,       label: "Relatórios",           href: "/consultor/relatorios",         dataTour: "menu-relatorios" },
  { icon: CalendarDays,    label: "Agenda",               href: "/consultor/agenda",             dataTour: "menu-agenda" },
  { icon: CalendarPlus,    label: "Agendar Reunião",      href: "/consultor/agendamento",        dataTour: "menu-reunioes" },
  { icon: AlertTriangle,   label: "Denúncias",            href: "/consultor/denuncias",          dataTour: "menu-denuncias" },
  { icon: Sparkles,        label: "IA: Código de Ética",  href: "/consultor/codigo-etica",       dataTour: "menu-codigo-etica" },
  { icon: FileText,        label: "IA: Atas",             href: "/consultor/atas",               dataTour: "menu-atas" },
];

interface ConsultorLayoutProps {
  children: ReactNode;
}

export function ConsultorLayout({ children }: ConsultorLayoutProps) {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const extraMenuItems = isAdmin ? (
    <>
      <DropdownMenuItem onClick={() => navigate("/admin")}>
        <Shield className="mr-2 h-4 w-4" />
        Painel Admin
      </DropdownMenuItem>
      <DropdownMenuSeparator />
    </>
  ) : null;

  return (
    <BaseLayout
      navItems={navItems}
      homeHref="/consultor"
      headerTitle={<h1 className="text-lg font-semibold text-foreground">Portal do Consultor</h1>}
      userRole="consultor"
      settingsHref="/consultor/configuracoes"
      extraMenuItems={extraMenuItems}
    >
      {children}
      <AgenteChat />
    </BaseLayout>
  );
}
