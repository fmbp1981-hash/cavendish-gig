import { useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, Clock, XCircle, RotateCcw } from "lucide-react";
import { ReuniaoCard } from "./ReuniaoCard";
import type { Reuniao } from "@/hooks/useReunioes";

interface AgendaTimelineProps {
  reunioes: Reuniao[];
  showDownloadICS?: (reuniao: Reuniao) => void;
}

function StatusIcon({ status }: { status: Reuniao["status"] }) {
  switch (status) {
    case "realizada":
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    case "cancelada":
      return <XCircle className="w-4 h-4 text-red-400" />;
    case "reagendada":
      return <RotateCcw className="w-4 h-4 text-yellow-500" />;
    default:
      return <Clock className="w-4 h-4 text-blue-500" />;
  }
}

function groupByMonth(reunioes: Reuniao[]): [string, Reuniao[]][] {
  const map = new Map<string, Reuniao[]>();
  for (const r of reunioes) {
    const key = format(new Date(r.data_inicio), "MMMM yyyy", { locale: ptBR });
    const group = map.get(key) ?? [];
    group.push(r);
    map.set(key, group);
  }
  return Array.from(map.entries());
}

export function AgendaTimeline({ reunioes }: AgendaTimelineProps) {
  const sorted = useMemo(
    () => [...reunioes].sort(
      (a, b) => new Date(b.data_inicio).getTime() - new Date(a.data_inicio).getTime()
    ),
    [reunioes]
  );

  const groups = useMemo(() => groupByMonth(sorted), [sorted]);

  if (reunioes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        Nenhuma reunião no histórico.
      </p>
    );
  }

  return (
    <div className="relative space-y-8">
      {/* Vertical line */}
      <div className="absolute left-[18px] top-2 bottom-2 w-px bg-border" aria-hidden />

      {groups.map(([month, items]) => (
        <div key={month} className="space-y-3">
          {/* Month label */}
          <div className="flex items-center gap-3 ml-1">
            <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0 z-10 relative">
              <span className="text-[10px] font-bold text-muted-foreground uppercase leading-tight text-center">
                {month.slice(0, 3)}
              </span>
            </div>
            <span className="text-sm font-semibold text-muted-foreground capitalize">
              {month}
            </span>
          </div>

          {/* Meetings in this month */}
          <div className="ml-12 space-y-3">
            {items.map((reuniao) => (
              <div key={reuniao.id} className="relative">
                {/* Dot on timeline */}
                <div
                  className="absolute -left-[30px] top-4 w-3 h-3 rounded-full border-2 border-background bg-border z-10"
                  aria-hidden
                >
                  <StatusIcon status={reuniao.status} />
                </div>
                <ReuniaoCard reuniao={reuniao} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
