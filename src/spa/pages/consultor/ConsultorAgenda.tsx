import { useState, useMemo } from "react";
import { Calendar, dateFnsLocalizer, View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { ConsultorLayout } from "@/components/layout/ConsultorLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { listarEventosCalendario } from "@/hooks/useGoogleCalendar";
import { RefreshCw, CalendarDays, AlertCircle } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// date-fns localizer for react-big-calendar
const locales = { "pt-BR": ptBR };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: ptBR }),
  getDay,
  locales,
});

// Messages translated to Portuguese
const messages = {
  allDay: "Dia inteiro",
  previous: "‹ Anterior",
  next: "Próximo ›",
  today: "Hoje",
  month: "Mês",
  week: "Semana",
  day: "Dia",
  agenda: "Agenda",
  date: "Data",
  time: "Hora",
  event: "Evento",
  noEventsInRange: "Nenhum evento neste período.",
  showMore: (total: number) => `+${total} mais`,
};

type EventResource = "gcal" | "reuniao" | "tarefa";

interface AgendaEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: EventResource;
  description?: string;
  prioridade?: string;
}

function isReuniaoGIG(summary: string): boolean {
  const lower = summary.toLowerCase();
  return (
    lower.includes("reunião") ||
    lower.includes("reuniao") ||
    lower.includes("acompanhamento") ||
    lower.includes("kickoff") ||
    lower.includes("gig")
  );
}

export default function ConsultorAgenda() {
  const [view, setView] = useState<View>("month");
  const [date, setDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<AgendaEvent | null>(null);

  // Fetch Google Calendar events
  const {
    data: gcalResult,
    isLoading: loadingGcal,
    refetch: refetchGcal,
    isError: gcalError,
  } = useQuery({
    queryKey: ["gcal-events"],
    queryFn: listarEventosCalendario,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  // Fetch tasks with deadline
  const { data: tarefasResult, isLoading: loadingTarefas } = useQuery({
    queryKey: ["tarefas-agenda"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tarefas")
        .select("id, titulo, prazo, prioridade, status, descricao")
        .not("prazo", "is", null)
        .neq("status", "concluida")
        .order("prazo");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 2 * 60 * 1000,
  });

  // Build unified event list
  const events = useMemo<AgendaEvent[]>(() => {
    const result: AgendaEvent[] = [];

    // Google Calendar events
    const gcalItems = gcalResult?.data?.items ?? [];
    gcalItems.forEach((item: any) => {
      const startRaw = item.start?.dateTime || item.start?.date;
      const endRaw = item.end?.dateTime || item.end?.date;
      if (!startRaw) return;
      const start = new Date(startRaw);
      const end = endRaw ? new Date(endRaw) : new Date(start.getTime() + 60 * 60 * 1000);
      const resource: EventResource = isReuniaoGIG(item.summary || "") ? "reuniao" : "gcal";
      result.push({
        id: item.id || Math.random().toString(),
        title: item.summary || "Evento",
        start,
        end,
        resource,
        description: item.description,
      });
    });

    // Tasks with deadlines
    (tarefasResult ?? []).forEach((tarefa: any) => {
      const start = new Date(tarefa.prazo);
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      result.push({
        id: `tarefa-${tarefa.id}`,
        title: `📋 ${tarefa.titulo}`,
        start,
        end,
        resource: "tarefa",
        description: tarefa.descricao,
        prioridade: tarefa.prioridade,
      });
    });

    return result;
  }, [gcalResult, tarefasResult]);

  const eventStyleGetter = (event: AgendaEvent) => {
    const colors: Record<EventResource, string> = {
      gcal: "#3b82f6",
      reuniao: "#10b981",
      tarefa: "#f97316",
    };
    const bg = colors[event.resource] ?? "#6b7280";
    return {
      style: {
        backgroundColor: bg,
        borderColor: bg,
        color: "#fff",
        borderRadius: "6px",
        fontSize: "0.75rem",
        padding: "2px 6px",
      },
    };
  };

  const loading = loadingGcal || loadingTarefas;

  return (
    <ConsultorLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Agenda</h1>
              <p className="text-sm text-muted-foreground">
                Visualize tarefas, reuniões e eventos do Google Calendar
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchGcal()}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Sincronizar Google Calendar
          </Button>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#10b981] inline-block" />
            <span className="text-muted-foreground">Reuniões GIG</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#3b82f6] inline-block" />
            <span className="text-muted-foreground">Google Calendar</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#f97316] inline-block" />
            <span className="text-muted-foreground">Tarefas com prazo</span>
          </div>
          {gcalError && (
            <div className="flex items-center gap-1.5 text-destructive ml-auto">
              <AlertCircle className="h-3.5 w-3.5" />
              <span className="text-xs">Google Calendar não configurado ou sem eventos</span>
            </div>
          )}
        </div>

        {/* Calendar */}
        <Card>
          <CardContent className="p-4">
            <div style={{ height: 620 }}>
              <Calendar
                localizer={localizer}
                events={events}
                view={view}
                onView={setView}
                date={date}
                onNavigate={setDate}
                eventPropGetter={eventStyleGetter}
                messages={messages}
                culture="pt-BR"
                onSelectEvent={(event) => setSelectedEvent(event as AgendaEvent)}
                popup
                style={{ fontFamily: "inherit" }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Event detail popover (shown as a fixed panel when event selected) */}
        {selectedEvent && (
          <Card className="border-l-4 animate-in slide-in-from-bottom-2 duration-200"
            style={{
              borderLeftColor:
                selectedEvent.resource === "reuniao"
                  ? "#10b981"
                  : selectedEvent.resource === "tarefa"
                  ? "#f97316"
                  : "#3b82f6",
            }}
          >
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-base">{selectedEvent.title.replace(/^📋 /, "")}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      style={{
                        backgroundColor:
                          selectedEvent.resource === "reuniao"
                            ? "#d1fae5"
                            : selectedEvent.resource === "tarefa"
                            ? "#ffedd5"
                            : "#dbeafe",
                        color:
                          selectedEvent.resource === "reuniao"
                            ? "#065f46"
                            : selectedEvent.resource === "tarefa"
                            ? "#9a3412"
                            : "#1e40af",
                      }}
                    >
                      {selectedEvent.resource === "reuniao"
                        ? "Reunião GIG"
                        : selectedEvent.resource === "tarefa"
                        ? "Tarefa"
                        : "Google Calendar"}
                    </Badge>
                    {selectedEvent.prioridade && (
                      <Badge variant="outline" className="text-xs">
                        Prioridade: {selectedEvent.prioridade}
                      </Badge>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-muted-foreground hover:text-foreground p-1"
                >
                  ×
                </button>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-1 text-sm">
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">Início:</span>{" "}
                {format(selectedEvent.start, "dd/MM/yyyy HH:mm", { locale: ptBR })}
              </p>
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">Fim:</span>{" "}
                {format(selectedEvent.end, "dd/MM/yyyy HH:mm", { locale: ptBR })}
              </p>
              {selectedEvent.description && (
                <p className="text-muted-foreground mt-2">
                  <span className="font-medium text-foreground">Descrição:</span>{" "}
                  {selectedEvent.description}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </ConsultorLayout>
  );
}
