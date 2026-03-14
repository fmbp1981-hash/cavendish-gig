import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { BaseLayout, NavItem } from "./BaseLayout";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  FileCheck,
  CalendarCheck,
  Leaf,
  Sparkles,
  Settings,
  Shield,
  Users2,
  User,
} from "lucide-react";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const navItems: NavItem[] = [
  { icon: ShieldCheck,  label: "Compliance",            href: "/parceiro/compliance",            dataTour: "parceiro-nav-compliance" },
  { icon: FileCheck,    label: "Adesão Ética",          href: "/parceiro/adesao-etica",          dataTour: "parceiro-nav-adesao-etica" },
  { icon: CalendarCheck, label: "Calendário Regulatório", href: "/parceiro/compliance-calendar", dataTour: "parceiro-nav-calendar" },
  { icon: Leaf,         label: "ESG",                   href: "/parceiro/esg",                   dataTour: "parceiro-nav-esg" },
  { icon: Sparkles,     label: "Código de Ética",       href: "/parceiro/codigo-etica",          dataTour: "parceiro-nav-codigo-etica" },
  { icon: Settings,     label: "Configurações",         href: "/parceiro/configuracoes" },
];

const headerTitle = (
  <>
    <h1 className="text-lg font-semibold text-foreground">Portal do Parceiro</h1>
    <Badge variant="outline" className="text-emerald-700 border-emerald-600/40 bg-emerald-50">
      Parceiro
    </Badge>
  </>
);

interface ParceiroLayoutProps {
  children: ReactNode;
}

export function ParceiroLayout({ children }: ParceiroLayoutProps) {
  const navigate = useNavigate();
  const { isAdmin, isConsultor } = useAuth();

  const hasAnyExtra = isAdmin || isConsultor;

  const extraMenuItems = hasAnyExtra ? (
    <>
      {isAdmin && (
        <DropdownMenuItem onClick={() => navigate("/admin")}>
          <Shield className="mr-2 h-4 w-4" />
          Painel Admin
        </DropdownMenuItem>
      )}
      {isConsultor && (
        <DropdownMenuItem onClick={() => navigate("/consultor")}>
          <Users2 className="mr-2 h-4 w-4" />
          Portal Consultor
        </DropdownMenuItem>
      )}
      <DropdownMenuItem onClick={() => navigate("/meu-projeto")}>
        <User className="mr-2 h-4 w-4" />
        Portal do Cliente
      </DropdownMenuItem>
      <DropdownMenuSeparator />
    </>
  ) : null;

  return (
    <BaseLayout
      navItems={navItems}
      homeHref="/parceiro"
      headerTitle={headerTitle}
      userRole="parceiro"
      settingsHref="/parceiro/configuracoes"
      extraMenuItems={extraMenuItems}
    >
      {children}
    </BaseLayout>
  );
}
