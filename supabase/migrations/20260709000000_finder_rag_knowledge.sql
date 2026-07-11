-- Fase 10 do Finder (opcional, RAG por agente): base de conhecimento vetorial por categoria,
-- consultada pelo prospeccao-agent quando prospeccao_agent_configs.usa_rag = true.
--
-- Embeddings são gerados via Gemini text-embedding-004 (768 dimensões) — mesmo provider já usado
-- para o resto do módulo (decisão consciente de ficar no free tier do Google AI Studio, já
-- documentada em docs/FINDER_SPEC.md). RAG só funciona com o Gemini ativo, mesma limitação já
-- existente pro function-calling do agente (Fase 4) — não é uma restrição nova.
--
-- Sem índice ivfflat/hnsw de propósito: o volume esperado de chunks por categoria é baixo
-- (dezenas a poucas centenas), então um sequential scan ordenado por distância é suficiente e
-- evita a complexidade de treinar um índice aproximado sem dados reais ainda. Revisitar se o
-- volume crescer (mesmo raciocínio já aplicado ao dashboard da Fase 8: otimizar quando o volume
-- real justificar, não especulativamente).

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE public.prospeccao_agent_knowledge (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria   text NOT NULL,
  titulo      text NOT NULL,
  conteudo    text NOT NULL,
  embedding   vector(768),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_prospeccao_agent_knowledge_categoria ON public.prospeccao_agent_knowledge(categoria);

CREATE TRIGGER set_prospeccao_agent_knowledge_updated_at
  BEFORE UPDATE ON public.prospeccao_agent_knowledge
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.prospeccao_agent_knowledge ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prospeccao_agent_knowledge_admin" ON public.prospeccao_agent_knowledge
  FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Busca por similaridade (distância de cosseno) restrita à categoria do lead. Sem
-- SECURITY DEFINER de propósito: o único chamador esperado é o prospeccao-agent, que já usa o
-- client de service role (bypassa RLS por padrão) — não precisa de privilégio elevado extra.
CREATE OR REPLACE FUNCTION public.buscar_conhecimento_similar(
  p_categoria text,
  p_embedding vector(768),
  p_top_k integer DEFAULT 5,
  p_threshold numeric DEFAULT 0.75
)
RETURNS TABLE(id uuid, titulo text, conteudo text, similaridade numeric)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  SELECT
    k.id,
    k.titulo,
    k.conteudo,
    (1 - (k.embedding <=> p_embedding))::numeric AS similaridade
  FROM public.prospeccao_agent_knowledge k
  WHERE k.categoria = p_categoria
    AND k.embedding IS NOT NULL
    AND (1 - (k.embedding <=> p_embedding)) >= p_threshold
  ORDER BY k.embedding <=> p_embedding
  LIMIT p_top_k;
$$;
