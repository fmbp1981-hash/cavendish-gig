import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface RepresentanteOption {
  id: string;
  nome: string | null;
  email: string;
}

/** Lista usuários com o papel `representante` — usado pelo admin para atribuir leads/ver o
 * responsável no kanban e na tabela. Duas queries + join no cliente (sem embedded joins,
 * convenção do projeto: ver MASTER-ARCHITECTURE.md). */
export function useRepresentantes() {
  return useQuery({
    queryKey: ["representantes"],
    queryFn: async () => {
      const { data: papeis, error: erroPapeis } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "representante" as any);
      if (erroPapeis) throw erroPapeis;

      const ids = (papeis ?? []).map((p) => p.user_id);
      if (ids.length === 0) return [] as RepresentanteOption[];

      const { data: perfis, error: erroPerfis } = await supabase
        .from("profiles")
        .select("id, nome, email")
        .in("id", ids);
      if (erroPerfis) throw erroPerfis;

      return (perfis ?? []) as RepresentanteOption[];
    },
  });
}
