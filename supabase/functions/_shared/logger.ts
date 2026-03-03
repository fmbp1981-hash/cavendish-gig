import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

export type LogLevel = "error" | "warning" | "info";

export interface LogOptions {
  source: string;
  functionName?: string;
  message: string;
  details?: Record<string, unknown>;
  userId?: string | null;
  organizacaoId?: string | null;
}

/**
 * Persiste um log na tabela public.system_logs.
 * Falha silenciosa — nunca interrompe o fluxo principal.
 */
export async function logToSystem(level: LogLevel, options: LogOptions): Promise<void> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceKey) return;

    const service = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    await service.from("system_logs").insert({
      level,
      source:         options.source,
      function_name:  options.functionName ?? null,
      message:        options.message,
      details:        options.details ?? null,
      user_id:        options.userId        ?? null,
      organizacao_id: options.organizacaoId ?? null,
    });
  } catch (err) {
    // Nunca interrompe o fluxo principal
    console.error("[logger] Failed to write system_log:", err);
  }
}

/** Atalho para erros de Edge Function */
export async function logEdgeFunctionError(
  functionName: string,
  error: unknown,
  context?: { userId?: string | null; organizacaoId?: string | null; extra?: Record<string, unknown> },
): Promise<void> {
  const err = error as Error;
  await logToSystem("error", {
    source:        "edge_function",
    functionName,
    message:       err?.message ?? String(error),
    details:       {
      stack:     err?.stack ?? null,
      name:      err?.name  ?? null,
      ...(context?.extra ?? {}),
    },
    userId:        context?.userId        ?? null,
    organizacaoId: context?.organizacaoId ?? null,
  });
}
