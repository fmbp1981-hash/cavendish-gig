// Taxonomia de nichos de negócio pra "Seleção Rápida" na busca do Finder — atalho de UI pra
// preencher o termo de busca do Google Places com um clique. Não confundir com
// `PROSPECCAO_CATEGORIAS` (types/prospeccao.ts): aquela é o gatilho de compliance/governança
// que rege o funil e o agente de IA (regra de negócio da Cavendish); esta aqui é só o ramo de
// atividade da empresa, usado como termo de busca — os dois são independentes e o formulário de
// busca pede os dois separadamente.

export interface GrupoNicho {
  categoria: string;
  nichos: string[];
}

export const GRUPOS_NICHO: GrupoNicho[] = [
  {
    categoria: "Alimentação",
    nichos: [
      "Restaurantes", "Pizzarias", "Lanchonetes", "Cafeterias", "Padarias", "Açougues",
      "Confeitarias", "Food Trucks", "Hamburguerias", "Sushi Bar", "Churrascarias",
      "Sorveterias", "Distribuidora de Bebidas", "Hortifruti",
    ],
  },
  {
    categoria: "Saúde e Bem-Estar",
    nichos: [
      "Clínicas Médicas", "Clínicas Odontológicas", "Clínicas de Fisioterapia",
      "Laboratórios de Análises Clínicas", "Farmácias", "Academias", "Estúdios de Pilates",
      "Nutricionistas", "Psicólogos", "Clínicas de Estética Corporal", "Ópticas", "Home Care",
    ],
  },
  {
    categoria: "Beleza e Estética",
    nichos: [
      "Salões de Beleza", "Barbearias", "Clínicas de Estética Facial", "Estúdios de Tatuagem",
      "Manicures e Pedicures", "Spas", "Distribuidoras de Cosméticos", "Designers de Sobrancelhas",
    ],
  },
  {
    categoria: "Comércio e Varejo",
    nichos: [
      "Lojas de Roupas", "Lojas de Calçados", "Supermercados", "Papelarias",
      "Lojas de Presentes", "Lojas de Eletrônicos", "Lojas de Brinquedos", "Pet Shops",
      "Lojas de Materiais de Construção", "Farmácias de Manipulação",
    ],
  },
  {
    categoria: "Serviços",
    nichos: [
      "Escritórios de Advocacia", "Escritórios de Contabilidade", "Agências de Marketing",
      "Imobiliárias", "Seguradoras", "Despachantes", "Consultorias Empresariais",
      "Escritórios de Arquitetura", "Agências de Viagens", "Empresas de Limpeza",
    ],
  },
  {
    categoria: "Construção e Reforma",
    nichos: [
      "Construtoras", "Empreiteiras", "Lojas de Material de Construção", "Marmorarias",
      "Vidraçarias", "Serralherias", "Empresas de Pintura", "Elétrica e Hidráulica",
      "Engenharia Civil",
    ],
  },
  {
    categoria: "Automotivo",
    nichos: [
      "Oficinas Mecânicas", "Concessionárias", "Lava-Rápidos", "Auto Peças", "Funilarias",
      "Locadoras de Veículos", "Estacionamentos", "Borracharias",
    ],
  },
  {
    categoria: "Educação",
    nichos: [
      "Escolas Particulares", "Cursos de Idiomas", "Cursinhos Preparatórios",
      "Escolas de Música", "Autoescolas", "Creches", "Cursos Profissionalizantes",
      "Escolas de Reforço Escolar",
    ],
  },
  {
    categoria: "Eventos e Festas",
    nichos: [
      "Buffets", "Casas de Festas", "Decoração de Eventos", "DJs e Bandas",
      "Fotografia e Filmagem", "Locação de Equipamentos para Eventos", "Cerimonialistas",
    ],
  },
  {
    categoria: "Tecnologia e Marketing",
    nichos: [
      "Agências Digitais", "Desenvolvedoras de Software", "Consultorias de TI",
      "Estúdios de Design", "Produtoras de Vídeo", "Empresas de E-commerce",
    ],
  },
  {
    categoria: "Indústria",
    nichos: [
      "Indústrias Metalúrgicas", "Indústrias Têxteis", "Indústrias Alimentícias",
      "Indústrias Químicas", "Indústrias Gráficas", "Indústrias de Plástico",
    ],
  },
  {
    categoria: "Entretenimento e Lazer",
    nichos: ["Casas de Show", "Cinemas", "Parques de Diversão", "Boliches", "Bares e Pubs", "Casas Noturnas"],
  },
  {
    categoria: "Turismo e Hotelaria",
    nichos: ["Hotéis", "Pousadas", "Agências de Turismo", "Locação de Temporada", "Guias Turísticos"],
  },
  {
    categoria: "Agricultura e Pecuária",
    nichos: ["Fazendas", "Cooperativas Agrícolas", "Distribuidoras de Insumos Agrícolas", "Veterinárias Rurais", "Laticínios"],
  },
  {
    categoria: "Transportes e Logística",
    nichos: ["Transportadoras", "Empresas de Mudança", "Despachantes Aduaneiros", "Empresas de Logística", "Frotas de Entrega"],
  },
  {
    categoria: "Móveis e Decoração",
    nichos: ["Lojas de Móveis", "Marcenarias", "Lojas de Decoração", "Design de Interiores", "Colchoarias"],
  },
  {
    categoria: "Esportes",
    nichos: ["Academias de Lutas", "Escolas de Natação", "Quadras Esportivas", "Lojas de Artigos Esportivos", "Estúdios de Yoga", "Clubes Esportivos"],
  },
];
