import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Trash2, Plus } from "lucide-react";
import { useKnowledgeByCategoria, useAddKnowledge, useDeleteKnowledge } from "@/hooks/useProspeccaoKnowledge";
import type { ProspeccaoCategoria } from "@/types/prospeccao";

interface KnowledgeBasePanelProps {
  categoria: ProspeccaoCategoria;
}

/** Base de conhecimento do RAG (Fase 10) para uma categoria — cada chunk vira um embedding
 * gerado server-side (ver useAddKnowledge). Lista + formulário simples de adicionar/remover;
 * sem edição in-place (remover e adicionar de novo é suficiente pro volume esperado). */
export function KnowledgeBasePanel({ categoria }: KnowledgeBasePanelProps) {
  const { data: chunks, isLoading } = useKnowledgeByCategoria(categoria);
  const adicionar = useAddKnowledge();
  const remover = useDeleteKnowledge();
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");

  const handleAdicionar = async () => {
    await adicionar.mutateAsync({ categoria, titulo, conteudo });
    setTitulo("");
    setConteudo("");
  };

  return (
    <div className="space-y-4">
      {isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : (chunks ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum conteúdo na base de conhecimento desta categoria ainda.</p>
      ) : (
        <div className="space-y-2">
          {(chunks ?? []).map((chunk) => (
            <div key={chunk.id} className="flex items-start justify-between gap-2 rounded-lg border p-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">{chunk.titulo}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{chunk.conteudo}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => remover.mutate({ id: chunk.id, categoria })}
                disabled={remover.isPending}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2 rounded-lg border p-3">
        <div>
          <Label>Título</Label>
          <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Política de preços" />
        </div>
        <div>
          <Label>Conteúdo</Label>
          <Textarea
            value={conteudo}
            onChange={(e) => setConteudo(e.target.value)}
            rows={4}
            placeholder="Texto que o agente pode consultar ao responder leads desta categoria..."
          />
        </div>
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={handleAdicionar}
            disabled={adicionar.isPending || !titulo.trim() || !conteudo.trim()}
          >
            {adicionar.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
            Adicionar
          </Button>
        </div>
      </div>
    </div>
  );
}
