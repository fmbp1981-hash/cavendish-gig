import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface LogoUploaderProps {
  organizacaoId: string;
  currentLogoUrl?: string;
  onLogoUploaded: (url: string) => void;
  type?: "logo" | "favicon";
}

export function LogoUploader({
  organizacaoId,
  currentLogoUrl,
  onLogoUploaded,
  type = "logo",
}: LogoUploaderProps) {
  const [logoUrl, setLogoUrl] = useState(currentLogoUrl || "");
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxSize = type === "favicon" ? 512 * 1024 : 2 * 1024 * 1024; // 512KB para favicon, 2MB para logo
  const acceptedFormats = type === "favicon" ? "image/png, image/x-icon" : "image/png, image/jpeg, image/svg+xml";
  const recommendedSize = type === "favicon" ? "32x32px" : "400x200px";

  const handleFileSelect = async (file: File) => {
    // Validar tamanho
    if (file.size > maxSize) {
      toast.error(`Arquivo muito grande. Máximo: ${maxSize / 1024 / 1024}MB`);
      return;
    }

    // Validar formato
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem válida");
      return;
    }

    setIsUploading(true);

    try {
      // Upload para Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${organizacaoId}-${type}-${Date.now()}.${fileExt}`;
      const filePath = `branding/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from("documentos")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from("documentos")
        .getPublicUrl(filePath);

      setLogoUrl(publicUrl);
      onLogoUploaded(publicUrl);
      toast.success(`${type === "favicon" ? "Favicon" : "Logo"} enviada com sucesso!`);
    } catch (error: any) {
      console.error("Erro ao fazer upload:", error);
      toast.error(`Erro ao enviar ${type}: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemove = () => {
    setLogoUrl("");
    onLogoUploaded("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        {logoUrl ? (
          <div className="space-y-3">
            <div className="relative rounded-lg border-2 border-border bg-muted/30 p-4 flex items-center justify-center min-h-[120px]">
              <img
                src={logoUrl}
                alt={type === "favicon" ? "Favicon" : "Logo"}
                className={cn(
                  "object-contain",
                  type === "favicon" ? "max-h-8 max-w-8" : "max-h-20 max-w-full"
                )}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                Trocar {type === "favicon" ? "Favicon" : "Logo"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemove}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50 hover:bg-muted/30"
            )}
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Enviando...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <ImageIcon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">
                    Arraste e solte ou clique para selecionar
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {type === "favicon"
                      ? "PNG ou ICO, máx. 512KB"
                      : "PNG, JPG ou SVG, máx. 2MB"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Recomendado: {recommendedSize}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats}
          onChange={handleFileInput}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
}
