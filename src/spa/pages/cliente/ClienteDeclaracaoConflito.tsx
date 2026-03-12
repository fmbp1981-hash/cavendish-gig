import { useState } from "react";
import { ClienteLayout } from "@/components/layout/ClienteLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Info,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useClienteProjeto } from "@/hooks/useClienteProjeto";
import {
  ConflitosStatus,
  STATUS_LABEL,
  STATUS_COR,
  useMinhaDeclaracao,
  useEnviarDeclaracao,
} from "@/hooks/useConflitosInteresse";

const ANO_ATUAL = new Date().getFullYear();

// ─── Formulário de declaração ──────────────────────────────────────────────────

function FormDeclaracao({ organizacaoId }: { organizacaoId: string }) {
  const enviar = useEnviarDeclaracao();
  const [temConflito, setTemConflito] = useState<boolean | null>(null);
  const [descricao, setDescricao] = useState("");

  const podeEnviar =
    temConflito !== null &&
    (temConflito === false || (temConflito === true && descricao.trim().length > 0));

  const handleSubmit = async () => {
    if (temConflito === null) return;
    await enviar.mutateAsync({
      organizacaoId,
      anoReferencia: ANO_ATUAL,
      temConflito,
      descricao: temConflito ? descricao : undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Info */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          O conflito de interesse ocorre quando interesses pessoais, financeiros ou de terceiros
          podem influenciar — ou aparentar influenciar — decisões profissionais. Todos os
          colaboradores têm a obrigação anual de declarar a existência ou não de tais conflitos.
        </AlertDescription>
      </Alert>

      {/* Pergunta */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Você possui algum conflito de interesse relevante?
          </CardTitle>
          <CardDescription>
            Selecione uma das opções abaixo para continuar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Opção: Não possuo */}
          <button
            type="button"
            onClick={() => { setTemConflito(false); setDescricao(""); }}
            className={[
              "w-full text-left rounded-lg border p-4 transition-colors",
              temConflito === false
                ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                : "border-border hover:bg-muted/50",
            ].join(" ")}
          >
            <div className="flex items-center gap-3">
              <div className={[
                "h-4 w-4 rounded-full border-2 shrink-0 flex items-center justify-center",
                temConflito === false ? "border-green-600" : "border-muted-foreground",
              ].join(" ")}>
                {temConflito === false && (
                  <div className="h-2 w-2 rounded-full bg-green-600" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium">Não possuo conflito de interesse</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Declaro que não tenho conflitos de interesse a reportar neste período.
                </p>
              </div>
            </div>
          </button>

          {/* Opção: Sim, possuo */}
          <button
            type="button"
            onClick={() => setTemConflito(true)}
            className={[
              "w-full text-left rounded-lg border p-4 transition-colors",
              temConflito === true
                ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                : "border-border hover:bg-muted/50",
            ].join(" ")}
          >
            <div className="flex items-center gap-3">
              <div className={[
                "h-4 w-4 rounded-full border-2 shrink-0 flex items-center justify-center",
                temConflito === true ? "border-orange-600" : "border-muted-foreground",
              ].join(" ")}>
                {temConflito === true && (
                  <div className="h-2 w-2 rounded-full bg-orange-600" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium">Sim, possuo conflito de interesse a declarar</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Irei descrever o conflito no campo abaixo.
                </p>
              </div>
            </div>
          </button>

          {/* Textarea quando tem conflito */}
          {temConflito === true && (
            <div className="space-y-1.5 pt-1">
              <label className="text-sm font-medium">
                Descreva o conflito de interesse *
              </label>
              <Textarea
                placeholder="Descreva detalhadamente a natureza do conflito, os envolvidos e como pode impactar suas decisões profissionais..."
                rows={5}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={!podeEnviar || enviar.isPending}
        >
          {enviar.isPending
            ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
            : <CheckCircle2 className="h-4 w-4 mr-2" />}
          Enviar Declaração
        </Button>
      </div>
    </div>
  );
}

// ─── Visualização da declaração já enviada ────────────────────────────────────

function DeclaracaoEnviada({
  declaracao,
  onAtualizar,
}: {
  declaracao: {
    tem_conflito: boolean;
    descricao: string | null;
    status: ConflitosStatus;
    observacao_analise: string | null;
    created_at: string;
  };
  onAtualizar: () => void;
}) {
  const dataEnvio = format(new Date(declaracao.created_at), "dd/MM/yyyy", { locale: ptBR });

  return (
    <div className="space-y-4">
      {/* Card de confirmação */}
      <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/20">
        <CardContent className="py-5">
          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-full bg-green-100 dark:bg-green-900 shrink-0">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-green-800 dark:text-green-300">
                  Declaração de {ANO_ATUAL} enviada em {dataEnvio}
                </h3>
                <Badge className={STATUS_COR[declaracao.status]}>
                  {STATUS_LABEL[declaracao.status]}
                </Badge>
              </div>
              <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                {declaracao.tem_conflito
                  ? "Você declarou possuir conflito de interesse."
                  : "Você declarou não possuir conflito de interesse."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Descrição do conflito, se houver */}
      {declaracao.tem_conflito && declaracao.descricao && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2 text-orange-700 dark:text-orange-400">
              <AlertTriangle className="h-4 w-4" />
              Conflito declarado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {declaracao.descricao}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Observação de análise */}
      {declaracao.status === "analisado" && declaracao.observacao_analise && (
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-sm text-blue-700 dark:text-blue-400">
              Observação do analista
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed border-l-2 border-blue-400 pl-3 whitespace-pre-wrap">
              {declaracao.observacao_analise}
            </p>
          </CardContent>
        </Card>
      )}

      <Separator />

      <div className="flex justify-end">
        <Button variant="outline" onClick={onAtualizar}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Atualizar declaração
        </Button>
      </div>
    </div>
  );
}

// ─── Página principal ──────────────────────────────────────────────────────────

export default function ClienteDeclaracaoConflito() {
  const { data: projeto, isLoading: loadingProjeto } = useClienteProjeto();
  const organizacaoId = projeto?.organizacao_id ?? "";

  const { data: declaracao, isLoading: loadingDeclaracao } = useMinhaDeclaracao(
    organizacaoId,
    ANO_ATUAL
  );

  const [modoFormulario, setModoFormulario] = useState(false);

  const isLoading = loadingProjeto || loadingDeclaracao;

  const mostrarFormulario = !declaracao || modoFormulario;

  return (
    <ClienteLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">
            Declaração de Conflito de Interesse — {ANO_ATUAL}
          </h1>
          <p className="text-muted-foreground mt-1">
            Declare anualmente se você possui algum conflito de interesse relevante
          </p>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : !organizacaoId ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Você não está vinculado a nenhuma organização.
              </p>
            </CardContent>
          </Card>
        ) : mostrarFormulario ? (
          <FormDeclaracao
            organizacaoId={organizacaoId}
          />
        ) : (
          declaracao && (
            <DeclaracaoEnviada
              declaracao={declaracao}
              onAtualizar={() => setModoFormulario(true)}
            />
          )
        )}
      </div>
    </ClienteLayout>
  );
}
