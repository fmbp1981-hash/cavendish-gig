import { useState, useCallback, useRef } from "react";
import { ConsultorLayout } from "@/components/layout/ConsultorLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Sparkles, Copy, Download, RefreshCw, Building2, Upload, X, FileText, Image, Music, Loader2 } from "lucide-react";

interface ArquivoReferencia {
  file: File;
  textoExtraido?: string;
  status: "pendente" | "processando" | "pronto" | "erro";
}

function getTipoIcone(tipo: string) {
  if (tipo.startsWith("audio/")) return <Music className="h-4 w-4" />;
  if (tipo.startsWith("image/")) return <Image className="h-4 w-4" />;
  return <FileText className="h-4 w-4" />;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function extrairTextoPDF(file: File): Promise<string> {
  try {
    const text = await file.text();
    // Basic text extraction - works for text-based PDFs
    const cleaned = text.replace(/[^\x20-\x7E\xA0-\xFF\n\r\t]/g, " ").replace(/\s+/g, " ").trim();
    if (cleaned.length > 100) return cleaned.slice(0, 15000);
    return `[Arquivo PDF: ${file.name} — conteúdo binário não extraível client-side]`;
  } catch {
    return `[Arquivo PDF: ${file.name}]`;
  }
}

export default function ConsultorCodigoEtica() {
  const [selectedOrg, setSelectedOrg] = useState<string>("");
  const [setor, setSetor] = useState("");
  const [valores, setValores] = useState("");
  const [contexto, setContexto] = useState("");
  const [codigoGerado, setCodigoGerado] = useState("");
  const [arquivos, setArquivos] = useState<ArquivoReferencia[]>([]);
  const [processandoArquivos, setProcessandoArquivos] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: organizacoes, isLoading: loadingOrgs } = useOrganizacoes();
  const { generate, loading: isGenerating } = useAIGenerate();

  const selectedOrgData = organizacoes?.find(org => org.id === selectedOrg);

  const processarArquivo = useCallback(async (file: File): Promise<string> => {
    const tipo = file.type;
    if (tipo === "application/pdf") {
      return await extrairTextoPDF(file);
    }
    if (tipo.startsWith("image/")) {
      return `[Imagem anexada: ${file.name} (${formatFileSize(file.size)})]`;
    }
    if (tipo.startsWith("audio/")) {
      // Transcrição via Whisper API (edge function)
      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1] || "");
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const result = await generate({
          tipo: "transcrever_audio",
          input_data: {
            audio_base64: base64,
            audio_filename: file.name,
            audio_mimetype: file.type,
          },
        });

        if (result.success && result.output) {
          return `[Transcrição do áudio "${file.name}"]:\n${result.output}`;
        }
        return `[Áudio: ${file.name} — transcrição não disponível]`;
      } catch {
        return `[Áudio: ${file.name} — erro na transcrição]`;
      }
    }
    // Text files
    try {
      const text = await file.text();
      return text.slice(0, 15000);
    } catch {
      return `[Arquivo: ${file.name}]`;
    }
  }, [generate]);

  const adicionarArquivos = useCallback(async (files: FileList | File[]) => {
    const novosArquivos: ArquivoReferencia[] = Array.from(files)
      .filter(f => {
        const tipoValido = f.type.startsWith("audio/") || f.type.startsWith("image/") ||
          f.type === "application/pdf" || f.type.startsWith("text/");
        const tamanhoValido = f.size <= 25 * 1024 * 1024; // 25MB max
        if (!tipoValido) toast.error(`Tipo não suportado: ${f.name}`);
        if (!tamanhoValido) toast.error(`Arquivo muito grande: ${f.name} (máx. 25MB)`);
        return tipoValido && tamanhoValido;
      })
      .map(f => ({ file: f, status: "pendente" as const }));

    if (novosArquivos.length === 0) return;
    setArquivos(prev => [...prev, ...novosArquivos]);
    setProcessandoArquivos(true);

    for (const arq of novosArquivos) {
      setArquivos(prev => prev.map(a =>
        a.file === arq.file ? { ...a, status: "processando" } : a
      ));
      try {
        const texto = await processarArquivo(arq.file);
        setArquivos(prev => prev.map(a =>
          a.file === arq.file ? { ...a, textoExtraido: texto, status: "pronto" } : a
        ));
      } catch {
        setArquivos(prev => prev.map(a =>
          a.file === arq.file ? { ...a, status: "erro" } : a
        ));
      }
    }
    setProcessandoArquivos(false);
  }, [processarArquivo]);

  const removerArquivo = (index: number) => {
    setArquivos(prev => prev.filter((_, i) => i !== index));
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.length) adicionarArquivos(e.dataTransfer.files);
  }, [adicionarArquivos]);

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

${arquivos.filter(a => a.textoExtraido).length > 0
  ? `**Material de Referência (arquivos carregados):**\n${arquivos.filter(a => a.textoExtraido).map(a => a.textoExtraido).join("\n\n")}`
  : ""}

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

    const contextoArquivos = arquivos
      .filter(a => a.textoExtraido)
      .map(a => a.textoExtraido)
      .join("\n\n");

    try {
      const result = await generate({
        tipo: "codigo_etica",
        input_data: {
          prompt,
          ...(contextoArquivos ? { contexto_arquivos: contextoArquivos } : {}),
        },
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

              {/* Área de Upload de Arquivos */}
              <div className="space-y-2">
                <Label>Arquivos de Referência</Label>
                <p className="text-xs text-muted-foreground">
                  Carregue PDFs, imagens ou áudios para a IA usar como referência
                </p>
                <div
                  className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
                    dragActive
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="application/pdf,image/*,audio/*,text/*"
                    onChange={(e) => {
                      if (e.target.files?.length) adicionarArquivos(e.target.files);
                      e.target.value = "";
                    }}
                    className="hidden"
                  />
                  <Upload className="mx-auto h-6 w-6 text-muted-foreground mb-1" />
                  <p className="text-sm text-muted-foreground">
                    Arraste arquivos ou clique para selecionar
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, imagens, áudios (máx. 25MB cada)
                  </p>
                </div>
                {arquivos.length > 0 && (
                  <div className="space-y-1.5 mt-2">
                    {arquivos.map((arq, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-muted/50 rounded-md px-3 py-1.5 text-sm">
                        {getTipoIcone(arq.file.type)}
                        <span className="truncate flex-1">{arq.file.name}</span>
                        <span className="text-xs text-muted-foreground">{formatFileSize(arq.file.size)}</span>
                        {arq.status === "processando" && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                        {arq.status === "pronto" && <Badge variant="secondary" className="text-xs">Pronto</Badge>}
                        {arq.status === "erro" && <Badge variant="destructive" className="text-xs">Erro</Badge>}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => { e.stopPropagation(); removerArquivo(idx); }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || processandoArquivos || !selectedOrg}
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