import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface CodigoEticaVersao {
  id: string;
  versao: string;
  titulo: string;
  conteudo: string;
  ativo: boolean;
  vigencia_inicio: string;
  created_at: string;
}

export interface CodigoEticaAdesao {
  id: string;
  user_id: string;
  organizacao_id: string;
  versao_id: string;
  aceito_em: string;
  profiles?: {
    nome: string | null;
    email: string | null;
  };
  organizacoes?: {
    nome: string;
  };
  codigo_etica_versoes?: {
    versao: string;
    titulo: string;
  };
}

export function useCodigoEticaAtivo() {
  return useQuery({
    queryKey: ["codigo-etica-ativo"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("codigo_etica_versoes")
        .select("*")
        .eq("ativo", true)
        .order("vigencia_inicio", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as CodigoEticaVersao | null;
    },
  });
}

export function useMinhaAdesao(versaoId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["minha-adesao", versaoId, user?.id],
    queryFn: async () => {
      if (!versaoId || !user?.id) return null;

      const { data, error } = await supabase
        .from("codigo_etica_adesoes")
        .select("*")
        .eq("versao_id", versaoId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as CodigoEticaAdesao | null;
    },
    enabled: !!versaoId && !!user?.id,
  });
}

export function useRegistrarAdesao() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ versaoId, organizacaoId }: { versaoId: string; organizacaoId: string }) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("codigo_etica_adesoes")
        .insert({
          user_id: user.id,
          organizacao_id: organizacaoId,
          versao_id: versaoId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["minha-adesao"] });
      queryClient.invalidateQueries({ queryKey: ["adesoes-organizacao"] });
      toast.success("Termo de adesão registrado com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao registrar adesão:", error);
      toast.error("Erro ao registrar adesão");
    },
  });
}

// Para consultores - ver adesões de uma organização
export function useAdesoesOrganizacao(organizacaoId: string | undefined) {
  return useQuery({
    queryKey: ["adesoes-organizacao", organizacaoId],
    queryFn: async () => {
      if (!organizacaoId) return [];

      const { data, error } = await supabase
        .from("codigo_etica_adesoes")
        .select(`
          *,
          profiles:user_id(nome, email),
          codigo_etica_versoes:versao_id(versao, titulo)
        `)
        .eq("organizacao_id", organizacaoId)
        .order("aceito_em", { ascending: false });

      if (error) throw error;
      return data as CodigoEticaAdesao[];
    },
    enabled: !!organizacaoId,
  });
}

// Para consultores - ver todas as adesões
export function useTodasAdesoes() {
  return useQuery({
    queryKey: ["todas-adesoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("codigo_etica_adesoes")
        .select(`
          *,
          profiles:user_id(nome, email),
          organizacoes:organizacao_id(nome),
          codigo_etica_versoes:versao_id(versao, titulo)
        `)
        .order("aceito_em", { ascending: false });

      if (error) throw error;
      return data as CodigoEticaAdesao[];
    },
  });
}

// Para consultores - estatísticas por organização
export function useEstatisticasAdesao() {
  return useQuery({
    queryKey: ["estatisticas-adesao"],
    queryFn: async () => {
      // Buscar organizações
      const { data: orgs, error: orgsError } = await supabase
        .from("organizacoes")
        .select("id, nome");

      if (orgsError) throw orgsError;

      // Buscar membros por organização
      const { data: members, error: membersError } = await supabase
        .from("organization_members")
        .select("organizacao_id, user_id");

      if (membersError) throw membersError;

      // Buscar versão ativa
      const { data: versaoAtiva } = await supabase
        .from("codigo_etica_versoes")
        .select("id")
        .eq("ativo", true)
        .maybeSingle();

      if (!versaoAtiva) return [];

      // Buscar adesões da versão ativa
      const { data: adesoes, error: adesoesError } = await supabase
        .from("codigo_etica_adesoes")
        .select("organizacao_id, user_id")
        .eq("versao_id", versaoAtiva.id);

      if (adesoesError) throw adesoesError;

      // Calcular estatísticas
      const stats = (orgs || []).map((org: any) => {
        const membrosOrg = (members || []).filter((m: any) => m.organizacao_id === org.id);
        const adesoesOrg = (adesoes || []).filter((a: any) => a.organizacao_id === org.id);
        
        return {
          organizacao_id: org.id,
          organizacao_nome: org.nome,
          total_membros: membrosOrg.length,
          total_adesoes: adesoesOrg.length,
          percentual: membrosOrg.length > 0 
            ? Math.round((adesoesOrg.length / membrosOrg.length) * 100) 
            : 0,
        };
      });

      return stats;
    },
  });
}
