import { ReactNode } from "react";
import { BaseLayout, NavItem } from "./BaseLayout";
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  Settings,
  ClipboardCheck,
  GraduationCap,
  ScrollText,
  BookOpen,
  AlertTriangle,
} from "lucide-react";

const menuItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Meu Projeto",            href: "/meu-projeto",                        dataTour: "dashboard" },
  { icon: ClipboardCheck,  label: "Diagnóstico",            href: "/meu-projeto/diagnostico",            dataTour: "menu-diagnosticos" },
  { icon: GraduationCap,   label: "Treinamentos",           href: "/meu-projeto/treinamentos",           dataTour: "menu-treinamentos" },
  { icon: ScrollText,      label: "Código de Ética",        href: "/meu-projeto/codigo-etica",           dataTour: "menu-codigo-etica-cliente" },
  { icon: FileText,        label: "Documentos Necessários", href: "/meu-projeto/documentos-necessarios", dataTour: "menu-documentos-necessarios" },
  { icon: FolderOpen,      label: "Repositório",            href: "/meu-projeto/documentos",             dataTour: "menu-repositorio" },
  { icon: BookOpen,        label: "Políticas",              href: "/meu-projeto/politicas",              dataTour: "menu-politicas-cliente" },
  { icon: AlertTriangle,   label: "Minha Declaração",       href: "/meu-projeto/conflitos",              dataTour: "menu-conflitos-cliente" },
  { icon: Settings,        label: "Configurações",          href: "/meu-projeto/configuracoes" },
];

interface ClienteLayoutProps {
  children: ReactNode;
}

export function ClienteLayout({ children }: ClienteLayoutProps) {
  return (
    <BaseLayout
      navItems={menuItems}
      homeHref="/meu-projeto"
      headerTitle={null}
      userRole="cliente"
      settingsHref="/meu-projeto/configuracoes"
    >
      {children}
    </BaseLayout>
  );
}
