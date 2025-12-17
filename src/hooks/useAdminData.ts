import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [usersResult, consultoresResult] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact" }),
        supabase
          .from("user_roles")
          .select("id", { count: "exact" })
          .eq("role", "consultor"),
      ]);

      return {
        totalUsers: usersResult.count || 0,
        totalConsultores: consultoresResult.count || 0,
      };
    },
  });
}

export function useAllUsers() {
  return useQuery({
    queryKey: ["all-users"],
    queryFn: async () => {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch user roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      // Combine data
      const usersWithRoles = profiles?.map((profile) => ({
        ...profile,
        user_roles: roles?.filter((r) => r.user_id === profile.id) || [],
      }));

      return usersWithRoles;
    },
  });
}

export function useAllUserRoles() {
  return useQuery({
    queryKey: ["all-user-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select(`
          *,
          profiles:user_id (
            id,
            nome,
            email
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

export function useDocumentoCatalogo() {
  return useQuery({
    queryKey: ["documento-catalogo"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documentos_catalogo")
        .select("*")
        .order("fase")
        .order("ordem");

      if (error) throw error;
      return data;
    },
  });
}

export function useConsultores() {
  return useQuery({
    queryKey: ["consultores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select(`
          user_id,
          profiles:user_id (
            id,
            nome,
            email
          )
        `)
        .eq("role", "consultor");

      if (error) throw error;
      return data;
    },
  });
}

export function useConsultorOrganizacoes(consultorId: string | undefined) {
  return useQuery({
    queryKey: ["consultor-organizacoes", consultorId],
    queryFn: async () => {
      if (!consultorId) return [];
      
      const { data, error } = await supabase
        .from("consultor_organizacoes")
        .select(`
          id,
          organizacao_id,
          organizacoes (
            id,
            nome,
            cnpj
          )
        `)
        .eq("consultor_id", consultorId);

      if (error) throw error;
      return data;
    },
    enabled: !!consultorId,
  });
}

export function useAllOrganizacoes() {
  return useQuery({
    queryKey: ["all-organizacoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizacoes")
        .select("*")
        .order("nome");

      if (error) throw error;
      return data;
    },
  });
}
