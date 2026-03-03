import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SaveBrandingData {
  organizacao_id: string;
  company_name: string;
  logo_url?: string;
  favicon_url?: string;
  primary_hsl: string;
  secondary_hsl: string;
  accent_hsl: string;
  custom_css?: string;
}

export function useSaveBranding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SaveBrandingData) => {
      // Verifica se já existe branding para esta organização
      const { data: existing, error: checkError } = await supabase
        .from("tenant_branding")
        .select("organizacao_id")
        .eq("organizacao_id", data.organizacao_id)
        .maybeSingle();

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError;
      }

      // Se existe, faz UPDATE, senão faz INSERT
      if (existing) {
        const { error: updateError } = await supabase
          .from("tenant_branding")
          .update({
            company_name: data.company_name,
            logo_url: data.logo_url,
            favicon_url: data.favicon_url,
            primary_hsl: data.primary_hsl,
            secondary_hsl: data.secondary_hsl,
            accent_hsl: data.accent_hsl,
            custom_css: data.custom_css,
            updated_at: new Date().toISOString(),
          })
          .eq("organizacao_id", data.organizacao_id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("tenant_branding")
          .insert({
            organizacao_id: data.organizacao_id,
            company_name: data.company_name,
            logo_url: data.logo_url,
            favicon_url: data.favicon_url,
            primary_hsl: data.primary_hsl,
            secondary_hsl: data.secondary_hsl,
            accent_hsl: data.accent_hsl,
            custom_css: data.custom_css,
          });

        if (insertError) throw insertError;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-branding"] });
      toast.success("Branding salvo com sucesso!");

      // Recarrega a página para aplicar as mudanças
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    },
    onError: (error: any) => {
      console.error("Erro ao salvar branding:", error);
      toast.error(`Erro ao salvar: ${error.message}`);
    },
  });
}
