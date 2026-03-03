/**
 * tourDefinitions.ts — Definições completas dos tours interativos do Sistema GIG
 * Cada TourStep pode ter uma `page` para navegação automática antes de destacar o elemento.
 */

export interface TourStep {
  /** URL para navegar antes de exibir este passo (opcional) */
  page?: string;
  /** Seletor CSS do elemento a ser destacado. Omitir para popover centralizado */
  element?: string;
  title: string;
  description: string;
  side?: "top" | "bottom" | "left" | "right";
}

export interface TourDefinition {
  key: string;
  title: string;
  description: string;
  roles: string[];
  icon: string;
  estimatedMinutes: number;
  steps: TourStep[];
}

/* ─────────────────────────────────────────────────────────────────────────────
   TOUR DO ADMINISTRADOR — 13 passos
──────────────────────────────────────────────────────────────────────────── */
const adminTour: TourDefinition = {
  key: "admin-onboarding",
  title: "Tour Completo — Painel Admin",
  description: "Conheça todas as funcionalidades do painel administrativo em um guia passo a passo.",
  roles: ["admin"],
  icon: "🏢",
  estimatedMinutes: 10,
  steps: [
    {
      title: "👋 Bem-vindo ao Sistema GIG!",
      description: `<p>O <strong>Sistema GIG</strong> (Gestão Integrada de Governança) é a plataforma completa da <strong>Cavendish</strong> para operacionalizar programas de Compliance e Integridade em organizações clientes.</p><br/><p>Como <strong>Administrador</strong>, você tem acesso total ao sistema. Este tour guiará você por todas as seções em poucos minutos.</p><br/><p>💡 <em>Você pode pausar e retomar o tour a qualquer momento pelo botão <strong>(?)</strong> no cabeçalho.</em></p>`,
    },
    {
      page: "/admin",
      element: '[data-tour="admin-nav-dashboard"]',
      title: "📊 Dashboard Geral",
      description: `<p>O <strong>Dashboard</strong> é sua central de comando. Aqui você monitora em tempo real:</p><ul style="margin:8px 0;padding-left:20px;list-style:disc"><li>Total de organizações ativas</li><li>Consultores e usuários cadastrados</li><li>Documentos gerados e pendentes</li><li>Atividade recente do sistema</li></ul>`,
      side: "right",
    },
    {
      page: "/admin/organizacoes",
      element: '[data-tour="admin-nav-organizacoes"]',
      title: "🏢 Organizações (Clientes)",
      description: `<p>Gerencie todas as <strong>organizações clientes</strong> da Cavendish:</p><ul style="margin:8px 0;padding-left:20px;list-style:disc"><li>Cadastre novas organizações (CNPJ, segmento, porte)</li><li>Vincule o consultor responsável por cada cliente</li><li>Acompanhe o status do programa de compliance</li><li>Acesse dados e projetos de cada empresa</li></ul>`,
      side: "right",
    },
    {
      page: "/admin/usuarios",
      element: '[data-tour="admin-nav-usuarios"]',
      title: "👥 Gestão de Usuários",
      description: `<p>Controle total sobre todos os usuários do sistema:</p><ul style="margin:8px 0;padding-left:20px;list-style:disc"><li>Veja todos os usuários (clientes, consultores, admins)</li><li>Altere papéis e permissões de acesso</li><li>Resete senhas e desative contas</li><li>Filtre por organização ou perfil</li></ul><p>🔒 <em>Acesso exclusivo para administradores.</em></p>`,
      side: "right",
    },
    {
      page: "/admin/consultores",
      element: '[data-tour="admin-nav-consultores"]',
      title: "👨‍💼 Gestão de Consultores",
      description: `<p>Cadastre e gerencie os <strong>consultores da Cavendish</strong>:</p><ul style="margin:8px 0;padding-left:20px;list-style:disc"><li>Pré-cadastre consultores antes do primeiro acesso</li><li>Vincule consultores às organizações que irão atender</li><li>Controle a carga de trabalho e carteira de clientes</li><li>Ative ou desative acessos conforme necessário</li></ul>`,
      side: "right",
    },
    {
      page: "/consultor/documentos",
      element: '[data-tour="admin-nav-documentos"]',
      title: "📄 Documentos",
      description: `<p>Central de todos os documentos do sistema:</p><ul style="margin:8px 0;padding-left:20px;list-style:disc"><li><strong>Código de Ética</strong> gerado por IA por organização</li><li>Políticas internas e procedimentos</li><li>Documentos enviados pelos clientes para aprovação</li><li>Status e histórico de cada documento</li></ul><p>💡 <em>A IA gera documentos 100% personalizados com base no diagnóstico de cada empresa.</em></p>`,
      side: "right",
    },
    {
      page: "/admin/catalogo",
      element: '[data-tour="admin-nav-catalogo"]',
      title: "📚 Catálogo de Documentos",
      description: `<p>Defina quais documentos cada tipo de organização precisa entregar:</p><ul style="margin:8px 0;padding-left:20px;list-style:disc"><li>Crie categorias por segmento ou porte da empresa</li><li>Configure documentos obrigatórios vs. opcionais</li><li>Defina prazos e instruções para cada documento</li><li>O sistema atribui automaticamente às organizações</li></ul>`,
      side: "right",
    },
    {
      page: "/admin/templates",
      element: '[data-tour="admin-nav-templates"]',
      title: "📝 Templates de Documentos",
      description: `<p>Crie e edite os <strong>modelos base</strong> usados pela IA para gerar documentos:</p><ul style="margin:8px 0;padding-left:20px;list-style:disc"><li>Templates para Código de Ética, Políticas e Relatórios</li><li>Use variáveis dinâmicas: <code>{{nome_empresa}}</code>, <code>{{setor}}</code></li><li>A IA adapta automaticamente ao perfil de cada organização</li><li>Versione e controle histórico de alterações</li></ul>`,
      side: "right",
    },
    {
      page: "/admin/relatorios/historico",
      element: '[data-tour="admin-nav-relatorios"]',
      title: "📈 Relatórios e Histórico",
      description: `<p>Acompanhe o histórico completo de relatórios de todas as organizações:</p><ul style="margin:8px 0;padding-left:20px;list-style:disc"><li>Relatórios mensais de evolução do programa</li><li>Índice de conformidade e maturidade por cliente</li><li>Comparativos de evolução entre períodos</li><li>Exportação em PDF para reuniões e apresentações</li></ul>`,
      side: "right",
    },
    {
      page: "/admin/integracoes",
      element: '[data-tour="admin-nav-integracoes"]',
      title: "🔌 Integrações com Sistemas Externos",
      description: `<p>Configure as <strong>integrações</strong> do Sistema GIG com ferramentas externas:</p><ul style="margin:8px 0;padding-left:20px;list-style:disc"><li><strong>OpenAI</strong> — Geração de documentos e análises com IA</li><li><strong>Google Drive</strong> — Armazenamento de documentos na nuvem</li><li><strong>Resend</strong> — Envio de e-mails transacionais</li><li><strong>Twilio</strong> — Notificações por WhatsApp</li><li><strong>Fireflies.ai</strong> — Transcrição automática de reuniões</li></ul><p>🔑 <em>Configure as chaves de API diretamente nesta página — sem acesso ao código.</em></p>`,
      side: "right",
    },
    {
      page: "/admin/branding",
      element: '[data-tour="admin-nav-branding"]',
      title: "🎨 White Label / Branding",
      description: `<p>Personalize a <strong>identidade visual</strong> do sistema por organização:</p><ul style="margin:8px 0;padding-left:20px;list-style:disc"><li>Logo da empresa no sistema</li><li>Cores primárias e de destaque</li><li>Nome da empresa no cabeçalho</li><li>Cada cliente vê o sistema com a identidade visual da própria empresa</li></ul>`,
      side: "right",
    },
    {
      page: "/admin/logs",
      element: '[data-tour="admin-nav-logs"]',
      title: "🐛 Logs do Sistema",
      description: `<p>Monitore a <strong>saúde técnica</strong> do sistema em tempo real:</p><ul style="margin:8px 0;padding-left:20px;list-style:disc"><li>Erros críticos com localização precisa (Edge Function, frontend, integração)</li><li>Avisos e alertas operacionais</li><li>Diagnóstico automático com sugestão de correção em português</li><li>Resolva e documente a solução de cada ocorrência</li></ul><p>🔔 <em>Verifique periodicamente para garantir que o sistema opera corretamente.</em></p>`,
      side: "right",
    },
    {
      page: "/admin/configuracoes",
      element: '[data-tour="admin-nav-configuracoes"]',
      title: "⚙️ Configurações do Sistema",
      description: `<p>Ajuste as configurações gerais e visualize o status dos serviços:</p><ul style="margin:8px 0;padding-left:20px;list-style:disc"><li>Informações da empresa administradora</li><li>Status em tempo real de todos os serviços</li><li>Personalização de branding global</li><li>Perfil e dados do administrador</li></ul>`,
      side: "right",
    },
    {
      title: "🎉 Tour Concluído!",
      description: `<p>Parabéns! Você conhece agora todas as funcionalidades do painel administrativo.</p><br/><p><strong>Próximos passos recomendados:</strong></p><ul style="margin:8px 0;padding-left:20px;list-style:disc"><li>Configure as <strong>integrações</strong> (OpenAI, e-mail, WhatsApp)</li><li>Cadastre as primeiras <strong>organizações clientes</strong></li><li>Convide os <strong>consultores</strong> da equipe</li><li>Defina o <strong>catálogo</strong> de documentos necessários</li></ul><br/><p>💡 Este tour fica disponível a qualquer momento no botão <strong>(?)</strong> no cabeçalho.</p>`,
    },
  ],
};

