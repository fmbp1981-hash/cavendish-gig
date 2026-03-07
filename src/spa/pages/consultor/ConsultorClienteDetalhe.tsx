import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ConsultorLayout } from "@/components/layout/ConsultorLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useOrganizacaoDetalhes } from "@/hooks/useConsultorData";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building2,
  FileText,
  Download,
  Calendar,
  FolderOpen,
  FileCheck,
  Mic,
  Eye,
  Users,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type AtaRow = Pick<Database["public"]["Tables"]["documentos"]["Row"],
  "id" | "nome" | "descricao" | "storage_path" | "tamanho_bytes" | "created_at">;

type DocumentoRow = Database["public"]["Tables"]["documentos"]["Row"];
type DocumentoRequeridoRow = Database["public"]["Tables"]["documentos_requeridos"]["Row"];
type DocumentoRequeridoStatusRow = Database["public"]["Tables"]["documentos_requeridos_status"]["Row"];

type DocumentoAprovadoRow = DocumentoRequeridoStatusRow & {
  documentos_requeridos: Pick<DocumentoRequeridoRow, "id" | "nome" | "descricao" | "fase"> | null;
  documentos: Pick<DocumentoRow, "id" | "nome" | "url" | "storage_path" | "drive_file_id" | "tipo" | "tamanho_bytes" | "created_at"> | null;
};

const faseLabels: Record<string, string> = {
  diagnostico: "Diagnóstico",
  implementacao: "Implementação",
  recorrencia: "Recorrência",
};

