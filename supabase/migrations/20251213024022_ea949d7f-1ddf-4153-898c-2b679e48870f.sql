-- Tabela de cursos/treinamentos
CREATE TABLE public.treinamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT NOT NULL DEFAULT 'compliance',
  carga_horaria_minutos INTEGER NOT NULL DEFAULT 60,
  obrigatorio BOOLEAN NOT NULL DEFAULT true,
  ativo BOOLEAN NOT NULL DEFAULT true,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de conteúdos/módulos do treinamento
CREATE TABLE public.treinamento_conteudos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  treinamento_id UUID NOT NULL REFERENCES public.treinamentos(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'texto', -- texto, video, pdf
  conteudo TEXT, -- markdown ou URL
  duracao_minutos INTEGER DEFAULT 5,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de perguntas do quiz
CREATE TABLE public.treinamento_quiz (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  treinamento_id UUID NOT NULL REFERENCES public.treinamentos(id) ON DELETE CASCADE,
  pergunta TEXT NOT NULL,
  alternativas JSONB NOT NULL, -- [{texto: "...", correta: true/false}]
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de inscrições/progresso do colaborador
CREATE TABLE public.treinamento_inscricoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  treinamento_id UUID NOT NULL REFERENCES public.treinamentos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'nao_iniciado', -- nao_iniciado, em_andamento, concluido
  progresso_conteudo JSONB DEFAULT '[]'::jsonb, -- IDs dos conteúdos concluídos
  quiz_tentativas INTEGER DEFAULT 0,
  quiz_nota NUMERIC,
  quiz_aprovado BOOLEAN DEFAULT false,
  iniciado_em TIMESTAMP WITH TIME ZONE,
  concluido_em TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(treinamento_id, user_id)
);

-- Tabela de certificados
CREATE TABLE public.treinamento_certificados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inscricao_id UUID NOT NULL REFERENCES public.treinamento_inscricoes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  treinamento_id UUID NOT NULL REFERENCES public.treinamentos(id) ON DELETE CASCADE,
  codigo_validacao TEXT NOT NULL UNIQUE DEFAULT ('CERT-' || upper(substring(gen_random_uuid()::text, 1, 8))),
  emitido_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  nome_completo TEXT NOT NULL,
  nota_final NUMERIC NOT NULL
);

-- Enable RLS
ALTER TABLE public.treinamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treinamento_conteudos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treinamento_quiz ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treinamento_inscricoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treinamento_certificados ENABLE ROW LEVEL SECURITY;

-- RLS Policies for treinamentos
CREATE POLICY "Everyone can view active trainings" ON public.treinamentos
  FOR SELECT USING (ativo = true);

CREATE POLICY "Admins can manage trainings" ON public.treinamentos
  FOR ALL USING (is_admin(auth.uid()));

-- RLS Policies for treinamento_conteudos
CREATE POLICY "Everyone can view training content" ON public.treinamento_conteudos
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.treinamentos t WHERE t.id = treinamento_id AND t.ativo = true
  ));

CREATE POLICY "Admins can manage content" ON public.treinamento_conteudos
  FOR ALL USING (is_admin(auth.uid()));

-- RLS Policies for treinamento_quiz
CREATE POLICY "Everyone can view quiz" ON public.treinamento_quiz
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.treinamentos t WHERE t.id = treinamento_id AND t.ativo = true
  ));

CREATE POLICY "Admins can manage quiz" ON public.treinamento_quiz
  FOR ALL USING (is_admin(auth.uid()));

