import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Plus, ShieldCheck, Clock, AlertTriangle, Trash2, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  LGPDInventario,
  LGPDSolicitacao,
  BaseLegal,
  DSRTipo,
  DSRStatus,
  BASE_LEGAL_LABEL,
  DSR_TIPO_LABEL,
  DSR_STATUS_LABEL,
  DSR_STATUS_COR,
  diasRestantesDSR,
  useLGPDInventario,
  useLGPDSolicitacoes,
  useCriarInventario,
  useAtualizarInventario,
  useExcluirInventario,
  useCriarSolicitacao,
  useResponderDSR,
} from "@/hooks/useLGPD";
import { useOrganizacoes } from "@/hooks/useConsultorData";
import { cn } from "@/lib/utils";

// ─── Inventário Form ──────────────────────────────────────────────────────────

function InventarioFormDialog({
  open, onOpenChange, organizacaoId, item,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  organizacaoId: string;
  item?: LGPDInventario | null;
}) {
  const isEdit = !!item;
  const criar = useCriarInventario();
  const atualizar = useAtualizarInventario();

  const [processo, setProcesso] = useState(item?.processo ?? "");
  const [finalidade, setFinalidade] = useState(item?.finalidade ?? "");
  const [baseLegal, setBaseLegal] = useState<BaseLegal>(item?.base_legal ?? "consentimento");
  const [dados, setDados] = useState((item?.dados_coletados ?? []).join(", "));
  const [titulares, setTitulares] = useState((item?.titulares ?? []).join(", "));
  const [retencao, setRetencao] = useState(item?.retencao_meses ? String(item.retencao_meses) : "");
  const [medidas, setMedidas] = useState(item?.medidas_seguranca ?? "");

  const saving = criar.isPending || atualizar.isPending;

  const handleSave = async () => {
    if (!processo.trim() || !finalidade.trim()) return;
    const payload = {
      processo,
      finalidade,
      base_legal: baseLegal,
      dados_coletados: dados ? dados.split(",").map(s => s.trim()).filter(Boolean) : [],
      titulares: titulares ? titulares.split(",").map(s => s.trim()).filter(Boolean) : [],
      retencao_meses: retencao ? Number(retencao) : undefined,
      medidas_seguranca: medidas || undefined,
    };
    if (isEdit && item) {
      await atualizar.mutateAsync({ id: item.id, ...payload });
    } else {
      await criar.mutateAsync({ organization_id: organizacaoId, ...payload });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Processo" : "Novo Processo de Tratamento (ROPA)"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Processo / Atividade *</Label>
              <Input placeholder="Ex: Folha de pagamento" value={processo} onChange={e => setProcesso(e.target.value)} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Finalidade *</Label>
              <Input placeholder="Ex: Processamento de salários e obrigações trabalhistas" value={finalidade} onChange={e => setFinalidade(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Base Legal</Label>
              <Select value={baseLegal} onValueChange={v => setBaseLegal(v as BaseLegal)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(BASE_LEGAL_LABEL).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Retenção (meses)</Label>
              <Input type="number" min={1} placeholder="Ex: 60" value={retencao} onChange={e => setRetencao(e.target.value)} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Dados coletados (separados por vírgula)</Label>
              <Input placeholder="Nome, CPF, Email, Endereço" value={dados} onChange={e => setDados(e.target.value)} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Titulares (separados por vírgula)</Label>
              <Input placeholder="Funcionários, Clientes, Fornecedores" value={titulares} onChange={e => setTitulares(e.target.value)} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Medidas de segurança</Label>
              <Textarea placeholder="Ex: Criptografia AES-256, controle de acesso por função, backup diário..." value={medidas} onChange={e => setMedidas(e.target.value)} rows={2} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!processo.trim() || !finalidade.trim() || saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {isEdit ? "Salvar" : "Adicionar ao inventário"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── DSR Form ─────────────────────────────────────────────────────────────────

function DSRFormDialog({
  open, onOpenChange, organizacaoId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  organizacaoId: string;
}) {
  const criar = useCriarSolicitacao();
  const [tipo, setTipo] = useState<DSRTipo>("acesso");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [descricao, setDescricao] = useState("");

  const handleSave = async () => {
    if (!nome.trim() || !email.trim()) return;
    await criar.mutateAsync({
      organization_id: organizacaoId,
      tipo,
      solicitante_nome: nome,
      solicitante_email: email,
      descricao: descricao || undefined,
    });
    setNome(""); setEmail(""); setDescricao("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Solicitação de Titular (DSR)</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label>Tipo de solicitação</Label>
            <Select value={tipo} onValueChange={v => setTipo(v as DSRTipo)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(DSR_TIPO_LABEL).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Nome do titular *</Label>
            <Input placeholder="Nome completo" value={nome} onChange={e => setNome(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>E-mail *</Label>
            <Input type="email" placeholder="email@exemplo.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Textarea placeholder="Detalhes da solicitação..." value={descricao} onChange={e => setDescricao(e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!nome.trim() || !email.trim() || criar.isPending}>
            Registrar solicitação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Responder DSR ────────────────────────────────────────────────────────────

function ResponderDSRDialog({
  solicitacao, open, onOpenChange,
}: {
  solicitacao: LGPDSolicitacao | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const responder = useResponderDSR();
  const [status, setStatus] = useState<DSRStatus>("concluida");
  const [resposta, setResposta] = useState("");

  const handleSave = async () => {
    if (!solicitacao) return;
    await responder.mutateAsync({ id: solicitacao.id, status, resposta });
    setResposta("");
    onOpenChange(false);
  };

  if (!solicitacao) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Responder DSR — {DSR_TIPO_LABEL[solicitacao.tipo]}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="rounded-lg bg-muted/40 px-3 py-2 text-sm space-y-1">
            <p><span className="text-muted-foreground">Titular:</span> {solicitacao.solicitante_nome}</p>
            <p><span className="text-muted-foreground">Email:</span> {solicitacao.solicitante_email}</p>
            {solicitacao.descricao && <p className="text-xs text-muted-foreground">{solicitacao.descricao}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Status da resposta</Label>
            <Select value={status} onValueChange={v => setStatus(v as DSRStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="concluida">Concluída</SelectItem>
                <SelectItem value="negada">Negada (com justificativa)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Resposta ao titular</Label>
            <Textarea placeholder="Descreva a ação tomada ou justificativa da negação..." value={resposta} onChange={e => setResposta(e.target.value)} rows={4} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={responder.isPending}>
            {responder.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Registrar resposta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────

export function LGPDTab() {
  const { data: orgs } = useOrganizacoes();
  const [selectedOrg, setSelectedOrg] = useState("");
  // Auto-seleciona a primeira org se nenhuma selecionada
  useEffect(() => {
    if (!selectedOrg && orgs && orgs.length > 0) {
      setSelectedOrg(orgs[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgs]);

  const [invFormOpen, setInvFormOpen] = useState(false);
  const [dsrFormOpen, setDsrFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<LGPDInventario | null>(null);
  const [responderTarget, setResponderTarget] = useState<LGPDSolicitacao | null>(null);

  const { data: inventario, isLoading: loadInv } = useLGPDInventario(selectedOrg || undefined);
  const { data: solicitacoes, isLoading: loadDSR } = useLGPDSolicitacoes(selectedOrg || undefined);
  const excluir = useExcluirInventario();

  const abertas = (solicitacoes ?? []).filter(s => s.status === "recebida" || s.status === "em_analise");
  const vencidas = abertas.filter(s => diasRestantesDSR(s.created_at) < 0);

  return (
    <div className="space-y-6">
      {/* Seletor */}
      <div className="flex flex-wrap items-center gap-3">
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
      </div>

      {/* Alertas de DSRs vencidas */}
      {vencidas.length > 0 && (
        <Alert className="border-red-400/40 bg-red-50 dark:bg-red-900/20">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 dark:text-red-300">
            <strong>{vencidas.length}</strong> solicitação{vencidas.length > 1 ? "ões" : ""} de titular{" "}
            vencida{vencidas.length > 1 ? "s" : ""} (prazo ANPD de 15 dias úteis ultrapassado).
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="ropa">
        <TabsList className="w-full">
          <TabsTrigger value="ropa" className="flex-1">
            Inventário de Dados (ROPA)
            {inventario && <Badge variant="secondary" className="ml-2 text-xs">{inventario.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="dsr" className="flex-1">
            Solicitações de Titulares
            {abertas.length > 0 && (
              <Badge variant="destructive" className="ml-2 text-xs">{abertas.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── ROPA ── */}
        <TabsContent value="ropa" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => { setEditItem(null); setInvFormOpen(true); }} disabled={!selectedOrg}>
              <Plus className="h-4 w-4 mr-1.5" />Adicionar processo
            </Button>
          </div>

          {loadInv ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : !inventario || inventario.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-10 gap-3 text-center">
                <ShieldCheck className="h-10 w-10 text-muted-foreground" />
                <p className="text-sm font-medium">Inventário vazio</p>
                <p className="text-xs text-muted-foreground max-w-xs">
                  {selectedOrg ? "Adicione os processos de tratamento de dados pessoais." : "Selecione uma organização."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Processo</TableHead>
                    <TableHead>Base legal</TableHead>
                    <TableHead>Retenção</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventario.map(item => (
                    <TableRow key={item.id}
                      className="cursor-pointer"
                      onClick={() => { setEditItem(item); setInvFormOpen(true); }}
                    >
                      <TableCell>
                        <p className="font-medium text-sm">{item.processo}</p>
                        <p className="text-xs text-muted-foreground">{item.finalidade}</p>
                      </TableCell>
                      <TableCell className="text-sm">{BASE_LEGAL_LABEL[item.base_legal]}</TableCell>
                      <TableCell className="text-sm">
                        {item.retencao_meses ? `${item.retencao_meses} meses` : "—"}
                      </TableCell>
                      <TableCell onClick={e => e.stopPropagation()}>
                        <button
                          className="text-muted-foreground hover:text-destructive transition-colors"
                          onClick={() => window.confirm("Remover este processo?") && excluir.mutate(item.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* ── DSR ── */}
        <TabsContent value="dsr" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setDsrFormOpen(true)} disabled={!selectedOrg}>
              <Plus className="h-4 w-4 mr-1.5" />Nova solicitação
            </Button>
          </div>

          {loadDSR ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : !solicitacoes || solicitacoes.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-10 gap-3 text-center">
                <Clock className="h-10 w-10 text-muted-foreground" />
                <p className="text-sm font-medium">Nenhuma solicitação</p>
                <p className="text-xs text-muted-foreground">Titulares ainda não enviaram solicitações.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {solicitacoes.map(s => {
                const dias = diasRestantesDSR(s.created_at);
                const aberta = s.status === "recebida" || s.status === "em_analise";
                return (
                  <Card key={s.id} className={cn(
                    "transition-colors",
                    aberta && dias < 0 && "border-red-400/60",
                    aberta && dias >= 0 && dias <= 3 && "border-orange-400/60",
                  )}>
                    <CardContent className="py-3 px-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 space-y-0.5">
                          <p className="text-sm font-medium">{s.solicitante_nome}</p>
                          <p className="text-xs text-muted-foreground">{s.solicitante_email}</p>
                          <div className="flex items-center gap-2 flex-wrap mt-1">
                            <Badge variant="outline" className="text-[10px]">{DSR_TIPO_LABEL[s.tipo]}</Badge>
                            <Badge variant="outline" className={cn("text-[10px]", DSR_STATUS_COR[s.status])}>
                              {DSR_STATUS_LABEL[s.status]}
                            </Badge>
                            {aberta && (
                              <span className={cn(
                                "text-[10px] font-medium",
                                dias < 0 ? "text-red-600" : dias <= 3 ? "text-orange-600" : "text-muted-foreground"
                              )}>
                                {dias < 0 ? `${Math.abs(dias)}d vencido` : `${dias}d restantes`}
                              </span>
                            )}
                          </div>
                        </div>
                        {aberta && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setResponderTarget(s)}
                            className="shrink-0"
                          >
                            Responder
                          </Button>
                        )}
                        {!aberta && <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {selectedOrg && (
        <>
          <InventarioFormDialog
            open={invFormOpen}
            onOpenChange={v => { setInvFormOpen(v); if (!v) setEditItem(null); }}
            organizacaoId={selectedOrg}
            item={editItem}
          />
          <DSRFormDialog open={dsrFormOpen} onOpenChange={setDsrFormOpen} organizacaoId={selectedOrg} />
        </>
      )}

      <ResponderDSRDialog
        solicitacao={responderTarget}
        open={!!responderTarget}
        onOpenChange={v => { if (!v) setResponderTarget(null); }}
      />
    </div>
  );
}
