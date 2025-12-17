import { useState } from "react";
import { ConsultorLayout } from "@/components/layout/ConsultorLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOrganizacoes } from "@/hooks/useConsultorData";
import { useRelatorioMensal, ReportData } from "@/hooks/useRelatorioMensal";
import { 
  FileText, 
  Download, 
  Building2, 
  ClipboardCheck, 
  GraduationCap, 
  ScrollText,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  RefreshCw
} from "lucide-react";

function getNivelMaturidadeLabel(nivel: string | null): string {
  const labels: Record<string, string> = {
    inexistente: "Inexistente",
    inicial: "Inicial",
    basico: "Básico",
    intermediario: "Intermediário",
    avancado: "Avançado",
    excelencia: "Excelência",
  };
  return nivel ? labels[nivel] || nivel : "Não avaliado";
}

function getNivelMaturidadeColor(nivel: string | null): string {
  const colors: Record<string, string> = {
    inexistente: "bg-destructive text-destructive-foreground",
    inicial: "bg-orange-500 text-white",
    basico: "bg-amber-500 text-white",
    intermediario: "bg-blue-500 text-white",
    avancado: "bg-emerald-500 text-white",
    excelencia: "bg-primary text-primary-foreground",
  };
  return nivel ? colors[nivel] || "bg-muted text-muted-foreground" : "bg-muted text-muted-foreground";
}

function ReportDashboard({ data }: { data: ReportData }) {
  return (
    <div className="space-y-6">
      {/* Organization Header */}
      <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <CardHeader>
          <CardTitle className="text-xl">{data.organizacao.nome}</CardTitle>
          <CardDescription className="text-primary-foreground/80">
            {data.organizacao.cnpj && `CNPJ: ${data.organizacao.cnpj} | `}
            Projeto: {data.projeto.nome} | Período: {data.periodo}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Documents */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Documentos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.documentos.aprovados}/{data.documentos.total}</div>
            <Progress value={data.documentos.percentual_aprovado} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {data.documentos.percentual_aprovado.toFixed(1)}% aprovados
            </p>
          </CardContent>
        </Card>

        {/* Diagnostico */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Diagnóstico</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {data.diagnostico ? (
              <>
                <div className="text-2xl font-bold">{data.diagnostico.score_geral?.toFixed(1) || 0}%</div>
                <Badge className={`mt-2 ${getNivelMaturidadeColor(data.diagnostico.nivel_maturidade)}`}>
                  {getNivelMaturidadeLabel(data.diagnostico.nivel_maturidade)}
                </Badge>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Não iniciado</p>
            )}
          </CardContent>
        </Card>

        {/* Ethics Adherence */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Código de Ética</CardTitle>
            <ScrollText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.adesoes_etica.total_adesoes}/{data.adesoes_etica.total_membros}</div>
            <Progress value={data.adesoes_etica.percentual_adesao} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {data.adesoes_etica.percentual_adesao.toFixed(1)}% adesão
            </p>
          </CardContent>
        </Card>

        {/* Trainings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Treinamentos</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.treinamentos.total_concluidos}/{data.treinamentos.total_obrigatorios}</div>
            <Progress value={data.treinamentos.percentual_conclusao} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {data.treinamentos.percentual_conclusao.toFixed(1)}% concluídos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Diagnostico Details */}
      {data.diagnostico && data.diagnostico.status === "concluido" && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Dimension Scores */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Scores por Dimensão
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Estrutura Societária", value: data.diagnostico.scores.estrutura_societaria },
                { label: "Governança", value: data.diagnostico.scores.governanca },
                { label: "Compliance", value: data.diagnostico.scores.compliance },
                { label: "Gestão", value: data.diagnostico.scores.gestao },
                { label: "Planejamento", value: data.diagnostico.scores.planejamento },
              ].map((item) => (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{item.label}</span>
                    <span className="font-medium">{item.value?.toFixed(1) || 0}%</span>
                  </div>
                  <Progress value={item.value || 0} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Strong Points & Attention */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Análise</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.diagnostico.pontos_fortes && data.diagnostico.pontos_fortes.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium flex items-center gap-2 text-emerald-600 mb-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Pontos Fortes
                  </h4>
                  <ul className="space-y-1">
                    {data.diagnostico.pontos_fortes.map((p, i) => (
                      <li key={i} className="text-sm text-muted-foreground bg-emerald-50 dark:bg-emerald-950/30 p-2 rounded">
                        ✓ {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {data.diagnostico.pontos_atencao && data.diagnostico.pontos_atencao.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium flex items-center gap-2 text-amber-600 mb-2">
                    <AlertTriangle className="h-4 w-4" />
                    Pontos de Atenção
                  </h4>
                  <ul className="space-y-1">
                    {data.diagnostico.pontos_atencao.map((p, i) => (
                      <li key={i} className="text-sm text-muted-foreground bg-amber-50 dark:bg-amber-950/30 p-2 rounded">
                        ⚠ {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Document Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Detalhamento de Documentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{data.documentos.total}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
              <div className="text-2xl font-bold text-emerald-600">{data.documentos.aprovados}</div>
              <div className="text-xs text-muted-foreground">Aprovados</div>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{data.documentos.enviados}</div>
              <div className="text-xs text-muted-foreground">Enviados</div>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
              <div className="text-2xl font-bold text-amber-600">{data.documentos.pendentes}</div>
              <div className="text-xs text-muted-foreground">Pendentes</div>
            </div>
            <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{data.documentos.rejeitados}</div>
              <div className="text-xs text-muted-foreground">Rejeitados</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <p className="text-xs text-muted-foreground text-center">
        Relatório gerado em {data.gerado_em}
      </p>
    </div>
  );
}

export default function ConsultorRelatorios() {
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const { data: organizacoes, isLoading: loadingOrgs } = useOrganizacoes();
  const { isLoading, reportData, fetchReportData, downloadPDF } = useRelatorioMensal();

  const handleSelectOrganization = async (orgId: string) => {
    setSelectedOrgId(orgId);
    await fetchReportData(orgId);
  };

  const handleDownloadPDF = () => {
    if (selectedOrgId && reportData) {
      downloadPDF(selectedOrgId, reportData.organizacao.nome);
    }
  };

  const handleRefresh = () => {
    if (selectedOrgId) {
      fetchReportData(selectedOrgId);
    }
  };

  return (
    <ConsultorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Relatórios Mensais</h1>
            <p className="text-muted-foreground">Dashboard de governança por organização</p>
          </div>
          <div className="flex items-center gap-2">
            {loadingOrgs ? (
              <Skeleton className="h-10 w-[250px]" />
            ) : (
              <Select value={selectedOrgId} onValueChange={handleSelectOrganization}>
                <SelectTrigger className="w-[250px]">
                  <Building2 className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Selecione uma organização" />
                </SelectTrigger>
                <SelectContent>
                  {organizacoes?.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {selectedOrgId && (
              <>
                <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
                <Button onClick={handleDownloadPDF} disabled={isLoading || !reportData}>
                  <Download className="h-4 w-4 mr-2" />
                  Baixar PDF
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        {!selectedOrgId ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                Selecione uma organização para visualizar o relatório mensal de governança.
              </p>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <div className="grid gap-4 md:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        ) : reportData ? (
          <ReportDashboard data={reportData} />
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
              <p className="text-muted-foreground text-center">
                Não foi possível carregar os dados do relatório.
              </p>
              <Button variant="outline" onClick={handleRefresh} className="mt-4">
                Tentar novamente
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </ConsultorLayout>
  );
}
