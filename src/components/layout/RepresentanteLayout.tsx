import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { BaseLayout, NavItem } from "./BaseLayout";
import { Badge } from "@/components/ui/badge";
import { Users, Kanban, Shield, Search } from "lucide-react";
import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

// Menu ainda cobre só as páginas que já existem (Busca, Leads, Funil) — Dashboard e Conversões
// entram conforme as fases seguintes do módulo Finder forem implementadas
// (ver FINDER_MODULE_SPEC.md §1.2).
const navItems: NavItem[] = [
  { icon: Search, label: "Busca", href: "/representante/finder/busca", dataTour: "representante-nav-busca" },
  { icon: Users, label: "Meus Leads", href: "/representante/finder/leads", dataTour: "representante-nav-leads" },
  { icon: Kanban, label: "Funil", href: "/representante/finder/funil", dataTour: "representante-nav-funil" },
];

const headerTitle = (
  <>
    <h1 className="text-lg font-semibold text-foreground">Finder</h1>
    <Badge variant="outline" className="text-sky-700 border-sky-600/40 bg-sky-50">
      Representante
    </Badge>
  </>
);

interface RepresentanteLayoutProps {
  children: ReactNode;
}

export function RepresentanteLayout({ children }: RepresentanteLayoutProps) {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

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
      homeHref="/representante/finder/leads"
      headerTitle={headerTitle}
      userRole="representante"
      settingsHref="/help"
      extraMenuItems={extraMenuItems}
    >
      {children}
    </BaseLayout>
  );
}
