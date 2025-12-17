import { useState } from "react";
import { ConsultorLayout } from "@/components/layout/ConsultorLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOrganizacoes } from "@/hooks/useConsultorData";
import { useAIGenerate } from "@/hooks/useAIGenerate";
import { toast } from "sonner";
import { Sparkles, Copy, Download, RefreshCw, Building2 } from "lucide-react";

export default function ConsultorCodigoEtica() {
  const [selectedOrg, setSelectedOrg] = useState<string>("");
  const [setor, setSetor] = useState("");
  const [valores, setValores] = useState("");
  const [contexto, setContexto] = useState("");
  const [codigoGerado, setCodigoGerado] = useState("");

  const { data: organizacoes, isLoading: loadingOrgs } = useOrganizacoes();
  const { generate, loading: isGenerating } = useAIGenerate();

  const selectedOrgData = organizacoes?.find(org => org.id === selectedOrg);

  const handleGenerate = async () => {
    if (!selectedOrg) {
      toast.error("Selecione uma organização");
      return;
    }

    const prompt = `Você é um especialista em Governança Corporativa e Compliance. Gere um Código de Ética e Conduta profissional e completo para a seguinte organização:

**Nome da Organização:** ${selectedOrgData?.nome}
${selectedOrgData?.cnpj ? `**CNPJ:** ${selectedOrgData.cnpj}` : ""}
${setor ? `**Setor de Atuação:** ${setor}` : ""}
${valores ? `**Valores da Empresa:** ${valores}` : ""}
${contexto ? `**Contexto Adicional:** ${contexto}` : ""}

O código deve conter:
1. Mensagem da Liderança
2. Objetivo e Abrangência
3. Princípios e Valores Fundamentais
4. Conduta Esperada dos Colaboradores
5. Relacionamento com Stakeholders (clientes, fornecedores, comunidade)
6. Conflito de Interesses
7. Confidencialidade e Proteção de Dados
8. Uso de Recursos da Empresa
9. Combate à Corrupção e Práticas Antiéticas
10. Canal de Denúncias e Proteção ao Denunciante
11. Consequências para Violações
12. Disposições Finais

Use linguagem formal e profissional. O documento deve estar em português brasileiro e ser completo, pronto para uso.`;

    setCodigoGerado("");

    try {
      const result = await generate({
        tipo: "codigo_etica",
        input_data: { prompt },
        projeto_id: undefined,
        organizacao_id: selectedOrg,
        stream: true,
        onDelta: (chunk) => {
          setCodigoGerado(prev => prev + chunk);
        }
      });

      if (!result.success) {
        throw new Error(result.error || "Erro ao gerar código");
      }
      
      toast.success("Código de Ética gerado com sucesso!");
    } catch (error) {
      console.error("Error generating ethics code:", error);
      toast.error("Erro ao gerar código de ética");
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(codigoGerado);
    toast.success("Código copiado para a área de transferência");
  };

  const handleDownload = () => {
    const blob = new Blob([codigoGerado], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `codigo-etica-${selectedOrgData?.nome?.toLowerCase().replace(/\s+/g, "-") || "organizacao"}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Download iniciado");
  };

  const handleReset = () => {
    setCodigoGerado("");
  };

  return (
    <ConsultorLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gerador de Código de Ética</h1>
          <p className="text-muted-foreground">
            Gere códigos de ética personalizados usando inteligência artificial
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Input Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Dados da Organização
              </CardTitle>
              <CardDescription>
                Preencha as informações para personalizar o código de ética
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Organização *</Label>
                {loadingOrgs ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select value={selectedOrg} onValueChange={setSelectedOrg}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma organização" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizacoes?.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="setor">Setor de Atuação</Label>
                <Input
                  id="setor"
                  placeholder="Ex: Tecnologia, Varejo, Indústria..."
                  value={setor}
                  onChange={(e) => setSetor(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="valores">Valores da Empresa</Label>
                <Textarea
                  id="valores"
                  placeholder="Ex: Integridade, Inovação, Respeito, Sustentabilidade..."
                  value={valores}
                  onChange={(e) => setValores(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contexto">Contexto Adicional</Label>
                <Textarea
                  id="contexto"
                  placeholder="Informações adicionais relevantes para o código..."
                  value={contexto}
                  onChange={(e) => setContexto(e.target.value)}
                  rows={3}
                />
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !selectedOrg}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Gerar Código de Ética
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Output */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Código Gerado
                  </CardTitle>
                  <CardDescription>
                    Resultado da geração com IA
                  </CardDescription>
                </div>
                {codigoGerado && (
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={handleCopy}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleDownload}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleReset}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {codigoGerado ? (
                <ScrollArea className="h-[500px] rounded-md border p-4">
                  <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
                    {codigoGerado}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex items-center justify-center h-[500px] rounded-md border border-dashed">
                  <div className="text-center text-muted-foreground">
                    <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>O código de ética aparecerá aqui</p>
                    <p className="text-sm">Preencha os dados e clique em gerar</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ConsultorLayout>
  );
}