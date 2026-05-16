import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type TipoReuniao = "kickoff" | "acompanhamento" | "workshop" | "apresentacao" | "outro";
export type StatusReuniao = "agendada" | "realizada" | "cancelada" | "reagendada";

export interface Reuniao {
  id: string;
  organizacao_id: string;
  projeto_id: string | null;
  tipo: TipoReuniao;
  titulo: string;
  descricao: string | null;
  data_inicio: string;
  data_fim: string;
  fase: string | null;
  participantes: { email: string; nome?: string }[];
  link_video: string | null;
  local: string | null;
  google_event_id: string | null;
  status: StatusReuniao;
  observacoes_pos: string | null;
  criado_por: string | null;
  created_at: string;
  updated_at: string;
}

export interface InsertReuniao {
  organizacao_id: string;
  projeto_id?: string | null;
  tipo: TipoReuniao;
  titulo: string;
  descricao?: string | null;
  data_inicio: string;
  data_fim: string;
  fase?: string | null;
  participantes?: { email: string; nome?: string }[];
  link_video?: string | null;
  local?: string | null;
  google_event_id?: string | null;
  status?: StatusReuniao;
}

export function useReunioesByOrg(organizacaoId: string | null) {
  return useQuery({
    queryKey: ["reunioes", organizacaoId],
    enabled: !!organizacaoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reunioes")
        .select("*")
        .eq("organizacao_id", organizacaoId!)
        .order("data_inicio", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as Reuniao[];
    },
  });
}

export function useProximaReuniao(organizacaoId: string | null) {
  return useQuery({
    queryKey: ["reuniao-proxima", organizacaoId],
    enabled: !!organizacaoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reunioes")
        .select("*")
        .eq("organizacao_id", organizacaoId!)
        .eq("status", "agendada")
        .gte("data_inicio", new Date().toISOString())
        .order("data_inicio", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as Reuniao | null;
    },
  });
}

export function useInsertReuniao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reuniao: InsertReuniao) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("reunioes")
        .insert({
          ...reuniao,
          participantes: (reuniao.participantes ?? []) as unknown as any,
          criado_por: user?.id ?? null,
        })
        .select("id, titulo, data_inicio, link_video")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["reunioes", vars.organizacao_id] });
      queryClient.invalidateQueries({ queryKey: ["reuniao-proxima", vars.organizacao_id] });
    },
  });
}

export function useAtualizarReuniaoGoogleId() {
  return useMutation({
    mutationFn: async ({ id, googleEventId, linkVideo }: { id: string; googleEventId: string; linkVideo?: string }) => {
      const { error } = await supabase
        .from("reunioes")
        .update({ google_event_id: googleEventId, link_video: linkVideo ?? null })
        .eq("id", id);
      if (error) throw error;
    },
  });
}
