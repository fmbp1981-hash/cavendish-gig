import { useState } from "react";
import { ConsultorLayout } from "@/components/layout/ConsultorLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  AlertTriangle,
  ShieldCheck,
  Scale,
  ClipboardList,
  TrendingUp,
  Shield,
  Search,
  FileText,
  ExternalLink,
  CheckCircle2,
  Clock,
  FileCheck,
  BookMarked,
  AlertCircle,
} from "lucide-react";
// Módulos Fase 1
import { RiscosTab } from "@/components/riscos/RiscosTab";
import { PoliticasTab } from "@/components/politicas/PoliticasTab";
import { ConflitosTab } from "@/components/conflitos/ConflitosTab";
import { LGPDTab } from "@/components/lgpd/LGPDTab";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  useDocumentosAnalytics,
  useProjetosAnalytics,
  useTarefasTimeline,
  useTreinamentosAnalytics,
} from "@/hooks/useAnalyticsData";

// ─── Tab definitions ──────────────────────────────────────────────────────────

const tabs = [
  { id: "politicas",      label: "Políticas",            icon: BookOpen,      title: "Políticas Corporativas",       description: "Gestão de políticas corporativas internas e externas da organização." },
  { id: "conflitos",      label: "Conflito de Interesses", icon: AlertTriangle, title: "Conflito de Interesses",      description: "Declarações e gestão de conflitos de interesse dos colaboradores e parceiros." },
  { id: "lgpd",           label: "LGPD",                 icon: ShieldCheck,   title: "LGPD",                         description: "Adequação à Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018)." },
  { id: "riscos",         label: "Riscos",               icon: Scale,         title: "Gestão de Riscos",             description: "Mapeamento, avaliação e mitigação de riscos corporativos." },
  { id: "due-diligence",  label: "Due Diligence",        icon: ClipboardList, title: "Due Diligence",                description: "Análise aprofundada de fornecedores e parceiros antes de firmar contratos ou parcerias. Levanta riscos jurídicos, financeiros e de reputação." },
  { id: "kpis",           label: "KPIs",                 icon: TrendingUp,    title: "KPIs de Compliance",           description: "Indicadores de performance e métricas do programa de compliance." },
  { id: "incidentes",     label: "Incidentes",           icon: Shield,        title: "Incidentes",                   description: "Registro, investigação e gestão de incidentes de compliance." },
  { id: "auditoria",      label: "Auditoria",            icon: Search,        title: "Auditoria Interna",            description: "Auditorias internas, não conformidades e planos de ação corretiva." },
  { id: "relatorios-reg", label: "Rel. Regulatórios",    icon: FileText,      title: "Relatórios Regulatórios",      description: "Relatórios obrigatórios para órgãos reguladores: CGU, CVM, BACEN, ANPD e outros." },
  { id: "ceis",           label: "Consulta CEIS",        icon: ExternalLink,  title: "Consulta CEIS",                description: "Consulta ao Cadastro de Empresas Inidôneas e Suspensas — impedimentos legais para contratar com o poder público." },
];

const TABS_WITH_CONTENT = new Set(["kpis", "ceis", "riscos", "politicas", "conflitos", "lgpd"]);

// ─── Placeholder (apenas para abas ainda não implementadas) ──────────────────

function PlaceholderTab({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
      <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
        <TrendingUp className="h-8 w-8 text-muted-foreground" />
      </div>
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-md mt-1">{description}</p>
      </div>
      <Badge variant="outline" className="text-amber-700 border-amber-500/40 bg-amber-50">
        Em desenvolvimento
      </Badge>
    </div>
  );
}

// ─── KPIs ─────────────────────────────────────────────────────────────────────

const PIE_COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];
const STATUS_COLORS: Record<string, string> = {
  Aprovado: "#22c55e",
  Enviado: "#3b82f6",
  "Em Análise": "#f59e0b",
  Pendente: "#94a3b8",
  Rejeitado: "#ef4444",
};

