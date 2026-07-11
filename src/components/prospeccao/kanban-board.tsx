import { ReactNode, useMemo, useState } from "react";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDraggable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { KanbanColumn, type KanbanColumnDef } from "./kanban-column";

// Board de kanban genérico e reutilizável — o projeto usava @dnd-kit só inline em
// ConsultorTarefas.tsx; este é o primeiro componente fatorado para reaproveitamento (o próprio
// módulo de tarefas pode migrar para ele no futuro, fora de escopo aqui).
//
// Sem reordenação persistida dentro da coluna (não existe uma coluna `kanban_order` no schema de
// prospecção) — arrastar move o item entre colunas; a posição dentro da coluna é só visual.

interface DraggableCardProps {
  id: string;
  children: ReactNode;
}

function DraggableCard({ id, children }: DraggableCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  const style = {
    transform: CSS.Translate.toString(transform),
  } as React.CSSProperties;

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? "opacity-40" : ""} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

export interface KanbanRenderContext {
  columns: KanbanColumnDef[];
  currentColumnId: string;
  /** Alternativa por teclado/sem ponteiro ao drag-and-drop (WCAG 2.5.7) — a página que renderiza
   * o card deve expor isso como uma ação clicável (ex: menu "Mover para"). */
  moveTo: (toColumnId: string) => void;
}

export interface KanbanBoardProps<T extends { id: string }> {
  columns: KanbanColumnDef[];
  items: T[];
  getColumnId: (item: T) => string;
  onMoveItem: (itemId: string, toColumnId: string) => void;
  renderCard: (item: T, ctx: KanbanRenderContext) => ReactNode;
}

export function KanbanBoard<T extends { id: string }>({
  columns,
  items,
  getColumnId,
  onMoveItem,
  renderCard,
}: KanbanBoardProps<T>) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const itemsByColumn = useMemo(() => {
    const map: Record<string, T[]> = Object.fromEntries(columns.map((c) => [c.id, [] as T[]]));
    for (const item of items) {
      const columnId = getColumnId(item);
      if (map[columnId]) map[columnId].push(item);
    }
    return map;
  }, [items, columns, getColumnId]);

  const activeItem = activeId ? items.find((i) => i.id === activeId) : undefined;

  // Só as colunas são registradas como droppable (useDroppable em KanbanColumn) — os cards em si
  // não são alvo de drop, então `event.over.id` é sempre "column:<id>", nunca o id de outro card.
  const parseColumnId = (id: string) => (id.startsWith("column:") ? id.replace("column:", "") : null);

  const handleDragStart = (event: DragStartEvent) => setActiveId(String(event.active.id));

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const overId = event.over ? String(event.over.id) : null;
    if (!overId) return;

    const draggedId = String(event.active.id);
    const draggedItem = items.find((i) => i.id === draggedId);
    if (!draggedItem) return;

    const toColumnId = parseColumnId(overId);
    if (!toColumnId || toColumnId === getColumnId(draggedItem)) return;

    onMoveItem(draggedId, toColumnId);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-4">
        {columns.map((column) => (
          <KanbanColumn key={column.id} column={column} count={itemsByColumn[column.id]?.length ?? 0}>
            {(itemsByColumn[column.id] ?? []).map((item) => (
              <DraggableCard key={item.id} id={item.id}>
                {renderCard(item, { columns, currentColumnId: getColumnId(item), moveTo: (toColumnId) => onMoveItem(item.id, toColumnId) })}
              </DraggableCard>
            ))}
          </KanbanColumn>
        ))}
      </div>

      <DragOverlay>
        {activeItem ? (
          <div className="w-[300px] rotate-2 scale-[1.03] drop-shadow-xl">
            {renderCard(activeItem, { columns, currentColumnId: getColumnId(activeItem), moveTo: () => {} })}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
