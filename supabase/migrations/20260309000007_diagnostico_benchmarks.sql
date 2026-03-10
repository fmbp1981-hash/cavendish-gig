-- Benchmarks setoriais para o diagnóstico de maturidade

CREATE TABLE IF NOT EXISTS public.diagnostico_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setor TEXT NOT NULL,
  pilar TEXT NOT NULL,
  score_medio NUMERIC NOT NULL,
  percentil_75 NUMERIC,
  percentil_25 NUMERIC,
  n_empresas INT,
  atualizado_em DATE DEFAULT CURRENT_DATE
);

CREATE INDEX IF NOT EXISTS idx_diag_bench_setor ON public.diagnostico_benchmarks(setor);

ALTER TABLE public.diagnostico_benchmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bench_select" ON public.diagnostico_benchmarks FOR SELECT USING (true);
CREATE POLICY "bench_admin" ON public.diagnostico_benchmarks FOR ALL USING (
  (public.has_role(auth.uid(), 'admin'::public.app_role))
);

-- Seed: 6 setores × 6 pilares = 36 linhas com dados realistas para PMEs brasileiras
INSERT INTO public.diagnostico_benchmarks (setor, pilar, score_medio, percentil_75, percentil_25, n_empresas) VALUES
-- VAREJO
('varejo', 'liderança',      55, 75, 35, 120),
('varejo', 'politicas',      48, 68, 28, 120),
('varejo', 'canais',         42, 62, 22, 120),
('varejo', 'treinamento',    50, 70, 30, 120),
('varejo', 'auditoria',      38, 58, 18, 120),
('varejo', 'denuncia',       35, 55, 15, 120),
-- FINANCEIRO
('financeiro', 'liderança',  72, 88, 55, 85),
('financeiro', 'politicas',  78, 92, 62, 85),
('financeiro', 'canais',     65, 80, 50, 85),
('financeiro', 'treinamento',70, 85, 55, 85),
('financeiro', 'auditoria',  75, 90, 60, 85),
('financeiro', 'denuncia',   68, 82, 52, 85),
-- SAÚDE
('saude', 'liderança',       65, 82, 48, 95),
('saude', 'politicas',       70, 85, 55, 95),
('saude', 'canais',          58, 75, 42, 95),
('saude', 'treinamento',     72, 88, 56, 95),
('saude', 'auditoria',       62, 78, 46, 95),
('saude', 'denuncia',        55, 72, 38, 95),
-- INDUSTRIA
('industria', 'liderança',   60, 78, 42, 110),
('industria', 'politicas',   58, 76, 40, 110),
('industria', 'canais',      50, 68, 32, 110),
('industria', 'treinamento', 62, 80, 44, 110),
('industria', 'auditoria',   55, 72, 38, 110),
('industria', 'denuncia',    48, 65, 30, 110),
-- SERVICOS
('servicos', 'liderança',    58, 76, 40, 150),
('servicos', 'politicas',    52, 70, 34, 150),
('servicos', 'canais',       45, 64, 26, 150),
('servicos', 'treinamento',  55, 73, 37, 150),
('servicos', 'auditoria',    48, 66, 30, 150),
('servicos', 'denuncia',     42, 60, 24, 150),
-- AGRONEGOCIO
('agronegocio', 'liderança',  45, 65, 25, 75),
('agronegocio', 'politicas',  40, 60, 20, 75),
('agronegocio', 'canais',     35, 52, 18, 75),
('agronegocio', 'treinamento',42, 62, 22, 75),
('agronegocio', 'auditoria',  38, 56, 20, 75),
('agronegocio', 'denuncia',   32, 50, 14, 75)
ON CONFLICT DO NOTHING;

-- Adiciona coluna setor na tabela organizacoes (se não existir)
ALTER TABLE public.organizacoes
  ADD COLUMN IF NOT EXISTS setor TEXT DEFAULT 'servicos'
    CHECK (setor IN ('varejo','financeiro','saude','industria','servicos','agronegocio'));
