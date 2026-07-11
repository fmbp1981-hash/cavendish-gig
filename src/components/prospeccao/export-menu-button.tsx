import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText, Loader2, Table2 } from "lucide-react";
import { toast } from "sonner";
import { exportToCSV, exportToPDF, exportToXLSX, type ExportColumn } from "@/lib/export/table-export";

interface ExportMenuButtonProps<T> {
  rows: T[];
  columns: ExportColumn<T>[];
  /** Usado como nome do arquivo (sem extensão) e como título no cabeçalho do PDF. */
  titulo: string;
}

type FormatoExport = "csv" | "xlsx" | "pdf";

export function ExportMenuButton<T>({ rows, columns, titulo }: ExportMenuButtonProps<T>) {
  const [exportando, setExportando] = useState<FormatoExport | null>(null);

  const slug = titulo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const handleExport = async (formato: FormatoExport) => {
    if (rows.length === 0) {
      toast.error("Nada para exportar", { description: "Não há registros na lista atual." });
      return;
    }
    setExportando(formato);
    try {
      if (formato === "csv") await exportToCSV(rows, columns, slug);
      else if (formato === "xlsx") await exportToXLSX(rows, columns, slug);
      else await exportToPDF(rows, columns, slug, titulo);
    } catch (err) {
      toast.error("Erro ao exportar", { description: (err as Error).message });
    } finally {
      setExportando(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={exportando !== null}>
          {exportando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport("csv")}>
          <Table2 className="h-4 w-4 mr-2" />
          CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("xlsx")}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Excel (XLSX)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("pdf")}>
          <FileText className="h-4 w-4 mr-2" />
          PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
