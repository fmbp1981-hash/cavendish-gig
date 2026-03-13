import { Link } from "react-router-dom";
import { ClienteLayout } from "@/components/layout/ClienteLayout";
import { useClienteProjeto, useDocumentosRequeridosProjeto } from "@/hooks/useClienteProjeto";
import { ProgressoDocumentos } from "@/components/documentos/ProgressoDocumentos";
import { WorkflowProgress } from "@/components/cliente/WorkflowProgress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  FolderOpen,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
} from "lucide-react";
import type { FaseProjeto } from "@/types/database";

const faseLabels: Record<FaseProjeto, string> = {
  diagnostico: "Diagnóstico",
  implementacao: "Implementação",
  recorrencia: "Recorrência",
};

const faseColors: Record<FaseProjeto, string> = {
  diagnostico: "bg-primary/10 text-primary",
  implementacao: "bg-accent/10 text-accent",
  recorrencia: "bg-secondary/10 text-secondary",
};

export default function MeuProjeto() {
  const { data: projeto, isLoading: projetoLoading } = useClienteProjeto();
  const { data: documentos = [], isLoading: docsLoading } = useDocumentosRequeridosProjeto(
    projeto?.id,
    projeto?.organizacao_id
  );

  const total = documentos.filter((d: any) => d.obrigatorio).length;
  const aprovados = documentos.filter((d: any) => d.obrigatorio && d.status?.status === "aprovado").length;
  const enviados = documentos.filter((d: any) => 
    d.obrigatorio && d.status && ["enviado", "em_analise", "aprovado"].includes(d.status.status)
  ).length;
  const pendentes = documentos.filter((d: any) => 
    d.obrigatorio && (!d.status || d.status.status === "pendente" || d.status.status === "rejeitado")
  ).length;

  if (projetoLoading) {
    return (
      <ClienteLayout>
        <div className="max-w-5xl mx-auto space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </ClienteLayout>
    );
  }

  if (!projeto) {
    return (
      <ClienteLayout>
        <div className="max-w-5xl mx-auto">
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">Nenhum projeto encontrado</h2>
              <p className="text-muted-foreground text-center max-w-md mb-6">
                Você ainda não possui um projeto ativo. Conclua o onboarding para criar sua organização, liberar o checklist e habilitar os uploads de documentos.
              </p>
              <Button asChild>
                <Link to="/onboarding">Concluir onboarding</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </ClienteLayout>
    );
  }

  return (
    <ClienteLayout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-foreground">{projeto.nome}</h1>
            <Badge className={faseColors[projeto.fase_atual as FaseProjeto]}>
              {faseLabels[projeto.fase_atual as FaseProjeto]}
            </Badge>
          </div>
          {projeto.organizacao && (
            <p className="text-muted-foreground">{projeto.organizacao.nome}</p>
          )}
        </div>

        {/* Workflow Progress */}
        <div className="mb-8" data-tour="progresso-projeto">
          <WorkflowProgress currentPhase={projeto.fase_atual as FaseProjeto} />
        </div>

        {/* Progress Card */}
        <Card className="mb-8" data-tour="documentos-necessarios">
          <CardHeader>
            <CardTitle className="text-lg">Progresso de Documentos</CardTitle>
          </CardHeader>
          <CardContent>
            {docsLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <ProgressoDocumentos
                total={total}
                enviados={enviados}
                aprovados={aprovados}
                pendentes={pendentes}
              />
            )}
            <div className="mt-4">
              <Link to="/meu-projeto/documentos-necessarios">
                <Button variant="outline" className="w-full sm:w-auto">
                  <FileText className="w-4 h-4 mr-2" />
                  Ver todos os documentos
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{aprovados}</p>
                  <p className="text-sm text-muted-foreground">Aprovados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{enviados - aprovados}</p>
                  <p className="text-sm text-muted-foreground">Em análise</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{pendentes}</p>
                  <p className="text-sm text-muted-foreground">Pendentes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link to="/meu-projeto/documentos-necessarios">
                <Button variant="outline" className="w-full justify-start h-auto py-4">
                  <FileText className="w-5 h-5 mr-3 text-primary" />
                  <div className="text-left">
                    <p className="font-medium">Enviar Documentos</p>
                    <p className="text-xs text-muted-foreground">{pendentes} pendentes</p>
                  </div>
                </Button>
              </Link>

              <Link to="/meu-projeto/documentos">
                <Button variant="outline" className="w-full justify-start h-auto py-4">
                  <FolderOpen className="w-5 h-5 mr-3 text-secondary" />
                  <div className="text-left">
                    <p className="font-medium">Meus Documentos</p>
                    <p className="text-xs text-muted-foreground">Repositório de arquivos</p>
                  </div>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </ClienteLayout>
  );
}
