import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Download,
  Trash2,
  FileText,
  File,
  Tag,
} from "lucide-react";
import type { BibliotecaArquivo } from "@/hooks/useBiblioteca";
import { formatBytes, getFormatoColor } from "@/hooks/useBiblioteca";
import { useIncrementDownloadCount } from "@/hooks/useBiblioteca";
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

// ─── Format icon ──────────────────────────────────────────────────────────────

function FormatoIcon({ formato }: { formato: string }) {
  const colorClass = getFormatoColor(formato);
  const textFormats = ["docx", "doc", "pdf", "pptx", "ppt", "txt"];
  const isText = textFormats.includes(formato.toLowerCase());

  const Icon = isText ? FileText : File;
  return <Icon className={`h-8 w-8 ${colorClass}`} />;
}

// ─── Format badge color ────────────────────────────────────────────────────────

function formatoBadgeVariant(formato: string): string {
  const map: Record<string, string> = {
    pdf: "bg-red-100 text-red-700 border-red-200",
    docx: "bg-blue-100 text-blue-700 border-blue-200",
    doc: "bg-blue-100 text-blue-700 border-blue-200",
    xlsx: "bg-green-100 text-green-700 border-green-200",
    xls: "bg-green-100 text-green-700 border-green-200",
    pptx: "bg-orange-100 text-orange-700 border-orange-200",
    ppt: "bg-orange-100 text-orange-700 border-orange-200",
    csv: "bg-teal-100 text-teal-700 border-teal-200",
    txt: "bg-gray-100 text-gray-700 border-gray-200",
  };
  return map[formato.toLowerCase()] ?? "bg-gray-100 text-gray-700 border-gray-200";
}

function formatDate(dateStr: string): string {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export interface BibliotecaCardProps {
  arquivo: BibliotecaArquivo;
  isAdmin: boolean;
  onDelete?: (id: string) => void;
}

export function BibliotecaCard({ arquivo, isAdmin, onDelete }: BibliotecaCardProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const incrementDownload = useIncrementDownloadCount();

  async function handleDownload() {
    setIsDownloading(true);
    try {
      window.open(arquivo.arquivo_url, "_blank", "noopener,noreferrer");
      await incrementDownload.mutateAsync(arquivo.id);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <Card className="flex flex-col h-full hover:shadow-md transition-shadow duration-200 border border-border">
      <CardContent className="flex flex-col gap-3 p-4 h-full">
        {/* Top row: icon + format + category */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 p-2 rounded-lg bg-muted">
              <FormatoIcon formato={arquivo.formato} />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-foreground line-clamp-2 leading-tight">
                {arquivo.nome}
              </p>
              <span
                className={`inline-block mt-1 text-xs font-medium px-1.5 py-0.5 rounded border ${formatoBadgeVariant(arquivo.formato)}`}
              >
                .{arquivo.formato.toUpperCase()}
              </span>
            </div>
          </div>
          {isAdmin && onDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive flex-shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Excluir arquivo</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir arquivo?</AlertDialogTitle>
                  <AlertDialogDescription>
                    O arquivo <strong>{arquivo.nome}</strong> será removido permanentemente da biblioteca. Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => onDelete(arquivo.id)}
                  >
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {/* Description */}
        {arquivo.descricao && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {arquivo.descricao}
          </p>
        )}

        {/* Category badge */}
        {arquivo.categoria && (
          <Badge variant="outline" className="self-start text-xs">
            {arquivo.categoria.nome}
          </Badge>
        )}

        {/* Tags */}
        {arquivo.tags && arquivo.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {arquivo.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-0.5 text-xs bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded-full"
              >
                <Tag className="h-2.5 w-2.5" />
                {tag}
              </span>
            ))}
            {arquivo.tags.length > 4 && (
              <span className="text-xs text-muted-foreground">
                +{arquivo.tags.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Footer: meta + download */}
        <div className="border-t border-border pt-3 flex items-center justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">
              {formatBytes(arquivo.tamanho_bytes)}
            </span>
            <span className="text-xs text-muted-foreground">
              {arquivo.download_count} download{arquivo.download_count !== 1 ? "s" : ""}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDate(arquivo.created_at)}
            </span>
          </div>
          <Button
            size="sm"
            onClick={handleDownload}
            disabled={isDownloading}
            className="gap-1.5 flex-shrink-0"
          >
            <Download className="h-3.5 w-3.5" />
            Baixar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
