-- Alinha as etapas do funil do Finder com o Kanban Board de referência (prospect-pulse-54), a
-- pedido do usuário: Novo Lead, Contato Inicial, Qualificação, Transferido para Consultor,
-- Fechado Ganho, Fechado Perdido, Follow-up (ordem literal pedida, "Follow-up" por último).
--
-- Substitui por completo as 7 etapas antigas (Novo/Contatado/Qualificando/Proposta Enviada/
-- Negociando/Fechado/Perdido) em vez de tentar remapear 1:1 — a lista nova tem uma estrutura
-- diferente ("Transferido para Consultor"/"Follow-up" não existiam, "Proposta Enviada" e
-- "Negociando" viram uma etapa só). DELETE é seguro aqui: as FKs de
-- prospeccao_leads.funil_etapa_id e prospeccao_campanhas.funil_etapa_id são ON DELETE SET NULL
-- (ver 20260708120002_finder_schema.sql) — leads existentes não são apagados, só ficam sem
-- etapa até serem arrastados de novo no kanban.

DO $$
DECLARE
  v_funil record;
BEGIN
  FOR v_funil IN SELECT id FROM public.prospeccao_funis WHERE padrao = true LOOP
    DELETE FROM public.prospeccao_funil_etapas WHERE funil_id = v_funil.id;

    INSERT INTO public.prospeccao_funil_etapas (funil_id, nome, posicao, is_terminal, followup_automatico_horas)
    VALUES
      (v_funil.id, 'Novo Lead', 1, false, 24),
      (v_funil.id, 'Contato Inicial', 2, false, 48),
      (v_funil.id, 'Qualificação', 3, false, 72),
      (v_funil.id, 'Transferido para Consultor', 4, false, 96),
      (v_funil.id, 'Fechado Ganho', 5, true, NULL),
      (v_funil.id, 'Fechado Perdido', 6, true, NULL),
      (v_funil.id, 'Follow-up', 7, false, NULL);
  END LOOP;
END $$;
