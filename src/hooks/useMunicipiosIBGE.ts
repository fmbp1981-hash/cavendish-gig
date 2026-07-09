import { useQuery } from "@tanstack/react-query";

// Lista de municípios por UF vem da API pública do IBGE (localidades) em vez de embutida no
// bundle — são ~5.570 municípios no Brasil, grande demais pra manter como dado estático, e o
// IBGE já mantém essa lista oficial atualizada. Chamada direta do browser (sem key, sem custo,
// sem dado sensível) — mesmo padrão de qualquer app brasileiro com cascata estado→cidade.

export interface MunicipioIBGE {
  id: number;
  nome: string;
}

export function useMunicipiosIBGE(uf?: string) {
  return useQuery({
    queryKey: ["ibge_municipios", uf],
    queryFn: async () => {
      const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`);
      if (!res.ok) throw new Error("Falha ao carregar municípios do IBGE");
      const data = await res.json();
      return (data as Array<{ id: number; nome: string }>)
        .map((m) => ({ id: m.id, nome: m.nome }))
        .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    },
    enabled: !!uf,
    staleTime: 24 * 60 * 60 * 1000, // dado geográfico estável — 1 dia de cache é seguro
  });
}
