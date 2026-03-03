import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to get plan information for an organization
 * Provides feature flags and quota checks based on the organization's plan
 */
export function usePlanInfo(organizacaoId: string | undefined) {
  return useQuery({
    queryKey: ["plan-info", organizacaoId],
    queryFn: async () => {
      if (!organizacaoId) return null;
      
      const { data, error } = await supabase.rpc("org_get_plan_info", {
        p_organizacao_id: organizacaoId,
      });
      
      if (error) throw error;
      return data as {
        organizacao_id: string;
        organizacao_nome: string;
        plano: "essencial" | "executivo" | "premium";
        plano_nome: string;
        plano_inicio: string;
        plano_fim: string | null;
        features: {
          diagnostico: boolean;
          codigo_etica: boolean;
          canal_denuncias: boolean;
          treinamentos: boolean;
          certificados: boolean;
          relatorios_mensais: boolean;
          integracao_drive: boolean;
          integracao_calendar: boolean;
          integracao_trello: boolean;
          integracao_clickup: boolean;
          integracao_fireflies: boolean;
          whatsapp_notifications: boolean;
          api_webhooks: boolean;
          white_label: boolean;
          suporte_prioritario: boolean;
        };
        limits: {
          usuarios: number | null;
          documentos_mes: number | null;
          treinamentos: number | null;
          ai_generations_mes: number | null;
          storage_gb: number | null;
        };
      };
    },
    enabled: !!organizacaoId,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}

/**
 * Hook to check if organization has a specific feature
 */
export function useHasFeature(organizacaoId: string | undefined, feature: string) {
  return useQuery({
    queryKey: ["has-feature", organizacaoId, feature],
    queryFn: async () => {
      if (!organizacaoId) return false;
      
      const { data, error } = await supabase.rpc("org_has_feature", {
        p_organizacao_id: organizacaoId,
        p_feature: feature,
      });
      
      if (error) {
        console.error("Error checking feature:", error);
        return false;
      }
      return data as boolean;
    },
    enabled: !!organizacaoId && !!feature,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook to check quota for an organization
 */
export function useCheckQuota(
  organizacaoId: string | undefined, 
  quotaType: "usuarios" | "documentos_mes" | "ai_generations_mes" | "treinamentos"
) {
  return useQuery({
    queryKey: ["check-quota", organizacaoId, quotaType],
    queryFn: async () => {
      if (!organizacaoId) return null;
      
      const { data, error } = await supabase.rpc("org_check_quota", {
        p_organizacao_id: organizacaoId,
        p_quota_type: quotaType,
      });
      
      if (error) throw error;
      return data as {
        allowed: boolean;
        limit: number | null;
        usage: number;
        remaining?: number;
        unlimited: boolean;
      };
    },
    enabled: !!organizacaoId && !!quotaType,
    staleTime: 1000 * 30, // Refresh more often for quotas
  });
}

/**
 * Get plan badge styling based on plan type
 */
export function getPlanBadgeStyle(plano: string) {
  switch (plano) {
    case "premium":
      return {
        className: "bg-gradient-to-r from-yellow-400 to-amber-500 text-black",
        label: "Premium",
        icon: "👑",
      };
    case "executivo":
      return {
        className: "bg-gradient-to-r from-blue-500 to-indigo-600 text-white",
        label: "Executivo",
        icon: "💼",
      };
    case "essencial":
    default:
      return {
        className: "bg-gray-100 text-gray-700 border border-gray-300",
        label: "Essencial",
        icon: "📋",
      };
  }
}

/**
 * Feature display names for UI
 */
export const FEATURE_LABELS: Record<string, string> = {
  diagnostico: "Diagnóstico de Governança",
  codigo_etica: "Código de Ética",
  canal_denuncias: "Canal de Denúncias",
  treinamentos: "Treinamentos",
  certificados: "Certificados",
  relatorios_mensais: "Relatórios Mensais",
  integracao_drive: "Google Drive",
  integracao_calendar: "Google Calendar",
  integracao_trello: "Trello",
  integracao_clickup: "ClickUp",
  integracao_fireflies: "Fireflies.ai",
  whatsapp_notifications: "Notificações WhatsApp",
  api_webhooks: "API & Webhooks",
  white_label: "White Label",
  suporte_prioritario: "Suporte Prioritário",
};

/**
 * Quota display names for UI
 */
export const QUOTA_LABELS: Record<string, string> = {
  usuarios: "Usuários",
  documentos_mes: "Documentos/mês",
  treinamentos: "Treinamentos",
  ai_generations_mes: "Gerações IA/mês",
  storage_gb: "Armazenamento (GB)",
};
