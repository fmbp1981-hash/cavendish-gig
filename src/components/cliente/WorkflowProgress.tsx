import { CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { FaseProjeto } from "@/types/database";

interface WorkflowProgressProps {
  currentPhase: FaseProjeto;
}

interface Phase {
  id: FaseProjeto;
  label: string;
  description: string;
}

const phases: Phase[] = [
  {
    id: "diagnostico",
    label: "Diagnóstico",
    description: "Análise inicial e avaliação de conformidade",
  },
  {
    id: "implementacao",
    label: "Implementação",
    description: "Execução das melhorias e adequações",
  },
  {
    id: "recorrencia",
    label: "Recorrência",
    description: "Manutenção contínua e monitoramento",
  },
];

const getPhaseStatus = (
  phaseId: FaseProjeto,
  currentPhase: FaseProjeto
): "completed" | "active" | "pending" => {
  const phaseOrder = ["diagnostico", "implementacao", "recorrencia"];
  const currentIndex = phaseOrder.indexOf(currentPhase);
  const phaseIndex = phaseOrder.indexOf(phaseId);

  if (phaseIndex < currentIndex) return "completed";
  if (phaseIndex === currentIndex) return "active";
  return "pending";
};

export function WorkflowProgress({ currentPhase }: WorkflowProgressProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          {phases.map((phase, index) => {
            const status = getPhaseStatus(phase.id, currentPhase);
            const isCompleted = status === "completed";
            const isActive = status === "active";
            const isPending = status === "pending";

            return (
              <div key={phase.id} className="flex items-center flex-1">
                {/* Phase Step */}
                <div className="flex flex-col items-center min-w-[160px]">
                  {/* Circle Icon */}
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all",
                      isCompleted &&
                        "bg-secondary border-secondary text-secondary-foreground",
                      isActive &&
                        "bg-primary border-primary text-primary-foreground animate-pulse",
                      isPending && "bg-muted border-muted-foreground/30 text-muted-foreground"
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      <Circle className="w-6 h-6" fill={isActive ? "currentColor" : "none"} />
                    )}
                  </div>

                  {/* Phase Label */}
                  <div className="mt-3 text-center">
                    <p
                      className={cn(
                        "font-semibold text-sm",
                        (isCompleted || isActive) && "text-foreground",
                        isPending && "text-muted-foreground"
                      )}
                    >
                      {phase.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-[140px]">
                      {phase.description}
                    </p>
                  </div>
                </div>

                {/* Connector Arrow */}
                {index < phases.length - 1 && (
                  <div className="flex-1 flex items-center justify-center pb-12">
                    <ArrowRight
                      className={cn(
                        "w-6 h-6 transition-colors",
                        isCompleted && "text-secondary",
                        isActive && "text-primary",
                        isPending && "text-muted-foreground/30"
                      )}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Current Phase Highlight */}
        <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <p className="text-sm font-medium text-primary">
            Fase Atual: {phases.find((p) => p.id === currentPhase)?.label}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {phases.find((p) => p.id === currentPhase)?.description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