/* ─────────────────────────────────────────────────────────────────────────────
   TOUR DO CONSULTOR — 11 passos
──────────────────────────────────────────────────────────────────────────── */
const consultorTour: TourDefinition = {
  key: "consultor-onboarding",
  title: "Tour do Portal do Consultor",
  description: "Descubra todas as ferramentas para gerenciar clientes e gerar documentos com IA.",
  roles: ["admin", "consultor"],
  icon: "👨‍💼",
  estimatedMinutes: 7,
  steps: [
    {
      title: "👋 Bem-vindo ao Portal do Consultor!",
      description: `<p>O <strong>Portal do Consultor</strong> é sua central de trabalho no Sistema GIG. Aqui você gerencia todos os clientes, gera documentos com Inteligência Artificial e acompanha o progresso de cada programa de compliance.</p><br/><p>Este tour apresentará todas as funcionalidades disponíveis. Vamos começar!</p>`,
    },
    {
      page: "/consultor",
      element: '[data-tour="dashboard"]',
      title: "📊 Dashboard do Consultor",
      description: `<p>O <strong>Dashboard</strong> mostra um resumo centralizado das suas atividades:</p><ul style="margin:8px 0;padding-left:20px;list-style:disc"><li>Total de clientes sob sua responsabilidade</li><li>Tarefas pendentes e próximos vencimentos</li><li>Documentos aguardando revisão ou aprovação</li><li>Próximas reuniões agendadas</li><li>Notificações e alertas importantes</li></ul>`,
      side: "right",
    },
    {
      page: "/consultor/clientes",
      element: '[data-tour="menu-organizacoes"]',
      title: "🏢 Meus Clientes",
      description: `<p>Gerencie todas as <strong>organizações clientes</strong> sob sua responsabilidade:</p><ul style="margin:8px 0;padding-left:20px;list-style:disc"><li>Acesse o projeto de qualquer cliente com um clique</li><li>Veja o status e progresso do programa de cada empresa</li><li>Adicione novas organizações à sua carteira</li><li>Filtre por status, segmento ou percentual de conclusão</li></ul>`,
      side: "right",
    },
    {
      page: "/consultor/documentos",
      element: '[data-tour="menu-documentos"]',
      title: "📄 Geração de Documentos com IA",
      description: `<p>O módulo mais poderoso do sistema! A <strong>IA gera documentos completos</strong> automaticamente:</p><ul style="margin:8px 0;padding-left:20px;list-style:disc"><li><strong>Código de Ética</strong> personalizado por empresa</li><li>Políticas internas e procedimentos de compliance</li><li>Relatórios de diagnóstico e conformidade</li><li>Aprovação e publicação diretamente no portal do cliente</li></ul><p>⚡ <em>Trabalho que levaria dias é feito em minutos.</em></p>`,
      side: "right",
    },
    {
      page: "/consultor/tarefas",
      element: '[data-tour="menu-tarefas"]',
      title: "✅ Gestão de Tarefas",
      description: `<p>Organize todas as <strong>atividades pendentes</strong> por cliente:</p><ul style="margin:8px 0;padding-left:20px;list-style:disc"><li>Crie tarefas para você ou para o cliente</li><li>Defina prazos, prioridades e responsáveis</li><li>Acompanhe o status em tempo real</li><li>Tarefas vencendo aparecem em destaque no dashboard</li></ul>`,
      side: "right",
    },
    {
      page: "/consultor/adesao-etica",
      element: '[data-tour="menu-adesao-etica"]',
      title: "📋 Adesão ao Código de Ética",
      description: `<p>Gerencie o processo de <strong>adesão ao Código de Ética</strong> pelos colaboradores:</p><ul style="margin:8px 0;padding-left:20px;list-style:disc"><li>Envie o Código de Ética para os colaboradores assinarem digitalmente</li><li>Acompanhe quem já assinou e quem está pendente</li><li>Envie lembretes automáticos para pendentes</li><li>Gere relatório completo de adesão por empresa</li></ul>`,
      side: "right",
    },
    {
      page: "/consultor/relatorios",
      element: '[data-tour="menu-relatorios"]',
      title: "📈 Relatórios de Progresso",
      description: `<p>Gere e visualize <strong>relatórios detalhados</strong> do programa de compliance:</p><ul style="margin:8px 0;padding-left:20px;list-style:disc"><li>Relatório mensal de evolução por cliente</li><li>Índice de conformidade e maturidade em compliance</li><li>Comparativo entre períodos</li><li>Exportação em PDF para reuniões e apresentações</li></ul>`,
      side: "right",
    },
    {
      page: "/consultor/agendamento",
      element: '[data-tour="menu-reunioes"]',
      title: "📅 Agendamento de Reuniões",
      description: `<p>Agende e gerencie as <strong>reuniões com os clientes</strong>:</p><ul style="margin:8px 0;padding-left:20px;list-style:disc"><li>Crie reuniões com data, hora e pauta definida</li><li>Convide participantes automaticamente por e-mail</li><li>Registre a gravação e transcrição após a reunião</li><li>Gere a ata automaticamente com IA (integração Fireflies.ai)</li></ul>`,
      side: "right",
    },
    {
      page: "/consultor/denuncias",
      element: '[data-tour="menu-denuncias"]',
      title: "🔔 Canal de Denúncias",
      description: `<p>Acompanhe as <strong>denúncias anônimas</strong> recebidas pelas organizações clientes:</p><ul style="margin:8px 0;padding-left:20px;list-style:disc"><li>Visualize todas as denúncias por organização</li><li>Acompanhe o status de cada investigação</li><li>Registre ações tomadas e o resultado final</li><li>O denunciante acompanha pelo número de protocolo</li></ul><p>🔒 <em>A identidade do denunciante é protegida em todas as etapas.</em></p>`,
      side: "right",
    },
    {
      page: "/consultor/codigo-etica",
      element: '[data-tour="menu-codigo-etica"]',
      title: "✨ IA: Gerador de Código de Ética",
      description: `<p>Gere um <strong>Código de Ética completo com IA</strong> em minutos:</p><ul style="margin:8px 0;padding-left:20px;list-style:disc"><li>Selecione a organização cliente</li><li>A IA analisa o perfil: segmento, porte e diagnóstico respondido</li><li>Gera um código personalizado, profissional e juridicamente adequado</li><li>Você revisa, edita e aprova antes de enviar ao cliente</li></ul>`,
      side: "right",
    },
    {
      page: "/consultor/atas",
      element: '[data-tour="menu-atas"]',
      title: "📝 IA: Gerador de Atas de Reunião",
      description: `<p>Gere <strong>atas de reunião automaticamente</strong> com Inteligência Artificial:</p><ul style="margin:8px 0;padding-left:20px;list-style:disc"><li>Cole a transcrição da reunião (Fireflies, Teams, Meet)</li><li>A IA identifica decisões, responsáveis e prazos</li><li>Gera uma ata estruturada, profissional e completa</li><li>Exporte ou envie diretamente para os participantes</li></ul>`,
      side: "right",
    },
    {
      title: "🎉 Tour do Consultor Concluído!",
      description: `<p>Agora você conhece todas as ferramentas do Portal do Consultor!</p><br/><p><strong>Sugestão de primeiros passos:</strong></p><ul style="margin:8px 0;padding-left:20px;list-style:disc"><li>Acesse <em>Meus Clientes</em> e verifique sua carteira</li><li>Abra um cliente e revise o status do diagnóstico</li><li>Gere o Código de Ética usando o módulo de IA</li><li>Agende a próxima reunião de acompanhamento</li></ul><br/><p>💡 Este tour está disponível no botão <strong>(?)</strong> do cabeçalho.</p>`,
    },
  ],
};

