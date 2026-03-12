import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2, Plus, Building2, AlertTriangle, CheckCircle2,
  ExternalLink, ChevronRight, ClipboardList, Calendar, History,
} from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Fornecedor,
  FornecedorCategoria,
  NivelCriticidade,
  CATEGORIA_LABEL,
  CRITICIDADE_LABEL,
  CRITICIDADE_COR,
  SCORE_COR,
  useFornecedores,
  useCriarFornecedor,
  useAtualizarFornecedor,
  useExcluirFornecedor,
  useDDPerguntas,
  useDueDiligenceFornecedor,
  useFinalizarDueDiligence,
  DDPergunta,
} from "@/hooks/useFornecedores";
import { useOrganizacoes } from "@/hooks/useConsultorData";
import { cn } from "@/lib/utils";

// ─── Formulário de Fornecedor ─────────────────────────────────────────────────

function FornecedorFormDialog({
  open, onOpenChange, organizacaoId, fornecedor,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  organizacaoId: string;
  fornecedor?: Fornecedor | null;
}) {
  const isEdit = !!fornecedor;
  const criar = useCriarFornecedor();
  const atualizar = useAtualizarFornecedor();

  const [nome, setNome] = useState(fornecedor?.nome ?? "");
  const [cnpj, setCnpj] = useState(fornecedor?.cnpj ?? "");
  const [categoria, setCategoria] = useState<FornecedorCategoria>(fornecedor?.categoria ?? "servicos");
  const [criticidade, setCriticidade] = useState<NivelCriticidade>(fornecedor?.nivel_criticidade ?? "medio");
  const [contatoNome, setContatoNome] = useState(fornecedor?.contato_nome ?? "");
  const [contatoEmail, setContatoEmail] = useState(fornecedor?.contato_email ?? "");
  const [website, setWebsite] = useState(fornecedor?.website ?? "");

  const saving = criar.isPending || atualizar.isPending;

  const handleSave = async () => {
    if (!nome.trim()) return;
    const payload = {
      nome, cnpj: cnpj || undefined, categoria,
      nivel_criticidade: criticidade,
      contato_nome: contatoNome || undefined,
      contato_email: contatoEmail || undefined,
      website: website || undefined,
    };
    if (isEdit && fornecedor) {
      await atualizar.mutateAsync({ id: fornecedor.id, ...payload });
    } else {
      await criar.mutateAsync({ organizacao_id: organizacaoId, ...payload });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Fornecedor" : "Novo Fornecedor"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label>Nome *</Label>
            <Input placeholder="Razão social" value={nome} onChange={e => setNome(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>CNPJ</Label>
              <Input placeholder="00.000.000/0001-00" value={cnpj} onChange={e => setCnpj(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select value={categoria} onValueChange={v => setCategoria(v as FornecedorCategoria)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORIA_LABEL).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Nível de criticidade</Label>
              <Select value={criticidade} onValueChange={v => setCriticidade(v as NivelCriticidade)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CRITICIDADE_LABEL).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Website</Label>
              <Input placeholder="https://..." value={website} onChange={e => setWebsite(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Contato</Label>
              <Input placeholder="Nome do contato" value={contatoNome} onChange={e => setContatoNome(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>E-mail contato</Label>
              <Input type="email" placeholder="email@fornecedor.com" value={contatoEmail} onChange={e => setContatoEmail(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!nome.trim() || saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {isEdit ? "Salvar" : "Cadastrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Reagendar avaliação ──────────────────────────────────────────────────────

function ReagendarDialog({
  fornecedor,
  open,
  onOpenChange,
}: {
  fornecedor: Fornecedor;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const atualizar = useAtualizarFornecedor();
  const valorInicial = fornecedor.proxima_avaliacao
    ? fornecedor.proxima_avaliacao.split("T")[0]
    : "";
  const [novaData, setNovaData] = useState(valorInicial);

  const handleSalvar = async () => {
    if (!novaData) return;
    await atualizar.mutateAsync({ id: fornecedor.id, proxima_avaliacao: novaData });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Reagendar Avaliação
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-sm text-muted-foreground">
            Defina a nova data para a próxima due diligence de{" "}
            <span className="font-medium text-foreground">{fornecedor.nome}</span>.
          </p>
          <div className="space-y-1.5">
            <Label>Nova data de avaliação</Label>
            <Input
              type="date"
              value={novaData}
              onChange={(e) => setNovaData(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSalvar} disabled={!novaData || atualizar.isPending}>
            {atualizar.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Wizard de Due Diligence ──────────────────────────────────────────────────

function DueDiligenceWizard({
  fornecedor,
  organizacaoId,
  open,
  onOpenChange,
}: {
  fornecedor: Fornecedor;
  organizacaoId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { data: perguntas, isLoading } = useDDPerguntas();
  const { data: historico } = useDueDiligenceFornecedor(fornecedor.id);
  const finalizar = useFinalizarDueDiligence();
  const [respostas, setRespostas] = useState<Record<string, boolean>>({});
  const [step, setStep] = useState<"questionario" | "resultado">("questionario");
  const [scoreResultado, setScoreResultado] = useState<number | null>(null);
  const [reagendarOpen, setReagendarOpen] = useState(false);

  const categorias = [...new Set((perguntas ?? []).map(p => p.categoria))];

  const handleToggle = (id: string, val: boolean) => {
    setRespostas(prev => ({ ...prev, [id]: val }));
  };

  const totalRespondidas = Object.keys(respostas).length;
  const totalPerguntas = perguntas?.length ?? 0;
  const progresso = totalPerguntas > 0 ? Math.round((totalRespondidas / totalPerguntas) * 100) : 0;

  const handleFinalizar = async () => {
    if (!perguntas) return;
    const score = await finalizar.mutateAsync({
      fornecedorId: fornecedor.id,
      organizacaoId,
      respostas,
      perguntas,
    });
    setScoreResultado(score);
    setStep("resultado");
  };

  const handleFechar = () => {
    setRespostas({});
    setStep("questionario");
    setScoreResultado(null);
    onOpenChange(false);
  };

  const CATEGORIA_ICON: Record<string, string> = {
    lgpd:          "🔐",
    anticorrupcao: "⚖️",
    financeiro:    "💰",
    seguranca:     "🛡️",
    esg:           "🌱",
    operacional:   "⚙️",
  };

  return (
    <>
      <Sheet open={open} onOpenChange={v => !v && handleFechar()}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle>Due Diligence — {fornecedor.nome}</SheetTitle>
          </SheetHeader>

          {step === "resultado" && scoreResultado !== null ? (
            <div className="space-y-6 py-4">
              <div className="text-center space-y-2">
                <div className={`text-6xl font-bold ${SCORE_COR(scoreResultado)}`}>
                  {scoreResultado}
                </div>
                <p className="text-muted-foreground">Score de Conformidade (0–100)</p>
              </div>

              <div className="space-y-2">
                <Progress value={scoreResultado} className="h-4" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Crítico</span><span>Alto</span><span>Médio</span><span>Baixo risco</span>
                </div>
              </div>

              <div className={cn(
                "rounded-lg p-4 text-sm",
                scoreResultado >= 80 ? "bg-green-50 text-green-800 dark:bg-green-900/20" :
                scoreResultado >= 60 ? "bg-yellow-50 text-yellow-800 dark:bg-yellow-900/20" :
                scoreResultado >= 40 ? "bg-orange-50 text-orange-800 dark:bg-orange-900/20" :
                                       "bg-red-50 text-red-800 dark:bg-red-900/20"
              )}>
                <p className="font-medium mb-1">
                  {scoreResultado >= 80 ? "✅ Baixo risco" :
                   scoreResultado >= 60 ? "⚠️ Risco médio" :
                   scoreResultado >= 40 ? "🔶 Alto risco" :
                                          "🔴 Risco crítico"}
                </p>
                <p className="text-xs">
                  {scoreResultado >= 80
                    ? "Fornecedor em conformidade adequada. Recomenda-se avaliação anual."
                    : scoreResultado >= 60
                    ? "Fornecedor apresenta pontos de atenção. Monitore os itens negativos."
                    : scoreResultado >= 40
                    ? "Fornecedor com lacunas relevantes. Exija plano de ação antes de contratar."
                    : "Fornecedor de alto risco. Revise criticamente antes de aprovar."}
                </p>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Score salvo. Próxima avaliação agendada para 12 meses.
              </p>

              <Button onClick={handleFechar} className="w-full">Fechar</Button>
            </div>
          ) : isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : (
            <div className="space-y-4">
              {/* Botão Reagendar */}
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setReagendarOpen(true)}
                >
                  <Calendar className="h-3.5 w-3.5 mr-1.5" />
                  Reagendar Avaliação
                </Button>
              </div>

              {/* Progresso */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{totalRespondidas}/{totalPerguntas} respondidas</span>
                  <span>{progresso}%</span>
                </div>
                <Progress value={progresso} className="h-1.5" />
              </div>

              {/* Perguntas por categoria */}
              <ScrollArea className="h-[calc(100vh-440px)]">
                <div className="space-y-6 pr-2">
                  {categorias.map(cat => {
                    const psCat = (perguntas ?? []).filter(p => p.categoria === cat);
                    return (
                      <div key={cat}>
                        <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <span>{CATEGORIA_ICON[cat] ?? "📋"}</span>
                          <span className="capitalize">{cat.replace("_", " ")}</span>
                        </p>
                        <div className="space-y-3">
                          {psCat.map(p => (
                            <label
                              key={p.id}
                              className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                            >
                              <Checkbox
                                checked={respostas[p.id] ?? false}
                                onCheckedChange={v => handleToggle(p.id, v === true)}
                                className="mt-0.5 shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="text-sm leading-snug">{p.pergunta}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">Peso: {p.peso}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              {/* Histórico de avaliações */}
              {historico && historico.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Histórico de avaliações
                  </p>
                  <div className="space-y-1.5">
                    {historico.map((dd, idx) => (
                      <div
                        key={dd.id}
                        className="flex items-center justify-between rounded-md border border-border bg-muted/20 px-3 py-2"
                      >
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(dd.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          {idx === 0 && (
                            <Badge variant="outline" className="ml-2 text-[10px]">
                              Mais recente
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {dd.score_calculado !== null && (
                            <span className={cn("text-xs font-bold", SCORE_COR(dd.score_calculado))}>
                              Score: {dd.score_calculado}/100
                            </span>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-xs px-2"
                            onClick={() => {
                              setRespostas({});
                              setStep("questionario");
                            }}
                          >
                            Re-avaliar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button
                onClick={handleFinalizar}
                disabled={totalRespondidas < totalPerguntas || finalizar.isPending}
                className="w-full"
              >
                {finalizar.isPending
                  ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  : <CheckCircle2 className="h-4 w-4 mr-2" />}
                {totalRespondidas < totalPerguntas
                  ? `Responda todas as ${totalPerguntas - totalRespondidas} restantes`
                  : "Calcular Score e Finalizar"}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {reagendarOpen && (
        <ReagendarDialog
          fornecedor={fornecedor}
          open={reagendarOpen}
          onOpenChange={setReagendarOpen}
        />
      )}
    </>
  );
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────

export function DueDiligenceTab() {
  const { data: orgs } = useOrganizacoes();
  const [selectedOrg, setSelectedOrg] = useState("");
  // Auto-seleciona a primeira org se nenhuma selecionada
  useEffect(() => {
    if (!selectedOrg && orgs && orgs.length > 0) {
      setSelectedOrg(orgs[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgs]);

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Fornecedor | null>(null);
  const [ddTarget, setDDTarget] = useState<Fornecedor | null>(null);
  const excluir = useExcluirFornecedor();

  const { data: fornecedores, isLoading } = useFornecedores(selectedOrg || undefined);

  const vencidos = (fornecedores ?? []).filter(f => {
    if (!f.proxima_avaliacao) return false;
    return differenceInDays(new Date(), parseISO(f.proxima_avaliacao)) > 0;
  });

  const aVencer = (fornecedores ?? []).filter(f => {
    if (!f.proxima_avaliacao) return false;
    const dias = differenceInDays(parseISO(f.proxima_avaliacao), new Date());
    return dias >= 0 && dias <= 30;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Select value={selectedOrg || "__all__"} onValueChange={v => setSelectedOrg(v === "__all__" ? "" : v)}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Todas as organizações" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todas as organizações</SelectItem>
            {(orgs ?? []).map((org: any) => (
              <SelectItem key={org.id} value={org.id}>{org.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={() => { setEditTarget(null); setFormOpen(true); }} disabled={!selectedOrg}>
          <Plus className="h-4 w-4 mr-1.5" />Novo Fornecedor
        </Button>
      </div>

      {/* Alertas */}
      {vencidos.length > 0 && (
        <Alert className="border-red-400/40 bg-red-50 dark:bg-red-900/20">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 dark:text-red-300">
            <strong>{vencidos.length}</strong> fornecedor{vencidos.length > 1 ? "es" : ""} com due diligence <strong>vencida</strong>.
          </AlertDescription>
        </Alert>
      )}
      {aVencer.length > 0 && (
        <Alert className="border-orange-400/40 bg-orange-50 dark:bg-orange-900/20">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800 dark:text-orange-300">
            <strong>{aVencer.length}</strong> fornecedor{aVencer.length > 1 ? "es" : ""} com avaliação a vencer nos próximos 30 dias.
          </AlertDescription>
        </Alert>
      )}

      {/* Lista */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : !fornecedores || fornecedores.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 gap-3 text-center">
            <Building2 className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm font-medium">Nenhum fornecedor cadastrado</p>
            <p className="text-xs text-muted-foreground">
              {selectedOrg ? "Cadastre o primeiro fornecedor para iniciar o controle de risco." : "Selecione uma organização."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {fornecedores.map(f => {
            const diasParaVencer = f.proxima_avaliacao
              ? differenceInDays(parseISO(f.proxima_avaliacao), new Date())
              : null;
            const vencido = diasParaVencer !== null && diasParaVencer < 0;
            const urgente = diasParaVencer !== null && diasParaVencer >= 0 && diasParaVencer <= 30;

            return (
              <Card
                key={f.id}
                className={cn(
                  "transition-colors",
                  vencido && "border-red-400/50",
                  urgente && !vencido && "border-orange-400/40"
                )}
              >
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{f.nome}</p>
                        {f.cnpj && <span className="text-xs text-muted-foreground">{f.cnpj}</span>}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-[10px]">
                          {f.categoria ? CATEGORIA_LABEL[f.categoria] : "—"}
                        </Badge>
                        <Badge variant="outline" className={cn("text-[10px]", CRITICIDADE_COR[f.nivel_criticidade])}>
                          {CRITICIDADE_LABEL[f.nivel_criticidade]}
                        </Badge>
                        {f.score_risco_atual !== null && (
                          <span className={cn("text-xs font-bold", SCORE_COR(f.score_risco_atual))}>
                            Score: {f.score_risco_atual}/100
                          </span>
                        )}
                        {f.proxima_avaliacao && (
                          <span className={cn(
                            "text-xs",
                            vencido ? "text-red-600 font-medium" :
                            urgente ? "text-orange-600 font-medium" :
                            "text-muted-foreground"
                          )}>
                            Avaliação: {format(parseISO(f.proxima_avaliacao), "dd/MM/yyyy", { locale: ptBR })}
                            {vencido && " ⚠️ vencida"}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {f.cnpj && (
                        <Button
                          size="sm" variant="ghost"
                          onClick={() => {
                            const digits = f.cnpj!.replace(/\D/g, "");
                            window.open(`https://portaltransparencia.gov.br/sancoes/ceis?cpfCnpj=${digits}`, "_blank");
                          }}
                          title="Consultar CEIS"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button
                        size="sm" variant="outline"
                        onClick={() => setDDTarget(f)}
                      >
                        <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
                        {f.score_risco_atual !== null ? "Reavaliar" : "Avaliar"}
                      </Button>
                      <Button
                        size="sm" variant="ghost"
                        onClick={() => { setEditTarget(f); setFormOpen(true); }}
                      >
                        Editar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialogs */}
      {selectedOrg && (
        <FornecedorFormDialog
          open={formOpen}
          onOpenChange={v => { setFormOpen(v); if (!v) setEditTarget(null); }}
          organizacaoId={selectedOrg}
          fornecedor={editTarget}
        />
      )}

      {ddTarget && selectedOrg && (
        <DueDiligenceWizard
          fornecedor={ddTarget}
          organizacaoId={selectedOrg}
          open={!!ddTarget}
          onOpenChange={v => !v && setDDTarget(null)}
        />
      )}
    </div>
  );
}
