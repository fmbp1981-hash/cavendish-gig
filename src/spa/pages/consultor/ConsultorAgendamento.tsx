import { useState } from "react";
import { ConsultorLayout } from "@/components/layout/ConsultorLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Calendar, Clock, Users, X, Plus, Loader2, Video, AlertCircle, CheckCircle2, FileText, Send, Eye } from "lucide-react";
import { agendarReuniaoKickoff, agendarReuniaoAcompanhamento } from "@/hooks/useGoogleCalendar";
import { useOrganizacoes } from "@/hooks/useConsultorData";
import { useInsertReuniao, useAtualizarReuniaoGoogleId } from "@/hooks/useReunioes";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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

  // --- Atas pendentes de revisão ---
  const queryClient = useQueryClient();

  const { data: atasPendentes, isLoading: loadingAtas } = useQuery({
    queryKey: ["atas-pendentes-consultor"],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("documentos")
        .select("id, nome, url, created_at, organizacao_id, metadata, organizacoes(nome)")
        .eq("status", "em_analise")
        .like("nome", "Ata - %")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Array<{
        id: string; nome: string; url: string; created_at: string;
        organizacao_id: string; metadata: Record<string, unknown> | null;
        organizacoes: { nome: string } | null;
      }>;
    },
    refetchInterval: 30_000,
  });

  const [ataVisualizando, setAtaVisualizando] = useState<{
    id: string; nome: string; conteudo: string; url: string;
    organizacaoNome: string; organizacaoId: string;
  } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const visualizarAta = async (ata: { id: string; nome: string; url: string; organizacaoNome: string; organizacaoId: string }) => {
    setLoadingPreview(true);
    try {
      const resp = await fetch(ata.url);
      const conteudo = resp.ok ? await resp.text() : "Não foi possível carregar o conteúdo.";
      setAtaVisualizando({ ...ata, conteudo });
    } catch {
      setAtaVisualizando({ ...ata, conteudo: "Erro ao carregar a ata." });
    } finally {
      setLoadingPreview(false);
    }
  };

  const aprovarAta = useMutation({
    mutationFn: async ({ ataId, organizacaoId, ataNome, ataUrl }: {
      ataId: string; organizacaoId: string; ataNome: string; ataUrl: string;
    }) => {
      // 1. Atualiza status para aprovado
      const { error: updateErr } = await supabase
        .from("documentos")
        .update({ status: "aprovado" } as any)
        .eq("id", ataId);
      if (updateErr) throw updateErr;

      // 2. Busca emails dos membros clientes da organização
      const { data: membros } = await supabase
        .from("organization_members")
        .select("profiles:user_id(email, nome)")
        .eq("organizacao_id", organizacaoId)
        .eq("role", "cliente");

      // 3. Busca nome da organização
      const { data: org } = await supabase
        .from("organizacoes")
        .select("nome")
        .eq("id", organizacaoId)
        .maybeSingle();

      // 4. Envia email para cada membro cliente
      const clientes = (membros ?? []).map((m: any) => m.profiles).filter(Boolean);
      for (const cliente of clientes) {
        if (!cliente.email) continue;
        await supabase.functions.invoke("send-email", {
          body: {
            type: "ata_aprovada",
            to: cliente.email,
            data: {
              ataNome,
              ataUrl,
              organizacaoNome: org?.nome ?? "",
              userName: cliente.nome ?? "",
              reuniaoData: new Date().toLocaleDateString("pt-BR"),
            },
          },
        });
      }

      return { clientesNotificados: clientes.length };
    },
    onSuccess: ({ clientesNotificados }, vars) => {
      queryClient.invalidateQueries({ queryKey: ["atas-pendentes-consultor"] });
      queryClient.invalidateQueries({ queryKey: ["atas", vars.organizacaoId] });
      setAtaVisualizando(null);
      toast.success("Ata aprovada e enviada!", {
        description: clientesNotificados > 0
          ? `${clientesNotificados} cliente(s) notificado(s) por email.`
          : "Ata aprovada. Nenhum cliente cadastrado para notificar.",
      });
    },
    onError: (err: any) => {
      toast.error("Erro ao aprovar ata", { description: err.message });
    },
  });

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

        {/* Atas Pendentes de Revisão */}
        {(loadingAtas || (atasPendentes && atasPendentes.length > 0)) && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-500" />
              <h2 className="text-lg font-semibold text-foreground">
                Atas para Revisar
              </h2>
              {atasPendentes && atasPendentes.length > 0 && (
                <Badge className="bg-indigo-600 hover:bg-indigo-600">
                  {atasPendentes.length}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Atas geradas pelo Fireflies.ai aguardando sua revisão antes de serem enviadas ao cliente.
            </p>

            {loadingAtas ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid gap-3">
                {atasPendentes!.map((ata: any) => (
                  <Card key={ata.id} className="border-indigo-200 bg-indigo-50/30">
                    <CardContent className="flex items-center justify-between py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{ata.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            {(ata.organizacoes as any)?.nome} ·{" "}
                            {new Date(ata.created_at).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-indigo-600 border-indigo-300 text-xs">
                          Aguardando revisão
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={loadingPreview}
                          onClick={() => visualizarAta({
                            id: ata.id,
                            nome: ata.nome,
                            url: ata.url,
                            organizacaoNome: (ata.organizacoes as any)?.nome ?? "",
                            organizacaoId: ata.organizacao_id,
                          })}
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          Revisar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dialog de revisão da ata */}
      <Dialog open={!!ataVisualizando} onOpenChange={(open) => { if (!open) setAtaVisualizando(null); }}>
        <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-500" />
              {ataVisualizando?.nome}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 pr-4">
            <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed text-foreground">
              {ataVisualizando?.conteudo}
            </pre>
          </ScrollArea>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAtaVisualizando(null)}>
              Fechar
            </Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700"
              disabled={aprovarAta.isPending}
              onClick={() => {
                if (!ataVisualizando) return;
                aprovarAta.mutate({
                  ataId: ataVisualizando.id,
                  organizacaoId: ataVisualizando.organizacaoId,
                  ataNome: ataVisualizando.nome,
                  ataUrl: ataVisualizando.url,
                });
              }}
            >
              {aprovarAta.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Aprovar e Enviar ao Cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConsultorLayout>
  );
}
