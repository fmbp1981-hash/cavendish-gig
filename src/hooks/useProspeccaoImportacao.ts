import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  parseCSVText,
  parseXLSXBuffer,
  validateParsedRow,
  type ColumnMapping,
  type ParsedImportRow,
} from "@/lib/prospeccao/import-parser";
import type { ProspeccaoImportacao, ProspeccaoImportacaoErro } from "@/types/prospeccao";

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
}

const LOTE = 200;

export function useImportarArquivo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ arquivo, mapping, responsavelId }: ImportarArquivoInput) => {
      const formato = arquivo.name.toLowerCase().endsWith(".xlsx") ? "xlsx" : "csv";

      const { linhas, totalLinhas } =
        formato === "csv"
          ? await parseCSVText(await arquivo.text(), mapping)
          : await parseXLSXBuffer(await arquivo.arrayBuffer(), mapping);

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
            origem: formato === "csv" ? "import_csv" : "import_xlsx",
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
