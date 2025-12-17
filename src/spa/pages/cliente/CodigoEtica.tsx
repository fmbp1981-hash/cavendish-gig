import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  Shield,
  Loader2,
  Download
} from "lucide-react";
import {
  useCodigoEticaAtivo,
  useMinhaAdesao,
  useRegistrarAdesao,
} from "@/hooks/useCodigoEtica";
import { useClienteProjeto } from "@/hooks/useClienteProjeto";

export default function ClienteCodigoEtica() {
  const { data: projeto, isLoading: loadingProjeto } = useClienteProjeto();
  const { data: versaoAtiva, isLoading: loadingVersao } = useCodigoEticaAtivo();
  const { data: minhaAdesao, isLoading: loadingAdesao } = useMinhaAdesao(versaoAtiva?.id);
  const registrarAdesao = useRegistrarAdesao();

  const [aceitoTermos, setAceitoTermos] = useState(false);
  const [leuConteudo, setLeuConteudo] = useState(false);

  if (loadingProjeto || loadingVersao || loadingAdesao) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!versaoAtiva) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Código de Ética</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Nenhuma versão do Código de Ética está disponível no momento.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleAceitar = async () => {
    if (!projeto?.organizacao_id) return;
    
    await registrarAdesao.mutateAsync({
      versaoId: versaoAtiva.id,
      organizacaoId: projeto.organizacao_id,
    });
  };

  // Renderizar conteúdo markdown simples
  const renderConteudo = (conteudo: string) => {
    return conteudo.split('\n').map((line, i) => {
      if (line.startsWith('# ')) {
        return <h1 key={i} className="text-2xl font-bold mt-6 mb-4">{line.slice(2)}</h1>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={i} className="text-xl font-semibold mt-5 mb-3">{line.slice(3)}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={i} className="text-lg font-medium mt-4 mb-2">{line.slice(4)}</h3>;
      }
      if (line.startsWith('- ')) {
        return <li key={i} className="ml-6 mb-1">{line.slice(2)}</li>;
      }
      if (line.trim()) {
        return <p key={i} className="mb-2 text-muted-foreground">{line}</p>;
      }
      return null;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Código de Ética</h1>
          <p className="text-muted-foreground">
            Leia e aceite o Código de Ética da organização
          </p>
        </div>
        {minhaAdesao && (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
            <CheckCircle2 className="w-4 h-4 mr-1" />
            Aceito
          </Badge>
        )}
      </div>

      {/* Card de status */}
      {minhaAdesao ? (
        <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/20">
          <CardContent className="py-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
                <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-green-800 dark:text-green-300">
                  Termo de Adesão Aceito
                </h3>
                <p className="text-sm text-green-700 dark:text-green-400">
                  Você aceitou o {versaoAtiva.titulo} em{" "}
                  {new Date(minhaAdesao.aceito_em).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-900/20">
          <CardContent className="py-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900">
                <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-300">
                  Adesão Pendente
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                  Leia o conteúdo abaixo e aceite o termo para estar em conformidade
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conteúdo do Código */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {versaoAtiva.titulo}
              </CardTitle>
              <CardDescription>
                Versão {versaoAtiva.versao} • Vigente desde{" "}
                {new Date(versaoAtiva.vigencia_inicio).toLocaleDateString("pt-BR")}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="prose dark:prose-invert max-w-none">
              {renderConteudo(versaoAtiva.conteudo)}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Termo de aceite */}
      {!minhaAdesao && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Termo de Adesão
            </CardTitle>
            <CardDescription>
              Confirme que leu e concorda com o Código de Ética
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="leu"
                  checked={leuConteudo}
                  onCheckedChange={(checked) => setLeuConteudo(checked as boolean)}
                />
                <label
                  htmlFor="leu"
                  className="text-sm leading-relaxed cursor-pointer"
                >
                  Declaro que li integralmente o Código de Ética e Conduta apresentado acima.
                </label>
              </div>
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="aceito"
                  checked={aceitoTermos}
                  onCheckedChange={(checked) => setAceitoTermos(checked as boolean)}
                />
                <label
                  htmlFor="aceito"
                  className="text-sm leading-relaxed cursor-pointer"
                >
                  Declaro que compreendi e me comprometo a cumprir todas as disposições do Código 
                  de Ética, estando ciente das consequências de seu descumprimento.
                </label>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Sua adesão será registrada com data e hora para fins de conformidade.
              </p>
              <Button
                onClick={handleAceitar}
                disabled={!leuConteudo || !aceitoTermos || registrarAdesao.isPending}
              >
                {registrarAdesao.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Aceitar Código de Ética
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