-- RLS Policies for treinamento_inscricoes
CREATE POLICY "Users can view own enrollments" ON public.treinamento_inscricoes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own enrollments" ON public.treinamento_inscricoes
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Consultors can view organization enrollments" ON public.treinamento_inscricoes
  FOR SELECT USING (
    has_role(auth.uid(), 'consultor') OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can manage all enrollments" ON public.treinamento_inscricoes
  FOR ALL USING (is_admin(auth.uid()));

-- RLS Policies for treinamento_certificados
CREATE POLICY "Anyone can verify certificates" ON public.treinamento_certificados
  FOR SELECT USING (true);

CREATE POLICY "Users can view own certificates" ON public.treinamento_certificados
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create certificates" ON public.treinamento_certificados
  FOR INSERT WITH CHECK (true);

-- Triggers for updated_at
CREATE TRIGGER update_treinamentos_updated_at
  BEFORE UPDATE ON public.treinamentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_treinamento_inscricoes_updated_at
  BEFORE UPDATE ON public.treinamento_inscricoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed inicial de treinamentos
INSERT INTO public.treinamentos (nome, descricao, categoria, carga_horaria_minutos, obrigatorio, ordem) VALUES
('Código de Ética e Conduta', 'Treinamento sobre os princípios éticos e normas de conduta da organização', 'etica', 60, true, 1),
('LGPD - Lei Geral de Proteção de Dados', 'Fundamentos da LGPD e boas práticas de proteção de dados pessoais', 'compliance', 90, true, 2),
('Prevenção à Lavagem de Dinheiro', 'Conceitos e procedimentos de PLD/FT para colaboradores', 'compliance', 45, false, 3),
('Assédio Moral e Sexual no Trabalho', 'Identificação, prevenção e denúncia de situações de assédio', 'etica', 30, true, 4),
('Conflito de Interesses', 'Como identificar e gerenciar conflitos de interesse nas atividades profissionais', 'governanca', 45, true, 5);

-- Seed de conteúdos para Código de Ética
INSERT INTO public.treinamento_conteudos (treinamento_id, titulo, tipo, conteudo, duracao_minutos, ordem)
SELECT id, 'Introdução ao Código de Ética', 'texto', 
'# Introdução ao Código de Ética

O Código de Ética é o documento que estabelece os princípios e valores que devem nortear todas as ações e decisões dos colaboradores.

## Por que é importante?

- **Orientação**: Fornece diretrizes claras para situações do dia a dia
- **Proteção**: Protege a empresa e os colaboradores de riscos reputacionais
- **Cultura**: Fortalece a cultura organizacional baseada em valores

## Princípios Fundamentais

1. **Integridade**: Agir com honestidade em todas as situações
2. **Respeito**: Tratar todos com dignidade e consideração
3. **Transparência**: Comunicar de forma clara e verdadeira
4. **Responsabilidade**: Assumir as consequências de nossas ações', 
15, 1
FROM public.treinamentos WHERE nome = 'Código de Ética e Conduta';

INSERT INTO public.treinamento_conteudos (treinamento_id, titulo, tipo, conteudo, duracao_minutos, ordem)
SELECT id, 'Normas de Conduta', 'texto',
'# Normas de Conduta

## Relacionamento com Colegas

- Manter ambiente de trabalho respeitoso
- Evitar fofocas e comentários depreciativos
- Colaborar para o sucesso coletivo

## Relacionamento com Clientes

- Atender com cortesia e profissionalismo
- Manter confidencialidade das informações
- Buscar sempre a melhor solução

## Uso de Recursos

- Utilizar recursos da empresa apenas para fins profissionais
- Zelar pela conservação de equipamentos
- Reportar desperdícios ou uso indevido',
15, 2
FROM public.treinamentos WHERE nome = 'Código de Ética e Conduta';

INSERT INTO public.treinamento_conteudos (treinamento_id, titulo, tipo, conteudo, duracao_minutos, ordem)
SELECT id, 'Canal de Denúncias', 'texto',
'# Canal de Denúncias

## O que é?

O Canal de Denúncias é um meio seguro e confidencial para reportar situações que violem o Código de Ética.

## Garantias

- **Anonimato**: Sua identidade é protegida
- **Não-retaliação**: Proibida qualquer forma de retaliação
- **Investigação**: Todas as denúncias são investigadas

## Como utilizar?

1. Acesse o canal de denúncias da empresa
2. Descreva a situação com detalhes
3. Anexe evidências se disponíveis
4. Acompanhe pelo número de protocolo',
10, 3
FROM public.treinamentos WHERE nome = 'Código de Ética e Conduta';

-- Seed de quiz para Código de Ética
INSERT INTO public.treinamento_quiz (treinamento_id, pergunta, alternativas, ordem)
SELECT id, 
'Qual é o principal objetivo do Código de Ética?',
'[{"texto": "Punir colaboradores que cometem erros", "correta": false}, {"texto": "Orientar comportamentos e decisões baseados em valores", "correta": true}, {"texto": "Aumentar a burocracia da empresa", "correta": false}, {"texto": "Substituir as leis trabalhistas", "correta": false}]'::jsonb,
1
FROM public.treinamentos WHERE nome = 'Código de Ética e Conduta';

INSERT INTO public.treinamento_quiz (treinamento_id, pergunta, alternativas, ordem)
SELECT id,
'O que é garantido ao utilizar o Canal de Denúncias?',
'[{"texto": "Recompensa financeira", "correta": false}, {"texto": "Promoção automática", "correta": false}, {"texto": "Anonimato e não-retaliação", "correta": true}, {"texto": "Demissão do denunciado", "correta": false}]'::jsonb,
2
FROM public.treinamentos WHERE nome = 'Código de Ética e Conduta';

INSERT INTO public.treinamento_quiz (treinamento_id, pergunta, alternativas, ordem)
SELECT id,
'Qual dos seguintes NÃO é um princípio fundamental do Código de Ética?',
'[{"texto": "Integridade", "correta": false}, {"texto": "Competitividade agressiva", "correta": true}, {"texto": "Transparência", "correta": false}, {"texto": "Responsabilidade", "correta": false}]'::jsonb,
3
FROM public.treinamentos WHERE nome = 'Código de Ética e Conduta';

INSERT INTO public.treinamento_quiz (treinamento_id, pergunta, alternativas, ordem)
SELECT id,
'Como devemos tratar as informações confidenciais de clientes?',
'[{"texto": "Compartilhar com amigos próximos", "correta": false}, {"texto": "Publicar nas redes sociais", "correta": false}, {"texto": "Manter em sigilo absoluto", "correta": true}, {"texto": "Usar para benefício pessoal", "correta": false}]'::jsonb,
4
FROM public.treinamentos WHERE nome = 'Código de Ética e Conduta';

INSERT INTO public.treinamento_quiz (treinamento_id, pergunta, alternativas, ordem)
SELECT id,
'Ao presenciar uma situação de assédio, você deve:',
'[{"texto": "Ignorar e fingir que não viu", "correta": false}, {"texto": "Participar da situação", "correta": false}, {"texto": "Reportar pelo Canal de Denúncias", "correta": true}, {"texto": "Esperar que a vítima resolva sozinha", "correta": false}]'::jsonb,
5
FROM public.treinamentos WHERE nome = 'Código de Ética e Conduta';