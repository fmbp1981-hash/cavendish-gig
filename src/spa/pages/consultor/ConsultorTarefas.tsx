import { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Calendar, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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

  const [modalOpen, setModalOpen] = useState(false);
  const [novaTarefa, setNovaTarefa] = useState({
    titulo: "",
    descricao: "",
    prioridade: "media",
    organizacao_id: "",
    prazo: "",
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

  const handleToggleConcluida = async (id: string, atualStatus: string) => {
    const novoStatus = atualStatus === "concluida" ? "pendente" : "concluida";
    try {
      await atualizarTarefa.mutateAsync({
        id,
        status: novoStatus,
        concluido_em: novoStatus === "concluida" ? new Date().toISOString() : undefined,
      });
    } catch {
      toast.error("Erro ao atualizar tarefa");
    }
  };

  const handleExcluir = async (id: string) => {
    try {
      await excluirTarefa.mutateAsync(id);
      toast.success("Tarefa excluída");
    } catch {
      toast.error("Erro ao excluir tarefa");
    }
  };

  const tarefasPendentes = tarefas?.filter(t => t.status !== "concluida" && t.status !== "cancelada") || [];
  const tarefasConcluidas = tarefas?.filter(t => t.status === "concluida") || [];

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
          <div className="grid md:grid-cols-2 gap-6">
            {/* Tarefas Pendentes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pendentes ({tarefasPendentes.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {tarefasPendentes.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma tarefa pendente
                  </p>
                ) : (
                  tarefasPendentes.map((tarefa) => (
                    <div
                      key={tarefa.id}
                      className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        checked={tarefa.status === "concluida"}
                        onCheckedChange={() => handleToggleConcluida(tarefa.id, tarefa.status)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{tarefa.titulo}</div>
                        {tarefa.descricao && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{tarefa.descricao}</p>
                        )}
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
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => handleExcluir(tarefa.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Tarefas Concluídas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Concluídas ({tarefasConcluidas.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {tarefasConcluidas.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma tarefa concluída
                  </p>
                ) : (
                  tarefasConcluidas.slice(0, 10).map((tarefa) => (
                    <div
                      key={tarefa.id}
                      className="flex items-start gap-3 p-3 border rounded-lg opacity-60"
                    >
                      <Checkbox
                        checked={true}
                        onCheckedChange={() => handleToggleConcluida(tarefa.id, tarefa.status)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium line-through">{tarefa.titulo}</div>
                        {tarefa.concluido_em && (
                          <span className="text-xs text-muted-foreground">
                            Concluída em {format(new Date(tarefa.concluido_em), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
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
