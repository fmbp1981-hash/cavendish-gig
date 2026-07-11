import { supabase } from "@/integrations/supabase/client";
import type { ProspeccaoCategoria } from "@/types/prospeccao";

// A API key do Google Places nunca fica no client — a busca roda inteira na Edge Function
// `prospeccao-search`, que resolve a key a partir do vault de integrações.

export interface BuscarGooglePlacesInput {
  /** Um ou mais nichos/termos de busca (Seleção Rápida permite multi-select). Ignorado se
   * `nomeEstabelecimento` for informado. */
  termos?: string[];
  /** Busca direta por nome do estabelecimento — dispensa cidade/nicho detalhado. */
  nomeEstabelecimento?: string;
  cidade?: string;
  estado?: string;
  /** Um ou mais bairros/regiões — roda uma combinação de busca por termo×bairro. */
  bairros?: string[];
  categoria: ProspeccaoCategoria;
  quantidade?: number;
  responsavelId?: string;
  gerarResumoIA?: boolean;
}

export interface BuscarGooglePlacesResultado {
  success: boolean;
  totalResultados: number;
  totalImportados: number;
  totalDuplicados: number;
  error?: string;
}

export async function buscarGooglePlaces(input: BuscarGooglePlacesInput): Promise<BuscarGooglePlacesResultado> {
  const { data, error } = await supabase.functions.invoke("prospeccao-search", { body: input });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data as BuscarGooglePlacesResultado;
}
