import { FileText, Download, Upload, Eye, RefreshCw, AlertCircle, User, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { DocumentoRequerido, DocumentoRequeridoStatus, StatusDocumento } from "@/types/database";

interface DocumentoRequeridoCardProps {
  documento: DocumentoRequerido;
  status?: DocumentoRequeridoStatus | null;
  onUpload: () => void;
  onView: () => void;
  onDownloadTemplate?: () => void;
  onViewRejeicao?: () => void;
  onAnalyze?: () => void;
  isConsultor?: boolean;
  enviadoPorNome?: string;
}

const statusConfig: Record<StatusDocumento, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
  pendente: { label: "Pendente", variant: "outline", className: "border-muted-foreground/30 text-muted-foreground" },
  enviado: { label: "Enviado", variant: "default", className: "bg-primary/10 text-primary border-primary/20" },
  em_analise: { label: "Em Análise", variant: "default", className: "bg-accent/10 text-accent border-accent/20" },
  aprovado: { label: "Aprovado", variant: "default", className: "bg-secondary/10 text-secondary border-secondary/20" },
  rejeitado: { label: "Rejeitado", variant: "destructive", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

export function DocumentoRequeridoCard({
  documento,
  status,
  onUpload,
  onView,
  onDownloadTemplate,
  onViewRejeicao,
  onAnalyze,
  isConsultor = false,
  enviadoPorNome,
}: DocumentoRequeridoCardProps) {
  const currentStatus = status?.status || "pendente";
  const config = statusConfig[currentStatus];

  const renderClienteActions = () => {
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
      case "em_analise":
        return (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onView}>
              <Eye className="w-4 h-4 mr-1" />
              Ver
            </Button>
            {currentStatus === "enviado" && (
              <Button size="sm" variant="outline" onClick={onUpload}>
                <RefreshCw className="w-4 h-4 mr-1" />
                Substituir
              </Button>
            )}
          </div>
        );
      case "aprovado":
        return (
          <Button size="sm" variant="outline" onClick={onView}>
            <Eye className="w-4 h-4 mr-1" />
            Ver
          </Button>
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
          </div>
        );
      default:
        return null;
    }
  };

  const renderConsultorActions = () => {
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
    <div className="bg-card border border-border rounded-xl p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-foreground truncate">{documento.nome}</h4>
              {documento.obrigatorio && (
                <Badge variant="outline" className="text-xs shrink-0">
                  Obrigatório
                </Badge>
              )}
            </div>
            {documento.descricao && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {documento.descricao}
              </p>
            )}
            
            {/* Consultor extra info - show when document has been submitted */}
            {isConsultor && status && currentStatus !== 'pendente' && (
              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                {enviadoPorNome && (
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {enviadoPorNome}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(status.updated_at).toLocaleDateString('pt-BR')}
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
  );
}
