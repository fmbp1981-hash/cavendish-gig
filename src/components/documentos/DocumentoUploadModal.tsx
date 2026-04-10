import { useState, useCallback } from "react";
import { Upload, X, FileText, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { DocumentoRequerido } from "@/types/database";

interface DocumentoUploadModalProps {
  documento: DocumentoRequerido;
  open: boolean;
  onClose: () => void;
  onSubmit: (file: File) => Promise<void>;
  isLoading?: boolean;
}

export function DocumentoUploadModal({
  documento,
  open,
  onClose,
  onSubmit,
  isLoading = false,
}: DocumentoUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatosAceitos = Array.isArray(documento.formatos_aceitos)
    ? documento.formatos_aceitos.map(f => f.trim())
    : (documento.formatos_aceitos || '').split(',').map(f => f.trim());
  const acceptString = formatosAceitos.map(f => `.${f}`).join(',');
  const tamanhoMaximoBytes = documento.tamanho_maximo_mb * 1024 * 1024;

  const validateFile = useCallback((file: File): string | null => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !formatosAceitos.includes(extension)) {
      return `Formato não aceito. Use: ${formatosAceitos.join(', ')}`;
    }
    if (file.size > tamanhoMaximoBytes) {
      return `Arquivo muito grande. Máximo: ${documento.tamanho_maximo_mb}MB`;
    }
    return null;
  }, [formatosAceitos, tamanhoMaximoBytes, documento.tamanho_maximo_mb]);

  const handleFile = useCallback((selectedFile: File) => {
    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      setFile(null);
    } else {
      setError(null);
      setFile(selectedFile);
    }
  }, [validateFile]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  }, [handleFile]);

  const handleSubmit = async () => {
    if (!file) return;
    await onSubmit(file);
    setFile(null);
    onClose();
  };

  const handleClose = () => {
    setFile(null);
    setError(null);
    onClose();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Enviar Documento</DialogTitle>
          <DialogDescription>{documento.nome}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Drop Zone */}
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? "border-primary bg-primary/5"
                : file
                ? "border-secondary bg-secondary/5"
                : "border-border hover:border-primary/50"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept={acceptString}
              onChange={handleChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="w-8 h-8 text-secondary" />
                <div className="text-left">
                  <p className="font-medium text-foreground">{file.name}</p>
                  <p className="text-sm text-muted-foreground">{formatFileSize(file.size)}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <>
                <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-foreground font-medium mb-1">
                  Arraste um arquivo ou clique para selecionar
                </p>
                <p className="text-sm text-muted-foreground">
                  Formatos: {formatosAceitos.join(', ').toUpperCase()}
                </p>
                <p className="text-sm text-muted-foreground">
                  Tamanho máximo: {documento.tamanho_maximo_mb}MB
                </p>
              </>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!file || isLoading}>
            {isLoading ? "Enviando..." : "Enviar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
