-- Módulo Finder: funil padrão por categoria, para o kanban ter algo para exibir sem depender
-- de uma tela de configuração de funis (ainda não implementada — ver FINDER_MODULE_SPEC.md §0.1,
-- a config de funis fica para a mesma fase da config de agentes de IA por categoria).
-- Etapas genéricas, iguais para as 7 categorias; "Perdido" é reconhecida por
-- src/lib/prospeccao/funil-utils.ts (deriveTerminalStatus) e atualiza o status do lead
-- automaticamente ao entrar nela.

DO $$
DECLARE
  v_categoria text;
  v_funil_id  uuid;
BEGIN
  FOREACH v_categoria IN ARRAY ARRAY[
    'sem_compliance_formal', 'licitacao_publica', 'acesso_credito_investimento',
    'fusao_aquisicao', 'certificacao_iso', 'grupo_empresarial', 'parceiro_indicador'
  ]
  LOOP
    INSERT INTO public.prospeccao_funis (nome, categoria, descricao, padrao)
    VALUES ('Funil padrão', v_categoria, 'Funil padrão gerado automaticamente', true)
    RETURNING id INTO v_funil_id;

    INSERT INTO public.prospeccao_funil_etapas (funil_id, nome, posicao, is_terminal, followup_automatico_horas)
    VALUES
      (v_funil_id, 'Novo', 1, false, 24),
      (v_funil_id, 'Contatado', 2, false, 48),
      (v_funil_id, 'Qualificando', 3, false, 72),
      (v_funil_id, 'Proposta Enviada', 4, false, 96),
      (v_funil_id, 'Negociando', 5, false, NULL),
      (v_funil_id, 'Fechado', 6, true, NULL),
      (v_funil_id, 'Perdido', 7, true, NULL);
  END LOOP;
END $$;
