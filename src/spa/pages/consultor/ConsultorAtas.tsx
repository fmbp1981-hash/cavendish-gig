import { useState } from "react";
import { ConsultorLayout } from "@/components/layout/ConsultorLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
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
import { Sparkles, Copy, Download, RefreshCw, FileText, Plus, X, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Participante {
  nome: string;
  cargo: string;
}

export default function ConsultorAtas() {
  const [selectedOrg, setSelectedOrg] = useState<string>("");
  const [dataReuniao, setDataReuniao] = useState(format(new Date(), "yyyy-MM-dd"));
  const [horaInicio, setHoraInicio] = useState("09:00");
  const [horaFim, setHoraFim] = useState("10:00");
  const [local, setLocal] = useState("");
  const [assunto, setAssunto] = useState("");
  const [participantes, setParticipantes] = useState<Participante[]>([{ nome: "", cargo: "" }]);
  const [notas, setNotas] = useState("");
  const [ataGerada, setAtaGerada] = useState("");

  const { data: organizacoes, isLoading: loadingOrgs } = useOrganizacoes();
  const { generate, loading: isGenerating } = useAIGenerate();

  const selectedOrgData = organizacoes?.find(org => org.id === selectedOrg);

  const addParticipante = () => {
    setParticipantes([...participantes, { nome: "", cargo: "" }]);
  };

  const removeParticipante = (index: number) => {
    if (participantes.length > 1) {
      setParticipantes(participantes.filter((_, i) => i !== index));
    }
  };

  const updateParticipante = (index: number, field: keyof Participante, value: string) => {
    const updated = [...participantes];
    updated[index][field] = value;
    setParticipantes(updated);
  };

  const handleGenerate = async () => {
    if (!selectedOrg) {
      toast.error("Selecione uma organização");
      return;
    }
    if (!assunto.trim()) {
      toast.error("Informe o assunto da reunião");
      return;
    }
    if (!notas.trim()) {
      toast.error("Informe as notas/pontos discutidos");
      return;
    }

    const participantesText = participantes
      .filter(p => p.nome.trim())
      .map(p => `- ${p.nome}${p.cargo ? ` (${p.cargo})` : ""}`)
      .join("\n");

    const dataFormatada = format(new Date(dataReuniao), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

    const prompt = `Você é um especialista em Governança Corporativa. Gere uma ata de reunião profissional e formal com base nas seguintes informações:

**Organização:** ${selectedOrgData?.nome}
**Data:** ${dataFormatada}
**Horário:** ${horaInicio} às ${horaFim}
**Local:** ${local || "Não especificado"}
**Assunto:** ${assunto}

**Participantes:**
${participantesText || "Não especificados"}

**Notas e Pontos Discutidos:**
${notas}

A ata deve conter:
1. Cabeçalho com informações da reunião
2. Lista de presença
3. Pauta da reunião
4. Desenvolvimento (discussões e deliberações)
5. Encaminhamentos e responsáveis
6. Encerramento
7. Espaço para assinaturas

Use linguagem formal. O documento deve estar em português brasileiro, bem formatado em markdown.`;

    setAtaGerada("");

    try {
      const result = await generate({
        tipo: "gerar_ata",
        input_data: { prompt },
        projeto_id: undefined,
        organizacao_id: selectedOrg,
        stream: true,
        onDelta: (chunk) => {
          setAtaGerada(prev => prev + chunk);
        }
      });

      if (!result.success) {
        throw new Error(result.error || "Erro ao gerar ata");
      }
      
      toast.success("Ata gerada com sucesso!");
    } catch (error) {
      console.error("Error generating ata:", error);
      toast.error("Erro ao gerar ata");
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(ataGerada);
    toast.success("Ata copiada para a área de transferência");
  };

  const handleDownload = () => {
    const blob = new Blob([ataGerada], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ata-${dataReuniao}-${assunto.toLowerCase().replace(/\s+/g, "-").slice(0, 30)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Download iniciado");
  };

  const handleReset = () => {
    setAtaGerada("");
  };

  return (
    <ConsultorLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gerador de Atas de Reunião</h1>
          <p className="text-muted-foreground">
            Gere atas de reunião formatadas usando inteligência artificial
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Input Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Dados da Reunião
              </CardTitle>
              <CardDescription>
                Preencha as informações para gerar a ata
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Organização *</Label>
                  {loadingOrgs ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select value={selectedOrg} onValueChange={setSelectedOrg}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
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
                  <Label htmlFor="data">Data *</Label>
                  <Input
                    id="data"
                    type="date"
                    value={dataReuniao}
                    onChange={(e) => setDataReuniao(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="horaInicio">Início</Label>
                  <Input
                    id="horaInicio"
                    type="time"
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="horaFim">Término</Label>
                  <Input
                    id="horaFim"
                    type="time"
                    value={horaFim}
                    onChange={(e) => setHoraFim(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="local">Local</Label>
                  <Input
                    id="local"
                    placeholder="Sala de reunião..."
                    value={local}
                    onChange={(e) => setLocal(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assunto">Assunto da Reunião *</Label>
                <Input
                  id="assunto"
                  placeholder="Ex: Revisão do Código de Ética"
                  value={assunto}
                  onChange={(e) => setAssunto(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Participantes</Label>
                  <Button variant="ghost" size="sm" onClick={addParticipante}>
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                </div>
                <div className="space-y-2">
                  {participantes.map((p, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="Nome"
                        value={p.nome}
                        onChange={(e) => updateParticipante(index, "nome", e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        placeholder="Cargo"
                        value={p.cargo}
                        onChange={(e) => updateParticipante(index, "cargo", e.target.value)}
                        className="flex-1"
                      />
                      {participantes.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeParticipante(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notas">Notas e Pontos Discutidos *</Label>
                <Textarea
                  id="notas"
                  placeholder="Descreva os principais pontos discutidos, decisões tomadas, pendências..."
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  rows={6}
                />
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !selectedOrg || !assunto || !notas}
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
                    Gerar Ata de Reunião
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
                    Ata Gerada
                  </CardTitle>
                  <CardDescription>
                    Resultado da geração com IA
                  </CardDescription>
                </div>
                {ataGerada && (
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
              {ataGerada ? (
                <ScrollArea className="h-[600px] rounded-md border p-4">
                  <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
                    {ataGerada}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex items-center justify-center h-[600px] rounded-md border border-dashed">
                  <div className="text-center text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>A ata de reunião aparecerá aqui</p>
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