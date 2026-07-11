import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type SortDirection = "asc" | "desc";

interface SortableTableHeadProps {
  label: string;
  active: boolean;
  direction?: SortDirection;
  onClick: () => void;
  className?: string;
}

/** Cabeçalho de tabela clicável, com indicador de direção — usado em leads-view.tsx e
 * clientes-view.tsx. Herda o className/altura padrão de TableHead; só troca o conteúdo de
 * texto simples por um botão acessível (foco visível, `aria-sort`). */
export function SortableTableHead({ label, active, direction, onClick, className }: SortableTableHeadProps) {
  const Icon = !active ? ArrowUpDown : direction === "asc" ? ArrowUp : ArrowDown;
  return (
    <TableHead
      className={className}
      aria-sort={active ? (direction === "asc" ? "ascending" : "descending") : "none"}
    >
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "flex items-center gap-1 -ml-2 rounded px-2 py-1 hover:bg-muted/60 hover:text-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors",
          active && "text-foreground"
        )}
      >
        {label}
        <Icon className={cn("h-3.5 w-3.5", active ? "opacity-100" : "opacity-40")} aria-hidden="true" />
      </button>
    </TableHead>
  );
}