/* ─────────────────────────────────────────────────────────────────────────────
   TOUR DO CLIENTE — 8 passos
──────────────────────────────────────────────────────────────────────────── */
const clienteTour: TourDefinition = {
  key: "cliente-onboarding",
  title: "Tour do Portal do Cliente",
  description: "Conheça o seu portal e saiba como participar do programa de compliance da sua empresa.",
  roles: ["cliente", "colaborador", "admin", "consultor"],
  icon: "🏗️",
  estimatedMinutes: 5,
  steps: [
    {
      title: "👋 Bem-vindo ao seu Portal!",
      description: `<p>Este é o seu portal personalizado para acompanhar o <strong>Programa de Governança e Compliance</strong> da sua empresa.</p><br/><p>Aqui você encontra tudo para participar ativamente do programa: documentos, treinamentos, diagnósticos e muito mais.</p><br/><p>Vamos conhecer cada seção — são apenas alguns minutos!</p>`,
    },
    {
      page: "/meu-projeto",
      element: '[data-tour="dashboard"]',
      title: "🏠 Meu Projeto",
      description: `<p>A página principal mostra um <strong>resumo completo do seu progresso</strong>:</p><ul style="margin:8px 0;padding-left:20px;list-style:disc"><li>Percentual de conclusão do programa de compliance</li><li>Próximas reuniões com o consultor</li><li>Documentos pendentes de envio</li><li>Tarefas abertas e atividade recente</li></ul>`,
      side: "right",
    },
    {
      page: "/meu-projeto/diagnostico",
      element: '[data-tour="menu-diagnosticos"]',
      title: "🔍 Diagnóstico de Maturidade",
      description: `<p>O <strong>diagnóstico</strong> avalia o nível de maturidade em compliance da sua empresa:</p><ul style="margin:8px 0;padding-left:20px;list-style:disc"><li>Questionário sobre processos e cultura organizacional</li><li>Resultado com score de maturidade e recomendações</li><li>O consultor usa as respostas para personalizar o programa</li><li>A IA usa o diagnóstico para gerar o Código de Ética</li></ul><p>📝 <em>Reserve cerca de 20 minutos para responder com calma.</em></p>`,
      side: "right",
    },
    {
      page: "/meu-projeto/documentos-necessarios",
      element: '[data-tour="menu-documentos-necessarios"]',
      title: "📋 Documentos Necessários",
      description: `<p>Lista de todos os documentos que sua empresa precisa enviar:</p><ul style="margin:8px 0;padding-left:20px;list-style:disc"><li>Documentos já enviados e aprovados ✅</li><li>Documentos pendentes de envio ⏳</li><li>Clique em cada item para ver instruções detalhadas</li><li>Faça o upload diretamente nesta página</li></ul><p>📌 <em>O progresso do programa avança conforme os documentos são aprovados.</em></p>`,
      side: "right",
    },
    {
      page: "/meu-projeto/documentos",
      element: '[data-tour="menu-repositorio"]',
      title: "🗂️ Repositório de Documentos",
      description: `<p>Todos os documentos do seu programa em um só lugar:</p><ul style="margin:8px 0;padding-left:20px;list-style:disc"><li>Documentos enviados pela sua empresa</li><li>Documentos gerados pela consultoria (Código de Ética, Políticas)</li><li>Busca por nome ou categoria</li><li>Download disponível a qualquer momento</li></ul>`,
      side: "right",
    },
    {
      page: "/meu-projeto/treinamentos",
      element: '[data-tour="menu-treinamentos"]',
      title: "🎓 Treinamentos de Compliance",
      description: `<p>Acesse os <strong>treinamentos</strong> disponibilizados pelo consultor:</p><ul style="margin:8px 0;padding-left:20px;list-style:disc"><li>Cursos sobre ética empresarial e compliance</li><li>Vídeos e materiais de apoio interativos</li><li>Progresso salvo automaticamente em cada treinamento</li><li>Certificado ao concluir cada módulo</li></ul><p>🏆 <em>Os treinamentos são parte obrigatória do programa.</em></p>`,
      side: "right",
    },
    {
      page: "/meu-projeto/codigo-etica",
      element: '[data-tour="menu-codigo-etica-cliente"]',
      title: "📜 Código de Ética",
      description: `<p>Acesse o <strong>Código de Ética</strong> personalizado da sua empresa:</p><ul style="margin:8px 0;padding-left:20px;list-style:disc"><li>Documento criado com IA especificamente para o perfil da sua empresa</li><li>Leia e compartilhe com todos os colaboradores</li><li>Registre sua adesão (concordância) ao código</li><li>Histórico de adesões registrado automaticamente</li></ul><p>✍️ <em>Todos os colaboradores devem realizar a adesão ao Código de Ética.</em></p>`,
      side: "right",
    },
    {
      title: "🎉 Tour Concluído!",
      description: `<p>Você agora conhece todas as funcionalidades do seu portal!</p><br/><p><strong>Por onde começar?</strong></p><ul style="margin:8px 0;padding-left:20px;list-style:disc"><li>Responda o <em>Diagnóstico de Maturidade</em> se ainda não fez</li><li>Confira a lista de <em>Documentos Necessários</em></li><li>Acesse os <em>Treinamentos</em> disponíveis</li><li>Leia e adira ao <em>Código de Ética</em> da empresa</li></ul><br/><p>Dúvidas? Clique no botão <strong>(?)</strong> no cabeçalho a qualquer momento!</p>`,
    },
  ],
};

/* ─────────────────────────────────────────────────────────────────────────────
   Exports
──────────────────────────────────────────────────────────────────────────── */
export const tourDefinitions: TourDefinition[] = [
  adminTour,
  consultorTour,
  clienteTour,
];

export function getToursByRole(role: string): TourDefinition[] {
  return tourDefinitions.filter((t) => t.roles.includes(role));
}

export function getTourByKey(key: string): TourDefinition | undefined {
  return tourDefinitions.find((t) => t.key === key);
}
