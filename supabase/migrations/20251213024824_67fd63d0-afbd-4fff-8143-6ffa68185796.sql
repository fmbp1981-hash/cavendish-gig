-- Tabela de versões do Código de Ética
CREATE TABLE public.codigo_etica_versoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  versao TEXT NOT NULL,
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT false,
  vigencia_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id)
);

-- Tabela de adesões ao Código de Ética
CREATE TABLE public.codigo_etica_adesoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  versao_id UUID NOT NULL REFERENCES public.codigo_etica_versoes(id) ON DELETE CASCADE,
  aceito_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT, -- Opcional, pode ser null para privacidade
  user_agent TEXT, -- Opcional, pode ser null para privacidade
  UNIQUE(user_id, versao_id)
);

-- Enable RLS
ALTER TABLE public.codigo_etica_versoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.codigo_etica_adesoes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for codigo_etica_versoes
CREATE POLICY "Everyone can view active versions" ON public.codigo_etica_versoes
  FOR SELECT USING (ativo = true);

CREATE POLICY "Admins can manage versions" ON public.codigo_etica_versoes
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Consultors can view all versions" ON public.codigo_etica_versoes
  FOR SELECT USING (has_role(auth.uid(), 'consultor'));

-- RLS Policies for codigo_etica_adesoes
CREATE POLICY "Users can view own adherence" ON public.codigo_etica_adesoes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own adherence" ON public.codigo_etica_adesoes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Consultors can view organization adherences" ON public.codigo_etica_adesoes
  FOR SELECT USING (
    has_role(auth.uid(), 'consultor') OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can manage all adherences" ON public.codigo_etica_adesoes
  FOR ALL USING (is_admin(auth.uid()));

-- Seed versão inicial do Código de Ética
INSERT INTO public.codigo_etica_versoes (versao, titulo, conteudo, ativo, vigencia_inicio) VALUES
('1.0', 'Código de Ética e Conduta Empresarial', '# Código de Ética e Conduta Empresarial

## 1. INTRODUÇÃO

Este Código de Ética e Conduta estabelece os princípios, valores e diretrizes que devem nortear o comportamento de todos os colaboradores, gestores, sócios e parceiros da organização.

## 2. VALORES FUNDAMENTAIS

### 2.1 Integridade
Agir com honestidade, transparência e retidão em todas as relações profissionais e pessoais no ambiente de trabalho.

### 2.2 Respeito
Tratar todos com dignidade, consideração e respeito, independentemente de cargo, função, gênero, raça, religião ou orientação.

### 2.3 Responsabilidade
Assumir a responsabilidade por nossas ações e decisões, cumprindo com os compromissos assumidos.

### 2.4 Excelência
Buscar continuamente a melhoria e a qualidade em tudo o que fazemos.

## 3. CONDUTAS ESPERADAS

### 3.1 No Ambiente de Trabalho
- Manter postura profissional e respeitosa
- Zelar pelo patrimônio da empresa
- Cumprir horários e compromissos
- Colaborar com os colegas

### 3.2 Com Clientes e Parceiros
- Atender com cortesia e profissionalismo
- Manter confidencialidade das informações
- Cumprir acordos e prazos estabelecidos
- Não aceitar ou oferecer vantagens indevidas

### 3.3 Com a Sociedade
- Respeitar as leis e regulamentações
- Atuar de forma sustentável
- Contribuir para o desenvolvimento da comunidade

## 4. CONDUTAS VEDADAS

São expressamente proibidas:
- Qualquer forma de assédio moral ou sexual
- Discriminação de qualquer natureza
- Uso de álcool ou substâncias ilícitas no trabalho
- Conflito de interesses não declarado
- Uso indevido de informações confidenciais
- Fraude, corrupção ou suborno

## 5. CANAL DE DENÚNCIAS

A organização disponibiliza um Canal de Denúncias seguro e confidencial para relatar violações a este Código. O anonimato é garantido e não haverá retaliação contra denunciantes de boa-fé.

## 6. CONSEQUÊNCIAS

O descumprimento deste Código poderá resultar em medidas disciplinares, incluindo advertência, suspensão ou desligamento, além de possíveis sanções legais.

## 7. DECLARAÇÃO DE ADESÃO

Ao aderir a este Código, declaro que:
- Li e compreendi integralmente seu conteúdo
- Comprometo-me a cumprir todas as suas disposições
- Estou ciente das consequências do seu descumprimento
- Comprometo-me a reportar violações de que tiver conhecimento', true, CURRENT_DATE);