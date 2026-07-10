import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  parseCSVText,
  parseXLSXBuffer,
  parseTXTText,
  parsePDFBuffer,
  parseDOCXBuffer,
  validateParsedRow,
  type ColumnMapping,
  type ParsedImportRow,
} from "@/lib/prospeccao/import-parser";
import type { ProspeccaoCategoria, ProspeccaoImportacao, ProspeccaoImportacaoErro } from "@/types/prospeccao";

const db = supabase as any;

export function useProspeccaoImportacoes() {
  return useQuery({
    queryKey: ["prospeccao_importacoes"],
    queryFn: async () => {
      const { data, error } = await db
        .from("prospeccao_importacoes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ProspeccaoImportacao[];
    },
  });
}

interface ImportarArquivoInput {
  arquivo: File;
  mapping: ColumnMapping;
  responsavelId: string;
  /** Categoria usada quando a linha não tem uma coluna de categoria mapeada (planilhas sem essa
   * coluna) e sempre para os formatos "freeform" (PDF/DOCX/TXT sem delimitador), que não têm
   * colunas pra mapear — ver import-parser.ts. */
  categoriaPadrao: ProspeccaoCategoria;
}

type FormatoImportacao = "csv" | "xlsx" | "pdf" | "txt" | "docx";

function detectarFormato(nomeArquivo: string): FormatoImportacao {
  const nome = nomeArquivo.toLowerCase();
  if (nome.endsWith(".xlsx")) return "xlsx";
  if (nome.endsWith(".pdf")) return "pdf";
  if (nome.endsWith(".docx")) return "docx";
  if (nome.endsWith(".txt")) return "txt";
  return "csv";
}

const LOTE = 200;

export function useImportarArquivo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ arquivo, mapping, responsavelId, categoriaPadrao }: ImportarArquivoInput) => {
      const formato = detectarFormato(arquivo.name);

      const { linhas, totalLinhas } = await (async () => {
        switch (formato) {
          case "xlsx":
            return parseXLSXBuffer(await arquivo.arrayBuffer(), mapping, categoriaPadrao);
          case "pdf":
            return parsePDFBuffer(await arquivo.arrayBuffer(), categoriaPadrao);
          case "docx":
            return parseDOCXBuffer(await arquivo.arrayBuffer(), categoriaPadrao);
          case "txt":
            return parseTXTText(await arquivo.text(), mapping, categoriaPadrao);
          case "csv":
          default:
            return parseCSVText(await arquivo.text(), mapping, categoriaPadrao);
        }
      })();

      const { data: importacao, error: erroImportacao } = await db
        .from("prospeccao_importacoes")
        .insert({
          responsavel_id: responsavelId,
          nome_arquivo: arquivo.name,
          formato,
          total_linhas: totalLinhas,
          status: "processando",
        })
        .select()
        .single();
      if (erroImportacao) throw erroImportacao;

      const erros: ProspeccaoImportacaoErro[] = [];
      const validas: (ParsedImportRow & { responsavel_id: string; importacao_id: string; origem: string })[] = [];

      linhas.forEach((linha, index) => {
        if (validateParsedRow(linha)) {
          validas.push({
            ...linha,
            responsavel_id: responsavelId,
            importacao_id: importacao.id,
            origem: `import_${formato}`,
          });
        } else {
          erros.push({ linha: index + 2, motivo: "Nome, categoria e telefone/email são obrigatórios" });
        }
      });

      let totalImportados = 0;
      let totalDuplicados = 0;

      for (let i = 0; i < validas.length; i += LOTE) {
        const lote = validas.slice(i, i + LOTE);
        const { error, data } = await db.from("prospeccao_leads").insert(lote).select("id");
        if (error) {
          // 23505 = unique_violation (telefone ou google_place_id já cadastrado para este responsável)
          if (error.code === "23505") {
            // Reinsere linha a linha para separar duplicadas de outros erros do lote.
            for (const linha of lote) {
              const { error: erroLinha } = await db.from("prospeccao_leads").insert(linha);
              if (!erroLinha) totalImportados += 1;
              else if (erroLinha.code === "23505") totalDuplicados += 1;
              else erros.push({ linha: 0, motivo: erroLinha.message });
            }
          } else {
            erros.push({ linha: 0, motivo: error.message });
          }
        } else {
          totalImportados += data?.length ?? lote.length;
        }
      }

      const status = erros.length === 0 ? "concluido" : totalImportados > 0 ? "parcial" : "falhou";

      const { error: erroUpdate } = await db
        .from("prospeccao_importacoes")
        .update({ total_importados: totalImportados, total_duplicados: totalDuplicados, total_falhas: erros.length, status, log_erros: erros })
        .eq("id", importacao.id);
      if (erroUpdate) throw erroUpdate;

      return { totalLinhas, totalImportados, totalDuplicados, totalFalhas: erros.length };
    },
    onSuccess: (resultado) => {
      queryClient.invalidateQueries({ queryKey: ["prospeccao_leads"] });
      queryClient.invalidateQueries({ queryKey: ["prospeccao_importacoes"] });
      toast.success("Importação concluída", {
        description: `${resultado.totalImportados} importados, ${resultado.totalDuplicados} duplicados, ${resultado.totalFalhas} falhas.`,
      });
    },
    onError: (err: Error) => toast.error("Erro ao importar arquivo", { description: err.message }),
  });
}
