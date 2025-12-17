import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Award,
  BookOpen,
  FileQuestion,
  Loader2,
  RotateCcw
} from "lucide-react";
import { toast } from "sonner";
import {
  useTreinamentos,
  useTreinamentoConteudos,
  useTreinamentoQuiz,
  useMinhaInscricao,
  useIniciarTreinamento,
  useSalvarProgresso,
  useResponderQuiz,
  getCategoriaLabel,
  TreinamentoQuiz,
} from "@/hooks/useTreinamentos";
import { useClienteProjeto } from "@/hooks/useClienteProjeto";

type Etapa = "intro" | "conteudo" | "quiz" | "resultado";

export default function TreinamentoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: projeto } = useClienteProjeto();
  
  const { data: treinamentos } = useTreinamentos();
  const treinamento = treinamentos?.find(t => t.id === id);
  
  const { data: conteudos, isLoading: loadingConteudos } = useTreinamentoConteudos(id);
  const { data: quiz, isLoading: loadingQuiz } = useTreinamentoQuiz(id);
  const { data: inscricao, isLoading: loadingInscricao } = useMinhaInscricao(id);
  
  const iniciarTreinamento = useIniciarTreinamento();
  const salvarProgresso = useSalvarProgresso();
  const responderQuiz = useResponderQuiz();

  const [etapa, setEtapa] = useState<Etapa>("intro");
  const [conteudoAtual, setConteudoAtual] = useState(0);
  const [conteudosConcluidos, setConteudosConcluidos] = useState<string[]>([]);
  const [respostas, setRespostas] = useState<Record<string, number>>({});
  const [resultadoQuiz, setResultadoQuiz] = useState<{ nota: number; aprovado: boolean } | null>(null);

  // Inicializar estado baseado na inscrição existente
  useEffect(() => {
    if (inscricao) {
      setConteudosConcluidos(inscricao.progresso_conteudo || []);
      if (inscricao.status === "concluido") {
        setEtapa("resultado");
        setResultadoQuiz({
          nota: inscricao.quiz_nota || 0,
          aprovado: inscricao.quiz_aprovado,
        });
      } else if (inscricao.status === "em_andamento") {
        const progressoConteudo = inscricao.progresso_conteudo || [];
        if (progressoConteudo.length === conteudos?.length && conteudos?.length > 0) {
          setEtapa("quiz");
        } else {
          setEtapa("conteudo");
        }
      }
    }
  }, [inscricao, conteudos]);

  if (!treinamento || loadingConteudos || loadingQuiz || loadingInscricao) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleIniciar = async () => {
    if (!projeto?.organizacao_id) {
      toast.error("Organização não encontrada");
      return;
    }

    await iniciarTreinamento.mutateAsync({
      treinamentoId: treinamento.id,
      organizacaoId: projeto.organizacao_id,
    });
    setEtapa("conteudo");
  };

  const handleProximoConteudo = async () => {
    if (!conteudos || !inscricao) return;

    const conteudoId = conteudos[conteudoAtual].id;
    const novosConteudosConcluidos = [...conteudosConcluidos, conteudoId];
    setConteudosConcluidos(novosConteudosConcluidos);

    await salvarProgresso.mutateAsync({
      inscricaoId: inscricao.id,
      conteudosConcluidos: novosConteudosConcluidos,
    });

    if (conteudoAtual < conteudos.length - 1) {
      setConteudoAtual(conteudoAtual + 1);
    } else {
      setEtapa("quiz");
    }
  };

  const handleEnviarQuiz = async () => {
    if (!quiz || !inscricao) return;

    // Calcular nota
    let acertos = 0;
    quiz.forEach((pergunta, index) => {
      const respostaUsuario = respostas[pergunta.id];
      if (respostaUsuario !== undefined && pergunta.alternativas[respostaUsuario]?.correta) {
        acertos++;
      }
    });

    const nota = Math.round((acertos / quiz.length) * 100);
    const aprovado = nota >= 70; // Nota mínima de 70%

    await responderQuiz.mutateAsync({
      inscricaoId: inscricao.id,
      treinamentoId: treinamento.id,
      nota,
      aprovado,
    });

    setResultadoQuiz({ nota, aprovado });
    setEtapa("resultado");
  };

  const handleRefazerQuiz = () => {
    setRespostas({});
    setResultadoQuiz(null);
    setEtapa("quiz");
  };

  const progressoConteudo = conteudos 
    ? Math.round((conteudosConcluidos.length / conteudos.length) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/meu-projeto/treinamentos")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {treinamento.obrigatorio && (
              <Badge variant="destructive" className="text-xs">Obrigatório</Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {getCategoriaLabel(treinamento.categoria)}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold">{treinamento.nome}</h1>
        </div>
      </div>

      {/* Barra de progresso geral */}
      {inscricao && etapa !== "intro" && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Progresso</span>
              <Progress value={progressoConteudo} className="flex-1 h-2" />
              <span className="text-sm text-muted-foreground">{progressoConteudo}%</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Etapa: Introdução */}
      {etapa === "intro" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Sobre este treinamento
            </CardTitle>
            <CardDescription>{treinamento.descricao}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>Duração: {treinamento.carga_horaria_minutos} minutos</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <BookOpen className="w-4 h-4 text-muted-foreground" />
                <span>{conteudos?.length || 0} módulos</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <FileQuestion className="w-4 h-4 text-muted-foreground" />
                <span>{quiz?.length || 0} perguntas no quiz</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Award className="w-4 h-4 text-muted-foreground" />
                <span>Certificado ao concluir</span>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-medium mb-2">Conteúdo programático:</h3>
              <ul className="space-y-2">
                {conteudos?.map((conteudo, index) => (
                  <li key={conteudo.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs">
                      {index + 1}
                    </span>
                    {conteudo.titulo}
                  </li>
                ))}
              </ul>
            </div>

            <Button 
              onClick={handleIniciar} 
              className="w-full"
              disabled={iniciarTreinamento.isPending}
            >
              {iniciarTreinamento.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Iniciar Treinamento
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Etapa: Conteúdo */}
      {etapa === "conteudo" && conteudos && conteudos[conteudoAtual] && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant="outline">
                Módulo {conteudoAtual + 1} de {conteudos.length}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {conteudos[conteudoAtual].duracao_minutos} min
              </span>
            </div>
            <CardTitle>{conteudos[conteudoAtual].titulo}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="prose dark:prose-invert max-w-none">
              {conteudos[conteudoAtual].conteudo?.split('\n').map((paragraph, i) => {
                if (paragraph.startsWith('# ')) {
                  return <h1 key={i} className="text-2xl font-bold mt-6 mb-4">{paragraph.slice(2)}</h1>;
                }
                if (paragraph.startsWith('## ')) {
                  return <h2 key={i} className="text-xl font-semibold mt-4 mb-3">{paragraph.slice(3)}</h2>;
                }
                if (paragraph.startsWith('- **')) {
                  const match = paragraph.match(/- \*\*(.+?)\*\*: (.+)/);
                  if (match) {
                    return (
                      <li key={i} className="ml-4">
                        <strong>{match[1]}</strong>: {match[2]}
                      </li>
                    );
                  }
                }
                if (paragraph.startsWith('- ')) {
                  return <li key={i} className="ml-4">{paragraph.slice(2)}</li>;
                }
                if (paragraph.match(/^\d+\. \*\*/)) {
                  const match = paragraph.match(/^\d+\. \*\*(.+?)\*\*: (.+)/);
                  if (match) {
                    return (
                      <li key={i} className="ml-4 list-decimal">
                        <strong>{match[1]}</strong>: {match[2]}
                      </li>
                    );
                  }
                }
                if (paragraph.trim()) {
                  return <p key={i} className="mb-3">{paragraph}</p>;
                }
                return null;
              })}
            </div>

            <Separator />

            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => setConteudoAtual(Math.max(0, conteudoAtual - 1))}
                disabled={conteudoAtual === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Anterior
              </Button>
              <Button 
                onClick={handleProximoConteudo}
                disabled={salvarProgresso.isPending}
              >
                {salvarProgresso.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {conteudoAtual === conteudos.length - 1 ? "Ir para Quiz" : "Próximo"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Etapa: Quiz */}
      {etapa === "quiz" && quiz && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileQuestion className="w-5 h-5" />
              Quiz de Avaliação
            </CardTitle>
            <CardDescription>
              Responda todas as perguntas. Você precisa de pelo menos 70% de acerto para obter o certificado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {quiz.map((pergunta, index) => (
              <div key={pergunta.id} className="space-y-3">
                <h3 className="font-medium">
                  {index + 1}. {pergunta.pergunta}
                </h3>
                <RadioGroup
                  value={respostas[pergunta.id]?.toString()}
                  onValueChange={(value) => 
                    setRespostas({ ...respostas, [pergunta.id]: parseInt(value) })
                  }
                >
                  {pergunta.alternativas.map((alt, altIndex) => (
                    <div key={altIndex} className="flex items-center space-x-2">
                      <RadioGroupItem value={altIndex.toString()} id={`${pergunta.id}-${altIndex}`} />
                      <Label htmlFor={`${pergunta.id}-${altIndex}`} className="cursor-pointer">
                        {alt.texto}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                {index < quiz.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}

            <Button 
              onClick={handleEnviarQuiz}
              className="w-full"
              disabled={Object.keys(respostas).length < quiz.length || responderQuiz.isPending}
            >
              {responderQuiz.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Enviar Respostas
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Etapa: Resultado */}
      {etapa === "resultado" && resultadoQuiz && (
        <Card>
          <CardContent className="py-8 text-center space-y-6">
            {resultadoQuiz.aprovado ? (
              <>
                <div className="w-20 h-20 mx-auto rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <Award className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-green-600 dark:text-green-400">
                    Parabéns!
                  </h2>
                  <p className="text-muted-foreground mt-2">
                    Você concluiu o treinamento com sucesso!
                  </p>
                </div>
                <div className="bg-muted rounded-lg p-4 inline-block">
                  <p className="text-sm text-muted-foreground">Sua nota</p>
                  <p className="text-4xl font-bold">{resultadoQuiz.nota}%</p>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Certificado gerado automaticamente
                </div>
              </>
            ) : (
              <>
                <div className="w-20 h-20 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
                  <FileQuestion className="w-10 h-10 text-destructive" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-destructive">
                    Tente novamente
                  </h2>
                  <p className="text-muted-foreground mt-2">
                    Você não atingiu a nota mínima de 70%
                  </p>
                </div>
                <div className="bg-muted rounded-lg p-4 inline-block">
                  <p className="text-sm text-muted-foreground">Sua nota</p>
                  <p className="text-4xl font-bold">{resultadoQuiz.nota}%</p>
                </div>
                <Button onClick={handleRefazerQuiz}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Refazer Quiz
                </Button>
              </>
            )}

            <Separator />

            <Button 
              variant="outline" 
              onClick={() => navigate("/meu-projeto/treinamentos")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Treinamentos
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
