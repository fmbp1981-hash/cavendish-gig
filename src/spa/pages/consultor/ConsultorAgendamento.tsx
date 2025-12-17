import { useState } from "react";
import { ConsultorLayout } from "@/components/layout/ConsultorLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calendar, Clock, Users, X, Plus, Loader2, Video, MapPin } from "lucide-react";
import { agendarReuniaoKickoff, agendarReuniaoAcompanhamento } from "@/hooks/useGoogleCalendar";
import { useOrganizacoes } from "@/hooks/useConsultorData";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type TipoReuniao = "kickoff" | "acompanhamento";

const fases = [
  { value: "diagnostico", label: "Diagnóstico" },
  { value: "implementacao", label: "Implementação" },
  { value: "recorrencia", label: "Recorrência" },
];

export default function ConsultorAgendamento() {
  const { data: organizacoes, isLoading: isLoadingOrgs } = useOrganizacoes();
  
  const [tipoReuniao, setTipoReuniao] = useState<TipoReuniao>("kickoff");
  const [organizacaoId, setOrganizacaoId] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("10:00");
  const [duracao, setDuracao] = useState("60");
  const [fase, setFase] = useState("diagnostico");
  const [participantes, setParticipantes] = useState<string[]>([]);
  const [novoParticipante, setNovoParticipante] = useState("");
  const [isAgendando, setIsAgendando] = useState(false);

  const organizacaoSelecionada = organizacoes?.find(org => org.id === organizacaoId);

  const adicionarParticipante = () => {
    const email = novoParticipante.trim().toLowerCase();
    if (!email) return;
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Email inválido");
      return;
    }
    
    if (participantes.includes(email)) {
      toast.error("Este email já foi adicionado");
      return;
    }
    
    setParticipantes([...participantes, email]);
    setNovoParticipante("");
  };

  const removerParticipante = (email: string) => {
    setParticipantes(participantes.filter(p => p !== email));
  };

  const handleAgendar = async () => {
    if (!organizacaoId) {
      toast.error("Selecione uma organização");
      return;
    }
    
    if (!data) {
      toast.error("Selecione uma data");
      return;
    }
    
    if (participantes.length === 0) {
      toast.error("Adicione pelo menos um participante");
      return;
    }

    setIsAgendando(true);

    try {
      const dataHora = new Date(`${data}T${hora}:00`);
      const duracaoMinutos = parseInt(duracao);

      let resultado;
      
      if (tipoReuniao === "kickoff") {
        resultado = await agendarReuniaoKickoff(
          organizacaoSelecionada?.nome || "Organização",
          dataHora,
          participantes,
          duracaoMinutos
        );
      } else {
        resultado = await agendarReuniaoAcompanhamento(
          organizacaoSelecionada?.nome || "Organização",
          dataHora,
          participantes,
          fases.find(f => f.value === fase)?.label || fase,
          duracaoMinutos
        );
      }

      if (resultado.success) {
        toast.success("Reunião agendada com sucesso!", {
          description: "Os participantes receberão o convite por email com o link do Google Meet."
        });
        
        // Reset form
        setOrganizacaoId("");
        setData("");
        setHora("10:00");
        setDuracao("60");
        setFase("diagnostico");
        setParticipantes([]);
      } else {
        toast.error("Erro ao agendar reunião", {
          description: resultado.error || "Verifique se a integração com Google Calendar está configurada."
        });
      }
    } catch (error: any) {
      toast.error("Erro ao agendar reunião", {
        description: error.message
      });
    } finally {
      setIsAgendando(false);
    }
  };

  const dataFormatada = data 
    ? format(new Date(data + "T12:00:00"), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })
    : null;

  return (
    <ConsultorLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agendar Reunião</h1>
          <p className="text-muted-foreground">
            Agende reuniões de kickoff ou acompanhamento com seus clientes
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Formulário */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Nova Reunião
              </CardTitle>
              <CardDescription>
                Preencha os dados para agendar a reunião no Google Calendar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Tipo de Reunião */}
              <div className="space-y-2">
                <Label>Tipo de Reunião</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={tipoReuniao === "kickoff" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setTipoReuniao("kickoff")}
                  >
                    Kickoff
                  </Button>
                  <Button
                    type="button"
                    variant={tipoReuniao === "acompanhamento" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setTipoReuniao("acompanhamento")}
                  >
                    Acompanhamento
                  </Button>
                </div>
              </div>

              {/* Organização */}
              <div className="space-y-2">
                <Label htmlFor="organizacao">Organização</Label>
                <Select value={organizacaoId} onValueChange={setOrganizacaoId}>
                  <SelectTrigger id="organizacao">
                    <SelectValue placeholder={isLoadingOrgs ? "Carregando..." : "Selecione a organização"} />
                  </SelectTrigger>
                  <SelectContent>
                    {organizacoes?.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Fase (apenas para acompanhamento) */}
              {tipoReuniao === "acompanhamento" && (
                <div className="space-y-2">
                  <Label htmlFor="fase">Fase do Projeto</Label>
                  <Select value={fase} onValueChange={setFase}>
                    <SelectTrigger id="fase">
                      <SelectValue placeholder="Selecione a fase" />
                    </SelectTrigger>
                    <SelectContent>
                      {fases.map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Data e Hora */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="data">Data</Label>
                  <Input
                    id="data"
                    type="date"
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    min={format(new Date(), "yyyy-MM-dd")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hora">Horário</Label>
                  <Input
                    id="hora"
                    type="time"
                    value={hora}
                    onChange={(e) => setHora(e.target.value)}
                  />
                </div>
              </div>

              {/* Duração */}
              <div className="space-y-2">
                <Label htmlFor="duracao">Duração</Label>
                <Select value={duracao} onValueChange={setDuracao}>
                  <SelectTrigger id="duracao">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutos</SelectItem>
                    <SelectItem value="45">45 minutos</SelectItem>
                    <SelectItem value="60">1 hora</SelectItem>
                    <SelectItem value="90">1 hora e 30 minutos</SelectItem>
                    <SelectItem value="120">2 horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Participantes */}
              <div className="space-y-2">
                <Label>Participantes</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="email@exemplo.com"
                    value={novoParticipante}
                    onChange={(e) => setNovoParticipante(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), adicionarParticipante())}
                  />
                  <Button type="button" variant="outline" onClick={adicionarParticipante}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {participantes.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {participantes.map((email) => (
                      <Badge key={email} variant="secondary" className="gap-1">
                        {email}
                        <button
                          type="button"
                          onClick={() => removerParticipante(email)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Botão Agendar */}
              <Button 
                className="w-full" 
                onClick={handleAgendar}
                disabled={isAgendando || !organizacaoId || !data || participantes.length === 0}
              >
                {isAgendando ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Agendando...
                  </>
                ) : (
                  <>
                    <Calendar className="mr-2 h-4 w-4" />
                    Agendar Reunião
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5 text-primary" />
                Prévia do Evento
              </CardTitle>
              <CardDescription>
                Como o evento aparecerá no Google Calendar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {organizacaoSelecionada ? (
                <>
                  <div className="bg-card rounded-lg p-4 border space-y-4">
                    <h3 className="font-semibold text-lg text-foreground">
                      {tipoReuniao === "kickoff" 
                        ? `Reunião de Kickoff - ${organizacaoSelecionada.nome}`
                        : `Acompanhamento ${fases.find(f => f.value === fase)?.label} - ${organizacaoSelecionada.nome}`
                      }
                    </h3>
                    
                    {dataFormatada && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span className="capitalize">{dataFormatada}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{hora} - {parseInt(duracao)} minutos</span>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Video className="h-4 w-4" />
                      <span>Google Meet (link gerado automaticamente)</span>
                    </div>
                    
                    {participantes.length > 0 && (
                      <div className="flex items-start gap-2 text-muted-foreground">
                        <Users className="h-4 w-4 mt-0.5" />
                        <div className="flex-1">
                          <span className="block mb-1">Participantes:</span>
                          <ul className="text-sm space-y-0.5">
                            {participantes.map(email => (
                              <li key={email}>{email}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground">
                        {tipoReuniao === "kickoff" ? (
                          <>
                            <strong>Agenda:</strong><br />
                            1. Apresentação da equipe<br />
                            2. Alinhamento de expectativas<br />
                            3. Cronograma do projeto<br />
                            4. Próximos passos
                          </>
                        ) : (
                          <>
                            <strong>Pauta:</strong><br />
                            1. Status das entregas<br />
                            2. Documentos pendentes<br />
                            3. Próximos passos<br />
                            4. Dúvidas e suporte
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Selecione uma organização para ver a prévia</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ConsultorLayout>
  );
}
