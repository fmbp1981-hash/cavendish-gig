import { useEffect, useMemo, useState } from "react";
import { ConsultorLayout } from "@/components/layout/ConsultorLayout";
import { useTarefas, useCriarTarefa, useAtualizarTarefa, useExcluirTarefa } from "@/hooks/useTarefas";
import { useOrganizacoes } from "@/hooks/useConsultorData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Calendar, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const statusConfig: Record<string, { label: string; color: string }> = {
  pendente: { label: "Pendente", color: "bg-yellow-500" },
  em_andamento: { label: "Em Andamento", color: "bg-blue-500" },
  concluida: { label: "Concluída", color: "bg-green-500" },
  cancelada: { label: "Cancelada", color: "bg-gray-500" },
};

const prioridadeConfig: Record<string, { label: string; color: string }> = {
  baixa: { label: "Baixa", color: "text-gray-500" },
  media: { label: "Média", color: "text-yellow-500" },
  alta: { label: "Alta", color: "text-orange-500" },
  urgente: { label: "Urgente", color: "text-red-500" },
};

export default function ConsultorTarefas() {
  const { data: tarefas, isLoading } = useTarefas();
  const { data: organizacoes } = useOrganizacoes();
  const criarTarefa = useCriarTarefa();
  const atualizarTarefa = useAtualizarTarefa();
  const excluirTarefa = useExcluirTarefa();
  const queryClient = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [localTasks, setLocalTasks] = useState(tarefas || []);
  const [novaTarefa, setNovaTarefa] = useState({
    titulo: "",
    descricao: "",
    prioridade: "media",
    organizacao_id: "",
    prazo: "",
  });

  useEffect(() => {
    setLocalTasks(tarefas || []);
  }, [tarefas]);

  const statuses = useMemo(() => ["pendente", "em_andamento", "concluida", "cancelada"], []);

  const tasksByStatus = useMemo(() => {
    const map: Record<string, any[]> = Object.fromEntries(statuses.map((s) => [s, []]));
    for (const t of localTasks || []) {
      const s = statuses.includes(t.status) ? t.status : "pendente";
      map[s].push(t);
    }
    for (const s of statuses) {
      map[s].sort((a, b) => {
        const ao = typeof a.kanban_order === "number" ? a.kanban_order : Number.POSITIVE_INFINITY;
        const bo = typeof b.kanban_order === "number" ? b.kanban_order : Number.POSITIVE_INFINITY;
        if (ao !== bo) return ao - bo;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    }
    return map as Record<string, typeof localTasks>;
  }, [localTasks, statuses]);

  const reorderMutation = useMutation({
    mutationFn: async (updates: Array<{ id: string; status: string; kanban_order: number; concluido_em?: string | null }>) => {
      if (updates.length === 0) return;
      const { error } = await (supabase as any)
        .from("tarefas")
        .upsert(updates, { onConflict: "id" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tarefas"] });
    },
    onError: () => {
      toast.error("Erro ao atualizar Kanban", {
        description: "Tente novamente."
      });
      queryClient.invalidateQueries({ queryKey: ["tarefas"] });
    },
  });

  const handleCriar = async () => {
    if (!novaTarefa.titulo.trim()) {
      toast.error("Título é obrigatório");
      return;
    }

    try {
      await criarTarefa.mutateAsync({
        titulo: novaTarefa.titulo,
        descricao: novaTarefa.descricao || undefined,
        prioridade: novaTarefa.prioridade,
        organizacao_id: novaTarefa.organizacao_id || undefined,
        prazo: novaTarefa.prazo || undefined,
      });
      toast.success("Tarefa criada com sucesso");
      setModalOpen(false);
      setNovaTarefa({ titulo: "", descricao: "", prioridade: "media", organizacao_id: "", prazo: "" });
    } catch {
      toast.error("Erro ao criar tarefa");
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const parseColumnId = (id: string) => {
    if (!id.startsWith("column:")) return null;
    return id.replace("column:", "");
  };

  const onDragStart = (event: DragStartEvent) => {
    setActiveTaskId(String(event.active.id));
  };

  const onDragEnd = async (event: DragEndEvent) => {
    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : null;
    setActiveTaskId(null);
    if (!overId || activeId === overId) return;

    const activeTask = (localTasks || []).find((t) => t.id === activeId);
    if (!activeTask) return;

    const overTask = (localTasks || []).find((t) => t.id === overId);
    const toStatus = overTask?.status || parseColumnId(overId);
    const fromStatus = activeTask.status;

    if (!toStatus || !statuses.includes(toStatus) || !statuses.includes(fromStatus)) return;

    const fromList = tasksByStatus[fromStatus].map((t) => t.id);
    const toList = tasksByStatus[toStatus].map((t) => t.id);

    const overIndexInTo = overTask ? toList.indexOf(overId) : -1;

    let nextFrom = fromList;
    let nextTo = toList;

    if (fromStatus === toStatus) {
      const oldIndex = fromList.indexOf(activeId);
      const newIndex = fromList.indexOf(overId);
      if (oldIndex === -1 || newIndex === -1) return;
      nextFrom = arrayMove(fromList, oldIndex, newIndex);
    } else {
      nextFrom = fromList.filter((id) => id !== activeId);
      nextTo = toList.filter((id) => id !== activeId);

      const insertAt = overIndexInTo >= 0 ? overIndexInTo : nextTo.length;
      nextTo.splice(insertAt, 0, activeId);
    }

    const updates: Array<{ id: string; status: string; kanban_order: number; concluido_em?: string | null }> = [];

    const applyOrder = (status: string, ids: string[]) => {
      ids.forEach((id, index) => {
        const prev = (localTasks || []).find((t) => t.id === id);
        let concluido_em: string | null | undefined;
        if (status === "concluida" && !prev?.concluido_em) concluido_em = new Date().toISOString();
        if (status !== "concluida" && prev?.concluido_em) concluido_em = null;

        updates.push({
          id,
          status,
          kanban_order: index + 1,
          ...(typeof concluido_em !== "undefined" ? { concluido_em } : {}),
        });
      });
    };

    if (fromStatus === toStatus) {
      applyOrder(fromStatus, nextFrom);
    } else {
      applyOrder(fromStatus, nextFrom);
      applyOrder(toStatus, nextTo);
    }

    const updatesById = new Map(updates.map((u) => [u.id, u]));
    setLocalTasks((prev) =>
      (prev || []).map((t) => {
        const upd = updatesById.get(t.id);
        if (!upd) return t;
        return {
          ...t,
          status: upd.status,
          kanban_order: upd.kanban_order,
          ...(Object.prototype.hasOwnProperty.call(upd, "concluido_em") ? { concluido_em: upd.concluido_em as any } : {}),
        };
      })
    );

    reorderMutation.mutate(updates);
  };

  const handleExcluir = async (id: string) => {
    try {
      await excluirTarefa.mutateAsync(id);
      toast.success("Tarefa excluída");
    } catch {
      toast.error("Erro ao excluir tarefa");
    }
  };

  function KanbanCard({ tarefa }: { tarefa: any }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: tarefa.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    } as React.CSSProperties;

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={
          "rounded-lg border bg-background p-3 shadow-sm hover:bg-muted/30 transition-colors " +
          (isDragging ? "opacity-70" : "")
        }
        {...attributes}
        {...listeners}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-medium truncate">{tarefa.titulo}</div>
            {tarefa.descricao && (
              <p className="text-sm text-muted-foreground line-clamp-2">{tarefa.descricao}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleExcluir(tarefa.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <Badge className={`${statusConfig[tarefa.status]?.color || "bg-gray-500"} text-white text-xs`}>
            {statusConfig[tarefa.status]?.label || tarefa.status}
          </Badge>
          <span className={`text-xs ${prioridadeConfig[tarefa.prioridade]?.color || ""}`}>
            {prioridadeConfig[tarefa.prioridade]?.label || tarefa.prioridade}
          </span>
          {tarefa.prazo && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(tarefa.prazo), "dd/MM", { locale: ptBR })}
            </span>
          )}
        </div>
      </div>
    );
  }

  function KanbanColumn({ status }: { status: string }) {
    const { setNodeRef, isOver } = useDroppable({ id: `column:${status}` });
    const tasks = tasksByStatus[status] || [];
    const ids = tasks.map((t) => t.id);

    return (
      <div className="w-80 shrink-0">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>{statusConfig[status]?.label || status}</span>
              <Badge variant="secondary">{tasks.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              ref={setNodeRef}
              className={
                "space-y-3 min-h-24 rounded-md p-1 transition-colors " +
                (isOver ? "bg-muted/40" : "")
              }
            >
              <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                {tasks.map((tarefa) => (
                  <KanbanCard key={tarefa.id} tarefa={tarefa} />
                ))}
              </SortableContext>
              {tasks.length === 0 && (
                <div className="text-xs text-muted-foreground text-center py-6">
                  Arraste tarefas para cá
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ConsultorLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Tarefas</h1>
            <p className="text-muted-foreground">Gerencie suas atividades e acompanhamentos</p>
          </div>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Tarefa
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          >
            <div className="flex gap-4 overflow-x-auto pb-2">
              {statuses.map((status) => (
                <KanbanColumn key={status} status={status} />
              ))}
            </div>

            <DragOverlay>
              {activeTaskId ? (
                <div className="w-80 rounded-lg border bg-background p-3 shadow">
                  <div className="font-medium">
                    {(localTasks || []).find((t) => t.id === activeTaskId)?.titulo || ""}
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}

        {/* Modal Nova Tarefa */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Tarefa</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Título *</label>
                <Input
                  value={novaTarefa.titulo}
                  onChange={(e) => setNovaTarefa({ ...novaTarefa, titulo: e.target.value })}
                  placeholder="Digite o título da tarefa"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Descrição</label>
                <Textarea
                  value={novaTarefa.descricao}
                  onChange={(e) => setNovaTarefa({ ...novaTarefa, descricao: e.target.value })}
                  placeholder="Detalhes da tarefa..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Prioridade</label>
                  <Select
                    value={novaTarefa.prioridade}
                    onValueChange={(v) => setNovaTarefa({ ...novaTarefa, prioridade: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Prazo</label>
                  <Input
                    type="date"
                    value={novaTarefa.prazo}
                    onChange={(e) => setNovaTarefa({ ...novaTarefa, prazo: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Organização (opcional)</label>
                <Select
                  value={novaTarefa.organizacao_id}
                  onValueChange={(v) => setNovaTarefa({ ...novaTarefa, organizacao_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {organizacoes?.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCriar} disabled={criarTarefa.isPending}>
                {criarTarefa.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Criar Tarefa
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ConsultorLayout>
  );
}
