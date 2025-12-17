import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Search, 
  Shield, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  FileSearch,
  Loader2,
  ArrowLeft
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface DenunciaStatus {
  ticket_id: string;
  status: string;
  categoria: string;
  created_at: string;
  analisado_em: string | null;
}

export default function ConsultaProtocolo() {
  const [protocolo, setProtocolo] = useState("");
  const [segredo, setSegredo] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<DenunciaStatus | null>(null);
  const [buscaRealizada, setBuscaRealizada] = useState(false);

  const handleBuscar = async () => {
    if (!protocolo.trim()) {
      toast.error("Digite o número do protocolo");
      return;
    }

    if (!segredo.trim()) {
      toast.error("Digite o código secreto de consulta");
      return;
    }

    setLoading(true);
    setBuscaRealizada(true);
    setResultado(null);

    try {
      const { data, error } = await supabase.functions.invoke("denuncias", {
        body: { 
          action: "consultar",
          ticket_id: protocolo.trim().toUpperCase(),
          ticket_secret: segredo.trim()
        }
      });

      if (error) throw error;

      if (data?.denuncia) {
        setResultado(data.denuncia);
      } else {
        setResultado(null);
      }
    } catch (error) {
      console.error("Erro ao buscar protocolo:", error);
      toast.error("Erro ao consultar protocolo");
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string; color: string; icon: React.ReactNode; descricao: string }> = {
      nova: {
        label: "Recebida",
        color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
        icon: <Clock className="w-5 h-5" />,
        descricao: "Sua denúncia foi recebida e está aguardando análise inicial."
      },
      em_analise: {
        label: "Em Análise",
        color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
        icon: <FileSearch className="w-5 h-5" />,
        descricao: "Sua denúncia está sendo analisada pela equipe responsável."
      },
      investigando: {
        label: "Em Investigação",
        color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
        icon: <Search className="w-5 h-5" />,
        descricao: "Uma investigação está em andamento para apurar os fatos relatados."
      },
      concluida: {
        label: "Concluída",
        color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
        icon: <CheckCircle2 className="w-5 h-5" />,
        descricao: "A análise da sua denúncia foi concluída e as medidas cabíveis foram tomadas."
      },
      arquivada: {
        label: "Arquivada",
        color: "bg-muted text-muted-foreground",
        icon: <AlertCircle className="w-5 h-5" />,
        descricao: "Após análise, não foram identificados elementos suficientes para prosseguimento."
      }
    };
    return statusMap[status] || statusMap.nova;
  };

  const getCategoriaLabel = (categoria: string) => {
    const categorias: Record<string, string> = {
      assedio: "Assédio",
      corrupcao: "Corrupção",
      fraude: "Fraude",
      discriminacao: "Discriminação",
      seguranca: "Segurança do Trabalho",
      outros: "Outros"
    };
    return categorias[categoria] || categoria;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Voltar</span>
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-semibold">Canal de Denúncias</span>
          </div>
          <div className="w-16" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Search className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Consulta de Protocolo</h1>
          <p className="text-muted-foreground">
            Acompanhe o status da sua denúncia de forma anônima e segura
          </p>
        </div>

        {/* Card de busca */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Digite seu protocolo</CardTitle>
            <CardDescription>
              Você precisa do protocolo e do código secreto gerados no envio da denúncia.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <Input
                placeholder="DEN-XXXXXXXX"
                value={protocolo}
                onChange={(e) => setProtocolo(e.target.value.toUpperCase())}
                className="font-mono"
              />
              <Input
                placeholder="Código secreto"
                value={segredo}
                onChange={(e) => setSegredo(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleBuscar()}
                className="font-mono"
              />
              <Button onClick={handleBuscar} disabled={loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Consultar
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Resultado */}
        {buscaRealizada && !loading && (
          resultado ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardDescription>Protocolo</CardDescription>
                    <CardTitle className="font-mono">{resultado.ticket_id}</CardTitle>
                  </div>
                  <Badge className={getStatusInfo(resultado.status).color}>
                    {getStatusInfo(resultado.status).label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Status visual */}
                <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                  <div className="p-2 rounded-full bg-background">
                    {getStatusInfo(resultado.status).icon}
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">
                      {getStatusInfo(resultado.status).label}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {getStatusInfo(resultado.status).descricao}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Detalhes */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Categoria</p>
                    <p className="font-medium">{getCategoriaLabel(resultado.categoria)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Data de Registro</p>
                    <p className="font-medium">
                      {new Date(resultado.created_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric"
                      })}
                    </p>
                  </div>
                  {resultado.analisado_em && (
                    <div className="sm:col-span-2">
                      <p className="text-sm text-muted-foreground mb-1">Última Atualização</p>
                      <p className="font-medium">
                        {new Date(resultado.analisado_em).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Garantias */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="w-4 h-4" />
                  <span>Sua identidade permanece protegida durante todo o processo</span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Protocolo não encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  Verifique se o número do protocolo foi digitado corretamente.
                </p>
                <p className="text-sm text-muted-foreground">
                  O protocolo segue o formato DEN-XXXXXXXX (letras e números).
                </p>
              </CardContent>
            </Card>
          )
        )}

        {/* Informações adicionais */}
        <Card className="mt-6 bg-muted/30 border-dashed">
          <CardContent className="py-6">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Informações Importantes
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                <span>Sua consulta é anônima e não deixa rastros identificáveis</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                <span>O prazo médio de análise inicial é de 5 a 10 dias úteis</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                <span>Investigações mais complexas podem levar mais tempo</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                <span>Em caso de dúvidas, você pode registrar uma nova denúncia referenciando seu protocolo</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Link para nova denúncia */}
        <div className="text-center mt-8">
          <p className="text-muted-foreground mb-2">Precisa fazer uma nova denúncia?</p>
          <Button variant="outline" asChild>
            <Link to="/denuncia">
              <Shield className="w-4 h-4 mr-2" />
              Acessar Canal de Denúncias
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
