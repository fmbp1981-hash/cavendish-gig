import { Button } from "@/components/ui/button";
import { CalendarClock, CalendarCheck, Loader2 } from "lucide-react";
import { useAgendarFechamento } from "@/hooks/useAgendarFechamento";
import type { ProspeccaoLead } from "@/types/prospeccao";

interface AgendarFechamentoButtonProps {
  lead: ProspeccaoLead;
}

/** Botão de agendamento automático da reunião de fechamento com o Alberto (Fase 6). Não aparece
 * para leads em status final (já convertido/perdido, nada a agendar) nem quando já existe uma
 * reunião de fechamento vinculada — nesse caso mostra só o indicador (mesmo ícone `CalendarCheck`
 * já usado no lead-card). */
export function AgendarFechamentoButton({ lead }: AgendarFechamentoButtonProps) {
  const agendar = useAgendarFechamento();

  if (lead.status === "convertido" || lead.status === "perdido") return null;

  if (lead.reuniao_fechamento_id) {
    return (
      <div className="flex items-center gap-2 text-sm text-emerald-600">
        <CalendarCheck className="h-4 w-4" />
        Reunião de fechamento já agendada
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => agendar.mutate(lead.id)}
      disabled={agendar.isPending}
    >
      {agendar.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CalendarClock className="h-4 w-4 mr-2" />}
      Agendar reunião com Alberto
    </Button>
  );
}
