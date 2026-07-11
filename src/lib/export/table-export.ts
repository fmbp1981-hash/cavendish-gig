// Exportação de tabelas (leads, clientes) para CSV/XLSX/PDF — 100% client-side, sem round-trip ao
// backend (os dados já estão carregados na tela via react-query). Libs de export são carregadas
// via import dinâmico, mesmo racional de bundle usado em import-parser.ts.

export interface ExportColumn<T> {
  label: string;
  getValue: (row: T) => string;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function linhasParaObjetos<T>(rows: T[], columns: ExportColumn<T>[]): Record<string, string>[] {
  return rows.map((row) => Object.fromEntries(columns.map((c) => [c.label, c.getValue(row)])));
}

export async function exportToCSV<T>(rows: T[], columns: ExportColumn<T>[], filenameSemExtensao: string): Promise<void> {
  const Papa = (await import("papaparse")).default;
  const csv = Papa.unparse(linhasParaObjetos(rows, columns));
  // BOM UTF-8 — sem isso o Excel abre acentos (São Paulo, etc.) corrompidos em CSVs não-ASCII.
  downloadBlob(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }), `${filenameSemExtensao}.csv`);
}

export async function exportToXLSX<T>(rows: T[], columns: ExportColumn<T>[], filenameSemExtensao: string): Promise<void> {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Dados");
  worksheet.columns = columns.map((c) => ({ header: c.label, key: c.label, width: 22 }));
  worksheet.getRow(1).font = { bold: true };
  for (const row of rows) {
    worksheet.addRow(Object.fromEntries(columns.map((c) => [c.label, c.getValue(row)])));
  }
  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(
    new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    `${filenameSemExtensao}.xlsx`
  );
}

export async function exportToPDF<T>(
  rows: T[],
  columns: ExportColumn<T>[],
  filenameSemExtensao: string,
  titulo: string
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({ orientation: columns.length > 5 ? "landscape" : "portrait" });
  doc.setFontSize(14);
  doc.text(titulo, 14, 15);
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")} — ${rows.length} registro(s)`, 14, 21);

  autoTable(doc, {
    startY: 26,
    head: [columns.map((c) => c.label)],
    body: rows.map((row) => columns.map((c) => c.getValue(row))),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [30, 41, 59] },
  });

  doc.save(`${filenameSemExtensao}.pdf`);
}
