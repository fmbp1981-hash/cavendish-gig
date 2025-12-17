import { AdminLayout } from "@/components/layout/AdminLayout";
import { useRelatorioEnvios } from "@/hooks/useRelatorioEnvios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Mail, Send, RefreshCw, CheckCircle, XCircle, Clock, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function HistoricoRelatorios() {
  const {
    relatorios,
    isLoading,
    isEnviando,
    enviarRelatoriosManual,
    formatarStatus,
    getStatusColor,
    formatarPeriodo,
    getEstatisticas,
  } = useRelatorioEnvios();

  const stats = getEstatisticas();

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Histórico de Relatórios
            </h1>
            <p className="text-muted-foreground">
              Envios automáticos de relatórios mensais por email
            </p>
          </div>
          <Button
            onClick={() => enviarRelatoriosManual()}
            disabled={isEnviando}
          >
            {isEnviando ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Enviar Agora
              </>
            )}
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total de Envios</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Enviados</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats.enviados}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {stats.pendentes}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.taxaSucesso}%</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Envios</CardTitle>
            <CardDescription>
              Últimos 100 relatórios enviados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : relatorios && relatorios.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Organização</TableHead>
                      <TableHead>Período</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Métricas</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {relatorios.map((relatorio) => (
                      <TableRow key={relatorio.id}>
                        <TableCell className="font-medium">
                          {relatorio.organizacao_nome || "N/A"}
                        </TableCell>
                        <TableCell>
                          {formatarPeriodo(
                            relatorio.mes_referencia,
                            relatorio.ano_referencia
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {relatorio.email_destinatario}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(relatorio.status)}>
                            {formatarStatus(relatorio.status)}
                          </Badge>
                          {relatorio.tentativas > 0 && relatorio.status !== "sent" && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({relatorio.tentativas} tentativas)
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {relatorio.status === "sent" ? (
                            <div className="text-xs space-y-1">
                              <div>
                                📄 {relatorio.documentos_aprovados || 0}/
                                {relatorio.total_documentos || 0} docs
                              </div>
                              <div>
                                ✅ {relatorio.tarefas_concluidas || 0}/
                                {relatorio.total_tarefas || 0} tarefas
                              </div>
                              {relatorio.progresso_projeto !== undefined && (
                                <div>
                                  📊 {relatorio.progresso_projeto.toFixed(0)}%
                                  progresso
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {relatorio.enviado_em ? (
                              <>
                                <CheckCircle className="h-3 w-3 inline mr-1 text-green-600" />
                                {format(
                                  new Date(relatorio.enviado_em),
                                  "dd/MM/yyyy HH:mm",
                                  { locale: ptBR }
                                )}
                              </>
                            ) : relatorio.status === "failed" ? (
                              <>
                                <XCircle className="h-3 w-3 inline mr-1 text-red-600" />
                                {format(
                                  new Date(relatorio.created_at),
                                  "dd/MM/yyyy HH:mm",
                                  { locale: ptBR }
                                )}
                              </>
                            ) : (
                              <>
                                <Clock className="h-3 w-3 inline mr-1 text-yellow-600" />
                                {format(
                                  new Date(relatorio.created_at),
                                  "dd/MM/yyyy HH:mm",
                                  { locale: ptBR }
                                )}
                              </>
                            )}
                          </div>
                          {relatorio.ultimo_erro && (
                            <div className="text-xs text-red-600 mt-1">
                              {relatorio.ultimo_erro}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">Nenhum relatório encontrado</h3>
                <p className="text-muted-foreground mt-2">
                  Os relatórios enviados aparecerão aqui.
                </p>
                <Button
                  onClick={() => enviarRelatoriosManual()}
                  className="mt-4"
                  disabled={isEnviando}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Primeiro Relatório
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Como funciona
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              • Os relatórios são enviados <strong>automaticamente todo dia 1 de cada mês às 08:00</strong>
            </p>
            <p>
              • Inclui métricas do mês anterior: documentos, tarefas e progresso do projeto
            </p>
            <p>
              • Apenas organizações <strong>ativas</strong> com email cadastrado recebem
            </p>
            <p>
              • Em caso de falha, o sistema tenta reenviar até <strong>3 vezes</strong>
            </p>
            <p>
              • Você também pode <strong>enviar manualmente</strong> clicando no botão "Enviar Agora"
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
