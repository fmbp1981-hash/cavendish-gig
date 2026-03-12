import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { BaseLayout, NavItem } from "./BaseLayout";
import { useAuth } from "@/contexts/AuthContext";
import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
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
  ShieldCheck,
  Users2,
  Handshake,
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
  const navigate = useNavigate();
  const { isAdmin, isConsultor, roles } = useAuth();
  
  const isParceiro = roles?.includes("parceiro");

  const extraMenuItems = (isAdmin || isConsultor || isParceiro) ? (
    <>
      {isAdmin && (
        <DropdownMenuItem onClick={() => navigate("/admin")}>
          <ShieldCheck className="mr-2 h-4 w-4" />
          Painel Administrativo
        </DropdownMenuItem>
      )}
      {isConsultor && (
        <DropdownMenuItem onClick={() => navigate("/consultor")}>
          <Users2 className="mr-2 h-4 w-4" />
          Portal Consultor
        </DropdownMenuItem>
      )}
      {isParceiro && (
        <DropdownMenuItem onClick={() => navigate("/parceiro")}>
          <Handshake className="mr-2 h-4 w-4" />
          Portal do Parceiro
        </DropdownMenuItem>
      )}
      <DropdownMenuSeparator />
    </>
  ) : null;

  return (
    <BaseLayout
      navItems={menuItems}
      homeHref="/meu-projeto"
      headerTitle={null}
      userRole="cliente"
      settingsHref="/meu-projeto/configuracoes"
      extraMenuItems={extraMenuItems}
    >
      {children}
    </BaseLayout>
  );
}
