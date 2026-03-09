import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, dateFnsLocalizer, View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ConsultorLayout } from "@/components/layout/ConsultorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CalendarDays, RefreshCw, X } from "lucide-react";
import "react-big-calendar/lib/css/react-big-calendar.css";

// Localização PT-BR
const locales = { "pt-BR": ptBR };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
});

const messages = {
  allDay: "Dia inteiro",
  previous: "Anterior",
  next: "Próximo",
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

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  source: "google" | "tarefa";
  description?: string;
  organizacao?: string;
  color: string;
}

interface EventoGoogle {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  organizer?: { displayName?: string };
}

function isReuniao(titulo: string) {
  const t = titulo.toLowerCase();
  return (
    t.includes("kickoff") ||
    t.includes("reunião") ||
    t.includes("acompanhamento") ||
    t.includes("meet") ||
    t.includes("gig") ||
    t.includes("consultoria") ||
    t.includes("compliance")
  );
}

export default function ConsultorAgenda() {
  const { user } = useAuth();
  const [view, setView] = useState<View>("month");
  const [date, setDate] = useState(new Date());
  const [eventoSelecionado, setEventoSelecionado] = useState<CalendarEvent | null>(null);

  // Busca tarefas com prazo
  const { data: tarefas, isLoading: loadingTarefas, refetch: refetchTarefas } = useQuery({
    queryKey: ["agenda-tarefas", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tarefas")
        .select("id, titulo, prazo, status, organizacoes(nome)")
        .not("prazo", "is", null)
        .neq("status", "concluida")
        .order("prazo");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  // Busca eventos do Google Calendar via Edge Function
  const { data: eventosGoogle, isLoading: loadingGoogle, refetch: refetchGoogle } = useQuery({
    queryKey: ["agenda-google", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("google-calendar", {
        body: { action: "list_events", timeMin: new Date().toISOString() },
      });
      if (error) return [];
      return (data?.events ?? []) as EventoGoogle[];
    },
    enabled: !!user,
    retry: false,
  });

  const eventos: CalendarEvent[] = useMemo(() => {
    const lista: CalendarEvent[] = [];

    // Eventos do Google Calendar
    (eventosGoogle ?? []).forEach((ev) => {
      const inicio = ev.start?.dateTime
        ? new Date(ev.start.dateTime)
        : ev.start?.date
        ? new Date(ev.start.date + "T00:00:00")
        : null;
      const fim = ev.end?.dateTime
        ? new Date(ev.end.dateTime)
        : ev.end?.date
        ? new Date(ev.end.date + "T23:59:59")
        : null;

      if (!inicio || !fim) return;

      lista.push({
        id: ev.id,
        title: ev.summary || "(sem título)",
        start: inicio,
        end: fim,
        source: "google",
        description: ev.description,
        color: isReuniao(ev.summary || "") ? "#1A5B44" : "#2563EB",
      });
    });

    // Tarefas com prazo
    (tarefas ?? []).forEach((t) => {
      const prazo = new Date(t.prazo as string);
      lista.push({
        id: t.id,
        title: `📋 ${t.titulo}`,
        start: prazo,
        end: prazo,
        source: "tarefa",
        organizacao: (t.organizacoes as any)?.nome,
        color: "#D97706",
      });
    });

    return lista;
  }, [eventosGoogle, tarefas]);

  const eventStyleGetter = useCallback(
    (event: CalendarEvent) => ({
      style: {
        backgroundColor: event.color,
        borderColor: event.color,
        color: "white",
        borderRadius: "6px",
        padding: "2px 6px",
        fontSize: "12px",
        fontWeight: 500,
      },
    }),
    []
  );

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setEventoSelecionado(event);
  }, []);

  const sincronizar = () => {
    refetchTarefas();
    refetchGoogle();
  };

  const loading = loadingTarefas || loadingGoogle;

  return (
    <ConsultorLayout>
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarDays className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-foreground">Agenda Unificada</h1>
              <p className="text-sm text-muted-foreground">
                Google Calendar + Tarefas com prazo
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={sincronizar} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Sincronizar
          </Button>
        </div>

        {/* Legenda */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-[#1A5B44] inline-block" />
            Reuniões GIG
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-[#2563EB] inline-block" />
            Google Calendar
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-[#D97706] inline-block" />
            Tarefas com prazo
          </span>
        </div>

        {/* Calendário */}
        <Card>
          <CardContent className="p-4">
            <Calendar
              localizer={localizer}
              events={eventos}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 600 }}
              view={view}
              onView={setView}
              date={date}
              onNavigate={setDate}
              messages={messages}
              culture="pt-BR"
              eventPropGetter={eventStyleGetter}
              onSelectEvent={handleSelectEvent}
              popup
            />
          </CardContent>
        </Card>
      </div>

      {/* Modal de detalhes do evento */}
      <Dialog
        open={!!eventoSelecionado}
        onOpenChange={() => setEventoSelecionado(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="pr-6 text-base">
              {eventoSelecionado?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                style={{
                  borderColor: eventoSelecionado?.color,
                  color: eventoSelecionado?.color,
                }}
              >
                {eventoSelecionado?.source === "google"
                  ? "Google Calendar"
                  : "Tarefa"}
              </Badge>
            </div>
            <div className="text-muted-foreground">
              <span className="font-medium text-foreground">Início: </span>
              {eventoSelecionado?.start.toLocaleString("pt-BR")}
            </div>
            <div className="text-muted-foreground">
              <span className="font-medium text-foreground">Fim: </span>
              {eventoSelecionado?.end.toLocaleString("pt-BR")}
            </div>
            {eventoSelecionado?.organizacao && (
              <div className="text-muted-foreground">
                <span className="font-medium text-foreground">Cliente: </span>
                {eventoSelecionado.organizacao}
              </div>
            )}
            {eventoSelecionado?.description && (
              <div className="bg-muted rounded-lg p-3 text-muted-foreground whitespace-pre-wrap">
                {eventoSelecionado.description}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </ConsultorLayout>
  );
}
