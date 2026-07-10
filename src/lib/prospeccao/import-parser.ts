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

/** Preenche `categoria` com o valor padrão escolhido no dialog de importação quando a coluna
 * mapeada não veio preenchida naquela linha — evita rejeitar linhas só por causa de uma célula de
 * categoria vazia numa planilha que já foi filtrada por categoria pelo usuário. */
function aplicarCategoriaPadrao(
  linha: Partial<ParsedImportRow>,
  categoriaPadrao?: ProspeccaoCategoria
): Partial<ParsedImportRow> {
  if (linha.categoria || !categoriaPadrao) return linha;
  return { ...linha, categoria: categoriaPadrao };
}

export async function parseCSVText(
  text: string,
  mapping: ColumnMapping,
  categoriaPadrao?: ProspeccaoCategoria
): Promise<{ linhas: Partial<ParsedImportRow>[]; totalLinhas: number }> {
  const Papa = (await import("papaparse")).default;
  const { data } = Papa.parse<Record<string, unknown>>(text, {
    header: true,
    skipEmptyLines: true,
  });
  return {
    linhas: data.map((row) => aplicarCategoriaPadrao(mapRow(row, mapping), categoriaPadrao)),
    totalLinhas: data.length,
  };
}

export async function parseXLSXBuffer(
  buffer: ArrayBuffer,
  mapping: ColumnMapping,
  categoriaPadrao?: ProspeccaoCategoria
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
    if (Object.keys(raw).length > 0) linhas.push(aplicarCategoriaPadrao(mapRow(raw, mapping), categoriaPadrao));
  });

  return { linhas, totalLinhas: linhas.length };
}

// ── Formatos "freeform" (PDF, DOCX, TXT sem delimitador) ─────────────────────
// Sem cabeçalho/colunas pra mapear — a extração é heurística por linha/parágrafo via regex
// (email, telefone, CNPJ; o restante do texto vira o nome). Não é um parser de tabela genérico
// (não tenta reconstruir colunas de um PDF com layout em grade) — é best-effort para listas de
// contato em texto corrido, uma linha por contato. Resultados devem ser conferidos pelo usuário
// antes de confirmar a importação (mesma tela de mapeamento mostra os totais de erro).

const REGEX_EMAIL = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const REGEX_CNPJ = /\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/;
const REGEX_TELEFONE = /(?:\+?55\s?)?\(?\d{2}\)?[\s.-]?9?\d{4}[\s.-]?\d{4}/;

/** Extrai um contato de uma linha/parágrafo de texto livre. Retorna null se a linha não tem
 * nenhum sinal de contato (nem telefone nem email) — provavelmente não é uma linha de dados
 * (título, cabeçalho de seção, linha em branco residual, etc.). */
function extrairContatoDeLinha(linha: string, categoriaPadrao: ProspeccaoCategoria): Partial<ParsedImportRow> | null {
  const texto = linha.trim();
  if (!texto) return null;

  const email = texto.match(REGEX_EMAIL)?.[0];
  const cnpj = texto.match(REGEX_CNPJ)?.[0];
  const telefoneMatch = texto.match(REGEX_TELEFONE)?.[0];
  const telefone = telefoneMatch ? normalizePhone(telefoneMatch) : null;

  if (!email && !telefone) return null;

  let nome = texto;
  for (const trecho of [email, cnpj, telefoneMatch]) {
    if (trecho) nome = nome.replace(trecho, " ");
  }
  // Remove separadores comuns deixados pela remoção dos trechos acima (vírgulas, traços, pipes soltos).
  nome = nome.replace(/[,;|]+/g, " ").replace(/\s{2,}/g, " ").trim();

  return {
    nome: nome || texto,
    email: email ?? undefined,
    telefone: telefone ?? undefined,
    cnpj: cnpj ?? undefined,
    categoria: categoriaPadrao,
  };
}

