import { Progress } from "@/components/ui/progress";
import { FileText, CheckCircle2, Clock } from "lucide-react";

interface ProgressoDocumentosProps {
  total: number;
  enviados: number;
  aprovados: number;
  pendentes?: number;
  compact?: boolean;
}

export function ProgressoDocumentos({
  total,
  enviados,
  aprovados,
  pendentes,
  compact = false,
}: ProgressoDocumentosProps) {
  const percentual = total > 0 ? Math.round((aprovados / total) * 100) : 0;
  const pendentesCount = pendentes ?? (total - enviados);

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progresso</span>
          <span className="font-semibold text-foreground">{aprovados}/{total}</span>
        </div>
        <Progress value={percentual} className="h-2" />
        {pendentesCount > 0 && (
          <p className="text-xs text-muted-foreground">
            {pendentesCount} pendente{pendentesCount > 1 ? 's' : ''} de envio
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <FileText className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Documentos Necessários</h3>
          <p className="text-sm text-muted-foreground">Progresso da entrega</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Progresso geral</span>
            <span className="text-sm font-semibold text-foreground">{percentual}%</span>
          </div>
          <Progress value={percentual} className="h-3" />
        </div>

        <div className="grid grid-cols-3 gap-4 pt-2">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Clock className="w-4 h-4" />
            </div>
            <p className="text-lg font-bold text-foreground">{pendentesCount}</p>
            <p className="text-xs text-muted-foreground">Pendentes</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-primary mb-1">
              <FileText className="w-4 h-4" />
            </div>
            <p className="text-lg font-bold text-foreground">{enviados}</p>
            <p className="text-xs text-muted-foreground">Enviados</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-secondary mb-1">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <p className="text-lg font-bold text-foreground">{aprovados}</p>
            <p className="text-xs text-muted-foreground">Aprovados</p>
          </div>
        </div>
      </div>
    </div>
  );
}
