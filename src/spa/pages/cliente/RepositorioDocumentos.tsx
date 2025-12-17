import { useState } from "react";
import { ClienteLayout } from "@/components/layout/ClienteLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DocumentoPreviewButton } from "@/components/documentos/DocumentoPreviewButton";
import { DocumentoHistorico } from "@/components/documentos/DocumentoHistorico";
import { useClienteProjeto } from "@/hooks/useClienteProjeto";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  FileText,
  Download,
  Search,
  FolderOpen,
  FileCheck,
  Calendar
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const faseLabels: Record<string, string> = {
  diagnostico: "Diagnóstico",
  implementacao: "Implementação",
  recorrencia: "Recorrência",
};

export default function RepositorioDocumentos() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: projeto } = useClienteProjeto();

  const { data: documentosAprovados, isLoading } = useQuery({
    queryKey: ["documentos-aprovados", projeto?.id],
    queryFn: async () => {
      if (!projeto?.id) return [];

      const { data, error } = await supabase
        .from("documentos_requeridos_status")
        .select(`
          *,
          documentos_requeridos (
            id,
            nome,
            descricao,
            fase
          ),
          documentos (
            id,
            nome,
            url,
            storage_path,
            tipo,
            tamanho_bytes,
            created_at
          )
        `)
        .eq("status", "aprovado")
        .not("documento_id", "is", null);

      if (error) throw error;

      // Filter by project
      const filtered = data?.filter(d => 
        d.documentos_requeridos?.fase && 
        d.documentos
      );

      return filtered || [];
    },
    enabled: !!projeto?.id,
  });

  const filteredDocuments = documentosAprovados?.filter(doc =>
    doc.documentos_requeridos?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.documentos?.nome?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedByFase = filteredDocuments?.reduce((acc, doc) => {
    const fase = doc.documentos_requeridos?.fase || "outros";
    if (!acc[fase]) acc[fase] = [];
    acc[fase].push(doc);
    return acc;
  }, {} as Record<string, typeof filteredDocuments>);

  const handleDownload = async (storagePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("documentos")
        .download(storagePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading:", error);
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
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Repositório de Documentos</h1>
          <p className="text-muted-foreground">
            Acesse todos os documentos aprovados do seu projeto
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar documentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Aprovados</CardTitle>
              <FileCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {documentosAprovados?.length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Documents by Phase */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : filteredDocuments && filteredDocuments.length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedByFase || {}).map(([fase, docs]) => (
              <Card key={fase}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FolderOpen className="h-5 w-5" />
                    {faseLabels[fase] || fase}
                  </CardTitle>
                  <CardDescription>
                    {docs?.length} documento(s) aprovado(s)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {docs?.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                            <FileText className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium">{doc.documentos_requeridos?.nome}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{doc.documentos?.nome}</span>
                              {doc.documentos?.tamanho_bytes && (
                                <>
                                  <span>•</span>
                                  <span>{formatFileSize(doc.documentos.tamanho_bytes)}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {doc.analisado_em && format(new Date(doc.analisado_em), "dd/MM/yyyy", { locale: ptBR })}
                            </div>
                          </div>
                          <Badge variant="default" className="bg-green-600">
                            Aprovado
                          </Badge>
                          <div className="flex items-center gap-2">
                            {doc.documentos?.id && (
                              <DocumentoHistorico
                                documentoId={doc.documentos.id}
                                documentoNome={doc.documentos.nome}
                              />
                            )}
                            {doc.documentos?.url && (
                              <DocumentoPreviewButton
                                url={doc.documentos.url}
                                fileName={doc.documentos.nome}
                              />
                            )}
                            {doc.documentos?.storage_path && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownload(
                                  doc.documentos!.storage_path!,
                                  doc.documentos!.nome
                                )}
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Baixar
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileCheck className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Nenhum documento aprovado</h3>
              <p className="text-muted-foreground text-center max-w-md mt-2">
                Os documentos aprovados aparecerão aqui. Continue enviando os documentos necessários para análise.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </ClienteLayout>
  );
}