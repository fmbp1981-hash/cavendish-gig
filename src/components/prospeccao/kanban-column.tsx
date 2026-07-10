import { ReactNode } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { getEtapaCores } from "@/lib/prospeccao/funil-etapa-cores";

export interface KanbanColumnDef {
  id: string;
  title: string;
  posicao?: number;
  isTerminal?: boolean;
}

interface KanbanColumnProps {
  column: KanbanColumnDef;
  count: number;
  children: ReactNode;
}

export function KanbanColumn({ column, count, children }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `column:${column.id}` });
  const cores = getEtapaCores(column.title, column.posicao, column.isTerminal);

  return (
    <div className="w-[300px] shrink-0 flex flex-col">
      <div className={cn("h-1.5 rounded-t-lg", cores.bar)} />
      <div className="flex flex-col flex-1 rounded-b-lg border border-t-0 bg-card shadow-sm">
        <div className="flex items-center justify-between gap-2 px-3 py-3 border-b bg-muted/30 rounded-t-none">
          <div className="flex items-center gap-2 min-w-0">
            <span className={cn("h-2 w-2 rounded-full shrink-0", cores.dot)} />
            <h3 className={cn("text-sm font-semibold truncate", cores.headerText)}>{column.title}</h3>
          </div>
          <Badge variant="outline" className={cn("shrink-0 font-mono tabular-nums", cores.badge)}>
            {count}
          </Badge>
        </div>

        <div
          ref={setNodeRef}
          className={cn(
            "flex-1 space-y-2.5 p-2.5 min-h-[180px] rounded-b-lg transition-all",
            isOver && cn("ring-2 ring-inset", cores.ring, cores.tint)
          )}
        >
          {children}
          {count === 0 && (
            <div className="flex flex-col items-center justify-center gap-1.5 py-8 text-muted-foreground/60">
              <Inbox className="h-5 w-5" />
              <span className="text-xs">Arraste cards para cá</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