function KPICard({
  icon: Icon,
  label,
  value,
  sub,
  color = "bg-primary/10",
  iconColor = "text-primary",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  iconColor?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start gap-4">
          <div className={`h-11 w-11 rounded-xl ${color} flex items-center justify-center shrink-0`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-bold leading-none">{value}</p>
            <p className="text-sm text-muted-foreground mt-1">{label}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function KPIsTab() {
  const { data: docData, isLoading: loadingDocs } = useDocumentosAnalytics();
  const { data: projData, isLoading: loadingProj } = useProjetosAnalytics();
  const { data: tarefasData, isLoading: loadingTarefas } = useTarefasTimeline();
  const { data: treinData, isLoading: loadingTrein } = useTreinamentosAnalytics();

  // Computed KPI values
  const totalDocs   = docData?.reduce((s, d) => s + d.value, 0) ?? 0;
  const aprovados   = docData?.find(d => d.status === "aprovado")?.value ?? 0;
  const pendentes   = docData?.find(d => d.status === "pendente")?.value ?? 0;
  const emAnalise   = docData?.find(d => d.status === "em_analise")?.value ?? 0;
  const conformidade = totalDocs > 0 ? Math.round((aprovados / totalDocs) * 100) : 0;
  const entrega     = totalDocs > 0 ? Math.round(((totalDocs - pendentes) / totalDocs) * 100) : 0;

  const totalTarefas     = tarefasData?.reduce((s, d) => s + d.concluidas + d.pendentes, 0) ?? 0;
  const tarefasConcluidas = tarefasData?.reduce((s, d) => s + d.concluidas, 0) ?? 0;
  const taxaTarefas = totalTarefas > 0 ? Math.round((tarefasConcluidas / totalTarefas) * 100) : 0;

  const totalOrgs = treinData?.length ?? 0;
  const taxaMediaTrein = treinData?.length
    ? Math.round(treinData.reduce((s, o) => s + o.taxa, 0) / treinData.length)
    : 0;

  // Sparkline data — last 7 days of tasks
  const sparkline = tarefasData?.slice(-7) ?? [];

  const isLoading = loadingDocs || loadingProj || loadingTarefas || loadingTrein;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-64" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          icon={CheckCircle2}
          label="Índice de Conformidade"
          value={`${conformidade}%`}
          sub={`${aprovados} de ${totalDocs} documentos aprovados`}
          color="bg-green-100 dark:bg-green-900/30"
          iconColor="text-green-600 dark:text-green-400"
        />
        <KPICard
          icon={FileCheck}
          label="Taxa de Entrega"
          value={`${entrega}%`}
          sub={`${pendentes} doc${pendentes !== 1 ? "s" : ""} pendente${pendentes !== 1 ? "s" : ""} de envio`}
          color="bg-blue-100 dark:bg-blue-900/30"
          iconColor="text-blue-600 dark:text-blue-400"
        />
        <KPICard
          icon={Clock}
          label="Tarefas Concluídas (30d)"
          value={`${taxaTarefas}%`}
          sub={`${tarefasConcluidas} de ${totalTarefas} tarefas no período`}
          color="bg-amber-100 dark:bg-amber-900/30"
          iconColor="text-amber-600 dark:text-amber-400"
        />
        <KPICard
          icon={BookMarked}
          label="Conclusão de Treinamentos"
          value={`${taxaMediaTrein}%`}
          sub={`Média entre ${totalOrgs} organizaç${totalOrgs !== 1 ? "ões" : "ão"}`}
          color="bg-purple-100 dark:bg-purple-900/30"
          iconColor="text-purple-600 dark:text-purple-400"
        />
      </div>

      {/* Documentos + Projetos */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Documentos por status — Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Documentos por Status</CardTitle>
            <CardDescription>Distribuição atual de todos os documentos</CardDescription>
          </CardHeader>
          <CardContent>
            {docData && docData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={docData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {docData.map((entry, index) => (
                      <Cell
                        key={entry.status}
                        fill={STATUS_COLORS[entry.name] ?? PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number, n: string) => [v, n]} />
                  <Legend iconType="circle" iconSize={10} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                <AlertCircle className="h-4 w-4 mr-2" />
                Sem dados
              </div>
            )}
          </CardContent>
        </Card>

        {/* Projetos por fase — Bar */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Projetos por Fase</CardTitle>
            <CardDescription>Diagnóstico · Implementação · Recorrência</CardDescription>
          </CardHeader>
          <CardContent>
            {projData && projData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={projData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" name="Projetos" radius={[4, 4, 0, 0]} fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                <AlertCircle className="h-4 w-4 mr-2" />
                Sem dados
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tarefas + Treinamentos */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Linha do tempo de tarefas — Line */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Atividade de Tarefas (30 dias)</CardTitle>
            <CardDescription>Tarefas concluídas vs pendentes por dia</CardDescription>
          </CardHeader>
          <CardContent>
            {sparkline && sparkline.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={sparkline} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v: string) => v.slice(5)} // MM-DD
                  />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip labelFormatter={(v: string) => v} />
                  <Line type="monotone" dataKey="concluidas" name="Concluídas" stroke="#22c55e" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="pendentes"  name="Pendentes"  stroke="#f59e0b" strokeWidth={2} dot={false} />
                  <Legend iconType="line" iconSize={16} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                <AlertCircle className="h-4 w-4 mr-2" />
                Sem dados nos últimos 30 dias
              </div>
            )}
          </CardContent>
        </Card>

        {/* Treinamentos por organização — Bar horizontal */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Treinamentos por Organização</CardTitle>
            <CardDescription>Taxa de conclusão (%) por cliente</CardDescription>
          </CardHeader>
          <CardContent>
            {treinData && treinData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={treinData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => [`${v}%`, "Conclusão"]} />
                  <Bar dataKey="taxa" name="Conclusão" radius={[0, 4, 4, 0]} fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                <AlertCircle className="h-4 w-4 mr-2" />
                Sem dados de treinamentos
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alertas de conformidade */}
      {(pendentes > 0 || emAnalise > 0) && (
        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <CardTitle className="text-base text-amber-700 dark:text-amber-400">Pontos de Atenção</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendentes > 0 && (
              <div className="flex items-center justify-between rounded-lg bg-amber-50 dark:bg-amber-900/20 px-4 py-2.5">
                <span className="text-sm text-amber-800 dark:text-amber-300">
                  <strong>{pendentes}</strong> documento{pendentes !== 1 ? "s" : ""} pendente{pendentes !== 1 ? "s" : ""} de envio pelos clientes
                </span>
                <Badge variant="outline" className="text-amber-700 border-amber-500 shrink-0 ml-3">Pendente</Badge>
              </div>
            )}
            {emAnalise > 0 && (
              <div className="flex items-center justify-between rounded-lg bg-blue-50 dark:bg-blue-900/20 px-4 py-2.5">
                <span className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>{emAnalise}</strong> documento{emAnalise !== 1 ? "s" : ""} aguardando sua análise
                </span>
                <Badge variant="outline" className="text-blue-700 border-blue-500 shrink-0 ml-3">Em Análise</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── CEIS ─────────────────────────────────────────────────────────────────────

function CEISTab() {
  const [cnpj, setCnpj] = useState("");

  const formatCNPJ = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 14);
    return digits
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  };

  const handleConsultar = () => {
    const digits = cnpj.replace(/\D/g, "");
    const url = `https://portaltransparencia.gov.br/sancoes/ceis?cpfCnpj=${digits}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5 text-primary" />
            Consulta CEIS — Portal da Transparência
          </CardTitle>
          <CardDescription>
            O CEIS (Cadastro de Empresas Inidôneas e Suspensas) é um banco de dados público do
            governo federal que registra empresas e pessoas físicas impedidas de contratar com a
            administração pública. Fundamental para due diligence antes de firmar parcerias.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder="CNPJ (00.000.000/0000-00)"
                value={cnpj}
                onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
                maxLength={18}
              />
            </div>
            <Button onClick={handleConsultar} disabled={cnpj.replace(/\D/g, "").length < 14}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Consultar no Portal
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            A consulta abre o Portal da Transparência do Governo Federal em uma nova aba.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">O que é o CEIS?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            O <strong className="text-foreground">CEIS</strong> é mantido pela Controladoria-Geral
            da União (CGU) e lista empresas e pessoas que receberam sanções administrativas que as
            impedem, temporária ou definitivamente, de participar de licitações ou celebrar
            contratos com o poder público.
          </p>
          <p>
            Uma empresa presente no CEIS representa um risco significativo para o seu cliente:{" "}
            <strong className="text-foreground">contratos com entidades sancionadas podem ser
            anulados</strong> e gerar responsabilidade solidária.
          </p>
          <div className="grid sm:grid-cols-3 gap-3 mt-4">
            {[
              { label: "CGU",  desc: "Controladoria-Geral da União — mantém o cadastro" },
              { label: "TCU",  desc: "Tribunal de Contas da União — sanções de inidoneidade" },
              { label: "ANPD", desc: "Agência Nacional de Proteção de Dados — infrações LGPD" },
            ].map((item) => (
              <div key={item.label} className="rounded-lg bg-muted p-3">
                <p className="font-medium text-foreground text-xs">{item.label}</p>
                <p className="text-xs mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ConsultorCompliance() {
  return (
    <ConsultorLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Compliance</h1>
          <p className="text-muted-foreground">
            Gestão integrada do programa de compliance corporativo
          </p>
        </div>

        <Tabs defaultValue="kpis">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-muted p-1 rounded-lg w-full">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5"
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {tabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="mt-6">
              {tab.id === "kpis" ? (
                <KPIsTab />
              ) : tab.id === "ceis" ? (
                <CEISTab />
              ) : tab.id === "riscos" ? (
                <RiscosTab />
              ) : tab.id === "politicas" ? (
                <PoliticasTab />
              ) : tab.id === "conflitos" ? (
                <ConflitosTab />
              ) : tab.id === "lgpd" ? (
                <LGPDTab />
              ) : (
                <PlaceholderTab title={tab.title} description={tab.description} />
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </ConsultorLayout>
  );
}
