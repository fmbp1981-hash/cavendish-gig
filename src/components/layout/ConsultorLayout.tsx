import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { BaseLayout, NavItem } from "./BaseLayout";
import {
  LayoutDashboard,
  Users,
  FileText,
  Shield,
  CheckSquare,
  Sparkles,
  CalendarPlus,
  CalendarDays,
  CalendarCheck,
  FileCheck,
  BarChart3,
  ShieldCheck,
  AlertTriangle,
  Building2,
  Leaf,
  PresentationIcon,
  User,
  Handshake,
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
  { icon: ShieldCheck,     label: "Compliance",           href: "/consultor/compliance",         dataTour: "menu-compliance" },
  { icon: CalendarCheck,      label: "Calendário Regulatório", href: "/consultor/compliance-calendar", dataTour: "menu-calendar" },
  { icon: Leaf,               label: "ESG",                   href: "/consultor/esg",                dataTour: "menu-esg" },
  { icon: PresentationIcon,   label: "Board Reporting",        href: "/consultor/board",              dataTour: "menu-board" },
  { icon: BarChart3,          label: "Relatórios",             href: "/consultor/relatorios",         dataTour: "menu-relatorios" },
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
  const { isAdmin, roles } = useAuth();
  const navigate = useNavigate();

  const isParceiro = roles?.includes("parceiro");
  const hasAnyExtra = isAdmin || isParceiro;

  const extraMenuItems = hasAnyExtra ? (
    <>
      {isAdmin && (
        <DropdownMenuItem onClick={() => navigate("/admin")}>
          <Shield className="mr-2 h-4 w-4" />
          Painel Admin
        </DropdownMenuItem>
      )}
      {isParceiro && (
        <DropdownMenuItem onClick={() => navigate("/parceiro")}>
          <Handshake className="mr-2 h-4 w-4" />
          Portal do Parceiro
        </DropdownMenuItem>
      )}
      <DropdownMenuItem onClick={() => navigate("/meu-projeto")}>
        <User className="mr-2 h-4 w-4" />
        Portal do Cliente
      </DropdownMenuItem>
      <DropdownMenuSeparator />
    </>
  ) : (
    <>
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
      homeHref="/consultor"
      headerTitle={<h1 className="text-lg font-semibold text-foreground">Portal do Consultor</h1>}
      userRole="consultor"
      settingsHref="/consultor/configuracoes"
      extraMenuItems={extraMenuItems}
      showAgentChat={true}
    >
      {children}
    </BaseLayout>
  );
}
