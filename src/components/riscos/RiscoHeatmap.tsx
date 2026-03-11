import { Risco, nivelBgHeatmap, nivelLabel } from "@/hooks/useRiscos";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface RiscoHeatmapProps {
  riscos: Risco[];
  onSelect?: (risco: Risco) => void;
}

const LABELS_IMP = ["", "Insignificante", "Baixo", "Moderado", "Alto", "Catastrófico"];
const LABELS_PROB = ["", "Raro", "Improvável", "Possível", "Provável", "Quase certo"];

export function RiscoHeatmap({ riscos, onSelect }: RiscoHeatmapProps) {
  const riscosMap: Record<string, Risco[]> = {};
  for (const r of riscos) {
    const key = `${r.probabilidade}-${r.impacto}`;
    riscosMap[key] = [...(riscosMap[key] ?? []), r];
  }

  // Zonas do heatmap: prob 5→1 (linhas), imp 1→5 (colunas)
  const probRows = [5, 4, 3, 2, 1];
  const impCols  = [1, 2, 3, 4, 5];

  return (
    <TooltipProvider>
      <div className="space-y-3">
        <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground">
          {[
            { cor: "bg-green-200", label: "Baixo (1–4)" },
            { cor: "bg-yellow-200", label: "Médio (5–9)" },
            { cor: "bg-orange-300", label: "Alto (10–16)" },
            { cor: "bg-red-400", label: "Crítico (17–25)" },
          ].map((z) => (
            <div key={z.label} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded ${z.cor}`} />
              <span>{z.label}</span>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto">
          <div className="inline-block min-w-[340px]">
            {/* Eixo Y — Probabilidade */}
            <div className="flex">
              {/* Rótulo do eixo */}
              <div className="flex items-center justify-center w-6 mr-1">
                <span
                  className="text-[10px] text-muted-foreground font-medium tracking-widest"
                  style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
                >
                  PROBABILIDADE →
                </span>
              </div>

              <div className="flex flex-col gap-1">
                {probRows.map((prob) => (
                  <div key={prob} className="flex items-center gap-1">
                    {/* Label probabilidade */}
                    <div className="w-20 text-right pr-2">
                      <span className="text-[10px] text-muted-foreground leading-tight">
                        {prob} — {LABELS_PROB[prob]}
                      </span>
                    </div>

                    {/* Células */}
                    {impCols.map((imp) => {
                      const key = `${prob}-${imp}`;
                      const cellRiscos = riscosMap[key] ?? [];
                      const nivel = prob * imp;
                      const bg = nivelBgHeatmap(prob, imp);

                      return (
                        <Tooltip key={imp}>
                          <TooltipTrigger asChild>
                            <div
                              className={`
                                w-14 h-12 rounded border border-white/60 flex flex-col items-center justify-center
                                cursor-default transition-colors text-[10px] font-semibold relative
                                ${bg}
                              `}
                              onClick={() => cellRiscos.length === 1 && onSelect?.(cellRiscos[0])}
                            >
                              <span className="opacity-60">{nivel}</span>
                              {cellRiscos.length > 0 && (
                                <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full w-4 h-4 text-[9px] flex items-center justify-center font-bold">
                                  {cellRiscos.length}
                                </div>
                              )}
                            </div>
                          </TooltipTrigger>
                          {cellRiscos.length > 0 && (
                            <TooltipContent className="max-w-xs space-y-1 p-3">
                              <p className="text-xs font-semibold mb-1">
                                Nível {nivel} — {nivelLabel(nivel)}
                              </p>
                              {cellRiscos.map((r) => (
                                <div
                                  key={r.id}
                                  className="text-xs cursor-pointer hover:underline"
                                  onClick={() => onSelect?.(r)}
                                >
                                  • {r.titulo}
                                </div>
                              ))}
                            </TooltipContent>
                          )}
                        </Tooltip>
                      );
                    })}
                  </div>
                ))}

                {/* Eixo X — Impacto */}
                <div className="flex items-center gap-1 mt-1">
                  <div className="w-20" />
                  {impCols.map((imp) => (
                    <div key={imp} className="w-14 text-center">
                      <span className="text-[9px] text-muted-foreground leading-none">
                        {imp}<br />{LABELS_IMP[imp]}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="text-center text-[10px] text-muted-foreground font-medium tracking-widest mt-0.5 ml-20">
                  IMPACTO →
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Resumo por zona */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Crítico",  filter: (r: Risco) => r.nivel_risco >= 17, cor: "text-red-600 dark:text-red-400" },
            { label: "Alto",     filter: (r: Risco) => r.nivel_risco >= 10 && r.nivel_risco <= 16, cor: "text-orange-600 dark:text-orange-400" },
            { label: "Médio",    filter: (r: Risco) => r.nivel_risco >= 5 && r.nivel_risco <= 9,   cor: "text-yellow-600 dark:text-yellow-400" },
            { label: "Baixo",    filter: (r: Risco) => r.nivel_risco <= 4,  cor: "text-green-600 dark:text-green-400" },
          ].map((zona) => {
            const count = riscos.filter(zona.filter).length;
            return (
              <div key={zona.label} className="text-center p-2 rounded-lg bg-muted">
                <p className={`text-xl font-bold ${zona.cor}`}>{count}</p>
                <p className="text-xs text-muted-foreground">{zona.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}
