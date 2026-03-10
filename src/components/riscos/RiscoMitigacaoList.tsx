import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Check, Trash2, Circle } from "lucide-react";
import {
  RiscoMitigacao,
  useRiscoMitigacoes,
  useCriarMitigacao,
  useAtualizarMitigacao,
  useExcluirMitigacao,
  MitigacaoStatus,
} from "@/hooks/useRiscos";
import { cn } from "@/lib/utils";

const STATUS_BADGE: Record<MitigacaoStatus, string> = {
  pendente:      "bg-slate-100 text-slate-700 border-slate-300",
  em_andamento:  "bg-blue-100 text-blue-700 border-blue-300",
  concluida:     "bg-green-100 text-green-700 border-green-300",
};

const STATUS_LABEL: Record<MitigacaoStatus, string> = {
  pendente:     "Pendente",
  em_andamento: "Em andamento",
  concluida:    "Concluída",
};

interface Props {
  riscoId: string;
}

export function RiscoMitigacaoList({ riscoId }: Props) {
  const { data: acoes, isLoading } = useRiscoMitigacoes(riscoId);
  const criar = useCriarMitigacao();
  const atualizar = useAtualizarMitigacao();
  const excluir = useExcluirMitigacao();

  const [novaAcao, setNovaAcao] = useState("");

  const handleAdicionar = async () => {
    if (!novaAcao.trim()) return;
    await criar.mutateAsync({ risco_id: riscoId, descricao: novaAcao.trim() });
    setNovaAcao("");
  };

  const ciclarStatus = (acao: RiscoMitigacao) => {
    const ciclo: MitigacaoStatus[] = ["pendente", "em_andamento", "concluida"];
    const idx = ciclo.indexOf(acao.status);
    const next = ciclo[(idx + 1) % ciclo.length];
    atualizar.mutate({ id: acao.id, risco_id: riscoId, status: next });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
        Ações de mitigação ({acoes?.length ?? 0})
      </p>

      {acoes && acoes.length > 0 ? (
        <ul className="space-y-1.5">
          {acoes.map((acao) => (
            <li
              key={acao.id}
              className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2"
            >
              {/* Botão ciclar status */}
              <button
                onClick={() => ciclarStatus(acao)}
                className="mt-0.5 shrink-0"
                title={`Status atual: ${STATUS_LABEL[acao.status]} — clique para avançar`}
              >
                {acao.status === "concluida" ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : acao.status === "em_andamento" ? (
                  <Circle className="h-4 w-4 text-blue-500 fill-blue-200" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground" />
                )}
              </button>

              <span
                className={cn(
                  "flex-1 text-sm leading-snug",
                  acao.status === "concluida" && "line-through text-muted-foreground"
                )}
              >
                {acao.descricao}
              </span>

              <Badge
                variant="outline"
                className={cn("text-[10px] shrink-0", STATUS_BADGE[acao.status])}
              >
                {STATUS_LABEL[acao.status]}
              </Badge>

              <button
                onClick={() => excluir.mutate({ id: acao.id, risco_id: riscoId })}
                className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                title="Remover ação"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground italic py-1">Nenhuma ação de mitigação cadastrada.</p>
      )}

      {/* Adicionar nova */}
      <div className="flex gap-2 mt-2">
        <Input
          placeholder="Descreva a ação de mitigação..."
          value={novaAcao}
          onChange={(e) => setNovaAcao(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdicionar()}
          className="h-8 text-sm"
        />
        <Button
          size="sm"
          variant="outline"
          onClick={handleAdicionar}
          disabled={!novaAcao.trim() || criar.isPending}
          className="h-8 px-3 shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
