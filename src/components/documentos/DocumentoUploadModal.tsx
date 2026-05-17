import { useState, useCallback, useMemo } from "react";
import { Upload, X, FileText, AlertCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  onSubmit: (file: File, descricao?: string) => Promise<void>;
  isLoading?: boolean;
}

export function DocumentoUploadModal({
  documento,
  open,
  onClose,
  onSubmit,
  isLoading = false,
}: DocumentoUploadModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [descricao, setDescricao] = useState("");

  const formatosAceitos = useMemo(
    () => (documento.formatos_aceitos && documento.formatos_aceitos.length > 0)
      ? documento.formatos_aceitos.map(f => f.trim()).filter(Boolean)
      : ['pdf', 'jpg', 'png'],
    [documento.formatos_aceitos]
  );
  const acceptString = formatosAceitos.map(f => `.${f}`).join(',');
  const tamanhoMaximoMb = documento.tamanho_maximo_mb ?? 10;
  const tamanhoMaximoBytes = tamanhoMaximoMb * 1024 * 1024;

  const validateFile = useCallback((file: File): string | null => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !formatosAceitos.includes(extension)) {
      return `"${file.name}": formato não aceito. Use: ${formatosAceitos.join(', ')}`;
    }
    if (file.size > tamanhoMaximoBytes) {
      return `"${file.name}": arquivo muito grande. Máximo: ${tamanhoMaximoMb}MB`;
    }
    return null;
  }, [formatosAceitos, tamanhoMaximoBytes, tamanhoMaximoMb]);

  const addFiles = useCallback((incoming: File[]) => {
    const newErrors: string[] = [];
    const valid: File[] = [];

    for (const f of incoming) {
      const err = validateFile(f);
      if (err) {
        newErrors.push(err);
      } else {
        // Avoid duplicates by name+size
        const isDuplicate = files.some(
          existing => existing.name === f.name && existing.size === f.size
        );
        if (!isDuplicate) valid.push(f);
      }
    }

    setErrors(newErrors);
    if (valid.length > 0) {
      setFiles(prev => [...prev, ...valid]);
    }
  }, [validateFile, files]);

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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  }, [addFiles]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
      // Reset input so same file can be added again after removal
      e.target.value = '';
    }
  }, [addFiles]);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = async () => {
    if (files.length === 0) return;
    // Upload each file sequentially — each gets its own anexo record
    for (const file of files) {
      await onSubmit(file, descricao.trim() || undefined);
    }
    setFiles([]);
    setDescricao("");
    setErrors([]);
    onClose();
  };

  const handleClose = () => {
    setFiles([]);
    setDescricao("");
    setErrors([]);
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
                : files.length > 0
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
              multiple
              onChange={handleChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />

            <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-foreground font-medium mb-1">
              Arraste arquivos ou clique para selecionar
            </p>
            <p className="text-sm text-muted-foreground">
              Formatos: {formatosAceitos.join(', ').toUpperCase()}
            </p>
            <p className="text-sm text-muted-foreground">
              Tamanho máximo por arquivo: {tamanhoMaximoMb}MB
            </p>
          </div>

          {/* Selected Files List */}
          {files.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">
                {files.length} arquivo{files.length > 1 ? 's' : ''} selecionado{files.length > 1 ? 's' : ''}:
              </p>
              <ul className="space-y-2">
                {files.map((file, index) => (
                  <li
                    key={`${file.name}-${file.size}-${index}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-secondary shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 h-7 w-7"
                      onClick={() => removeFile(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <div className="space-y-1">
              {errors.map((err, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {err}
                </div>
              ))}
            </div>
          )}

          {/* Resumo / Observações */}
          <div className="space-y-1.5">
            <Label htmlFor="resumo-upload">Resumo / Observações <span className="text-muted-foreground font-normal">(opcional)</span></Label>
            <Textarea
              id="resumo-upload"
              placeholder="Breve descrição do documento..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              maxLength={500}
              rows={3}
            />
            <p className="text-xs text-muted-foreground text-right">{descricao.length}/500</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={files.length === 0 || isLoading}>
            {isLoading
              ? "Enviando..."
              : files.length > 1
              ? `Enviar ${files.length} arquivo(s)`
              : "Enviar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