export default function ConsultorClienteDetalhe() {
  const { id: organizacaoId } = useParams<{ id: string }>();
  const [ataVisualizando, setAtaVisualizando] = useState<{ nome: string; conteudo: string } | null>(null);

  const { data: organizacao, isLoading: isLoadingOrg } = useOrganizacaoDetalhes(organizacaoId);

  const projetoAtivo = organizacao?.projetos?.[0];

  const { data: documentosAprovados, isLoading: isLoadingDocs } = useQuery({
    queryKey: ["documentos-aprovados-consultor", projetoAtivo?.id],
    queryFn: async () => {
      if (!projetoAtivo?.id) return [];

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
            drive_file_id,
            tipo,
            tamanho_bytes,
            created_at
          )
        `)
        .eq("status", "aprovado")
        .not("documento_id", "is", null);

      if (error) throw error;

      return (data?.filter(d => d.documentos_requeridos?.fase && d.documentos) || []) as DocumentoAprovadoRow[];
    },
    enabled: !!projetoAtivo?.id,
  });

  const { data: atasReuniao, isLoading: isLoadingAtas } = useQuery({
    queryKey: ["atas-reuniao-consultor", organizacaoId],
    queryFn: async () => {
      if (!organizacaoId) return [];

      const { data, error } = await supabase
        .from("documentos")
        .select("id, nome, descricao, storage_path, tamanho_bytes, created_at")
        .eq("organizacao_id", organizacaoId)
        .like("nome", "Ata - %")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as AtaRow[];
    },
    enabled: !!organizacaoId,
  });

  const groupedByFase = documentosAprovados?.reduce((acc, doc) => {
    const fase = doc.documentos_requeridos?.fase || "outros";
    if (!acc[fase]) acc[fase] = [];
    acc[fase].push(doc);
    return acc;
  }, {} as Record<string, typeof documentosAprovados>);

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

  const handleVisualizarAta = async (storagePath: string, nome: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("documentos")
        .download(storagePath);

      if (error) throw error;

      const text = await data.text();
      setAtaVisualizando({ nome, conteudo: text });
    } catch (error) {
      console.error("Error loading ata:", error);
      toast.error("Erro ao carregar ata");
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "";
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
  };

  if (isLoadingOrg) {
    return (
      <ConsultorLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-32 w-full" />
        </div>
      </ConsultorLayout>
    );
  }

  if (!organizacao) {
    return (
      <ConsultorLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Organização não encontrada.</p>
          <Button variant="outline" asChild className="mt-4">
            <Link to="/consultor/clientes">Voltar</Link>
          </Button>
        </div>
      </ConsultorLayout>
    );
  }

  return (
    <ConsultorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/consultor/clientes">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Clientes
            </Link>
          </Button>
        </div>

        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-primary/10">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{organizacao.nome}</h1>
            <p className="text-muted-foreground">{organizacao.cnpj || "CNPJ não informado"}</p>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Membros</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {organizacao.organization_members?.length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Documentos Aprovados</CardTitle>
              <FileCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {documentosAprovados?.length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Atas de Reunião</CardTitle>
              <Mic className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">
                {atasReuniao?.length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="atas">
          <TabsList>
            <TabsTrigger value="atas">
              <Mic className="h-4 w-4 mr-2" />
              Atas de Reunião
            </TabsTrigger>
            <TabsTrigger value="documentos">
              <FileText className="h-4 w-4 mr-2" />
              Documentos
            </TabsTrigger>
          </TabsList>

          {/* Tab: Atas */}
          <TabsContent value="atas" className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Atas de Reunião</h2>
              <p className="text-sm text-muted-foreground">
                Atas geradas automaticamente via FireFlies.ai
              </p>
            </div>

            {isLoadingAtas ? (
              <div className="space-y-3">
                {[1, 2].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : atasReuniao && atasReuniao.length > 0 ? (
              <Card>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    {atasReuniao.map((ata) => (
                      <div
                        key={ata.id}
                        className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                            <Mic className="h-5 w-5 text-orange-500" />
                          </div>
                          <div>
                            <p className="font-medium">{ata.nome}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              {ata.descricao && <span>{ata.descricao}</span>}
                              {ata.tamanho_bytes && (
                                <>
                                  <span>•</span>
                                  <span>{formatFileSize(ata.tamanho_bytes)}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {ata.created_at && format(new Date(ata.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </div>
                          </div>
                          <Badge variant="outline" className="text-orange-600 border-orange-300">
                            FireFlies
                          </Badge>
                          {ata.storage_path && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleVisualizarAta(ata.storage_path!, ata.nome)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Visualizar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownload(ata.storage_path!, `${ata.nome}.md`)}
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Baixar
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <Mic className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Nenhuma ata disponível</h3>
                  <p className="text-muted-foreground text-center max-w-md mt-2">
                    As atas geradas via FireFlies.ai aparecerão aqui automaticamente após as reuniões. Configure o webhook no painel da integração.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab: Documentos */}
          <TabsContent value="documentos" className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Documentos Aprovados</h2>
              <p className="text-sm text-muted-foreground">
                Documentos aprovados no repositório desta organização
              </p>
            </div>

            {isLoadingDocs ? (
              <div className="space-y-4">
                {[1, 2].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
              </div>
            ) : documentosAprovados && documentosAprovados.length > 0 ? (
              <div className="space-y-4">
                {Object.entries(groupedByFase || {}).map(([fase, docs]) => (
                  <Card key={fase}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <FolderOpen className="h-5 w-5" />
                        {faseLabels[fase] || fase}
                      </CardTitle>
                      <CardDescription>{docs?.length} documento(s) aprovado(s)</CardDescription>
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
                                <p className="text-sm text-muted-foreground">{doc.documentos?.nome}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {doc.analisado_em && format(new Date(doc.analisado_em), "dd/MM/yyyy", { locale: ptBR })}
                                </div>
                              </div>
                              <Badge variant="default" className="bg-green-600">Aprovado</Badge>
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
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <FileCheck className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Nenhum documento aprovado</h3>
                  <p className="text-muted-foreground text-center max-w-md mt-2">
                    Os documentos aprovados desta organização aparecerão aqui.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal visualização da ata */}
      <Dialog open={!!ataVisualizando} onOpenChange={() => setAtaVisualizando(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{ataVisualizando?.nome}</DialogTitle>
          </DialogHeader>
          <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed p-4 rounded-lg bg-muted">
            {ataVisualizando?.conteudo}
          </pre>
        </DialogContent>
      </Dialog>
    </ConsultorLayout>
  );
}
