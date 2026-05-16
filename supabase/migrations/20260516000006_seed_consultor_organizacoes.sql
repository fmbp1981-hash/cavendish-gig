-- Vínculos iniciais entre consultores e organizações Cavendish
-- Felipe (fmbp1981@gmail.com) → Grupo CAVENDISH + CAVENDISH CONSULTORIA E INCORPORACAO
-- Felipe (fmbp2002@yahoo.com.br) → Grupo CAVENDISH

INSERT INTO consultor_organizacoes (consultor_id, organizacao_id)
VALUES
  ('373d256e-4263-4ae4-b99d-ca40b4c8243c', '7209f31b-5bd2-45d4-9f14-2d07a4284d6d'),
  ('373d256e-4263-4ae4-b99d-ca40b4c8243c', '8dd31b95-e7e4-4f11-bfa6-d3d0ed97cc5f'),
  ('c86f53a7-50b6-4ad3-9a69-b118eddf43a4', '7209f31b-5bd2-45d4-9f14-2d07a4284d6d')
ON CONFLICT DO NOTHING;
