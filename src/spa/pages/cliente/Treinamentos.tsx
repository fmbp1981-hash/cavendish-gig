import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, 
  Clock, 
  Award, 
  CheckCircle2, 
  Play,
  FileText,
  Loader2
} from "lucide-react";
import {
  useTreinamentos,
  useMinhasInscricoes,
  useMeusCertificados,
  getCategoriaLabel,
  getStatusLabel,
  getStatusColor,
  Treinamento,
  TreinamentoInscricao,
} from "@/hooks/useTreinamentos";

export default function ClienteTreinamentos() {
  const navigate = useNavigate();
  const { data: treinamentos, isLoading: loadingTreinamentos } = useTreinamentos();
  const { data: inscricoes, isLoading: loadingInscricoes } = useMinhasInscricoes();
  const { data: certificados, isLoading: loadingCertificados } = useMeusCertificados();

  const getInscricao = (treinamentoId: string) => {
    return inscricoes?.find(i => i.treinamento_id === treinamentoId);
  };

  const treinamentosObrigatorios = treinamentos?.filter(t => t.obrigatorio) || [];
  const treinamentosOpcionais = treinamentos?.filter(t => !t.obrigatorio) || [];

  const totalObrigatorios = treinamentosObrigatorios.length;
  const concluidosObrigatorios = treinamentosObrigatorios.filter(t => {
    const inscricao = getInscricao(t.id);
    return inscricao?.status === "concluido";
  }).length;

  const progressoGeral = totalObrigatorios > 0 
    ? Math.round((concluidosObrigatorios / totalObrigatorios) * 100) 
    : 0;

  if (loadingTreinamentos || loadingInscricoes) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Treinamentos</h1>
        <p className="text-muted-foreground">
          Complete os treinamentos obrigatórios para estar em conformidade
        </p>
      </div>

      {/* Card de progresso geral */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Progresso Geral</span>
                <span className="text-sm text-muted-foreground">
                  {concluidosObrigatorios} de {totalObrigatorios} obrigatórios
                </span>
              </div>
              <Progress value={progressoGeral} className="h-2" />
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold">{progressoGeral}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="todos" data-tour="treinamentos-list">
        <TabsList>
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="obrigatorios">Obrigatórios</TabsTrigger>
          <TabsTrigger value="certificados">Meus Certificados</TabsTrigger>
        </TabsList>

        <TabsContent value="todos" className="space-y-4 mt-4">
          {treinamentos?.map((treinamento) => (
            <TreinamentoCard 
              key={treinamento.id}
              treinamento={treinamento}
              inscricao={getInscricao(treinamento.id)}
              onAcessar={() => navigate(`/meu-projeto/treinamentos/${treinamento.id}`)}
            />
          ))}
        </TabsContent>

        <TabsContent value="obrigatorios" className="space-y-4 mt-4">
          {treinamentosObrigatorios.map((treinamento) => (
            <TreinamentoCard 
              key={treinamento.id}
              treinamento={treinamento}
              inscricao={getInscricao(treinamento.id)}
              onAcessar={() => navigate(`/meu-projeto/treinamentos/${treinamento.id}`)}
            />
          ))}
        </TabsContent>

        <TabsContent value="certificados" className="space-y-4 mt-4">
          {loadingCertificados ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : certificados?.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Award className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Você ainda não possui certificados. Complete os treinamentos para obter seus certificados.
                </p>
              </CardContent>
            </Card>
          ) : (
            certificados?.map((cert) => (
              <Card key={cert.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
                        <Award className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h3 className="font-medium">{cert.treinamentos?.nome}</h3>
                        <p className="text-sm text-muted-foreground">
                          Código: {cert.codigo_validacao}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                        Nota: {cert.nota_final}%
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(cert.emitido_em).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TreinamentoCard({ 
  treinamento, 
  inscricao,
  onAcessar 
}: { 
  treinamento: Treinamento;
  inscricao: TreinamentoInscricao | undefined;
  onAcessar: () => void;
}) {
  const status = inscricao?.status || "nao_iniciado";
  const concluido = status === "concluido";

  return (
    <Card className={concluido ? "border-green-200 dark:border-green-800" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {treinamento.obrigatorio && (
                <Badge variant="destructive" className="text-xs">Obrigatório</Badge>
              )}
              <Badge variant="outline" className="text-xs">
                {getCategoriaLabel(treinamento.categoria)}
              </Badge>
            </div>
            <CardTitle className="text-lg flex items-center gap-2">
              {concluido && <CheckCircle2 className="w-5 h-5 text-green-500" />}
              {treinamento.nome}
            </CardTitle>
            <CardDescription className="mt-1">
              {treinamento.descricao}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {treinamento.carga_horaria_minutos} min
            </span>
            <Badge className={getStatusColor(status)}>
              {getStatusLabel(status)}
            </Badge>
          </div>
          <Button 
            onClick={onAcessar}
            variant={concluido ? "outline" : "default"}
          >
            {status === "nao_iniciado" ? (
              <>
                <Play className="w-4 h-4 mr-2" />
                Iniciar
              </>
            ) : concluido ? (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Ver Certificado
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Continuar
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
