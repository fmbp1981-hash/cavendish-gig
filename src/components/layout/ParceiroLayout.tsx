import { ReactNode } from "react";
import { BaseLayout, NavItem } from "./BaseLayout";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  FileCheck,
  CalendarCheck,
  Leaf,
  Sparkles,
  Settings,
} from "lucide-react";

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
  return (
    <BaseLayout
      navItems={navItems}
      homeHref="/parceiro"
      headerTitle={headerTitle}
      userRole="parceiro"
      settingsHref="/parceiro/configuracoes"
    >
      {children}
    </BaseLayout>
  );
}
