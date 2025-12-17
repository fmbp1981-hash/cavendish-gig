import { useState } from "react";
import { ConsultorLayout } from "@/components/layout/ConsultorLayout";
import { useDenuncias, useAtualizarDenuncia } from "@/hooks/useDenuncias";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Eye, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  nova: { label: "Nova", color: "bg-blue-500", icon: AlertTriangle },
  em_analise: { label: "Em Análise", color: "bg-yellow-500", icon: Clock },
  resolvida: { label: "Resolvida", color: "bg-green-500", icon: CheckCircle2 },
  arquivada: { label: "Arquivada", color: "bg-gray-500", icon: XCircle },
};

const categoriaLabels: Record<string, string> = {
  corrupcao: "Corrupção",
  fraude: "Fraude",
  assedio: "Assédio",
  discriminacao: "Discriminação",
  conflito_interesses: "Conflito de Interesses",
  seguranca_trabalho: "Segurança do Trabalho",
  meio_ambiente: "Meio Ambiente",
  outros: "Outros",
};

export default function ConsultorDenuncias() {
  const { data: denuncias, isLoading } = useDenuncias();
  const atualizarDenuncia = useAtualizarDenuncia();
  const [selectedDenuncia, setSelectedDenuncia] = useState<string | null>(null);
  const [novoStatus, setNovoStatus] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const denunciaSelecionada = denuncias?.find(d => d.id === selectedDenuncia);

  const handleAtualizar = async () => {
    if (!selectedDenuncia || !novoStatus) return;

    try {
      await atualizarDenuncia.mutateAsync({
        id: selectedDenuncia,
        status: novoStatus,
        observacoes_internas: observacoes,
      });
      toast.success("Denúncia atualizada com sucesso");
      setSelectedDenuncia(null);
      setNovoStatus("");
      setObservacoes("");
    } catch {
      toast.error("Erro ao atualizar denúncia");
    }
  };

  const stats = {
    total: denuncias?.length || 0,
    novas: denuncias?.filter(d => d.status === "nova").length || 0,
    emAnalise: denuncias?.filter(d => d.status === "em_analise").length || 0,
    resolvidas: denuncias?.filter(d => d.status === "resolvida").length || 0,
  };

  return (
    <ConsultorLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Canal de Denúncias</h1>
          <p className="text-muted-foreground">Gerencie as denúncias recebidas de forma anônima</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-500">{stats.novas}</div>
              <div className="text-sm text-muted-foreground">Novas</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-500">{stats.emAnalise}</div>
              <div className="text-sm text-muted-foreground">Em Análise</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-500">{stats.resolvidas}</div>
              <div className="text-sm text-muted-foreground">Resolvidas</div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Denúncias */}
        <Card>
          <CardHeader>
            <CardTitle>Denúncias Recebidas</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : denuncias?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma denúncia registrada
              </div>
            ) : (
              <div className="space-y-4">
                {denuncias?.map((denuncia) => {
                  const config = statusConfig[denuncia.status] || statusConfig.nova;
                  const StatusIcon = config.icon;
                  return (
                    <div
                      key={denuncia.id}
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded">
                              {denuncia.ticket_id}
                            </code>
                            <Badge variant="outline" className="text-xs">
                              {categoriaLabels[denuncia.categoria] || denuncia.categoria}
                            </Badge>
                            <Badge className={`${config.color} text-white text-xs`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {config.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {denuncia.descricao}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>
                              Recebida em {format(new Date(denuncia.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </span>
                            {denuncia.data_ocorrido && (
                              <span>
                                Ocorrido em {format(new Date(denuncia.data_ocorrido), "dd/MM/yyyy", { locale: ptBR })}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedDenuncia(denuncia.id);
                            setNovoStatus(denuncia.status);
                            setObservacoes(denuncia.observacoes_internas || "");
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de Detalhes */}
        <Dialog open={!!selectedDenuncia} onOpenChange={(open) => !open && setSelectedDenuncia(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Denúncia {denunciaSelecionada?.ticket_id}
              </DialogTitle>
            </DialogHeader>
            
            {denunciaSelecionada && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Categoria</div>
                    <div className="font-medium">
                      {categoriaLabels[denunciaSelecionada.categoria] || denunciaSelecionada.categoria}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Data do Ocorrido</div>
                    <div className="font-medium">
                      {denunciaSelecionada.data_ocorrido 
                        ? format(new Date(denunciaSelecionada.data_ocorrido), "dd/MM/yyyy", { locale: ptBR })
                        : "Não informada"}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-muted-foreground mb-1">Descrição</div>
                  <div className="bg-muted/50 rounded-lg p-3 text-sm whitespace-pre-wrap">
                    {denunciaSelecionada.descricao}
                  </div>
                </div>

                {denunciaSelecionada.envolvidos && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Envolvidos</div>
                    <div className="bg-muted/50 rounded-lg p-3 text-sm">
                      {denunciaSelecionada.envolvidos}
                    </div>
                  </div>
                )}

                <div className="border-t pt-4 space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Status</div>
                    <Select value={novoStatus} onValueChange={setNovoStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nova">Nova</SelectItem>
                        <SelectItem value="em_analise">Em Análise</SelectItem>
                        <SelectItem value="resolvida">Resolvida</SelectItem>
                        <SelectItem value="arquivada">Arquivada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Observações Internas</div>
                    <Textarea
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      placeholder="Notas internas sobre a análise..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedDenuncia(null)}>
                Cancelar
              </Button>
              <Button onClick={handleAtualizar} disabled={atualizarDenuncia.isPending}>
                {atualizarDenuncia.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Salvar Alterações
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ConsultorLayout>
  );
}
