import { AlertCircle, Calendar } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { DocumentoRequerido, DocumentoRequeridoStatus } from "@/types/database";

interface DocumentoRejeicaoModalProps {
  documento: DocumentoRequerido;
  status: DocumentoRequeridoStatus;
  open: boolean;
  onClose: () => void;
  onReenviar: () => void;
}

export function DocumentoRejeicaoModal({
  documento,
  status,
  open,
  onClose,
  onReenviar,
}: DocumentoRejeicaoModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="w-5 h-5" />
            Documento Rejeitado
          </DialogTitle>
          <DialogDescription>{documento.nome}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Motivo */}
          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-2">Motivo da rejeição:</h4>
            <p className="text-sm text-muted-foreground">
              {status.observacao_rejeicao || "Nenhuma observação fornecida."}
            </p>
          </div>

          {/* Data da análise */}
          {status.analisado_em && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              Analisado em {new Date(status.analisado_em).toLocaleDateString('pt-BR')}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          <Button onClick={onReenviar}>
            Enviar Novo Documento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
