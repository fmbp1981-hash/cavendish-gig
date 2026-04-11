import { Link } from "react-router-dom";
import { useState } from "react";
import { FileText, Upload } from "lucide-react";
import { ClienteLayout } from "@/components/layout/ClienteLayout";
import { ProgressoDocumentos } from "@/components/documentos/ProgressoDocumentos";
import { DocumentoRequeridoCard } from "@/components/documentos/DocumentoRequeridoCard";
import { DocumentoUploadModal } from "@/components/documentos/DocumentoUploadModal";
import { DocumentoRejeicaoModal } from "@/components/documentos/DocumentoRejeicaoModal";
import { FiltroFaseDocumentos } from "@/components/documentos/FiltroFaseDocumentos";
import { DocumentoPreviewButton } from "@/components/documentos/DocumentoPreviewButton";
import { GoogleDrivePreviewButton } from "@/components/documentos/GoogleDrivePreviewButton";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { useClienteProjeto, useDocumentosRequeridosProjeto, type DocumentoArquivoProjeto } from "@/hooks/useClienteProjeto";
import { useUploadDocumento } from "@/hooks/useUploadDocumento";
import { useDeleteDocumento } from "@/hooks/useDeleteDocumento";
import type { FaseProjeto, DocumentoRequerido, DocumentoRequeridoStatus } from "@/types/database";

const faseLabels: Record<FaseProjeto, string> = {
  diagnostico: "Diagnóstico",
  implementacao: "Implementação",
  recorrencia: "Recorrência",
};

type DocumentoStatusComArquivo = DocumentoRequeridoStatus & { documentos?: DocumentoArquivoProjeto | null };
type DocumentoComStatus = DocumentoRequerido & { status: DocumentoStatusComArquivo | null };

