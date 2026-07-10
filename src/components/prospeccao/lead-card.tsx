import { CalendarCheck, Building2, GripVertical } from "lucide-react";
import { CategoryBadge } from "./category-badge";
import { cn } from "@/lib/utils";
import type { ProspeccaoLead } from "@/types/prospeccao";

interface LeadCardProps {
  lead: ProspeccaoLead;
  /** Nome do representante responsável — só relevante na visão do admin (múltiplos representantes).
   * O join com `profiles`/`auth.users` é feito pela página que usa o card, não aqui (sem embedded
   * joins, convenção do projeto). */
  responsavelNome?: string;
  onClick?: () => void;
  /** Classe Tailwind (bg-*) da cor da etapa atual do lead — pinta a barra de destaque à esquerda.
   * Vem de getEtapaCores(), calculado pela página que sabe em qual etapa o lead está. */
  accentClassName?: string;
}

function scoreCores(score: number) {
  if (score >= 70) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400";
  if (score >= 40) return "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400";
  return "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400";
}

export function LeadCard({ lead, responsavelNome, onClick, accentClassName }: LeadCardProps) {
  return (
    <div
      onClick={onClick}
      className="group relative overflow-hidden rounded-lg border bg-background shadow-sm hover:shadow-md hover:border-foreground/20 transition-all cursor-grab active:cursor-grabbing"
    >
      <div className={cn("absolute inset-y-0 left-0 w-1", accentClassName ?? "bg-border")} />

      <div className="pl-3.5 pr-3 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-medium text-sm truncate flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              {lead.nome}
            </div>
            {lead.cidade && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {lead.cidade}
                {lead.estado ? ` - ${lead.estado}` : ""}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {lead.reuniao_fechamento_id && (
              <CalendarCheck className="h-4 w-4 text-emerald-600" aria-label="Reunião de fechamento agendada" />
            )}
            <GripVertical className="h-4 w-4 text-muted-foreground/0 group-hover:text-muted-foreground/50 transition-colors" />
          </div>
        </div>

        <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
          <CategoryBadge categoria={lead.categoria} />
          {typeof lead.ai_score === "number" && (
            <span className={cn("text-xs font-semibold px-1.5 py-0.5 rounded-full leading-none", scoreCores(lead.ai_score))}>
              {lead.ai_score}
            </span>
          )}
        </div>

        {responsavelNome && (
          <p className="text-xs text-muted-foreground mt-2 truncate">Responsável: {responsavelNome}</p>
        )}
      </div>
    </div>
  );
}
