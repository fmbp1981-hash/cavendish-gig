import { useState, useRef } from "react";
import { ClienteLayout } from "@/components/layout/ClienteLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { DocumentoPreviewButton } from "@/components/documentos/DocumentoPreviewButton";
import { GoogleDrivePreviewButton } from "@/components/documentos/GoogleDrivePreviewButton";
import { DocumentoHistorico } from "@/components/documentos/DocumentoHistorico";
import { useClienteProjeto } from "@/hooks/useClienteProjeto";
import { useUploadDocumento } from "@/hooks/useUploadDocumento";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  FileText,
  Download,
  Search,
  FolderOpen,
  FileCheck,
  Calendar,
  Upload,
  Clock,
  AlertCircle,
  CheckCircle2,
  Eye,
  Loader2,
  FileUp,
  Filter,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const faseLabels: Record<string, string> = {
  diagnostico: "Diagnóstico",
  implementacao: "Implementação",
  recorrencia: "Recorrência",
};

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  pendente:    { label: "Pendente",    color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",    icon: Clock },
  enviado:     { label: "Enviado",     color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",    icon: FileUp },
  em_analise:  { label: "Em Análise",  color: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300", icon: Eye },
  aprovado:    { label: "Aprovado",    color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300", icon: CheckCircle2 },
  rejeitado:   { label: "Rejeitado",   color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",        icon: AlertCircle },
};

type DocumentoRow = Database["public"]["Tables"]["documentos"]["Row"];
type DocumentoRequeridoRow = Database["public"]["Tables"]["documentos_requeridos"]["Row"];
type DocumentoRequeridoStatusRow = Database["public"]["Tables"]["documentos_requeridos_status"]["Row"];

type DocumentoComStatus = DocumentoRequeridoStatusRow & {
  documentos_requeridos: Pick<DocumentoRequeridoRow, "id" | "nome" | "descricao" | "fase" | "obrigatorio" | "formatos_aceitos" | "tamanho_maximo_mb"> | null;
  documentos: Pick<DocumentoRow, "id" | "nome" | "url" | "storage_path" | "drive_file_id" | "tipo" | "tamanho_bytes" | "created_at"> | null;
};

export default function RepositorioDocumentos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "pendente" | "enviado" | "aprovado" | "rejeitado">("todos");
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTargetRef = useRef<{ docRequeridoId: string; nome: string } | null>(null);

  const { data: projeto } = useClienteProjeto();
  const uploadMutation = useUploadDocumento();
  const queryClient = useQueryClient();

  // Fetch ALL documents (not just approved) — separate queries to avoid PostgREST FK join issues
  const { data: todosDocumentos, isLoading } = useQuery({
    queryKey: ["repositorio-completo", projeto?.id],
    queryFn: async () => {
      if (!projeto?.id) return [] as DocumentoComStatus[];

      // 1. Fetch all status records
      const { data: statusData, error: statusErr } = await supabase
        .from("documentos_requeridos_status")
        .select("*");

      if (statusErr) throw statusErr;
      if (!statusData || statusData.length === 0) return [] as DocumentoComStatus[];

      // 2. Fetch related documentos_requeridos
      const reqIds = [...new Set(statusData.map((s: any) => s.documento_requerido_id).filter(Boolean))];
      let reqMap = new Map();
      if (reqIds.length > 0) {
        const { data: reqDocs } = await supabase
          .from("documentos_requeridos")
          .select("id, nome, descricao, fase, obrigatorio, formatos_aceitos, tamanho_maximo_mb")
          .in("id", reqIds);
        reqMap = new Map((reqDocs || []).map((d: any) => [d.id, d]));
      }

      // 3. Fetch related uploaded documentos
      const docIds = [...new Set(statusData.map((s: any) => s.documento_id).filter(Boolean))];
      let docMap = new Map();
      if (docIds.length > 0) {
        const { data: docs } = await supabase
          .from("documentos")
          .select("id, nome, url, storage_path, drive_file_id, tipo, tamanho_bytes, created_at")
          .in("id", docIds);
        docMap = new Map((docs || []).map((d: any) => [d.id, d]));
      }

      // 4. Combine in JS
      return statusData.map((s: any) => ({
        ...s,
        documentos_requeridos: reqMap.get(s.documento_requerido_id) || null,
        documentos: s.documento_id ? docMap.get(s.documento_id) || null : null,
      })) as unknown as DocumentoComStatus[];
    },
    enabled: !!projeto?.id,
  });

  // Also fetch pending docs (no status yet)
  const { data: docsRequeridosSemStatus } = useQuery({
    queryKey: ["docs-requeridos-sem-status", projeto?.id, projeto?.organizacao_id],
    queryFn: async (): Promise<Array<{ id: string; nome: string; descricao: string | null; fase: string; obrigatorio: boolean; formatos_aceitos: string; tamanho_maximo_mb: number }>> => {
      if (!projeto?.id || !projeto?.organizacao_id) return [];

      // Get all required docs for this project
      const { data: allRequired, error: reqErr } = await (supabase as any)
        .from("documentos_requeridos")
        .select("id, nome, descricao, fase, obrigatorio, formatos_aceitos, tamanho_maximo_mb")
        .eq("projeto_id", projeto.id);

      if (reqErr) throw reqErr;

      // Get IDs that already have a status
      const { data: existing, error: exErr } = await supabase
        .from("documentos_requeridos_status")
        .select("documento_requerido_id")
        .not("documento_requerido_id", "is", null);

      if (exErr) throw exErr;

      const idsComStatus = new Set(existing?.map(e => e.documento_requerido_id) ?? []);
      return (allRequired ?? []).filter((d: any) => !idsComStatus.has(d.id));
    },
    enabled: !!projeto?.id && !!projeto?.organizacao_id,
  });

  // Combine all documents
  const allDocumentos = [
    ...(todosDocumentos ?? []).map(d => ({
      ...d,
      _status: d.status as string,
      _nome: d.documentos_requeridos?.nome ?? "",
      _fase: d.documentos_requeridos?.fase ?? "outros",
      _docReqId: d.documento_requerido_id,
    })),
    ...(docsRequeridosSemStatus ?? []).map(d => ({
      _status: "pendente" as string,
      _nome: d.nome,
      _fase: d.fase,
      _docReqId: d.id,
      documentos_requeridos: d,
      documentos: null as DocumentoComStatus["documentos"],
      id: d.id,
      documento_requerido_id: d.id,
      documento_id: null,
      status: "pendente" as const,
      observacao: null,
      analisado_por: null,
      analisado_em: null,
      enviado_em: null,
      created_at: "",
      updated_at: "",
    })),
  ];

  // Filter
  const filtered = allDocumentos.filter(doc => {
    if (filtroStatus !== "todos" && doc._status !== filtroStatus) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return doc._nome.toLowerCase().includes(term) || doc.documentos?.nome?.toLowerCase().includes(term);
    }
    return true;
  });

  const groupedByFase = filtered.reduce((acc, doc) => {
    const fase = doc._fase || "outros";
    if (!acc[fase]) acc[fase] = [];
    acc[fase].push(doc);
    return acc;
  }, {} as Record<string, typeof filtered>);

  // Stats
  const stats = {
    total: allDocumentos.length,
    pendentes: allDocumentos.filter(d => d._status === "pendente").length,
    enviados: allDocumentos.filter(d => d._status === "enviado" || d._status === "em_analise").length,
    aprovados: allDocumentos.filter(d => d._status === "aprovado").length,
    rejeitados: allDocumentos.filter(d => d._status === "rejeitado").length,
  };
  const progressPercent = stats.total > 0 ? Math.round((stats.aprovados / stats.total) * 100) : 0;

  const handleUploadClick = (docRequeridoId: string, nome: string) => {
    uploadTargetRef.current = { docRequeridoId, nome };
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTargetRef.current || !projeto) return;

    const { docRequeridoId, nome } = uploadTargetRef.current;
    setUploadingDocId(docRequeridoId);

    try {
      await uploadMutation.mutateAsync({
        file,
        documentoRequeridoId: docRequeridoId,
        projetoId: projeto.id,
        organizacaoId: projeto.organizacao_id,
        nomeDocumento: nome,
      });
      toast.success(`"${file.name}" enviado com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ["repositorio-completo"] });
      queryClient.invalidateQueries({ queryKey: ["docs-requeridos-sem-status"] });
    } catch {
      toast.error("Erro ao enviar documento. Tente novamente.");
    } finally {
      setUploadingDocId(null);
      uploadTargetRef.current = null;
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

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

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "";
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
  };

  return (
    <ClienteLayout>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelected}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.zip"
      />

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Repositório de Documentos</h1>
          <p className="text-muted-foreground">
            Envie, acompanhe e acesse todos os documentos do seu projeto
          </p>
        </div>

        {/* Progress Overview */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium">Progresso de Documentação</p>
                <p className="text-xs text-muted-foreground">{stats.aprovados} de {stats.total} documentos aprovados</p>
              </div>
              <span className="text-2xl font-bold text-primary">{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-2.5" />
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
          {[
            { label: "Pendentes",  value: stats.pendentes,  icon: Clock,        color: "text-gray-600",  bg: "bg-gray-100 dark:bg-gray-800" },
            { label: "Enviados",   value: stats.enviados,   icon: FileUp,       color: "text-blue-600",  bg: "bg-blue-100 dark:bg-blue-900" },
            { label: "Aprovados",  value: stats.aprovados,  icon: CheckCircle2, color: "text-green-600", bg: "bg-green-100 dark:bg-green-900" },
            { label: "Rejeitados", value: stats.rejeitados, icon: AlertCircle,  color: "text-red-600",   bg: "bg-red-100 dark:bg-red-900" },
          ].map(s => (
            <Card key={s.label} className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setFiltroStatus(filtroStatus === s.label.toLowerCase().replace("s", "").replace("ado", "ado") as any ? "todos" : s.label === "Enviados" ? "enviado" : s.label === "Pendentes" ? "pendente" : s.label === "Aprovados" ? "aprovado" : "rejeitado")}
            >
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${s.bg}`}>
                    <s.icon className={`h-4 w-4 ${s.color}`} />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar documentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Tabs value={filtroStatus} onValueChange={(v) => setFiltroStatus(v as typeof filtroStatus)}>
            <TabsList>
              <TabsTrigger value="todos">Todos</TabsTrigger>
              <TabsTrigger value="pendente">Pendentes</TabsTrigger>
              <TabsTrigger value="enviado">Enviados</TabsTrigger>
              <TabsTrigger value="aprovado">Aprovados</TabsTrigger>
              <TabsTrigger value="rejeitado">Rejeitados</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Documents by Phase */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedByFase).map(([fase, docs]) => (
              <Card key={fase}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FolderOpen className="h-5 w-5" />
                    {faseLabels[fase] || fase}
                  </CardTitle>
                  <CardDescription>
                    {docs?.length} documento(s)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {docs?.map((doc) => {
                      const sc = statusConfig[doc._status] || statusConfig.pendente;
                      const StatusIcon = sc.icon;
                      const isUploading = uploadingDocId === doc._docReqId;
                      const isPendente = doc._status === "pendente";
                      const isRejeitado = doc._status === "rejeitado";

                      return (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className={`p-2 rounded-lg ${isPendente ? "bg-muted" : "bg-primary/10"}`}>
                              <FileText className={`h-5 w-5 ${isPendente ? "text-muted-foreground" : "text-primary"}`} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium truncate">{doc._nome}</p>
                                {doc.documentos_requeridos?.obrigatorio && (
                                  <Badge variant="outline" className="text-[10px] shrink-0">Obrigatório</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                                {doc.documentos?.nome && <span className="truncate">{doc.documentos.nome}</span>}
                                {doc.documentos?.tamanho_bytes && (
                                  <><span>•</span><span>{formatFileSize(doc.documentos.tamanho_bytes)}</span></>
                                )}
                                {!doc.documentos && isPendente && (
                                  <span className="text-xs italic">Aguardando envio</span>
                                )}
                              </div>
                              {(doc as any).observacao && isRejeitado && (
                                <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3 shrink-0" />
                                  <span className="truncate">{(doc as any).observacao}</span>
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0 ml-4">
                            {/* Date */}
                            {doc.documentos?.created_at && (
                              <div className="text-right text-xs text-muted-foreground hidden md:block">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(doc.documentos.created_at), "dd/MM/yyyy", { locale: ptBR })}
                                </div>
                              </div>
                            )}

                            {/* Status Badge */}
                            <Badge className={`${sc.color} shrink-0`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {sc.label}
                            </Badge>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-1.5">
                              {/* Upload button for Pending or Rejected docs */}
                              {(isPendente || isRejeitado) && (
                                <Button
                                  size="sm"
                                  onClick={() => handleUploadClick(doc._docReqId, doc._nome)}
                                  disabled={isUploading}
                                  className="gap-1.5"
                                >
                                  {isUploading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Upload className="h-4 w-4" />
                                  )}
                                  {isUploading ? "Enviando..." : isPendente ? "Enviar" : "Reenviar"}
                                </Button>
                              )}

                              {/* Preview / View buttons */}
                              {doc.documentos?.id && (
                                <DocumentoHistorico
                                  documentoId={doc.documentos.id}
                                  documentoNome={doc.documentos.nome}
                                />
                              )}
                              {(doc.documentos?.url || doc.documentos?.storage_path) && (
                                <DocumentoPreviewButton
                                  url={doc.documentos.url}
                                  storagePath={doc.documentos.storage_path}
                                  fileName={doc.documentos.nome}
                                />
                              )}
                              {doc.documentos?.drive_file_id && (
                                <GoogleDrivePreviewButton
                                  driveFileId={doc.documentos.drive_file_id}
                                  fileName={doc.documentos.nome}
                                />
                              )}
                              {doc.documentos?.storage_path && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownload(doc.documentos!.storage_path!, doc.documentos!.nome)}
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  Baixar
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileCheck className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">
                {searchTerm || filtroStatus !== "todos" ? "Nenhum documento encontrado" : "Nenhum documento no repositório"}
              </h3>
              <p className="text-muted-foreground text-center max-w-md mt-2">
                {searchTerm || filtroStatus !== "todos"
                  ? "Ajuste os filtros para encontrar seus documentos."
                  : "Os documentos enviados e aprovados aparecerão aqui. Acesse 'Documentos Necessários' para enviar os documentos solicitados."
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </ClienteLayout>
  );
}