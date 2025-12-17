import { useState, useEffect } from "react";
import { ClienteLayout } from "@/components/layout/ClienteLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, AlertTriangle, TrendingUp, ArrowRight, ArrowLeft, ClipboardCheck } from "lucide-react";
import { useClienteProjeto } from "@/hooks/useClienteProjeto";
import {
  useDiagnostico,
  usePerguntas,
  useRespostas,
  useIniciarDiagnostico,
  useSalvarRespostas,
  useFinalizarDiagnostico,
  getDimensoes,
  getNivelMaturidadeLabel,
  getNivelMaturidadeColor,
  DiagnosticoPergunta,
} from "@/hooks/useDiagnostico";

const DIMENSOES = getDimensoes();

export default function Diagnostico() {
  const clienteProjetoQuery = useClienteProjeto();
  const projeto = clienteProjetoQuery.data;
  const organizacao = projeto?.organizacao;
  const isLoadingProjeto = clienteProjetoQuery.isLoading;
  
  const { data: diagnostico, isLoading: isLoadingDiagnostico } = useDiagnostico(projeto?.id);
  const { data: perguntas, isLoading: isLoadingPerguntas } = usePerguntas();
  const { data: respostasExistentes } = useRespostas(diagnostico?.id);
  
  const iniciarDiagnostico = useIniciarDiagnostico();
  const salvarRespostas = useSalvarRespostas();
  const finalizarDiagnostico = useFinalizarDiagnostico();

  const [etapaAtual, setEtapaAtual] = useState(1);
  const [respostas, setRespostas] = useState<Record<string, { resposta: string; valor: number }>>({});

  // Sync etapa with diagnostico
  useEffect(() => {
    if (diagnostico?.etapa_atual) {
      setEtapaAtual(diagnostico.etapa_atual);
    }
  }, [diagnostico?.etapa_atual]);

  // Sync respostas with existing ones
  useEffect(() => {
    if (respostasExistentes && respostasExistentes.length > 0) {
      const respostasMap: Record<string, { resposta: string; valor: number }> = {};
      respostasExistentes.forEach(r => {
        respostasMap[r.pergunta_id] = { resposta: r.resposta, valor: r.valor };
      });
      setRespostas(respostasMap);
    }
  }, [respostasExistentes]);

  const isLoading = isLoadingProjeto || isLoadingDiagnostico || isLoadingPerguntas;

  if (isLoading) {
    return (
      <ClienteLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ClienteLayout>
    );
  }

  const handleIniciar = () => {
    if (projeto && organizacao) {
      iniciarDiagnostico.mutate({
        projetoId: projeto.id,
        organizacaoId: organizacao.id,
      });
    }
  };

  const dimensaoAtual = DIMENSOES[etapaAtual - 1];
  const perguntasEtapa = perguntas?.filter(p => p.dimensao === dimensaoAtual?.key) || [];

  const handleResposta = (perguntaId: string, resposta: string) => {
    const valor = resposta === 'sim' ? 2 : resposta === 'parcialmente' ? 1 : 0;
    setRespostas(prev => ({
      ...prev,
      [perguntaId]: { resposta, valor }
    }));
  };

  const todasRespondidas = perguntasEtapa.every(p => respostas[p.id]);

  const handleProximaEtapa = () => {
    if (!diagnostico) return;

    const respostasEtapa = perguntasEtapa.map(p => ({
      pergunta_id: p.id,
      resposta: respostas[p.id]?.resposta || 'nao',
      valor: respostas[p.id]?.valor || 0,
    }));

    if (etapaAtual < 5) {
      salvarRespostas.mutate({
        diagnosticoId: diagnostico.id,
        respostas: respostasEtapa,
        proximaEtapa: etapaAtual + 1,
      }, {
        onSuccess: () => setEtapaAtual(etapaAtual + 1)
      });
    } else {
      // Última etapa - finalizar
      salvarRespostas.mutate({
        diagnosticoId: diagnostico.id,
        respostas: respostasEtapa,
        proximaEtapa: 5,
      }, {
        onSuccess: () => finalizarDiagnostico.mutate(diagnostico.id)
      });
    }
  };

  const handleEtapaAnterior = () => {
    if (etapaAtual > 1) {
      setEtapaAtual(etapaAtual - 1);
    }
  };

  // Diagnóstico não iniciado
  if (!diagnostico) {
    return (
      <ClienteLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Diagnóstico de Governança</h1>
            <p className="text-muted-foreground">
              Avalie o nível de maturidade da sua empresa em governança corporativa
            </p>
          </div>

          <Card className="max-w-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <ClipboardCheck className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>Avaliação de Maturidade</CardTitle>
              <CardDescription>
                Este diagnóstico avalia sua empresa em 5 dimensões essenciais de governança
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-3">
                {DIMENSOES.map((dim, i) => (
                  <div key={dim.key} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                      {i + 1}
                    </div>
                    <span className="font-medium">{dim.label}</span>
                    <Badge variant="secondary" className="ml-auto">10 perguntas</Badge>
                  </div>
                ))}
              </div>

              <div className="text-center text-sm text-muted-foreground">
                <p>Tempo estimado: 15-20 minutos</p>
                <p>Você pode pausar e continuar depois</p>
              </div>

              <Button 
                className="w-full" 
                size="lg"
                onClick={handleIniciar}
                disabled={iniciarDiagnostico.isPending}
              >
                {iniciarDiagnostico.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="mr-2 h-4 w-4" />
                )}
                Iniciar Diagnóstico
              </Button>
            </CardContent>
          </Card>
        </div>
      </ClienteLayout>
    );
  }

  // Diagnóstico concluído - mostrar resultados
  if (diagnostico.status === 'concluido') {
    const scores = [
      { label: 'Estrutura Societária', value: diagnostico.score_estrutura_societaria },
      { label: 'Governança', value: diagnostico.score_governanca },
      { label: 'Compliance', value: diagnostico.score_compliance },
      { label: 'Gestão', value: diagnostico.score_gestao },
      { label: 'Planejamento', value: diagnostico.score_planejamento },
    ];

    return (
      <ClienteLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Resultado do Diagnóstico</h1>
            <p className="text-muted-foreground">
              Concluído em {diagnostico.concluido_em ? new Date(diagnostico.concluido_em).toLocaleDateString('pt-BR') : '-'}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Score Geral */}
            <Card className="md:col-span-2">
              <CardHeader className="text-center">
                <CardTitle>Nível de Maturidade</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                <div className="relative w-48 h-48">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-muted"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      strokeDasharray={`${(diagnostico.score_geral || 0) * 2.83} 283`}
                      className="text-primary"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold">{Math.round(diagnostico.score_geral || 0)}%</span>
                    <span className={`text-sm font-medium ${getNivelMaturidadeColor(diagnostico.nivel_maturidade)}`}>
                      {getNivelMaturidadeLabel(diagnostico.nivel_maturidade).split(' ')[0]}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Scores por Dimensão */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Scores por Dimensão
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {scores.map((score) => (
                  <div key={score.label} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{score.label}</span>
                      <span className="font-medium">{Math.round(score.value || 0)}%</span>
                    </div>
                    <Progress value={score.value || 0} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Pontos Fortes e Atenção */}
            <Card>
              <CardHeader>
                <CardTitle>Análise</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {diagnostico.pontos_fortes && diagnostico.pontos_fortes.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      Pontos Fortes
                    </h4>
                    <ul className="space-y-1 text-sm">
                      {diagnostico.pontos_fortes.map((ponto) => (
                        <li key={ponto} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          {ponto}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {diagnostico.pontos_atencao && diagnostico.pontos_atencao.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2 text-orange-500">
                      <AlertTriangle className="h-4 w-4" />
                      Pontos de Atenção
                    </h4>
                    <ul className="space-y-1 text-sm">
                      {diagnostico.pontos_atencao.map((ponto) => (
                        <li key={ponto} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                          {ponto}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {(!diagnostico.pontos_fortes?.length && !diagnostico.pontos_atencao?.length) && (
                  <p className="text-muted-foreground text-sm">
                    Sua empresa está em um nível equilibrado. Continue acompanhando o projeto para evoluir em todas as dimensões.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </ClienteLayout>
    );
  }

  // Diagnóstico em andamento
  return (
    <ClienteLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Diagnóstico de Governança</h1>
          <p className="text-muted-foreground">
            Etapa {etapaAtual} de 5: {dimensaoAtual?.label}
          </p>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progresso</span>
            <span>{Math.round((etapaAtual / 5) * 100)}%</span>
          </div>
          <Progress value={(etapaAtual / 5) * 100} />
          <div className="flex justify-between text-xs text-muted-foreground">
            {DIMENSOES.map((dim, i) => (
              <span 
                key={dim.key} 
                className={i + 1 <= etapaAtual ? 'text-primary font-medium' : ''}
              >
                {i + 1}
              </span>
            ))}
          </div>
        </div>

        {/* Perguntas */}
        <Card>
          <CardHeader>
            <CardTitle>{dimensaoAtual?.label}</CardTitle>
            <CardDescription>
              Responda cada pergunta de acordo com a situação atual da sua empresa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {perguntasEtapa.map((pergunta, index) => (
              <div key={pergunta.id} className="space-y-3 pb-4 border-b last:border-0">
                <div>
                  <p className="font-medium">
                    {index + 1}. {pergunta.pergunta}
                  </p>
                  {pergunta.descricao && (
                    <p className="text-sm text-muted-foreground mt-1">{pergunta.descricao}</p>
                  )}
                </div>
                <RadioGroup
                  value={respostas[pergunta.id]?.resposta || ''}
                  onValueChange={(value) => handleResposta(pergunta.id, value)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sim" id={`${pergunta.id}-sim`} />
                    <Label htmlFor={`${pergunta.id}-sim`} className="cursor-pointer">Sim</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="parcialmente" id={`${pergunta.id}-parcial`} />
                    <Label htmlFor={`${pergunta.id}-parcial`} className="cursor-pointer">Parcialmente</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="nao" id={`${pergunta.id}-nao`} />
                    <Label htmlFor={`${pergunta.id}-nao`} className="cursor-pointer">Não</Label>
                  </div>
                </RadioGroup>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleEtapaAnterior}
            disabled={etapaAtual === 1}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Anterior
          </Button>

          <Button
            onClick={handleProximaEtapa}
            disabled={!todasRespondidas || salvarRespostas.isPending || finalizarDiagnostico.isPending}
          >
            {(salvarRespostas.isPending || finalizarDiagnostico.isPending) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {etapaAtual === 5 ? 'Finalizar' : 'Próxima'}
            {etapaAtual < 5 && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      </div>
    </ClienteLayout>
  );
}
