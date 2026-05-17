import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, CalendarCheck2, ChevronDown, Clock } from "lucide-react";
import { ClienteLayout } from "@/components/layout/ClienteLayout";
import { ReuniaoCard } from "@/components/agenda/ReuniaoCard";
import { AgendaTimeline } from "@/components/agenda/AgendaTimeline";
import { useReunioesByOrg, useProximaReuniao } from "@/hooks/useReunioes";
import type { Reuniao } from "@/hooks/useReunioes";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

function generateICS(reuniao: Reuniao): string {
  const start = new Date(reuniao.data_inicio);
  const end = new Date(reuniao.data_fim);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Cavendish GIG//PT",
    "BEGIN:VEVENT",
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${reuniao.titulo}`,
    reuniao.link_video ? `LOCATION:${reuniao.link_video}` : "",
    reuniao.descricao ? `DESCRIPTION:${reuniao.descricao}` : "",
    `UID:${reuniao.id}@cavendish-gig`,
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

function downloadICS(reuniao: Reuniao) {
  const content = generateICS(reuniao);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${reuniao.titulo.replace(/\s+/g, "_")}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

function useOrganizacaoId() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["minha-organizacao", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organization_members")
        .select("organizacao_id")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data?.organizacao_id ?? null;
    },
  });
}

export default function MinhaAgenda() {
  const [historicoOpen, setHistoricoOpen] = useState(false);
  const { data: organizacaoId, isLoading: loadingOrg } = useOrganizacaoId();

  const { data: proximaReuniao, isLoading: loadingProxima } =
    useProximaReuniao(organizacaoId ?? null);

  const { data: todasReunioes = [], isLoading: loadingTodas } =
    useReunioesByOrg(organizacaoId ?? null);

  const now = new Date();

  const proximasReunioes = todasReunioes.filter(
    (r) =>
      r.status === "agendada" &&
      new Date(r.data_inicio) > now &&
      r.id !== proximaReuniao?.id
  );

  const historico = todasReunioes.filter(
    (r) =>
      r.status === "realizada" ||
      r.status === "cancelada" ||
      r.status === "reagendada" ||
      (r.status === "agendada" && new Date(r.data_inicio) <= now)
  );

  const isLoading = loadingOrg || loadingProxima || loadingTodas;

  if (isLoading) {
    return (
      <ClienteLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </ClienteLayout>
    );
  }

  return (
    <ClienteLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="flex items-center gap-3">
          <CalendarCheck2 className="w-7 h-7 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Minha Agenda</h1>
        </div>

        {/* Hero: Próxima Reunião */}
        <section>
          <h2 className="text-base font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
            Próxima Reunião
          </h2>
          {proximaReuniao ? (
            <div className="space-y-3">
              <ReuniaoCard reuniao={proximaReuniao} highlighted />
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadICS(proximaReuniao)}
                  className="gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  Adicionar ao Calendário
                </Button>
              </div>
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-10 text-center gap-3">
                <CalendarCheck2 className="w-10 h-10 text-muted-foreground" />
                <p className="text-muted-foreground font-medium">
                  Nenhuma reunião agendada
                </p>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Quando seu consultor agendar uma reunião, ela aparecerá aqui.
                </p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Próximas Reuniões */}
        {proximasReunioes.length > 0 && (
          <section>
            <h2 className="text-base font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              Próximas Reuniões
            </h2>
            <div className="space-y-3">
              {proximasReunioes.map((reuniao) => (
                <ReuniaoCard key={reuniao.id} reuniao={reuniao} />
              ))}
            </div>
          </section>
        )}

        {/* Histórico */}
        {historico.length > 0 && (
          <section>
            <Separator className="mb-6" />
            <Collapsible open={historicoOpen} onOpenChange={setHistoricoOpen}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-muted-foreground uppercase tracking-wide">
                  Histórico
                </h2>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                    {historicoOpen ? "Ocultar" : `Ver ${historico.length} reuniões`}
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        historicoOpen ? "rotate-180" : ""
                      }`}
                    />
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent>
                <AgendaTimeline reunioes={historico} />
              </CollapsibleContent>
            </Collapsible>
          </section>
        )}

        {todasReunioes.length === 0 && !proximaReuniao && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-4">
              <Clock className="w-12 h-12 text-muted-foreground" />
              <div>
                <p className="font-semibold text-foreground mb-1">
                  Nenhuma reunião encontrada
                </p>
                <p className="text-sm text-muted-foreground max-w-xs">
                  As reuniões agendadas pelo seu consultor aparecerão aqui.
                </p>
              </div>
              <Link to="/meu-projeto">
                <Button variant="outline" size="sm">
                  Voltar ao Meu Projeto
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Summary card when there are meetings */}
        {todasReunioes.length > 0 && (
          <Card className="bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Resumo
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {todasReunioes.filter((r) => r.status === "agendada").length}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Agendadas</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {todasReunioes.filter((r) => r.status === "realizada").length}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Realizadas</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {todasReunioes.length}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Total</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ClienteLayout>
  );
}
