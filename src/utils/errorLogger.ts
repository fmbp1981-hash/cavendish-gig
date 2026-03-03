import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export type LogLevel = "error" | "warning" | "info";

interface LogPayload {
  level: LogLevel;
  source: string;
  function_name?: string;
  message: string;
  details?: Record<string, unknown>;
  organizacao_id?: string | null;
}

/**
 * Persiste um log na tabela public.system_logs via cliente Supabase do frontend.
 * Falha silenciosa — nunca interrompe o fluxo principal.
 */
export async function logError(payload: LogPayload): Promise<void> {
  try {
    await supabase.from("system_logs").insert({
      level:          payload.level,
      source:         payload.source,
      function_name:  payload.function_name ?? null,
      message:        payload.message,
      details:        (payload.details ?? null) as Json | null,
      organizacao_id: payload.organizacao_id ?? null,
    });
  } catch {
    // Nunca interrompe o fluxo principal
  }
}

/**
 * Instala handlers globais de erros não tratados no browser.
 * Chamar uma única vez na inicialização do app (ex.: main.tsx ou App.tsx).
 */
export function installGlobalErrorHandlers(): void {
  if (typeof window === "undefined") return;

  window.addEventListener("error", (event) => {
    logError({
      level:   "error",
      source:  "frontend",
      message: event.message || "Uncaught error",
      details: {
        filename: event.filename,
        lineno:   event.lineno,
        colno:    event.colno,
        stack:    event.error?.stack ?? null,
      },
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    logError({
      level:   "error",
      source:  "frontend",
      message: reason?.message ?? String(reason) ?? "Unhandled promise rejection",
      details: {
        stack: reason?.stack ?? null,
        type:  "unhandledrejection",
      },
    });
  });
}
