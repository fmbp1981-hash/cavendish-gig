import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ConsultorLayout } from "@/components/layout/ConsultorLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "lucide-react";

export default function ConsultorClienteDetalhe() {
  const { id: organizacaoId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ataAberta, setAtaAberta] = useState<{
    nome: string;
    conteudo: string;
  } | null>(null);

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

  // Busca atas (documentos com nome iniciando em "Ata - ")
  const { data: atas, isLoading: loadingAtas } = useQuery({
    queryKey: ["atas", organizacaoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documentos")
        .select("id, nome, url, created_at")
        .eq("organizacao_id", organizacaoId!)
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
        .select("id, nome, url, status, created_at")
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

        <Tabs defaultValue="atas">
          <TabsList>
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
          </TabsList>

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
                      <Badge
                        variant={
                          doc.status === "aprovado"
                            ? "default"
                            : doc.status === "rejeitado"
                            ? "destructive"
                            : "secondary"
                        }
                        className="text-xs capitalize"
                      >
                        {doc.status}
                      </Badge>
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
