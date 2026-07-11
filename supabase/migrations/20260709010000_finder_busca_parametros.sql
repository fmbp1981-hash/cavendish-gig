-- Redesenho da tela de busca do Finder: guarda os parâmetros originais de cada busca (termos,
-- bairros, cidade/estado, quantidade solicitada, nome de estabelecimento se foi busca direta)
-- pra "Usar novamente" (prefill do formulário) e "Reprocessar" (rodar de novo com os mesmos
-- parâmetros) funcionarem de verdade — antes só existia `localizacao` (string já combinada,
-- suficiente pra exibir mas não pra reconstruir o formulário).

ALTER TABLE public.prospeccao_buscas
  ADD COLUMN IF NOT EXISTS parametros jsonb NOT NULL DEFAULT '{}';