export default function DocumentosNecessarios() {
  const { toast } = useToast();
  const [filtroFase, setFiltroFase] = useState<FaseProjeto | "todas">("todas");
  const [uploadModalDoc, setUploadModalDoc] = useState<DocumentoRequerido | null>(null);
  const [rejeicaoModalDoc, setRejeicaoModalDoc] = useState<DocumentoComStatus | null>(null);

  const { data: projeto, isLoading: projetoLoading } = useClienteProjeto();
  const { data: documentos = [], isLoading: docsLoading, refetch } = useDocumentosRequeridosProjeto(
    projeto?.id,
    projeto?.organizacao_id
  );

  const uploadMutation = useUploadDocumento();
  const deleteMutation = useDeleteDocumento();

  const documentosFiltrados = filtroFase === "todas"
    ? documentos
    : documentos.filter((d: DocumentoComStatus) => d.fase === filtroFase);

  const documentosPorFase = documentosFiltrados.reduce((acc: Record<FaseProjeto, DocumentoComStatus[]>, doc: DocumentoComStatus) => {
    const fase = doc.fase as FaseProjeto;
    if (!acc[fase]) acc[fase] = [];
    acc[fase].push(doc);
    return acc;
  }, {} as Record<FaseProjeto, DocumentoComStatus[]>);

  const total = documentos.filter((d: DocumentoComStatus) => d.obrigatorio).length;
  const aprovados = documentos.filter((d: DocumentoComStatus) => d.obrigatorio && d.status?.status === "aprovado").length;
  const enviados = documentos.filter((d: DocumentoComStatus) =>
    d.obrigatorio && d.status && ["enviado", "em_analise", "aprovado"].includes(d.status.status)
  ).length;
  const pendentes = documentos.filter((d: DocumentoComStatus) =>
    d.obrigatorio && (!d.status || d.status.status === "pendente" || d.status.status === "rejeitado")
  ).length;

  const handleUpload = async (file: File) => {
    if (!uploadModalDoc || !projeto) return;

    try {
      if (!uploadModalDoc.id) {
        // Upload avulso / checklist sugerido
        await uploadMutation.mutateAsync({
          file,
          documentoRequeridoId: undefined,
          projetoId: projeto.id,
          organizacaoId: projeto.organizacao_id,
          nomeDocumento: uploadModalDoc.nome === "Documento Avulso" ? file.name : uploadModalDoc.nome,
        });
      } else {
        await uploadMutation.mutateAsync({
          file,
          documentoRequeridoId: uploadModalDoc.id,
          projetoId: projeto.id,
          organizacaoId: projeto.organizacao_id,
          nomeDocumento: uploadModalDoc.nome,
        });
      }

      toast({ title: "Documento enviado!", description: `${file.name} foi enviado com sucesso.` });
      setUploadModalDoc(null);
      refetch();
    } catch (error) {
      toast({
        title: "Erro ao enviar",
        description: "Não foi possível enviar o documento. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleOpenDocument = async (doc: DocumentoComStatus) => {
    const arquivo = doc.status?.documentos;

    // Signed URL para bucket privado
    if (arquivo?.storage_path) {
      try {
        const { data, error } = await supabase.storage
          .from('documentos')
          .createSignedUrl(arquivo.storage_path, 3600);
        if (error) throw error;
        window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
      } catch {
        toast({ title: 'Erro ao abrir arquivo', description: 'Não foi possível gerar o link de visualização.', variant: 'destructive' });
      }
      return;
    }

    if (arquivo?.drive_file_id) {
      window.open(`https://drive.google.com/file/d/${arquivo.drive_file_id}/view`, "_blank", "noopener,noreferrer");
      return;
    }

    toast({
      title: "Arquivo não disponível",
      description: "O documento ainda não possui arquivo acessível para visualização.",
      variant: "destructive",
    });
  };

  const isLoading = projetoLoading || docsLoading;

  if (isLoading) {
    return (
      <ClienteLayout>
        <div className="max-w-5xl mx-auto space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-24 w-full" />
          <div className="space-y-4">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        </div>
      </ClienteLayout>
    );
  }

  if (!projeto) {
    return (
      <ClienteLayout>
        <div className="max-w-5xl mx-auto">
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">Nenhum projeto encontrado</h2>
              <p className="text-muted-foreground text-center max-w-md mb-6">
                Você ainda não possui um projeto ativo. Finalize o onboarding para liberar checklist, uploads e o repositório de documentos.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild>
                  <Link to="/onboarding">Finalizar onboarding</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/meu-projeto">Voltar ao portal</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </ClienteLayout>
    );
  }

  return (
    <ClienteLayout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        {/* Header Content with Upload Button */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Documentos Necessários</h1>
            </div>
            <p className="text-muted-foreground">Envie os documentos solicitados para cada fase do seu projeto.</p>
          </div>
          <Button onClick={() => setUploadModalDoc({
            id: "",
            nome: "Documento Avulso",
            descricao: "Envie qualquer documento livremente para o projeto.",
            fase: "diagnostico",
            tipo_projeto: null,
            obrigatorio: false,
            ordem: 0,
            template_url: null,
            formatos_aceitos: "pdf,doc,docx,xls,xlsx,ppt,pptx,jpg,jpeg,png,zip",
            tamanho_maximo_mb: 25,
            ativo: true,
            created_at: new Date().toISOString()
          })}>
            <Upload className="w-4 h-4 mr-2" />
            Upload de Documento
          </Button>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <ProgressoDocumentos total={total} enviados={enviados} aprovados={aprovados} pendentes={pendentes} />
        </div>

        {/* Filter */}
        <div className="mb-6">
          <FiltroFaseDocumentos faseAtual={filtroFase} onChange={setFiltroFase} />
        </div>

        {/* Documents by Phase */}
        {documentos.length === 0 ? (
          <div className="space-y-6">
            <Card className="border-dashed bg-accent/5">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <FileText className="w-10 h-10 text-muted-foreground mb-3" />
                <h3 className="font-medium text-lg">Checklist de Documentos (Visão Sugerida)</h3>
                <p className="text-muted-foreground text-center text-sm max-w-md mt-1">
                  O gerente do seu projeto ainda não atrelou um checklist estrito. Você pode utilizar o guia norteador abaixo ou fazer upload livremente de qualquer arquivo usando o botão "Upload Avulso".
                </p>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground mb-4">Guia Prático Inicial (Norte)</h2>
              {[
                { nome: "Contrato Social ou Estatuto", obrigatorio: true },
                { nome: "Comprovante de CNPJ", obrigatorio: true },
                { nome: "Último Balanço Patrimonial", obrigatorio: false },
                { nome: "Organograma da Empresa", obrigatorio: false },
                { nome: "Políticas Internas Atuais (Código de Conduta, etc)", obrigatorio: false }
              ].map((item, index) => (
                <DocumentoRequeridoCard
                  key={`sugerido-${index}`}
                  documento={{
                    id: "",
                    nome: item.nome,
                    descricao: "Documento sugerido para acelerar o diagnóstico do projeto.",
                    fase: "diagnostico",
                    tipo_projeto: null,
                    obrigatorio: item.obrigatorio,
                    ordem: index,
                    template_url: null,
                    formatos_aceitos: "pdf,jpg,png,doc,docx",
                    tamanho_maximo_mb: 25,
                    ativo: true,
                    created_at: new Date().toISOString(),
                  }}
                  status={null}
                  onUpload={() => setUploadModalDoc({
                    id: "",
                    nome: item.nome,
                    descricao: "Documento sugerido para acelerar o diagnóstico do projeto.",
                    fase: "diagnostico",
                    tipo_projeto: null,
                    obrigatorio: item.obrigatorio,
                    ordem: index,
                    template_url: null,
                    formatos_aceitos: "pdf,jpg,png,doc,docx",
                    tamanho_maximo_mb: 25,
                    ativo: true,
                    created_at: new Date().toISOString()
                  })}
                  onView={() => {}}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {(Object.keys(documentosPorFase) as FaseProjeto[]).map((fase) => (
              <div key={fase}>
                <h2 className="text-lg font-semibold text-foreground mb-4">{faseLabels[fase]}</h2>
                <div className="space-y-3">
                  {documentosPorFase[fase].map((doc: DocumentoComStatus) => (
                    <div key={doc.id} className="space-y-3">
                      <DocumentoRequeridoCard
                        documento={doc}
                        status={doc.status}
                        onUpload={() => setUploadModalDoc(doc)}
                        onView={() => handleOpenDocument(doc)}
                        onDownloadTemplate={() => doc.template_url && window.open(doc.template_url, "_blank")}
                        onViewRejeicao={() => doc.status && setRejeicaoModalDoc(doc)}
                        onDelete={doc.status?.documento_id ? () => deleteMutation.mutate({
                          documentoId: doc.status!.documento_id!,
                          storagePath: doc.status!.documentos?.storage_path ?? null,
                          documentoRequeridoId: doc.id,
                        }) : undefined}
                      />

                      {doc.status?.documentos && (
                        <div className="flex flex-wrap items-center gap-2 pl-4">
                          <span className="text-xs text-muted-foreground">
                            Arquivo enviado: {doc.status.documentos.nome}
                          </span>
                          {(doc.status.documentos.url || doc.status.documentos.storage_path) && (
                            <DocumentoPreviewButton
                              url={doc.status.documentos.url}
                              storagePath={doc.status.documentos.storage_path}
                              fileName={doc.status.documentos.nome}
                            />
                          )}
                          {doc.status.documentos.drive_file_id && (
                            <GoogleDrivePreviewButton
                              driveFileId={doc.status.documentos.drive_file_id}
                              fileName={doc.status.documentos.nome}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modals */}
        {uploadModalDoc && (
          <DocumentoUploadModal
            documento={uploadModalDoc}
            open={!!uploadModalDoc}
            onClose={() => setUploadModalDoc(null)}
            onSubmit={handleUpload}
            isLoading={uploadMutation.isPending}
          />
        )}

        {rejeicaoModalDoc && (
          <DocumentoRejeicaoModal
            documento={rejeicaoModalDoc}
            status={rejeicaoModalDoc.status!}
            open={!!rejeicaoModalDoc}
            onClose={() => setRejeicaoModalDoc(null)}
            onReenviar={() => {
              setRejeicaoModalDoc(null);
              setUploadModalDoc(rejeicaoModalDoc);
            }}
          />
        )}
      </div>
    </ClienteLayout>
  );
}
