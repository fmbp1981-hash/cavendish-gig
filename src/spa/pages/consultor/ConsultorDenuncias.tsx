import { useState } from "react";
import { ConsultorLayout } from "@/components/layout/ConsultorLayout";
import { useDenuncias, useAtualizarDenuncia, useDenunciasKPIs, Denuncia } from "@/hooks/useDenuncias";
import {
  useInvestigacaoPorDenuncia,
  useAbrirInvestigacao,
  useTriagemIA,
  Investigacao,
} from "@/hooks/useInvestigacoes";
import { InvestigacaoDrawer } from "@/components/denuncias/InvestigacaoDrawer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertTriangle, Eye, Clock, CheckCircle2, XCircle,
  Loader2, Search, FileText, Zap, ShieldAlert, ShieldCheck, ShieldOff,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  nova:       { label: "Nova",       color: "bg-blue-500",   icon: AlertTriangle },
  em_analise: { label: "Em Análise", color: "bg-yellow-500", icon: Clock },
  resolvida:  { label: "Resolvida",  color: "bg-green-500",  icon: CheckCircle2 },
  arquivada:  { label: "Arquivada",  color: "bg-gray-500",   icon: XCircle },
};

const categoriaLabels: Record<string, string> = {
  corrupcao:           "Corrupção",
  fraude:              "Fraude",
  assedio:             "Assédio",
  discriminacao:       "Discriminação",
  conflito_interesses: "Conflito de Interesses",
  seguranca_trabalho:  "Segurança do Trabalho",
  meio_ambiente:       "Meio Ambiente",
  outros:              "Outros",
};

// ─── Row com botão de investigação ────────────────────────────────────────────

