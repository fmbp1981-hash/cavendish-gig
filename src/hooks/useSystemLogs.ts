import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type LogLevel  = "error" | "warning" | "info";
export type LogSource = "edge_function" | "frontend" | "auth" | "cron" | "integration" | "database";

export interface SystemLog {
  id:               string;
  level:            LogLevel;
  source:           string;
  function_name:    string | null;
  message:          string;
  details:          Record<string, unknown> | null;
  user_id:          string | null;
  organizacao_id:   string | null;
  resolved:         boolean;
  resolved_at:      string | null;
  resolved_by:      string | null;
  resolution_notes: string | null;
  created_at:       string;
}

export interface LogFilters {
  level?:    LogLevel | "all";
  source?:   string   | "all";
  resolved?: boolean  | "all";
  search?:   string;
  from?:     string;   // ISO date string
}

export interface ResolvePayload {
  id:               string;
  resolution_notes: string;
}

// ── Fetch logs ────────────────────────────────────────────────────────────────

export function useSystemLogs(filters: LogFilters = {}) {
  return useQuery({
    queryKey: ["system-logs", filters],
    queryFn:  async (): Promise<SystemLog[]> => {
      let q = supabase
        .from("system_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (filters.level && filters.level !== "all")
        q = q.eq("level", filters.level);
      if (filters.source && filters.source !== "all")
        q = q.eq("source", filters.source);
      if (filters.resolved !== undefined && filters.resolved !== "all" as unknown)
        q = q.eq("resolved", filters.resolved as boolean);
      if (filters.from)
        q = q.gte("created_at", filters.from);
      if (filters.search)
        q = q.ilike("message", `%${filters.search}%`);

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as SystemLog[];
    },
    staleTime: 30_000,
    refetchInterval: 60_000, // refresh automático a cada 60s
  });
}

// ── Stats (counts por level) ──────────────────────────────────────────────────

export interface LogStats {
  total:          number;
  errors:         number;
  warnings:       number;
  infos:          number;
  unresolved:     number;
  unresolvedError: number;
  last24h:        number;
}

export function useLogStats() {
  return useQuery({
    queryKey: ["system-logs-stats"],
    queryFn:  async (): Promise<LogStats> => {
      const { data, error } = await supabase
        .from("system_logs")
        .select("level, resolved, created_at");

      if (error) throw error;
      const rows = data ?? [];
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      return {
        total:           rows.length,
        errors:          rows.filter(r => r.level === "error").length,
        warnings:        rows.filter(r => r.level === "warning").length,
        infos:           rows.filter(r => r.level === "info").length,
        unresolved:      rows.filter(r => !r.resolved).length,
        unresolvedError: rows.filter(r => !r.resolved && r.level === "error").length,
        last24h:         rows.filter(r => r.created_at >= yesterday).length,
      };
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

// ── Resolve log ───────────────────────────────────────────────────────────────

export function useResolveLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, resolution_notes }: ResolvePayload) => {
      const { error } = await supabase
        .from("system_logs")
        .update({
          resolved:         true,
          resolved_at:      new Date().toISOString(),
          resolution_notes: resolution_notes || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["system-logs"] });
      qc.invalidateQueries({ queryKey: ["system-logs-stats"] });
    },
  });
}

// ── Reabrir log ───────────────────────────────────────────────────────────────

export function useReopenLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("system_logs")
        .update({ resolved: false, resolved_at: null, resolution_notes: null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["system-logs"] });
      qc.invalidateQueries({ queryKey: ["system-logs-stats"] });
    },
  });
}
