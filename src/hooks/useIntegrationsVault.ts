import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type IntegrationScope = "system" | "organization";

export interface IntegrationListItem {
  provider: string;
  scope: IntegrationScope;
  organizacao_id: string | null;
  enabled: boolean;
  configured: boolean;
  updated_at: string;
  config: Record<string, unknown>;
}

async function invokeIntegrations(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("integrations", { body });
  if (error) throw error;
  return data as any;
}

export function useIntegrationsList(scope: IntegrationScope = "system", organizacaoId: string | null = null) {
  return useQuery({
    queryKey: ["integrations", scope, organizacaoId],
    queryFn: async () => {
      const resp = await invokeIntegrations({
        action: "list",
        scope,
        organizacao_id: organizacaoId,
      });
      return (resp?.data || []) as IntegrationListItem[];
    },
  });
}

export function useUpsertIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: {
      provider: string;
      scope?: IntegrationScope;
      organizacao_id?: string | null;
      enabled?: boolean;
      config?: Record<string, unknown>;
      secrets?: Record<string, unknown>;
    }) => {
      const resp = await invokeIntegrations({
        action: "upsert",
        scope: args.scope || "system",
        organizacao_id: args.organizacao_id ?? null,
        provider: args.provider,
        enabled: args.enabled ?? true,
        config: args.config || {},
        secrets: args.secrets || {},
      });
      return resp?.data as IntegrationListItem;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["integrations", variables.scope || "system", variables.organizacao_id ?? null] });
    },
  });
}

export function useDeleteIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: {
      provider: string;
      scope?: IntegrationScope;
      organizacao_id?: string | null;
    }) => {
      const resp = await invokeIntegrations({
        action: "delete",
        scope: args.scope || "system",
        organizacao_id: args.organizacao_id ?? null,
        provider: args.provider,
      });
      return resp;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["integrations", variables.scope || "system", variables.organizacao_id ?? null] });
    },
  });
}
