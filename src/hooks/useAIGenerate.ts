import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AIGenerationType = "codigo_etica" | "analise_documento" | "gerar_ata" | "chat";

interface AIGenerateOptions {
  tipo: AIGenerationType;
  input_data: Record<string, unknown>;
  projeto_id?: string;
  organizacao_id?: string;
  stream?: boolean;
  onDelta?: (text: string) => void;
}

interface AIGenerateResult {
  success: boolean;
  output?: string;
  tokens_used?: number;
  duration_ms?: number;
  error?: string;
}

export function useAIGenerate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async (options: AIGenerateOptions): Promise<AIGenerateResult> => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Você precisa estar logado para usar a IA");
      }

      if (options.stream && options.onDelta) {
        // Streaming mode
        const response = await fetch(
          `${
            process.env.NEXT_PUBLIC_SUPABASE_URL ??
            process.env.VITE_SUPABASE_URL
          }/functions/v1/ai-generate`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ ...options, stream: true }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Erro ao gerar conteúdo");
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("Stream não disponível");

        const decoder = new TextDecoder();
        let fullText = "";
        let textBuffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          textBuffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);

            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || line.trim() === "") continue;
            if (!line.startsWith("data: ")) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") break;

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullText += content;
                options.onDelta(content);
              }
            } catch {
              textBuffer = line + "\n" + textBuffer;
              break;
            }
          }
        }

        return { success: true, output: fullText };
      } else {
        // Non-streaming mode
        const { data, error: fnError } = await supabase.functions.invoke("ai-generate", {
          body: options,
        });

        if (fnError) throw fnError;
        if (!data.success) throw new Error(data.error || "Erro ao gerar conteúdo");

        return data as AIGenerateResult;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return { generate, loading, error };
}
