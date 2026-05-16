import { useState } from "react";
import { FileText, Download, Upload, Eye, RefreshCw, AlertCircle, User, Calendar, Trash2, Paperclip, ChevronDown, ChevronUp, CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAnexosByRequerido } from "@/hooks/useAnexosRequerido";
import type { DocumentoRequerido, DocumentoRequeridoStatus, StatusDocumento } from "@/types/database";

interface DocumentoRequeridoCardProps {
  documento: DocumentoRequerido;
  status?: DocumentoRequeridoStatus | null;
  onUpload: () => void;
  onView: () => void;
  onDownloadTemplate?: () => void;
  onViewRejeicao?: () => void;
  onAnalyze?: () => void;
  onDelete?: () => void;
  isConsultor?: boolean;
  enviadoPorNome?: string;
}

const statusConfig: Record<StatusDocumento, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
  pendente: { label: "Pendente", variant: "outline", className: "border-muted-foreground/30 text-muted-foreground" },
  enviado: { label: "Enviado", variant: "default", className: "bg-primary/10 text-primary border-primary/20" },
  em_analise: { label: "Em Análise", variant: "default", className: "bg-accent/10 text-accent border-accent/20" },
  aprovado: { label: "Aprovado", variant: "default", className: "bg-secondary/10 text-secondary border-secondary/20" },
  rejeitado: { label: "Rejeitado", variant: "destructive", className: "bg-destructive/10 text-destructive border-destructive/20" },
} as const;

const anexoStatusIcon: Record<string, JSX.Element> = {
  aprovado: <CheckCircle className="w-3.5 h-3.5 text-secondary" />,
  rejeitado: <XCircle className="w-3.5 h-3.5 text-destructive" />,
  em_analise: <Clock className="w-3.5 h-3.5 text-accent" />,
  enviado: <Clock className="w-3.5 h-3.5 text-primary" />,
  pendente: <Clock className="w-3.5 h-3.5 text-muted-foreground" />,
};

function DeleteConfirmDialog({ onDelete }: { onDelete: () => void }): JSX.Element {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="outline" className="text-destructive hover:text-destructive hover:bg-destructive/10">
          <Trash2 className="w-4 h-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir documento?</AlertDialogTitle>
          <AlertDialogDescription>
            O arquivo será removido permanentemente e o documento voltará ao status{" "}
            <strong>Pendente</strong>. Essa ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function DocumentoRequeridoCard({
  documento,
  status,
  onUpload,
  onView,
  onDownloadTemplate,
  onViewRejeicao,
  onAnalyze,
  onDelete,
  isConsultor = false,
  enviadoPorNome,
}: DocumentoRequeridoCardProps): JSX.Element {
  const currentStatus = status?.status ?? "pendente";
  const config = statusConfig[currentStatus];

  // Only fetch anexos when the document has an id (not for suggested items)
  const { data: anexos } = useAnexosByRequerido(documento.id || null);
  const anexosCount = anexos?.length ?? 0;
  const hasMultipleAnexos = anexosCount > 1;

  const [showAnexos, setShowAnexos] = useState(false);

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderClienteActions = (): JSX.Element | null => {
    switch (currentStatus) {
      case "pendente":
        return (
          <div className="flex gap-2">
            <Button size="sm" onClick={onUpload}>
              <Upload className="w-4 h-4 mr-1" />
              Fazer Upload
            </Button>
            {documento.template_url && (
              <Button size="sm" variant="outline" onClick={onDownloadTemplate}>
                <Download className="w-4 h-4 mr-1" />
                Modelo
              </Button>
            )}
          </div>
        );
      case "enviado":
        return (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onView}>
              <Eye className="w-4 h-4 mr-1" />
              Ver
            </Button>
            <Button size="sm" variant="outline" onClick={onUpload}>
              <Upload className="w-4 h-4 mr-1" />
              Adicionar
            </Button>
            {onDelete && <DeleteConfirmDialog onDelete={onDelete} />}
          </div>
        );
      case "em_analise":
        return (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onView}>
              <Eye className="w-4 h-4 mr-1" />
              Ver
            </Button>
          </div>
        );
      case "aprovado":
        return (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onView}>
              <Eye className="w-4 h-4 mr-1" />
              Ver
            </Button>
            <Button size="sm" variant="outline" onClick={onUpload}>
              <Upload className="w-4 h-4 mr-1" />
              Adicionar
            </Button>
          </div>
        );
      case "rejeitado":
        return (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onViewRejeicao}>
              <AlertCircle className="w-4 h-4 mr-1" />
              Ver Motivo
            </Button>
            <Button size="sm" onClick={onUpload}>
              <Upload className="w-4 h-4 mr-1" />
              Enviar Novamente
            </Button>
            {onDelete && <DeleteConfirmDialog onDelete={onDelete} />}
          </div>
        );
      default:
        return null;
    }
  };

  const renderConsultorActions = (): JSX.Element | null => {
    if (currentStatus === "enviado" && onAnalyze) {
      return (
        <Button size="sm" onClick={onAnalyze}>
          <Eye className="w-4 h-4 mr-1" />
          Analisar
        </Button>
      );
    }
    if (["em_analise", "aprovado", "rejeitado"].includes(currentStatus)) {
      return (
        <Button size="sm" variant="outline" onClick={onView}>
          <Eye className="w-4 h-4 mr-1" />
          Ver
        </Button>
      );
    }
    return null;
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-sm transition-shadow">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h4 className="font-semibold text-foreground truncate">{documento.nome}</h4>
                {documento.obrigatorio && (
                  <Badge variant="outline" className="text-xs shrink-0">
                    Obrigatório
                  </Badge>
                )}
                {/* Attachment count badge — only when multiple files exist */}
                {hasMultipleAnexos && (
                  <button
                    type="button"
                    onClick={() => setShowAnexos(v => !v)}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 text-xs font-medium hover:bg-primary/20 transition-colors"
                  >
                    <Paperclip className="w-3 h-3" />
                    {anexosCount} arquivos
                    {showAnexos ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                )}
              </div>
              {documento.descricao && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {documento.descricao}
                </p>
              )}

              {isConsultor && status?.enviado_em && (
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                  {enviadoPorNome && (
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {enviadoPorNome}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(status.enviado_em).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">
            <Badge variant={config.variant} className={config.className}>
              {config.label}
            </Badge>
            {isConsultor ? renderConsultorActions() : renderClienteActions()}
          </div>
        </div>
      </div>

      {/* Expandable anexos list */}
      {showAnexos && anexos && anexos.length > 0 && (
        <div className="border-t border-border bg-muted/20 px-5 py-3 space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Arquivos anexados
          </p>
          {anexos.map((anexo) => (
            <div
              key={anexo.id}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <div className="flex items-center gap-2 min-w-0">
                {anexoStatusIcon[anexo.status] ?? anexoStatusIcon['pendente']}
                <span className="truncate text-foreground">
                  {anexo.documento?.nome ?? 'Arquivo'}
                </span>
                {anexo.documento?.tamanho_bytes && (
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatFileSize(anexo.documento.tamanho_bytes)}
                  </span>
                )}
              </div>
              <Badge
                variant="outline"
                className={`text-xs shrink-0 ${statusConfig[anexo.status as StatusDocumento]?.className ?? ''}`}
              >
                {statusConfig[anexo.status as StatusDocumento]?.label ?? anexo.status}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
