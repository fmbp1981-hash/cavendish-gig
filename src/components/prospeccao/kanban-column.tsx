import { ReactNode } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface KanbanColumnDef {
  id: string;
  title: string;
}

interface KanbanColumnProps {
  column: KanbanColumnDef;
  count: number;
  children: ReactNode;
}

export function KanbanColumn({ column, count, children }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `column:${column.id}` });

  return (
    <div className="w-80 shrink-0">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <span>{column.title}</span>
            <Badge variant="secondary">{count}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            ref={setNodeRef}
            className={"space-y-3 min-h-24 rounded-md p-1 transition-colors " + (isOver ? "bg-muted/40" : "")}
          >
            {children}
            {count === 0 && (
              <div className="text-xs text-muted-foreground text-center py-6">Arraste cards para cá</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
