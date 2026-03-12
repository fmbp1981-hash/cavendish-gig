import { useState } from "react";
import { CheckCircle2, XCircle, FileText, ExternalLink, Sparkles, RefreshCw, Brain, ShieldAlert, FileSearch, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentoPreviewButton } from "@/components/documentos/DocumentoPreviewButton";
import { GoogleDrivePreviewButton } from "@/components/documentos/GoogleDrivePreviewButton";
import { DocumentoHistorico } from "@/components/documentos/DocumentoHistorico";
import { useAIGenerate } from "@/hooks/useAIGenerate";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DocumentoInfo {
  id: string;
  nome: string;
  descricao?: string;
  criterios_aceitacao?: string;
}

interface StatusInfo {
  id: string;
  status: string;
  updated_at?: string;
}

interface DocumentoArquivoInfo {
  id: string;
  nome: string;
  url?: string | null;
  drive_file_id?: string | null;
  storage_path?: string | null;
}

interface DocumentoAnaliseModalProps {
  documento: DocumentoInfo;
  status: StatusInfo;
  documentoUrl?: string;
  documentoArquivo?: DocumentoArquivoInfo;
  open: boolean;
  onClose: () => void;
  onAprovar: () => Promise<void>;
  onRejeitar: (observacao: string) => Promise<void>;
  isLoading?: boolean;
}

interface AIAnalysisResult {
  tipo: "aprovar" | "rejeitar";
  justificativa: string;
}

