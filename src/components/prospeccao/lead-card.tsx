import { CalendarCheck, Building2, GripVertical, MoreVertical } from "lucide-react";
import { CategoryBadge } from "./category-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { STATUS_TOKENS, scoreParaTom } from "@/lib/prospeccao/status-tokens";
import type { ProspeccaoLead } from "@/types/prospeccao";
import type { KanbanColumnDef } from "./kanban-column";

interface LeadCardProps {
  lead: ProspeccaoLead;
  /** Nome do representante responsável — só relevante na visão do admin (múltiplos representantes).
   * O join com `profiles`/`auth.users` é feito pela página que usa o card, não aqui (sem embedded
   * joins, convenção do projeto). */
  responsavelNome?: string;
  onClick?: () => void;
  /** Classe Tailwind (bg-*) da cor da etapa atual do lead — pinta a barra de destaque à esquerda.
   * Vem de getEtapaCores(), calculado pela página que sabe em qual etapa o lead está. */
  accentClassName?: string;
  /** Colunas do funil e etapa atual do lead — alimentam o menu "Mover para", a alternativa por
   * teclado ao drag-and-drop (WCAG 2.5.7: toda ação de arrastar precisa de um caminho sem
   * ponteiro). Omitidos quando o card é usado fora de um kanban. */
  columns?: KanbanColumnDef[];
  currentColumnId?: string;
  onMoveToColumn?: (columnId: string) => void;
}

export function LeadCard({
  lead,
  responsavelNome,
  onClick,
  accentClassName,
  columns,
  currentColumnId,
  onMoveToColumn,
}: LeadCardProps) {
  const outrasColunas = (columns ?? []).filter((c) => c.id !== currentColumnId);

  return (
    <div
      onClick={onClick}
      className="group relative overflow-hidden rounded-lg border bg-background shadow-sm hover:shadow-md hover:border-foreground/20 transition-all cursor-grab active:cursor-grabbing"
    >
      <div className={cn("absolute inset-y-0 left-0 w-1", accentClassName ?? "bg-border")} />

      <div className="pl-3.5 pr-3 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-medium text-sm truncate flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              {lead.nome}
            </div>
            {lead.cidade && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {lead.cidade}
                {lead.estado ? ` - ${lead.estado}` : ""}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {lead.reuniao_fechamento_id && (
              <CalendarCheck className="h-4 w-4 text-emerald-600" aria-label="Reunião de fechamento agendada" />
            )}
            {outrasColunas.length > 0 && onMoveToColumn && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label={`Mover ${lead.nome} para outra etapa`}
                    className="rounded p-0.5 text-muted-foreground/60 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuLabel>Mover para</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {outrasColunas.map((coluna) => (
                    <DropdownMenuItem key={coluna.id} onClick={() => onMoveToColumn(coluna.id)}>
                      {coluna.title}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <GripVertical
              className="h-4 w-4 text-muted-foreground/0 group-hover:text-muted-foreground/50 transition-colors"
              aria-hidden="true"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
          <CategoryBadge categoria={lead.categoria} />
          {typeof lead.ai_score === "number" && (
            <span
              className={cn(
                "text-xs font-semibold px-1.5 py-0.5 rounded-full leading-none",
                STATUS_TOKENS[scoreParaTom(lead.ai_score)].pill
              )}
            >
              {lead.ai_score}
            </span>
          )}
        </div>

        {responsavelNome && (
          <p className="text-xs text-muted-foreground mt-2 truncate">Responsável: {responsavelNome}</p>
        )}
      </div>
    </div>
  );
}
