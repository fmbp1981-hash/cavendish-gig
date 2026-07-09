// Atalhos de localização mais comuns pra prospecção B2B — não é uma lista exaustiva (isso é
// papel do dropdown de cidade via IBGE, ver useMunicipiosIBGE.ts), só os destinos mais usados
// pra preencher a busca com um clique.

export interface CidadePopular {
  cidade: string;
  estado: string;
}

export const CIDADES_POPULARES: CidadePopular[] = [
  { cidade: "São Paulo", estado: "SP" },
  { cidade: "Rio de Janeiro", estado: "RJ" },
  { cidade: "Belo Horizonte", estado: "MG" },
  { cidade: "Brasília", estado: "DF" },
  { cidade: "Salvador", estado: "BA" },
  { cidade: "Curitiba", estado: "PR" },
  { cidade: "Porto Alegre", estado: "RS" },
  { cidade: "Recife", estado: "PE" },
  { cidade: "Fortaleza", estado: "CE" },
  { cidade: "Manaus", estado: "AM" },
  { cidade: "Goiânia", estado: "GO" },
  { cidade: "Campinas", estado: "SP" },
  { cidade: "Florianópolis", estado: "SC" },
  { cidade: "Vitória", estado: "ES" },
  { cidade: "Belém", estado: "PA" },
  { cidade: "Natal", estado: "RN" },
];
