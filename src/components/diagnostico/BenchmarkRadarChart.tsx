import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BarChart3 } from "lucide-react";
import { SETORES, SETOR_LABELS, type SetorType, type BenchmarkPonto } from "@/hooks/useBenchmarkSetorial";

interface Props {
  pontos: BenchmarkPonto[];
  setor: SetorType;
  onSetorChange: (setor: SetorType) => void;
  isLoading?: boolean;
}

interface TooltipPayload {
  name: string;
  value: number;
  color: string;
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border rounded-lg shadow-md p-3 text-sm space-y-1">
      <p className="font-semibold text-foreground">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <span className="font-medium">{p.value}%</span>
        </p>
      ))}
    </div>
  );
}

export function BenchmarkRadarChart({ pontos, setor, onSetorChange, isLoading }: Props) {
  const melhorQueBenchmark = pontos.filter(p => p.scoreCliente >= p.scoreMedio).length;
  const nEmpresas = pontos[0]?.nEmpresas ?? 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Benchmark Setorial
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {nEmpresas > 0 ? `${nEmpresas} empresas` : 'Dados do setor'}
            </Badge>
            <Select value={setor} onValueChange={(v) => onSetorChange(v as SetorType)}>
              <SelectTrigger className="w-36 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SETORES.map(([key, label]) => (
                  <SelectItem key={key} value={key} className="text-xs">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Sua empresa está acima da média em{" "}
          <span className="font-semibold text-foreground">{melhorQueBenchmark}</span> de{" "}
          {pontos.length} dimensões para empresas de{" "}
          <span className="font-semibold">{SETOR_LABELS[setor]}</span>.
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-72 flex items-center justify-center text-muted-foreground text-sm">
            Carregando benchmark...
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={pontos} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                />
                <Radar
                  name="P75 do setor"
                  dataKey="percentil75"
                  stroke="hsl(142 71% 45%)"
                  fill="hsl(142 71% 45%)"
                  fillOpacity={0.08}
                  strokeDasharray="4 2"
                  strokeWidth={1.5}
                />
                <Radar
                  name="Média do setor"
                  dataKey="scoreMedio"
                  stroke="hsl(var(--muted-foreground))"
                  fill="hsl(var(--muted-foreground))"
                  fillOpacity={0.1}
                  strokeWidth={1.5}
                />
                <Radar
                  name="Sua empresa"
                  dataKey="scoreCliente"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                  formatter={(value) => (
                    <span className="text-muted-foreground">{value}</span>
                  )}
                />
              </RadarChart>
            </ResponsiveContainer>

            {/* Tabela resumo */}
            <div className="mt-4 space-y-2">
              {pontos.map((p) => {
                const diff = p.scoreCliente - p.scoreMedio;
                const acima = diff >= 0;
                return (
                  <div key={p.dimensao} className="flex items-center gap-3 text-sm">
                    <span className="w-40 text-muted-foreground truncate">{p.label}</span>
                    <div className="flex-1 relative h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="absolute left-0 top-0 h-full rounded-full bg-primary/40"
                        style={{ width: `${p.scoreMedio}%` }}
                      />
                      <div
                        className="absolute left-0 top-0 h-full rounded-full bg-primary"
                        style={{ width: `${p.scoreCliente}%` }}
                      />
                    </div>
                    <span className="w-10 text-right font-medium tabular-nums">{p.scoreCliente}%</span>
                    <span
                      className={`w-14 text-right text-xs font-medium ${acima ? "text-green-600" : "text-destructive"}`}
                    >
                      {acima ? "+" : ""}{diff}% vs med.
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
