import { useState } from "react";
import { ConsultorLayout } from "@/components/layout/ConsultorLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Calendar, Clock, Users, X, Plus, Loader2, Video, AlertCircle, CheckCircle2 } from "lucide-react";
import { agendarReuniaoKickoff, agendarReuniaoAcompanhamento } from "@/hooks/useGoogleCalendar";
import { useOrganizacoes } from "@/hooks/useConsultorData";
import { useInsertReuniao, useAtualizarReuniaoGoogleId } from "@/hooks/useReunioes";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type TipoReuniao = "kickoff" | "acompanhamento";

const fases = [
  { value: "diagnostico", label: "Diagnóstico" },
  { value: "implementacao", label: "Implementação" },
  { value: "recorrencia", label: "Recorrência" },
];

function parseGoogleError(errorMsg: string): string {
  if (!errorMsg) return "Verifique as configurações da integração com Google Calendar.";
  const msg = errorMsg.toLowerCase();

  if (msg.includes("not configured") || msg.includes("not_configured") || msg.includes("google calendar integration not configured")) {
    return "Integração com Google Calendar não configurada. Peça ao administrador para configurar a conta de serviço em Integrações.";
  }
  if (msg.includes("disabled")) {
    return "Integração com Google Calendar está desativada. Ative-a em Configurações > Integrações.";
  }
  if (msg.includes("invalid_grant") || msg.includes("invalid grant")) {
    return "Credencial Google expirada ou inválida. O administrador precisa reconfigurar a conta de serviço.";
  }
  if (msg.includes("permission") || msg.includes("forbidden") || msg.includes("403")) {
    return "Sem permissão para criar eventos. Verifique se a conta de serviço tem Domain-wide Delegation no Google Workspace.";
  }
  if (msg.includes("unauthorized") || msg.includes("401")) {
    return "Token de autorização inválido. Verifique a chave da conta de serviço Google.";
  }
  if (msg.includes("rate limit") || msg.includes("429") || msg.includes("quota")) {
    return "Limite de chamadas à API Google excedido. Tente novamente em alguns minutos.";
  }
  if (msg.includes("network") || msg.includes("fetch") || msg.includes("timeout")) {
    return "Erro de conexão com o Google. Verifique a conectividade e tente novamente.";
  }
  return errorMsg;
}

export default function ConsultorAgendamento() {
  const { data: organizacoes, isLoading: isLoadingOrgs } = useOrganizacoes();
  const insertReuniao = useInsertReuniao();
  const atualizarGoogleId = useAtualizarReuniaoGoogleId();

  const [tipoReuniao, setTipoReuniao] = useState<TipoReuniao>("kickoff");
  const [organizacaoId, setOrganizacaoId] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("10:00");
  const [duracao, setDuracao] = useState("60");
  const [fase, setFase] = useState("diagnostico");
  const [participantes, setParticipantes] = useState<string[]>([]);
  const [novoParticipante, setNovoParticipante] = useState("");
  const [isAgendando, setIsAgendando] = useState(false);
  const [googleWarning, setGoogleWarning] = useState<string | null>(null);

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
    if (!organizacaoId) { toast.error("Selecione uma organização"); return; }
    if (!data) { toast.error("Selecione uma data"); return; }
    if (participantes.length === 0) { toast.error("Adicione pelo menos um participante"); return; }

    setIsAgendando(true);
    setGoogleWarning(null);

    try {
      const dataHora = new Date(`${data}T${hora}:00`);
      const duracaoMinutos = parseInt(duracao);
      const dataFim = new Date(dataHora.getTime() + duracaoMinutos * 60000);
      const faseLabel = fases.find(f => f.value === fase)?.label || fase;
      const titulo = tipoReuniao === "kickoff"
        ? `Reunião de Kickoff — ${organizacaoSelecionada?.nome}`
        : `Acompanhamento ${faseLabel} — ${organizacaoSelecionada?.nome}`;

      // 1. Persistir localmente primeiro
      const reuniao = await insertReuniao.mutateAsync({
        organizacao_id: organizacaoId,
        tipo: tipoReuniao,
        titulo,
        data_inicio: dataHora.toISOString(),
        data_fim: dataFim.toISOString(),
        fase: tipoReuniao === "acompanhamento" ? fase : null,
        participantes: participantes.map(email => ({ email })),
        status: "agendada",
      });

      // 2. Tentar Google Calendar em background (não bloqueia o fluxo)
      try {
        let googleResult;
        if (tipoReuniao === "kickoff") {
          googleResult = await agendarReuniaoKickoff(
            organizacaoSelecionada?.nome || "Organização",
            dataHora,
            participantes,
            duracaoMinutos
          );
        } else {
          googleResult = await agendarReuniaoAcompanhamento(
            organizacaoSelecionada?.nome || "Organização",
            dataHora,
            participantes,
            faseLabel,
            duracaoMinutos
          );
        }

        if (googleResult.success && googleResult.data?.id) {
          // Atualizar reunião com ID e link do Google
          await atualizarGoogleId.mutateAsync({
            id: reuniao.id,
            googleEventId: googleResult.data.id,
            linkVideo: googleResult.data.hangoutLink || googleResult.data.conferenceData?.entryPoints?.[0]?.uri,
          });
          toast.success("Reunião agendada!", {
            description: "Evento criado no Google Calendar. Os participantes receberão o convite por email.",
          });
        } else {
          setGoogleWarning(parseGoogleError(googleResult.error || ""));
          toast.success("Reunião salva no sistema!", {
            description: "A sincronização com Google Calendar falhou, mas a reunião está registrada.",
          });
        }
      } catch (googleErr: any) {
        setGoogleWarning(parseGoogleError(googleErr.message || ""));
        toast.success("Reunião salva no sistema!", {
          description: "Não foi possível sincronizar com Google Calendar. A reunião está registrada localmente.",
        });
      }

      // Reset form
      setOrganizacaoId("");
      setData("");
      setHora("10:00");
      setDuracao("60");
      setFase("diagnostico");
      setParticipantes([]);
    } catch (err: any) {
      toast.error("Erro ao salvar reunião", { description: err.message });
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

        {googleWarning && (
          <Alert variant="destructive" className="border-amber-500 bg-amber-50 text-amber-900">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="space-y-1">
              <p className="font-medium">Google Calendar não sincronizado</p>
              <p className="text-sm">{googleWarning}</p>
              <p className="text-xs text-amber-700 mt-1">
                A reunião foi salva no sistema e aparecerá na agenda do cliente.
              </p>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Formulário */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Nova Reunião
              </CardTitle>
              <CardDescription>
                Preencha os dados para agendar a reunião
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
                Como o evento aparecerá no sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {organizacaoSelecionada ? (
                <div className="bg-card rounded-lg p-4 border space-y-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Sempre salvo no sistema</p>
                      <h3 className="font-semibold text-base text-foreground">
                        {tipoReuniao === "kickoff"
                          ? `Reunião de Kickoff — ${organizacaoSelecionada.nome}`
                          : `Acompanhamento ${fases.find(f => f.value === fase)?.label} — ${organizacaoSelecionada.nome}`
                        }
                      </h3>
                    </div>
                  </div>

                  {dataFormatada && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span className="capitalize">{dataFormatada}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{hora} — {parseInt(duracao)} minutos</span>
                  </div>

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Video className="h-4 w-4" />
                    <span>Google Meet (se integração configurada)</span>
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