export function DocumentoAnaliseModal({
  documento,
  status,
  documentoUrl,
  documentoArquivo,
  open,
  onClose,
  onAprovar,
  onRejeitar,
  isLoading = false,
}: DocumentoAnaliseModalProps) {
  const [showRejeicaoForm, setShowRejeicaoForm] = useState(false);
  const [observacao, setObservacao] = useState("");
  const [aiSugestao, setAiSugestao] = useState<AIAnalysisResult | null>(null);
  const [aiResumo, setAiResumo] = useState<string | null>(null);
  const [aiRiscos, setAiRiscos] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState<"analise" | "resumo" | "riscos" | null>(null);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { generate } = useAIGenerate();

  const handleDownload = async (storagePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage.from("documentos").download(storagePath);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Erro ao baixar documento");
    }
  };

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // ---- AI Analysis: Quick Decision ----
  const handleAnaliseIA = async () => {
    setLoadingAI("analise");
    setAiSugestao(null);

    try {
      const result = await generate({
        tipo: "analise_documento",
        input_data: {
          tipo_documento: documento.nome,
          nome_documento: documento.nome,
          conteudo: documento.descricao || "Documento enviado pelo cliente para análise de compliance",
          criterios: documento.criterios_aceitacao,
        },
        stream: false,
      });

      if (result.success && result.output) {
        try {
          const jsonMatch = result.output.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            setAiSugestao({
              tipo: parsed.tipo === "rejeitar" ? "rejeitar" : "aprovar",
              justificativa: parsed.justificativa || result.output,
            });
          } else {
            setAiSugestao({ tipo: "aprovar", justificativa: result.output });
          }
        } catch {
          setAiSugestao({ tipo: "aprovar", justificativa: result.output });
        }
      }
    } catch {
      toast.error("Erro ao analisar documento com IA");
    } finally {
      setLoadingAI(null);
      setShowAIPanel(true);
    }
  };

  // ---- AI: Executive Summary ----
  const handleResumoIA = async () => {
    setLoadingAI("resumo");

    try {
      const result = await generate({
        tipo: "sumarizar_documento",
        input_data: {
          tipo_documento: documento.nome,
          nome_documento: documento.nome,
          conteudo: documento.descricao || "Documento de compliance enviado pelo cliente para análise. Tipo: " + documento.nome,
        },
        stream: false,
      });

      if (result.success && result.output) {
        setAiResumo(result.output);
      }
    } catch {
      toast.error("Erro ao gerar resumo com IA");
    } finally {
      setLoadingAI(null);
      setShowAIPanel(true);
    }
  };

  // ---- AI: Risk Detection ----
  const handleDeteccaoRiscos = async () => {
    setLoadingAI("riscos");

    try {
      const result = await generate({
        tipo: "detectar_riscos",
        input_data: {
          contexto: `Análise de riscos para o documento "${documento.nome}" enviado por um cliente como parte do projeto de compliance.`,
          area: "Compliance e Governança Corporativa",
          conteudo: documento.descricao || "Documento de compliance enviado para diagnóstico. " + (documento.criterios_aceitacao || ""),
        },
        stream: false,
      });

      if (result.success && result.output) {
        setAiRiscos(result.output);
      }
    } catch {
      toast.error("Erro ao detectar riscos com IA");
    } finally {
      setLoadingAI(null);
      setShowAIPanel(true);
    }
  };

  const handleAprovar = async () => {
    await onAprovar();
    onClose();
  };

  const handleRejeitar = async () => {
    if (!observacao.trim()) return;
    await onRejeitar(observacao);
    setObservacao("");
    setShowRejeicaoForm(false);
    onClose();
  };

  const handleClose = () => {
    setShowRejeicaoForm(false);
    setObservacao("");
    setAiSugestao(null);
    setAiResumo(null);
    setAiRiscos(null);
    setShowAIPanel(false);
    onClose();
  };

  const handleUseSugestao = () => {
    if (aiSugestao?.tipo === "rejeitar") {
      setObservacao(aiSugestao.justificativa);
      setShowRejeicaoForm(true);
    }
  };

  const hasAnyAIResult = aiSugestao || aiResumo || aiRiscos;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Analisar Documento</DialogTitle>
          <DialogDescription>{documento.nome}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-4 py-4">
            {/* Document Preview Link */}
            <div className="bg-muted rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">{documento.nome}</p>
                    {status.updated_at && (
                      <p className="text-sm text-muted-foreground">
                        Enviado em {new Date(status.updated_at).toLocaleDateString("pt-BR")}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {documentoArquivo?.id && (
                    <DocumentoHistorico
                      documentoId={documentoArquivo.id}
                      documentoNome={documentoArquivo.nome}
                    />
                  )}
                  {(documentoArquivo?.url || null) && (
                    <DocumentoPreviewButton
                      url={documentoArquivo?.url ?? null}
                      fileName={documentoArquivo?.nome ?? documento.nome}
                    />
                  )}
                  {(documentoArquivo?.drive_file_id || null) && (
                    <GoogleDrivePreviewButton
                      driveFileId={documentoArquivo?.drive_file_id ?? null}
                      fileName={documentoArquivo?.nome ?? documento.nome}
                    />
                  )}
                  {documentoArquivo?.storage_path && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(documentoArquivo.storage_path!, documentoArquivo.nome)}
                    >
                      Baixar
                    </Button>
                  )}
                  {!documentoArquivo?.url && !documentoArquivo?.drive_file_id && !documentoArquivo?.storage_path && documentoUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={documentoUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Abrir
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* AI Analysis Buttons */}
            {!showRejeicaoForm && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Sparkles className="h-4 w-4" />
                  Análise com Inteligência Artificial
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAnaliseIA}
                    disabled={loadingAI !== null}
                    className="flex flex-col items-center py-3 h-auto gap-1.5"
                  >
                    {loadingAI === "analise" ? (
                      <RefreshCw className="h-5 w-5 animate-spin text-primary" />
                    ) : (
                      <FileSearch className="h-5 w-5 text-primary" />
                    )}
                    <span className="text-xs">Análise Rápida</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResumoIA}
                    disabled={loadingAI !== null}
                    className="flex flex-col items-center py-3 h-auto gap-1.5"
                  >
                    {loadingAI === "resumo" ? (
                      <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
                    ) : (
                      <Brain className="h-5 w-5 text-blue-600" />
                    )}
                    <span className="text-xs">Resumo Executivo</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeteccaoRiscos}
                    disabled={loadingAI !== null}
                    className="flex flex-col items-center py-3 h-auto gap-1.5"
                  >
                    {loadingAI === "riscos" ? (
                      <RefreshCw className="h-5 w-5 animate-spin text-amber-600" />
                    ) : (
                      <ShieldAlert className="h-5 w-5 text-amber-600" />
                    )}
                    <span className="text-xs">Detectar Riscos</span>
                  </Button>
                </div>
              </div>
            )}

            {/* AI Results Panel */}
            {hasAnyAIResult && !showRejeicaoForm && (
              <div className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => setShowAIPanel(!showAIPanel)}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 hover:from-purple-100 hover:to-blue-100 dark:hover:from-purple-950/50 dark:hover:to-blue-950/50 transition-colors"
                >
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    Resultados da IA
                  </div>
                  {showAIPanel ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>

                {showAIPanel && (
                  <div className="p-4 space-y-4 bg-card">
                    {/* Quick Analysis Result */}
                    {aiSugestao && (
                      <div className={`rounded-lg p-3 border ${aiSugestao.tipo === "aprovar" ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30" : "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30"}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <FileSearch className="h-4 w-4" />
                            <span className="text-sm font-medium">Análise Rápida</span>
                            <Badge variant={aiSugestao.tipo === "aprovar" ? "default" : "destructive"} className="text-[10px]">
                              {aiSugestao.tipo === "aprovar" ? "✓ Aprovar" : "✗ Rejeitar"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(aiSugestao.justificativa, "analise")}>
                              {copiedField === "analise" ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                            </Button>
                            {aiSugestao.tipo === "rejeitar" && (
                              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleUseSugestao}>
                                Usar como motivo
                              </Button>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-foreground/80 whitespace-pre-line">{aiSugestao.justificativa}</p>
                      </div>
                    )}

                    {/* Executive Summary Result */}
                    {aiResumo && (
                      <div className="rounded-lg p-3 border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Brain className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium">Resumo Executivo</span>
                          </div>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(aiResumo, "resumo")}>
                            {copiedField === "resumo" ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                        <div className="text-sm text-foreground/80 whitespace-pre-line max-h-48 overflow-y-auto">{aiResumo}</div>
                      </div>
                    )}

                    {/* Risk Detection Result */}
                    {aiRiscos && (
                      <div className="rounded-lg p-3 border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <ShieldAlert className="h-4 w-4 text-amber-600" />
                            <span className="text-sm font-medium">Detecção de Riscos</span>
                          </div>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(aiRiscos, "riscos")}>
                            {copiedField === "riscos" ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                        <div className="text-sm text-foreground/80 whitespace-pre-line max-h-48 overflow-y-auto">{aiRiscos}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Rejeição Form */}
            {showRejeicaoForm && (
              <div className="space-y-3">
                <Label htmlFor="observacao">Motivo da rejeição *</Label>
                <Textarea
                  id="observacao"
                  placeholder="Descreva o motivo da rejeição e o que precisa ser corrigido..."
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {showRejeicaoForm ? (
            <>
              <Button
                variant="outline"
                onClick={() => setShowRejeicaoForm(false)}
                disabled={isLoading}
              >
                Voltar
              </Button>
              <Button
                variant="destructive"
                onClick={handleRejeitar}
                disabled={!observacao.trim() || isLoading}
              >
                {isLoading ? "Processando..." : "Confirmar Rejeição"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                Cancelar
              </Button>
              <Button
                variant="outline"
                className="text-destructive border-destructive hover:bg-destructive/10"
                onClick={() => setShowRejeicaoForm(true)}
                disabled={isLoading}
              >
                <XCircle className="w-4 h-4 mr-1" />
                Rejeitar
              </Button>
              <Button onClick={handleAprovar} disabled={isLoading}>
                <CheckCircle2 className="w-4 h-4 mr-1" />
                {isLoading ? "Processando..." : "Aprovar"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}