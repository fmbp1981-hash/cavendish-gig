import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ConsultorLayout } from "@/components/layout/ConsultorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  FileText,
  Download,
  Eye,
  Building2,
  Loader2,
  Mail,
  User,
  Star,
  Plus,
  Trash2,
} from "lucide-react";
import {
  useProjetoPorOrganizacao,
  useDocumentosComplementaresProjeto,
  useRemoverDocComplementar,
} from "@/hooks/useDocumentosComplementares";
import { SolicitarDocComplementarDialog } from "@/components/documentos/SolicitarDocComplementarDialog";

const MIME_LABELS: Record<string, string> = {
  "application/pdf": "PDF",
  "image/png": "PNG",
  "image/jpeg": "JPEG",
  "image/jpg": "JPEG",
  "image/gif": "GIF",
  "image/webp": "WebP",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
  "application/msword": "DOC",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
  "application/vnd.ms-excel": "XLS",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "PPTX",
  "text/plain": "TXT",
  "text/csv": "CSV",
};

function formatTipo(tipo: string | null): string {
  if (!tipo) return "Arquivo";
  return MIME_LABELS[tipo.toLowerCase()] ?? tipo.split("/").pop()?.toUpperCase() ?? "Arquivo";
}

export default function ConsultorClienteDetalhe() {
  const { id: organizacaoId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ataAberta, setAtaAberta] = useState<{
    nome: string;
    conteudo: string;
  } | null>(null);
  const [dialogComplementarAberto, setDialogComplementarAberto] = useState(false);

  const { data: projeto } = useProjetoPorOrganizacao(organizacaoId);
  const projetoId = projeto?.id;
  const { data: docsComplementares, isLoading: loadingComplementares } =
    useDocumentosComplementaresProjeto(projetoId);
  const removerComplementar = useRemoverDocComplementar();

  // Busca dados da organização
  const { data: org, isLoading: loadingOrg } = useQuery({
    queryKey: ["org-detalhe", organizacaoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizacoes")
        .select("id, nome, cnpj, plano, created_at")
        .eq("id", organizacaoId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!organizacaoId,
  });

  const { data: membros, isLoading: loadingMembros } = useQuery({
    queryKey: ["org-membros", organizacaoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organization_members")
        .select("id, role, profiles:user_id(id, nome, email)")
        .eq("organizacao_id", organizacaoId!);

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!organizacaoId,
  });

  // Busca atas (documentos com nome iniciando em "Ata - ")
  const { data: atas, isLoading: loadingAtas } = useQuery({
    queryKey: ["atas", organizacaoId],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("documentos")
        .select("id, nome, url, created_at")
        .eq("organizacao_id", organizacaoId!)
        .eq("status", "aprovado")
        .like("nome", "Ata - %")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!organizacaoId,
  });

  // Busca documentos aprovados (exceto atas)
  const { data: documentos, isLoading: loadingDocs } = useQuery({
    queryKey: ["documentos-org", organizacaoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documentos")
        .select("id, nome, url, tipo, created_at")
        .eq("organizacao_id", organizacaoId!)
        .not("nome", "like", "Ata - %")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!organizacaoId,
  });

  const visualizarAta = async (ata: { nome: string; url: string }) => {
    try {
      const resp = await fetch(ata.url);
      const texto = await resp.text();
      setAtaAberta({ nome: ata.nome, conteudo: texto });
    } catch {
      setAtaAberta({ nome: ata.nome, conteudo: "Não foi possível carregar o conteúdo da ata." });
    }
  };

  const baixarAta = (ata: { nome: string; url: string }) => {
    const a = document.createElement("a");
    a.href = ata.url;
    a.download = `${ata.nome}.md`;
    a.click();
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  if (loadingOrg) {
    return (
      <ConsultorLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </ConsultorLayout>
    );
  }

  if (!org) {
    return (
      <ConsultorLayout>
        <div className="p-6 text-center text-muted-foreground">
          Organização não encontrada.
        </div>
      </ConsultorLayout>
    );
  }

  return (
    <ConsultorLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Voltar
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">{org.nome}</h1>
              <p className="text-sm text-muted-foreground">
                {org.cnpj || "CNPJ não informado"} ·{" "}
                <Badge variant="outline" className="text-xs capitalize">
                  {org.plano || "essencial"}
                </Badge>
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="perfil">
          <TabsList>
            <TabsTrigger value="perfil">
              Perfil do Cliente
              {membros && membros.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {membros.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="atas">
              Atas de Reunião{" "}
              {atas && atas.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {atas.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="documentos">
              Documentos{" "}
              {documentos && documentos.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {documentos.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="complementares">
              Complementares
              {docsComplementares && docsComplementares.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {docsComplementares.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="perfil" className="mt-4">
            {loadingMembros ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : membros && membros.length > 0 ? (
              <div className="grid gap-3">
                {membros.map((membro: any) => (
                  <Card key={membro.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="py-4 px-5 flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {membro.profiles?.nome || "Usuário sem nome"}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Mail className="w-3 h-3" />
                            {membro.profiles?.email || "Email não informado"}
                          </p>
                        </div>
                      </div>

                      <Badge variant="outline" className="capitalize">
                        {membro.role || "cliente"}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <User className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Nenhum perfil de cliente vinculado a esta organização.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Aba Atas */}
          <TabsContent value="atas" className="mt-4">
            {loadingAtas ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : atas && atas.length > 0 ? (
              <div className="grid gap-3">
                {atas.map((ata) => (
                  <Card key={ata.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="flex items-center justify-between py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {ata.nome}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Gerada em {formatDate(ata.created_at)} · FireFlies
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            visualizarAta({ nome: ata.nome, url: ata.url })
                          }
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          Ver
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            baixarAta({ nome: ata.nome, url: ata.url })
                          }
                        >
                          <Download className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Nenhuma ata registrada ainda.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    As atas são geradas automaticamente após reuniões no FireFlies.ai.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Aba Documentos Complementares */}
          <TabsContent value="complementares" className="mt-4">
            <div className="flex justify-end mb-3">
              <Button
                size="sm"
                disabled={!projetoId}
                onClick={() => setDialogComplementarAberto(true)}
              >
                <Plus className="w-4 h-4 mr-1" />
                Solicitar Documento
              </Button>
            </div>
            {loadingComplementares ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : docsComplementares && docsComplementares.length > 0 ? (
              <div className="grid gap-3">
                {docsComplementares.map((doc) => (
                  <Card key={doc.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="flex items-center justify-between py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                          <Star className="w-4 h-4 text-amber-600 fill-amber-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {doc.nome}
                          </p>
                          {doc.descricao && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {doc.descricao}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Solicitado em {formatDate(doc.created_at)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={removerComplementar.isPending}
                        onClick={() =>
                          removerComplementar.mutate({ id: doc.id, projetoId: projetoId! })
                        }
                        title="Remover solicitação"
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Star className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Nenhum documento complementar solicitado.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Use o botão acima para solicitar documentos adicionais ao cliente.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Aba Documentos */}
          <TabsContent value="documentos" className="mt-4">
            {loadingDocs ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : documentos && documentos.length > 0 ? (
              <div className="grid gap-3">
                {documentos.map((doc) => (
                  <Card key={doc.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="flex items-center justify-between py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {doc.nome}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(doc.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {formatTipo(doc.tipo)}
                        </Badge>
                        {doc.url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(doc.url!, "_blank")}
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            Abrir
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Nenhum documento encontrado.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog solicitar documento complementar */}
      {projetoId && organizacaoId && (
        <SolicitarDocComplementarDialog
          open={dialogComplementarAberto}
          onClose={() => setDialogComplementarAberto(false)}
          projetoId={projetoId}
          organizacaoId={organizacaoId}
        />
      )}

      {/* Modal de visualização da ata */}
      <Dialog open={!!ataAberta} onOpenChange={() => setAtaAberta(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">{ataAberta?.nome}</DialogTitle>
          </DialogHeader>
          <pre className="text-sm whitespace-pre-wrap font-mono bg-muted rounded-lg p-4 text-foreground leading-relaxed">
            {ataAberta?.conteudo}
          </pre>
        </DialogContent>
      </Dialog>
    </ConsultorLayout>
  );
}
