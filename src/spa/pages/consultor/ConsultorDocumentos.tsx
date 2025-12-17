import { useState, useMemo } from "react";
import { ConsultorLayout } from "@/components/layout/ConsultorLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useDocumentosPendentes } from "@/hooks/useConsultorData";
import { DocumentoAnaliseModal } from "@/components/documentos/DocumentoAnaliseModal";
import { useAprovarDocumento, useRejeitarDocumento } from "@/hooks/useAnaliseDocumento";
import { FileText, Search, Eye, CheckCircle, Clock, Building2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const faseLabels: Record<string, string> = {
  diagnostico: "Diagnóstico",
  implementacao: "Implementação",
  recorrencia: "Recorrência",
};

export default function ConsultorDocumentos() {
  const [search, setSearch] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const { data: documentos, isLoading, refetch } = useDocumentosPendentes();

  const filteredDocumentos = useMemo(() => {
    if (!documentos) return [];
    if (!search) return documentos;
    
    const searchLower = search.toLowerCase();
    return documentos.filter((doc: any) => 
      doc.documentos_requeridos?.nome?.toLowerCase().includes(searchLower) ||
      doc.documentos_requeridos?.projetos?.organizacoes?.nome?.toLowerCase().includes(searchLower)
    );
  }, [documentos, search]);

  const aprovarMutation = useAprovarDocumento();
  const rejeitarMutation = useRejeitarDocumento();

  const handleAprovar = async () => {
    if (!selectedDoc) return;
    try {
      await aprovarMutation.mutateAsync(selectedDoc.id);
      toast.success("Documento aprovado com sucesso!");
      setSelectedDoc(null);
      refetch();
    } catch (error) {
      toast.error("Erro ao aprovar documento");
    }
  };

  const handleRejeitar = async (observacao: string) => {
    if (!selectedDoc) return;
    try {
      await rejeitarMutation.mutateAsync({ statusId: selectedDoc.id, observacao });
      toast.success("Documento rejeitado");
      setSelectedDoc(null);
      refetch();
    } catch (error) {
      toast.error("Erro ao rejeitar documento");
    }
  };

  return (
    <ConsultorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Documentos para Análise</h1>
            <p className="text-muted-foreground">Revise e aprove documentos enviados pelos clientes</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar documento ou cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {filteredDocumentos.filter((d: any) => d.status === "enviado").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Novos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {filteredDocumentos.filter((d: any) => d.status === "em_analise").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Em Análise</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{filteredDocumentos.length}</p>
                  <p className="text-sm text-muted-foreground">Total Pendente</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Documents list */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : filteredDocumentos.length > 0 ? (
          <div className="space-y-4">
            {filteredDocumentos.map((doc: any) => (
              <Card key={doc.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold truncate">
                          {doc.documentos_requeridos?.nome}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Building2 className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground truncate">
                            {doc.documentos_requeridos?.projetos?.organizacoes?.nome}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            Enviado {formatDistanceToNow(new Date(doc.updated_at), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge 
                        variant={doc.status === "enviado" ? "default" : "secondary"}
                        className="shrink-0"
                      >
                        {doc.status === "enviado" ? "Novo" : "Em análise"}
                      </Badge>
                      <Badge variant="outline" className="shrink-0">
                        {faseLabels[doc.documentos_requeridos?.fase]}
                      </Badge>
                      <Button 
                        size="sm" 
                        onClick={() => setSelectedDoc(doc)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Analisar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-medium">Tudo em dia!</h3>
              <p className="text-sm text-muted-foreground">
                {search ? "Nenhum documento encontrado para esta busca" : "Não há documentos pendentes de análise"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Analysis Modal */}
      {selectedDoc && (
        <DocumentoAnaliseModal
          open={!!selectedDoc}
          onClose={() => setSelectedDoc(null)}
          documento={{
            id: selectedDoc.documento_requerido_id,
            nome: selectedDoc.documentos_requeridos?.nome || "",
          }}
          status={{
            id: selectedDoc.id,
            status: selectedDoc.status,
            updated_at: selectedDoc.updated_at,
          }}
          documentoUrl={selectedDoc.documentos?.url}
          onAprovar={handleAprovar}
          onRejeitar={handleRejeitar}
          isLoading={aprovarMutation.isPending || rejeitarMutation.isPending}
        />
      )}
    </ConsultorLayout>
  );
}
