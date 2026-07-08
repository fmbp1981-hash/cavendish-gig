import type { ProspeccaoCategoria } from "@/types/prospeccao";
import { PROSPECCAO_CATEGORIAS } from "@/types/prospeccao";

// Libs de parsing são carregadas via import dinâmico dentro das funções que precisam delas —
// evita inflar o bundle da SPA inteira com libs usadas só na tela de importação (mesmo racional
// do módulo `finder` original). XLSX usa `exceljs` (não `xlsx`/SheetJS): a versão publicada da
// SheetJS no npm (pacote "xlsx") tem CVEs conhecidos de alta severidade (prototype pollution,
// ReDoS) sem correção disponível via npm — só via CDN próprio da SheetJS, inacessível na rede
// deste ambiente. `exceljs` é mantido ativamente e não carrega esse risco.

export interface ParsedImportRow {
  nome: string;
  cnpj?: string;
  telefone?: string;
  email?: string;
  website?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  setor?: string;
  categoria: ProspeccaoCategoria;
}

/** Mapeia o nome da coluna do arquivo para o campo de destino em ParsedImportRow. */
export type ColumnMapping = Partial<Record<keyof ParsedImportRow, string>>;

const CATEGORIA_ALIASES: Record<ProspeccaoCategoria, RegExp> = {
  sem_compliance_formal: /sem.?compliance|sem.?programa/i,
  licitacao_publica: /licita/i,
  acesso_credito_investimento: /cr[eé]dito|investi/i,
  fusao_aquisicao: /fus[aã]o|aquisi[cç][aã]o|m&a/i,
  certificacao_iso: /iso|certifica/i,
  grupo_empresarial: /grupo|filiai/i,
  parceiro_indicador: /parceiro|indicador/i,
};

export function normalizeCategoria(raw: string | undefined | null): ProspeccaoCategoria | null {
  if (!raw) return null;
  const trimmed = raw.trim().toLowerCase().replace(/\s+/g, "_");
  if ((PROSPECCAO_CATEGORIAS as readonly string[]).includes(trimmed)) {
    return trimmed as ProspeccaoCategoria;
  }
  for (const categoria of PROSPECCAO_CATEGORIAS) {
    if (CATEGORIA_ALIASES[categoria].test(raw)) return categoria;
  }
  return null;
}

/** Remove tudo que não é dígito e garante o DDI 55 (Brasil) para números plausíveis de celular/fixo. */
export function normalizePhone(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 10) return null;
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

export function mapRow(row: Record<string, unknown>, mapping: ColumnMapping): Partial<ParsedImportRow> {
  const result: Partial<ParsedImportRow> = {};
  for (const [campo, coluna] of Object.entries(mapping) as [keyof ParsedImportRow, string][]) {
    const valor = coluna ? row[coluna] : undefined;
    if (valor === undefined || valor === null || valor === "") continue;
    if (campo === "categoria") {
      const categoria = normalizeCategoria(String(valor));
      if (categoria) result.categoria = categoria;
    } else if (campo === "telefone") {
      const telefone = normalizePhone(String(valor));
      if (telefone) result.telefone = telefone;
    } else {
      (result as Record<string, unknown>)[campo] = String(valor).trim();
    }
  }
  return result;
}

/** Regra de negócio: nome é obrigatório; telefone OU email precisa estar presente para o lead
 * ser contatável; categoria é obrigatória (ver schema `prospeccao_leads.categoria NOT NULL`). */
export function validateParsedRow(row: Partial<ParsedImportRow>): row is ParsedImportRow {
  return Boolean(row.nome?.trim()) && Boolean(row.telefone || row.email) && Boolean(row.categoria);
}

export async function parseCSVText(
  text: string,
  mapping: ColumnMapping
): Promise<{ linhas: Partial<ParsedImportRow>[]; totalLinhas: number }> {
  const Papa = (await import("papaparse")).default;
  const { data } = Papa.parse<Record<string, unknown>>(text, {
    header: true,
    skipEmptyLines: true,
  });
  return { linhas: data.map((row) => mapRow(row, mapping)), totalLinhas: data.length };
}

export async function parseXLSXBuffer(
  buffer: ArrayBuffer,
  mapping: ColumnMapping
): Promise<{ linhas: Partial<ParsedImportRow>[]; totalLinhas: number }> {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) return { linhas: [], totalLinhas: 0 };

  const header: string[] = [];
  worksheet.getRow(1).eachCell((cell, colNumber) => {
    header[colNumber - 1] = String(cell.value ?? "").trim();
  });

  const linhas: Partial<ParsedImportRow>[] = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // cabeçalho
    const raw: Record<string, unknown> = {};
    row.eachCell((cell, colNumber) => {
      const coluna = header[colNumber - 1];
      if (coluna) raw[coluna] = cell.value;
    });
    if (Object.keys(raw).length > 0) linhas.push(mapRow(raw, mapping));
  });

  return { linhas, totalLinhas: linhas.length };
}