function DenunciaRow({
  denuncia,
  onVerDetalhes,
  onAbrirInvestigacao,
}: {
  denuncia: Denuncia;
  onVerDetalhes: () => void;
  onAbrirInvestigacao: () => void;
}) {
  const { data: inv } = useInvestigacaoPorDenuncia(denuncia.id);
  const triagemIA = useTriagemIA();
  const config = statusConfig[denuncia.status] ?? statusConfig.nova;
  const StatusIcon = config.icon;

  const semTriagem = inv && !inv.categoria_triagem;

  const handleTriagemIA = () => {
    if (!inv) return;
    triagemIA.mutate({ investigacaoId: inv.id, descricao: denuncia.descricao });
  };

  return (
    <div className="border rounded-lg p-4 hover:bg-muted/40 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded">{denuncia.ticket_id}</code>
            <Badge variant="outline" className="text-xs">
              {categoriaLabels[denuncia.categoria] ?? denuncia.categoria}
            </Badge>
            <Badge className={`${config.color} text-white text-xs`}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {config.label}
            </Badge>
            {(denuncia as any).nivel_risco && (
              <Badge variant="outline" className={cn(
                "text-xs",
                (denuncia as any).nivel_risco === "critico" ? "text-red-700 border-red-400" :
                (denuncia as any).nivel_risco === "alto"    ? "text-orange-700 border-orange-400" :
                "text-yellow-700 border-yellow-400"
              )}>
                {(denuncia as any).nivel_risco}
              </Badge>
            )}
            {inv && (
              <Badge variant="outline" className="text-xs text-purple-700 border-purple-400">
                Investigação: {inv.status}
              </Badge>
            )}
            {inv?.categoria_triagem && (
              <Badge variant="outline" className="text-xs text-blue-700 border-blue-400">
                IA: {inv.categoria_triagem}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">{denuncia.descricao}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {format(new Date(denuncia.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          <Button variant="outline" size="sm" onClick={onVerDetalhes}>
            <Eye className="h-4 w-4 mr-1" />Ver
          </Button>
          {inv ? (
            <Button variant="outline" size="sm" onClick={onAbrirInvestigacao} className="text-purple-700 border-purple-400 hover:bg-purple-50">
              <Search className="h-4 w-4 mr-1" />Investigar
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={onAbrirInvestigacao}>
              <FileText className="h-4 w-4 mr-1" />Abrir Inv.
            </Button>
          )}
          {semTriagem && (
            <Button
              variant="outline"
              size="sm"
              className="text-amber-700 border-amber-400 hover:bg-amber-50"
              onClick={handleTriagemIA}
              disabled={triagemIA.isPending}
            >
              {triagemIA.isPending
                ? <Loader2 className="h-3 w-3 animate-spin mr-1" />
                : <Zap className="h-3 w-3 mr-1" />}
              Triagem IA
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ConsultorDenuncias() {
  const { data: denuncias, isLoading } = useDenuncias();
  const { data: kpis } = useDenunciasKPIs();
  const atualizarDenuncia = useAtualizarDenuncia();
  const abrirInvestigacao = useAbrirInvestigacao();

  const [selectedDenunciaId, setSelectedDenunciaId] = useState<string | null>(null);
  const [investigacaoTarget, setInvestigacaoTarget] = useState<Investigacao | null>(null);
  const [invDenunciaId, setInvDenunciaId] = useState<string | null>(null);
  const [novoStatus, setNovoStatus] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const denunciaSelecionada = denuncias?.find(d => d.id === selectedDenunciaId);

  const handleAtualizar = async () => {
    if (!selectedDenunciaId || !novoStatus) return;
    try {
      await atualizarDenuncia.mutateAsync({ id: selectedDenunciaId, status: novoStatus, observacoes_internas: observacoes });
      toast.success("Denúncia atualizada!");
      setSelectedDenunciaId(null);
    } catch { toast.error("Erro ao atualizar denúncia"); }
  };

  const handleAbrirInvestigacao = async (denunciaId: string) => {
    // Tenta buscar investigação existente
    const inv = await abrirInvestigacao.mutateAsync({ denunciaId }).catch(() => null);
    // Após abrir, o drawer ficará disponível via query
  };

  return (
    <ConsultorLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Canal de Denúncias</h1>
          <p className="text-muted-foreground">Gerencie as denúncias e investigações formais</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                <div className="text-2xl font-bold">{kpis?.total ?? denuncias?.length ?? 0}</div>
              </div>
              <div className="text-sm text-muted-foreground">Total de Denúncias</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <ShieldAlert className="h-4 w-4 text-yellow-500" />
                <div className="text-2xl font-bold text-yellow-500">{kpis?.emInvestigacao ?? 0}</div>
              </div>
              <div className="text-sm text-muted-foreground">Em Investigação</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="h-4 w-4 text-green-500" />
                <div className="text-2xl font-bold text-green-500">{kpis?.resolvidas ?? 0}</div>
              </div>
              <div className="text-sm text-muted-foreground">Resolvidas</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <ShieldOff className="h-4 w-4 text-slate-400" />
                <div className="text-2xl font-bold text-slate-500">{kpis?.semInvestigacao ?? 0}</div>
              </div>
              <div className="text-sm text-muted-foreground">Sem Investigação</div>
            </CardContent>
          </Card>
        </div>

        {/* Lista */}
        <Card>
          <CardHeader>
            <CardTitle>Denúncias Recebidas</CardTitle>
            <CardDescription>
              Clique em "Abrir Inv." para iniciar uma investigação formal. Clique em "Investigar" para continuar uma já aberta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : !denuncias?.length ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Nenhuma denúncia registrada
              </div>
            ) : (
              <div className="space-y-3">
                {denuncias.map(d => (
                  <DenunciaRow
                    key={d.id}
                    denuncia={d}
                    onVerDetalhes={() => {
                      setSelectedDenunciaId(d.id);
                      setNovoStatus(d.status);
                      setObservacoes(d.observacoes_internas ?? "");
                    }}
                    onAbrirInvestigacao={() => setInvDenunciaId(d.id)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal detalhes/status */}
        <Dialog open={!!selectedDenunciaId} onOpenChange={open => !open && setSelectedDenunciaId(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Denúncia {denunciaSelecionada?.ticket_id}</DialogTitle>
            </DialogHeader>
            {denunciaSelecionada && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Categoria</p>
                    <p className="font-medium">{categoriaLabels[denunciaSelecionada.categoria] ?? denunciaSelecionada.categoria}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Data do ocorrido</p>
                    <p className="font-medium">
                      {denunciaSelecionada.data_ocorrido
                        ? format(new Date(denunciaSelecionada.data_ocorrido), "dd/MM/yyyy", { locale: ptBR })
                        : "Não informada"}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Descrição</p>
                  <div className="bg-muted/50 rounded-lg p-3 text-sm whitespace-pre-wrap">{denunciaSelecionada.descricao}</div>
                </div>
                {denunciaSelecionada.envolvidos && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Envolvidos</p>
                    <div className="bg-muted/50 rounded-lg p-3 text-sm">{denunciaSelecionada.envolvidos}</div>
                  </div>
                )}
                <div className="border-t pt-4 space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1.5">Status</p>
                    <Select value={novoStatus} onValueChange={setNovoStatus}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nova">Nova</SelectItem>
                        <SelectItem value="em_analise">Em Análise</SelectItem>
                        <SelectItem value="resolvida">Resolvida</SelectItem>
                        <SelectItem value="arquivada">Arquivada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1.5">Observações internas</p>
                    <Textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} placeholder="Notas internas..." rows={3} />
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedDenunciaId(null)}>Cancelar</Button>
              <Button onClick={handleAtualizar} disabled={atualizarDenuncia.isPending}>
                {atualizarDenuncia.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Investigação Drawer */}
        {invDenunciaId && (
          <InvestigacaoDrawerWrapper
            denunciaId={invDenunciaId}
            onClose={() => setInvDenunciaId(null)}
          />
        )}
      </div>
    </ConsultorLayout>
  );
}

// Wrapper que busca investigação e abre drawer ou abre nova
function InvestigacaoDrawerWrapper({ denunciaId, onClose }: { denunciaId: string; onClose: () => void }) {
  const { data: inv, isLoading } = useInvestigacaoPorDenuncia(denunciaId);
  const abrirInvestigacao = useAbrirInvestigacao();

  if (isLoading) return null;

  if (!inv) {
    // Abre nova investigação automaticamente ao abrir drawer
    abrirInvestigacao.mutate({ denunciaId });
    return null;
  }

  return <InvestigacaoDrawer investigacao={inv} onClose={onClose} />;
}
