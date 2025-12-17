import { Button } from "@/components/ui/button";
import type { FaseProjeto } from "@/types/database";

interface FiltroFaseDocumentosProps {
  faseAtual: FaseProjeto | "todas";
  onChange: (fase: FaseProjeto | "todas") => void;
}

const fases: { value: FaseProjeto | "todas"; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "diagnostico", label: "Diagnóstico" },
  { value: "implementacao", label: "Implementação" },
  { value: "recorrencia", label: "Recorrência" },
];

export function FiltroFaseDocumentos({ faseAtual, onChange }: FiltroFaseDocumentosProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {fases.map((fase) => (
        <Button
          key={fase.value}
          variant={faseAtual === fase.value ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(fase.value)}
        >
          {fase.label}
        </Button>
      ))}
    </div>
  );
}
