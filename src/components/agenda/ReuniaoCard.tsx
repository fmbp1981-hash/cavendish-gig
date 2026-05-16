import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Clock, Users, Video, ExternalLink, Download } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Reuniao } from "@/hooks/useReunioes";

const TIPO_LABELS: Record<string, string> = {
  kickoff: "Kickoff",
  acompanhamento: "Acompanhamento",
  workshop: "Workshop",
  apresentacao: "Apresentação",
  outro: "Outro",
};

const TIPO_COLORS: Record<string, string> = {
  kickoff: "bg-blue-100 text-blue-800",
  acompanhamento: "bg-purple-100 text-purple-800",
  workshop: "bg-green-100 text-green-800",
  apresentacao: "bg-orange-100 text-orange-800",
  outro: "bg-gray-100 text-gray-800",
};

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

function getDurationMinutes(reuniao: Reuniao): number {
  const start = new Date(reuniao.data_inicio);
  const end = new Date(reuniao.data_fim);
  return Math.round((end.getTime() - start.getTime()) / 60000);
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export interface ReuniaoCardProps {
  reuniao: Reuniao;
  highlighted?: boolean;
}

export function ReuniaoCard({ reuniao, highlighted = false }: ReuniaoCardProps) {
  const tipoColor = TIPO_COLORS[reuniao.tipo] ?? TIPO_COLORS.outro;
  const tipoLabel = TIPO_LABELS[reuniao.tipo] ?? "Outro";
  const dataInicio = new Date(reuniao.data_inicio);
  const durationMinutes = getDurationMinutes(reuniao);

  const participantesPrimeiros = reuniao.participantes.slice(0, 3);
  const participantesExtras = reuniao.participantes.length - 3;

  return (
    <Card
      className={
        highlighted
          ? "border-primary border-2 shadow-md"
          : "border"
      }
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={tipoColor}>{tipoLabel}</Badge>
            {highlighted && (
              <Badge variant="outline" className="border-primary text-primary text-xs">
                Próxima reunião
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            {reuniao.link_video && (
              <Button
                variant="outline"
                size="sm"
                asChild
                className="h-8 px-2 text-xs"
              >
                <a href={reuniao.link_video} target="_blank" rel="noopener noreferrer">
                  <Video className="w-3 h-3 mr-1" />
                  Entrar
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={() => downloadICS(reuniao)}
              title="Adicionar ao calendário"
            >
              <Download className="w-3 h-3 mr-1" />
              .ics
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <h3 className={highlighted ? "text-lg font-semibold text-foreground" : "font-medium text-foreground"}>
          {reuniao.titulo}
        </h3>

        <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 shrink-0" />
            <span className="capitalize">
              {format(dataInicio, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 shrink-0" />
            <span>
              {format(dataInicio, "HH:mm", { locale: ptBR })}
              {" — "}
              {format(new Date(reuniao.data_fim), "HH:mm", { locale: ptBR })}
              {" "}
              <span className="text-xs">({formatDuration(durationMinutes)})</span>
            </span>
          </div>
          {reuniao.participantes.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Users className="w-4 h-4 shrink-0" />
              <div className="flex flex-wrap gap-1">
                {participantesPrimeiros.map((p) => (
                  <Badge
                    key={p.email}
                    variant="secondary"
                    className="text-xs font-normal"
                  >
                    {p.nome ?? p.email}
                  </Badge>
                ))}
                {participantesExtras > 0 && (
                  <Badge variant="secondary" className="text-xs font-normal">
                    +{participantesExtras} mais
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {reuniao.descricao && (
          <p className="text-sm text-muted-foreground line-clamp-2">{reuniao.descricao}</p>
        )}
      </CardContent>
    </Card>
  );
}
