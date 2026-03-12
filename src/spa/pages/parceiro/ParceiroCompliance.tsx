/**
 * Parceiro: Compliance page
 * Reuses ConsultorCompliance content but rendered inside ParceiroLayout
 */
import { useState } from "react";
import { ParceiroLayout } from "@/components/layout/ParceiroLayout";
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
import { RiscosTab } from "@/components/riscos/RiscosTab";
import { PoliticasTab } from "@/components/politicas/PoliticasTab";
import { ConflitosTab } from "@/components/conflitos/ConflitosTab";
import { LGPDTab } from "@/components/lgpd/LGPDTab";
import { DueDiligenceTab } from "@/components/fornecedores/DueDiligenceTab";
import { IncidentesTab } from "@/components/incidentes/IncidentesTab";
import { AuditoriaTab } from "@/components/auditoria/AuditoriaTab";
import { RelatoriosRegTab } from "@/components/relatorios-reg/RelatoriosRegTab";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  useDocumentosAnalytics, useProjetosAnalytics,
  useTarefasTimeline, useTreinamentosAnalytics,
} from "@/hooks/useAnalyticsData";

// Re-use tab definitions from consultor compliance
const tabs = [
  { id: "politicas",      label: "Políticas",            icon: BookOpen,      title: "Políticas Corporativas",       description: "Gestão de políticas corporativas internas e externas da organização." },
  { id: "conflitos",      label: "Conflito de Interesses", icon: AlertTriangle, title: "Conflito de Interesses",      description: "Declarações e gestão de conflitos de interesse dos colaboradores e parceiros." },
  { id: "lgpd",           label: "LGPD",                 icon: ShieldCheck,   title: "LGPD",                         description: "Adequação à Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018)." },
  { id: "riscos",         label: "Riscos",               icon: Scale,         title: "Gestão de Riscos",             description: "Mapeamento, avaliação e mitigação de riscos corporativos." },
  { id: "due-diligence",  label: "Due Diligence",        icon: ClipboardList, title: "Due Diligence",                description: "Análise aprofundada de fornecedores e parceiros." },
  { id: "kpis",           label: "KPIs",                 icon: TrendingUp,    title: "KPIs de Compliance",           description: "Indicadores de performance e métricas do programa de compliance." },
  { id: "incidentes",     label: "Incidentes",           icon: Shield,        title: "Incidentes",                   description: "Registro, investigação e gestão de incidentes de compliance." },
  { id: "auditoria",      label: "Auditoria",            icon: Search,        title: "Auditoria Interna",            description: "Auditorias internas, não conformidades e planos de ação corretiva." },
  { id: "relatorios-reg", label: "Rel. Regulatórios",    icon: FileText,      title: "Relatórios Regulatórios",      description: "Relatórios obrigatórios para órgãos reguladores." },
  { id: "ceis",           label: "Consulta CEIS",        icon: ExternalLink,  title: "Consulta CEIS",                description: "Consulta ao Cadastro de Empresas Inidôneas e Suspensas." },
];

const TABS_WITH_CONTENT = new Set(["kpis", "ceis", "riscos", "politicas", "conflitos", "lgpd", "due-diligence", "incidentes", "auditoria", "relatorios-reg"]);

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

const PIE_COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];
const STATUS_COLORS: Record<string, string> = {
  Aprovado: "#22c55e", Enviado: "#3b82f6", "Em Análise": "#f59e0b",
  Pendente: "#94a3b8", Rejeitado: "#ef4444",
};

function KPICard({ icon: Icon, label, value, sub, color = "bg-primary/10", iconColor = "text-primary" }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color?: string; iconColor?: string;
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
    ? Math.round(treinData.reduce((s, o) => s + o.taxa, 0) / treinData.length) : 0;
  const sparkline = tarefasData?.slice(-7) ?? [];
  const isLoading = loadingDocs || loadingProj || loadingTarefas || loadingTrein;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard icon={CheckCircle2} label="Índice de Conformidade" value={`${conformidade}%`} sub={`${aprovados} de ${totalDocs} docs aprovados`} color="bg-green-100 dark:bg-green-900/30" iconColor="text-green-600 dark:text-green-400" />
        <KPICard icon={FileCheck} label="Taxa de Entrega" value={`${entrega}%`} sub={`${pendentes} pendentes`} color="bg-blue-100 dark:bg-blue-900/30" iconColor="text-blue-600 dark:text-blue-400" />
        <KPICard icon={Clock} label="Tarefas Concluídas (30d)" value={`${taxaTarefas}%`} sub={`${tarefasConcluidas} de ${totalTarefas}`} color="bg-amber-100 dark:bg-amber-900/30" iconColor="text-amber-600 dark:text-amber-400" />
        <KPICard icon={BookMarked} label="Conclusão de Treinamentos" value={`${taxaMediaTrein}%`} sub={`Média entre ${totalOrgs} org.`} color="bg-purple-100 dark:bg-purple-900/30" iconColor="text-purple-600 dark:text-purple-400" />
      </div>
    </div>
  );
}

function CEISTab() {
  const [cnpj, setCnpj] = useState("");
  const formatCNPJ = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 14);
    return digits.replace(/^(\d{2})(\d)/, "$1.$2").replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1/$2").replace(/(\d{4})(\d)/, "$1-$2");
  };
  const handleConsultar = () => {
    const digits = cnpj.replace(/\D/g, "");
    window.open(`https://portaltransparencia.gov.br/sancoes/ceis?cpfCnpj=${digits}`, "_blank", "noopener,noreferrer");
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><ExternalLink className="h-5 w-5 text-primary" />Consulta CEIS</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <Input placeholder="CNPJ (00.000.000/0000-00)" value={cnpj} onChange={(e) => setCnpj(formatCNPJ(e.target.value))} maxLength={18} />
          </div>
          <Button onClick={handleConsultar} disabled={cnpj.replace(/\D/g, "").length < 14}>
            <ExternalLink className="h-4 w-4 mr-2" />Consultar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ParceiroCompliance() {
  return (
    <ParceiroLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Compliance</h1>
          <p className="text-muted-foreground">Gestão integrada do programa de compliance corporativo</p>
        </div>
        <Tabs defaultValue="kpis">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-muted p-1 rounded-lg w-full">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-1.5 text-xs px-3 py-1.5">
                <tab.icon className="h-3.5 w-3.5" />{tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {tabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="mt-6">
              {tab.id === "kpis" ? <KPIsTab /> :
               tab.id === "ceis" ? <CEISTab /> :
               tab.id === "riscos" ? <RiscosTab /> :
               tab.id === "politicas" ? <PoliticasTab /> :
               tab.id === "conflitos" ? <ConflitosTab /> :
               tab.id === "lgpd" ? <LGPDTab /> :
               tab.id === "due-diligence" ? <DueDiligenceTab /> :
               tab.id === "incidentes" ? <IncidentesTab /> :
               tab.id === "auditoria" ? <AuditoriaTab /> :
               tab.id === "relatorios-reg" ? <RelatoriosRegTab /> :
               <PlaceholderTab title={tab.title} description={tab.description} />}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </ParceiroLayout>
  );
}
