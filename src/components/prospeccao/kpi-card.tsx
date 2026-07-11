import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Tons de chip para os ícones dos cards de KPI. Reaproveita as cores de marca já existentes no
 * design system (`primary`/`accent`, ver index.css) em vez de inventar uma paleta nova — os
 * tons semânticos de status.ts (success/warning/...) fariam sentido pra indicadores de bom/ruim,
 * mas aqui os 4 KPIs são métricas neutras (nenhuma delas é "erro"), então usamos identidade
 * visual da marca pra diferenciar os cards sem sugerir que um é "certo" e outro "errado". */
export type KpiTom = "primary" | "info" | "success" | "accent";

const CHIP_CLASSES: Record<KpiTom, string> = {
  primary: "bg-primary/10 text-primary",
  info: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  accent: "bg-accent/15 text-accent-foreground",
};

/** Mesma barra colorida usada no topo das colunas do kanban (kanban-column.tsx) — reaproveita a
 * linguagem visual entre as duas telas mais usadas do Finder. */
const BAR_CLASSES: Record<KpiTom, string> = {
  primary: "bg-primary",
  info: "bg-sky-500",
  success: "bg-emerald-500",
  accent: "bg-accent",
};

interface KpiCardProps {
  icon: LucideIcon;
  tom: KpiTom;
  label: string;
  value: string | number;
  description: string;
  loading?: boolean;
}

export function KpiCard({ icon: Icon, tom, label, value, description, loading }: KpiCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow duration-200">
      <div className={cn("h-1", BAR_CLASSES[tom])} />
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <div className={cn("rounded-lg p-2", CHIP_CLASSES[tom])}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{value}</div>}
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
