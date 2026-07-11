import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface FinderPageHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  /** Botões/filtros do canto direito — mantém o mesmo layout de header em toda página do Finder
   * em vez de cada tela reimplementar seu próprio `flex items-center justify-between`. */
  actions?: ReactNode;
}

/** Cabeçalho padrão das páginas do Finder — badge de ícone + título com mais peso visual do que
 * o `text-2xl font-bold` genérico usado antes. Substitui o h1 duplicado em leads-view,
 * clientes-view, funil-view, busca-view e no dashboard. */
export function FinderPageHeader({ icon: Icon, title, subtitle, actions }: FinderPageHeaderProps) {
  return (
    <div className="flex items-start justify-between flex-wrap gap-4">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-primary/10 p-2.5 text-primary shrink-0">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}