function parseFreeformText(
  texto: string,
  categoriaPadrao: ProspeccaoCategoria
): { linhas: Partial<ParsedImportRow>[]; totalLinhas: number } {
  const blocos = texto
    .split(/\r?\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  const linhas = blocos
    .map((bloco) => extrairContatoDeLinha(bloco, categoriaPadrao))
    .filter((l): l is Partial<ParsedImportRow> => l !== null);

  return { linhas, totalLinhas: blocos.length };
}

/** Heurística simples: considera "delimitado" (tratável como CSV) se a primeira linha não-vazia
 * tiver o mesmo separador repetido em pelo menos mais uma linha — cobre .txt exportado de planilha
 * (separado por vírgula/ponto-e-vírgula/tab). Caso contrário, trata como texto livre. */
function pareceDelimitado(texto: string): boolean {
  const linhas = texto.split(/\r?\n+/).map((l) => l.trim()).filter(Boolean).slice(0, 5);
  if (linhas.length < 2) return false;
  for (const delimitador of [",", ";", "\t"]) {
    const contagens = linhas.map((l) => l.split(delimitador).length - 1);
    if (contagens[0] > 0 && contagens.every((c) => c === contagens[0])) return true;
  }
  return false;
}

export async function parseTXTText(
  texto: string,
  mapping: ColumnMapping,
  categoriaPadrao: ProspeccaoCategoria
): Promise<{ linhas: Partial<ParsedImportRow>[]; totalLinhas: number }> {
  if (pareceDelimitado(texto)) return parseCSVText(texto, mapping, categoriaPadrao);
  return parseFreeformText(texto, categoriaPadrao);
}

export async function parsePDFBuffer(
  buffer: ArrayBuffer,
  categoriaPadrao: ProspeccaoCategoria
): Promise<{ linhas: Partial<ParsedImportRow>[]; totalLinhas: number }> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  const doc = await pdfjs.getDocument({ data: buffer }).promise;
  const paginas: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const pagina = await doc.getPage(i);
    const conteudo = await pagina.getTextContent();
    const linha = conteudo.items.map((item) => ("str" in item ? item.str : "")).join(" ");
    paginas.push(linha);
  }

  return parseFreeformText(paginas.join("\n"), categoriaPadrao);
}

export async function parseDOCXBuffer(
  buffer: ArrayBuffer,
  categoriaPadrao: ProspeccaoCategoria
): Promise<{ linhas: Partial<ParsedImportRow>[]; totalLinhas: number }> {
  const mammoth = await import("mammoth");
  const { value: texto } = await mammoth.extractRawText({ arrayBuffer: buffer });
  return parseFreeformText(texto, categoriaPadrao);
}

// ── Suporte à UI de importação (mapeamento de colunas) ───────────────────────

/** Nomes de coluna comuns (PT/EN) por campo de destino — usado só para sugerir um mapeamento
 * inicial no dialog de importação; o usuário sempre pode corrigir manualmente. */
const ALIASES_COLUNA: Record<keyof ParsedImportRow, RegExp> = {
  nome: /^(nome|empresa|raz[aã]o social|nome fantasia|company|name)/i,
  telefone: /telefone|celular|whats ?app|fone|phone/i,
  email: /e-?mail/i,
  cnpj: /cnpj/i,
  website: /site|website|url|p[aá]gina/i,
  endereco: /endere[cç]o|address|logradouro/i,
  cidade: /cidade|city|munic[ií]pio/i,
  estado: /^(estado|uf|state)$/i,
  setor: /setor|segmento|ramo|sector|industry/i,
  categoria: /categoria|category/i,
};

/** Sugere um ColumnMapping inicial casando o nome de cada coluna do arquivo com os aliases acima.
 * Puramente um ponto de partida editável na UI — nunca aplica o mapeamento sem o usuário revisar. */
export function guessColumnMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  for (const campo of Object.keys(ALIASES_COLUNA) as (keyof ParsedImportRow)[]) {
    const coluna = headers.find((h) => ALIASES_COLUNA[campo].test(h.trim()));
    if (coluna) mapping[campo] = coluna;
  }
  return mapping;
}

async function lerHeaderXLSX(buffer: ArrayBuffer): Promise<string[]> {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) return [];
  const header: string[] = [];
  worksheet.getRow(1).eachCell((cell, colNumber) => {
    header[colNumber - 1] = String(cell.value ?? "").trim();
  });
  return header.filter(Boolean);
}

async function lerHeaderCSV(texto: string): Promise<string[]> {
  const Papa = (await import("papaparse")).default;
  const { meta } = Papa.parse<Record<string, unknown>>(texto, { header: true, preview: 1 });
  return meta.fields ?? [];
}

export interface EstruturaArquivo {
  /** true = arquivo tem colunas identificáveis (CSV/XLSX, ou TXT delimitado) — mostra mapeamento
   * de colunas na UI. false = extração heurística por linha (PDF/DOCX/TXT em texto livre). */
  estruturado: boolean;
  headers: string[];
}

/** Espia a estrutura do arquivo (sem processar todas as linhas) pra decidir se o dialog de
 * importação mostra a UI de mapeamento de colunas ou a nota de extração automática. Usa
 * exatamente a mesma heurística (`pareceDelimitado`) que o parser real vai usar no envio — mesmo
 * arquivo sempre resulta na mesma decisão, sem risco de UI e parser divergirem. */
export async function peekEstruturaArquivo(arquivo: File): Promise<EstruturaArquivo> {
  const nome = arquivo.name.toLowerCase();

  if (nome.endsWith(".xlsx")) {
    return { estruturado: true, headers: await lerHeaderXLSX(await arquivo.arrayBuffer()) };
  }
  if (nome.endsWith(".pdf") || nome.endsWith(".docx")) {
    return { estruturado: false, headers: [] };
  }

  const texto = await arquivo.text();
  if (!nome.endsWith(".txt") || pareceDelimitado(texto)) {
    return { estruturado: true, headers: await lerHeaderCSV(texto) };
  }
  return { estruturado: false, headers: [] };
}
