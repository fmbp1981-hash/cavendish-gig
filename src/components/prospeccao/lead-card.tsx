import { CalendarCheck, Building2 } from "lucide-react";
import { CategoryBadge } from "./category-badge";
import type { ProspeccaoLead } from "@/types/prospeccao";

interface LeadCardProps {
  lead: ProspeccaoLead;
  /** Nome do representante responsável — só relevante na visão do admin (múltiplos representantes).
   * O join com `profiles`/`auth.users` é feito pela página que usa o card, não aqui (sem embedded
   * joins, convenção do projeto). */
  responsavelNome?: string;
  onClick?: () => void;
}

export function LeadCard({ lead, responsavelNome, onClick }: LeadCardProps) {
  return (
    <div
      onClick={onClick}
      className="rounded-lg border bg-background p-3 shadow-sm hover:bg-muted/30 transition-colors cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-medium truncate flex items-center gap-1">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            {lead.nome}
          </div>
          {lead.cidade && (
            <p className="text-xs text-muted-foreground truncate">
              {lead.cidade}
              {lead.estado ? ` - ${lead.estado}` : ""}
            </p>
          )}
        </div>
        {lead.reuniao_fechamento_id && (
          <CalendarCheck className="h-4 w-4 text-emerald-600 shrink-0" aria-label="Reunião de fechamento agendada" />
        )}
      </div>

      <div className="flex items-center gap-2 mt-2 flex-wrap">
        <CategoryBadge categoria={lead.categoria} />
        {typeof lead.ai_score === "number" && (
          <span className="text-xs font-medium text-muted-foreground">Score: {lead.ai_score}</span>
        )}
      </div>

      {responsavelNome && (
        <p className="text-xs text-muted-foreground mt-2 truncate">Responsável: {responsavelNome}</p>
      )}
    </div>
  );
}
