import { useState } from "react";
import { ConsultorLayout } from "@/components/layout/ConsultorLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Construction,
  ExternalLink,
} from "lucide-react";

const tabs = [
  {
    id: "politicas",
    label: "Políticas",
    icon: BookOpen,
    title: "Políticas Corporativas",
    description: "Gestão de políticas corporativas internas e externas da organização.",
  },
  {
    id: "conflitos",
    label: "Conflito de Interesses",
    icon: AlertTriangle,
    title: "Conflito de Interesses",
    description: "Declarações e gestão de conflitos de interesse dos colaboradores e parceiros.",
  },
  {
    id: "lgpd",
    label: "LGPD",
    icon: ShieldCheck,
    title: "LGPD",
    description: "Adequação à Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018).",
  },
  {
    id: "riscos",
    label: "Riscos",
    icon: Scale,
    title: "Gestão de Riscos",
    description: "Mapeamento, avaliação e mitigação de riscos corporativos.",
  },
  {
    id: "due-diligence",
    label: "Due Diligence",
    icon: ClipboardList,
    title: "Due Diligence",
    description:
      "Análise aprofundada de fornecedores e parceiros antes de firmar contratos ou parcerias. Levanta riscos jurídicos, financeiros e de reputação.",
  },
  {
    id: "kpis",
    label: "KPIs",
    icon: TrendingUp,
    title: "KPIs de Compliance",
    description: "Indicadores de performance e métricas do programa de compliance.",
  },
  {
    id: "incidentes",
    label: "Incidentes",
    icon: Shield,
    title: "Incidentes",
    description: "Registro, investigação e gestão de incidentes de compliance.",
  },
  {
    id: "auditoria",
    label: "Auditoria",
    icon: Search,
    title: "Auditoria Interna",
    description: "Auditorias internas, não conformidades e planos de ação corretiva.",
  },
  {
    id: "relatorios-reg",
    label: "Rel. Regulatórios",
    icon: FileText,
    title: "Relatórios Regulatórios",
    description:
      "Relatórios obrigatórios para órgãos reguladores: CGU, CVM, BACEN, ANPD e outros.",
  },
  {
    id: "ceis",
    label: "Consulta CEIS",
    icon: ExternalLink,
    title: "Consulta CEIS",
    description:
      "Consulta ao Cadastro de Empresas Inidôneas e Suspensas — verifica se fornecedores ou parceiros têm impedimentos legais para contratar com o poder público.",
  },
];

function PlaceholderTab({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
      <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
        <Construction className="h-8 w-8 text-muted-foreground" />
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
              { label: "CGU", desc: "Controladoria-Geral da União — mantém o cadastro" },
              { label: "TCU", desc: "Tribunal de Contas da União — sanções de inidoneidade" },
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

        <Tabs defaultValue="politicas">
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
              {tab.id === "ceis" ? (
                <CEISTab />
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
