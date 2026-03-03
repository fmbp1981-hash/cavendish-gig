import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TenantBranding {
  organizacao_id: string;
  company_name: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  primary_hsl: string;
  secondary_hsl: string;
  accent_hsl: string;
  custom_css: string | null;
  created_at: string;
  updated_at: string;
}

export function useTenantBranding(organizacaoId: string | undefined) {
  return useQuery({
    queryKey: ["tenant-branding", organizacaoId],
    queryFn: async (): Promise<TenantBranding | null> => {
      if (!organizacaoId) return null;

      const { data, error } = await supabase
        .from("tenant_branding")
        .select("*")
        .eq("organizacao_id", organizacaoId)
        .maybeSingle();

      if (error) throw error;
      return (data as TenantBranding) || null;
    },
    enabled: !!organizacaoId,
    staleTime: 60_000,
    retry: 1,
  });
}
