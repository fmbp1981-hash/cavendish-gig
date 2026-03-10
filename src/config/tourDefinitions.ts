/**
 * tourDefinitions.ts — Tours interativos do Sistema GIG
 * Cada passo descreve O QUE a seção faz E O QUE o usuário deve fazer para obter o resultado.
 */

export interface TourStep {
  page?: string;
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

/* ─── helpers ─────────────────────────────────────────────────────────────── */
function step(what: string, how: string[]): string {
  return `<p>${what}</p><br/><p style="font-weight:600;color:hsl(161 55% 23%);margin-bottom:6px">✅ O que fazer:</p><ul style="margin:0;padding-left:20px;list-style:disc">${how.map(h => `<li style="margin-bottom:5px">${h}</li>`).join("")}</ul>`;
}

/* ─────────────────────────────────────────────────────────────────────────────
   TOUR DO ADMINISTRADOR — 13 passos
──────────────────────────────────────────────────────────────────────────── */
const adminTour: TourDefinition = {
  key: "admin-onboarding",
  title: "Tour Completo — Painel Admin",
  description: "Conheça todas as funcionalidades e saiba exatamente o que fazer em cada seção.",
  roles: ["admin"],
  icon: "🏢",
  estimatedMinutes: 10,
  steps: [
    {
      title: "👋 Bem-vindo ao Sistema GIG!",
      description: `<p>O <strong>Sistema GIG</strong> é a plataforma da <strong>Cavendish</strong> para operacionalizar programas de Compliance e Integridade nas organizações clientes.</p><br/><p>Como <strong>Administrador</strong>, você configura e controla todo o sistema. Este tour mostrará <strong>o que você precisa fazer</strong> em cada seção para o sistema funcionar plenamente.</p><br/><p>💡 <em>Você pode pausar e retomar este tour a qualquer momento pelo botão <strong>(?)</strong> no cabeçalho.</em></p>`,
    },
    {
      page: "/admin",
      element: '[data-tour="admin-nav-dashboard"]',
      title: "📊 Dashboard Geral",
      description: step(
        "O Dashboard é sua central de monitoramento. Mostra em tempo real o total de organizações, consultores, usuários e atividade recente do sistema.",
        [
          "Acesse o Dashboard diariamente para verificar se há alertas ou pendências.",
          "Observe os cards de totais — se algum número parecer incorreto, navegue até a seção correspondente para investigar.",
          "Use o Dashboard como ponto de partida de cada sessão de trabalho."
        ]
      ),
      side: "right",
    },
    {
      page: "/admin/organizacoes",
      element: '[data-tour="admin-nav-organizacoes"]',
      title: "🏢 Organizações (Clientes)",
      description: step(
        "Aqui você cadastra e gerencia todas as organizações clientes da Cavendish. Cada organização é um tenant isolado no sistema.",
        [
          "Clique em <strong>\"Nova Organização\"</strong> para cadastrar um novo cliente.",
          "Preencha: CNPJ, razão social, segmento de atuação e porte da empresa.",
          "Selecione o <strong>consultor responsável</strong> por aquela organização.",
          "Após salvar, o sistema cria automaticamente o projeto e o portal do cliente.",
          "Clique em uma organização existente para ver o status do programa de compliance."
        ]
      ),
      side: "right",
    },
    {
      page: "/admin/usuarios",
      element: '[data-tour="admin-nav-usuarios"]',
      title: "👥 Gestão de Usuários",
      description: step(
        "Controle total sobre todos os usuários do sistema — clientes, consultores e administradores.",
        [
          "Clique em <strong>\"Convidar Usuário\"</strong>, informe o e-mail e selecione o perfil: <em>admin</em>, <em>consultor</em> ou <em>cliente</em>.",
          "O usuário receberá um e-mail com link para criar a senha e acessar o sistema.",
          "Para alterar o perfil de um usuário, clique nos três pontos ao lado do nome e escolha <strong>\"Alterar Perfil\"</strong>.",
          "Para desativar um acesso, clique em <strong>\"Desativar Conta\"</strong> — o usuário não conseguirá mais logar."
        ]
      ),
      side: "right",
    },
    {
      page: "/admin/consultores",
      element: '[data-tour="admin-nav-consultores"]',
      title: "👨‍💼 Gestão de Consultores",
      description: step(
        "Pré-cadastre os consultores da Cavendish antes de eles criarem a conta. Isso garante que o perfil correto seja atribuído automaticamente no primeiro acesso.",
        [
          "Clique em <strong>\"Novo Consultor\"</strong> e preencha nome e e-mail profissional.",
          "Quando o consultor criar a conta com esse e-mail, o sistema reconhece e atribui o perfil de consultor automaticamente.",
          "Vincule o consultor às organizações que ele irá atender clicando em <strong>\"Atribuir Clientes\"</strong>.",
          "Monitore a carteira de cada consultor para equilibrar a carga de trabalho."
        ]
      ),
      side: "right",
    },
    {
      page: "/admin/documentos",
      element: '[data-tour="admin-nav-documentos"]',
      title: "📄 Documentos",
      description: step(
        "Central de todos os documentos do sistema — gerados pela IA ou enviados pelos clientes.",
        [
          "Use o filtro de <strong>organização</strong> para ver os documentos de um cliente específico.",
          "Documentos com status <strong>\"Pendente\"</strong> aguardam envio pelo cliente — entre em contato se estiver atrasado.",
          "Documentos com status <strong>\"Em Revisão\"</strong> precisam de aprovação do consultor — clique para revisar e aprovar ou solicitar correção.",
          "Para gerar um novo documento com IA, clique em <strong>\"Gerar Documento\"</strong>, selecione o tipo e a organização."
        ]
      ),
      side: "right",
    },
    {
      page: "/admin/catalogo",
      element: '[data-tour="admin-nav-catalogo"]',
      title: "📚 Catálogo de Documentos",
      description: step(
        "Define quais documentos cada tipo de organização precisa entregar. O sistema atribui automaticamente as obrigações a cada cliente.",
        [
          "Clique em <strong>\"Adicionar Item ao Catálogo\"</strong> para criar um novo tipo de documento.",
          "Defina: nome, categoria, se é <em>obrigatório</em> ou <em>opcional</em>, prazo de entrega e instruções detalhadas para o cliente.",
          "Selecione os <strong>segmentos ou portes</strong> de empresa aos quais este documento se aplica.",
          "Ao salvar, todas as organizações dos segmentos selecionados receberão este documento automaticamente em suas listas."
        ]
      ),
      side: "right",
    },
    {
      page: "/admin/templates",
      element: '[data-tour="admin-nav-templates"]',
      title: "📝 Templates de Documentos",
      description: step(
        "Modelos base que a IA usa para gerar documentos personalizados. Quanto melhor o template, melhor o resultado da IA.",
        [
          "Clique em <strong>\"Novo Template\"</strong> e selecione o tipo (ex: Código de Ética, Política Interna).",
          "Escreva o modelo completo usando variáveis dinâmicas: <code>{{nome_empresa}}</code>, <code>{{setor}}</code>, <code>{{porte}}</code>.",
          "A IA substitui automaticamente as variáveis pelos dados reais de cada organização ao gerar o documento.",
          "Clique em <strong>\"Salvar Template\"</strong> — ele ficará disponível imediatamente para uso na geração de documentos."
        ]
      ),
      side: "right",
    },
    {
      page: "/admin/relatorios/historico",
      element: '[data-tour="admin-nav-relatorios"]',
      title: "📈 Relatórios e Histórico",
      description: step(
        "Histórico completo de todos os relatórios de progresso gerados para as organizações clientes.",
        [
          "Selecione a <strong>organização</strong> e o <strong>período</strong> (mês/ano) desejado.",
          "Clique em <strong>\"Gerar Relatório\"</strong> — o sistema calculará automaticamente o índice de conformidade.",
          "Clique em <strong>\"Exportar PDF\"</strong> para baixar o relatório formatado para reuniões e apresentações.",
          "O histórico fica salvo permanentemente — você pode acessar relatórios de meses anteriores a qualquer momento."
        ]
      ),
      side: "right",
    },
    {
      page: "/admin/integracoes",
      element: '[data-tour="admin-nav-integracoes"]',
      title: "🔌 Integrações com Sistemas Externos",
      description: step(
        "Configure as conexões com ferramentas externas. <strong>Sem as integrações, os recursos de IA e notificações não funcionarão.</strong>",
        [
          "Clique na integração desejada (ex: <strong>OpenAI</strong>) para expandir as configurações.",
          "Cole a <strong>chave de API</strong> no campo indicado — obtida diretamente no painel do serviço.",
          "Clique em <strong>\"Salvar e Testar\"</strong> para verificar se a conexão está funcionando.",
          "Repita para cada integração: <em>OpenAI</em> (IA), <em>Resend</em> (e-mails), <em>Twilio</em> (WhatsApp), <em>Google Drive</em> (armazenamento), <em>Fireflies</em> (transcrição de reuniões).",
          "⚠️ <strong>Configure o OpenAI primeiro</strong> — ele é necessário para gerar documentos e relatórios com IA."
        ]
      ),
      side: "right",
    },
    {
      page: "/admin/branding",
      element: '[data-tour="admin-nav-branding"]',
      title: "🎨 White Label / Branding",
      description: step(
        "Personaliza a identidade visual do sistema para cada organização. Cada cliente vê o sistema com a cara da própria empresa.",
        [
          "Selecione a <strong>organização</strong> que deseja personalizar no campo de seleção.",
          "Clique em <strong>\"Enviar Logo\"</strong> e faça upload do logotipo da empresa (PNG ou SVG, fundo transparente).",
          "Escolha a <strong>cor primária</strong> da empresa usando o seletor de cor — ela será usada nos botões e destaques do portal daquela empresa.",
          "Preencha o <strong>nome da empresa</strong> que aparecerá no cabeçalho do portal.",
          "Clique em <strong>\"Salvar Configurações\"</strong> — as mudanças são aplicadas imediatamente para aquela organização."
        ]
      ),
      side: "right",
    },
    {
      page: "/admin",
      title: "✨ IntelliX AI — Assistente no Header",
      description: step(
        "O assistente de IA da IntelliX está disponível diretamente no cabeçalho do sistema — basta clicar no ícone de faísca (✨) ao lado do sino de notificações.",
        [
          "Clique no ícone <strong>✨</strong> no cabeçalho (ao lado do sino) para abrir o painel de chat.",
          "Pergunte sobre o status dos clientes, documentos pendentes, projetos ou tarefas.",
          "O assistente tem acesso ao contexto do sistema e responde em linguagem natural.",
          "Use o botão de <strong>minimizar</strong> para deixar o chat aberto sem ocupar espaço.",
          "Disponível para <em>Admin</em> e <em>Consultor</em> — em qualquer página do sistema."
        ]
      ),
    },
    {
      page: "/admin/audit-trail",
      element: '[data-tour="admin-nav-audit"]',
      title: "🔍 Audit Trail — Trilha de Auditoria",
      description: step(
        "Log imutável de todas as ações realizadas no sistema — INSERT, UPDATE, DELETE e LOGIN. Essencial para conformidade, investigações internas e rastreabilidade de alterações.",
        [
          "Acesse <strong>Audit Trail</strong> no menu lateral do Painel Admin.",
          "Use o filtro <strong>\"Tabela\"</strong> para buscar ações em uma tabela específica (ex: <em>documentos</em>, <em>projetos</em>).",
          "Filtre por <strong>\"Ação\"</strong> (INSERT, UPDATE, DELETE) para focar em um tipo de operação.",
          "Use os filtros de <strong>data</strong> para investigar um período específico — ex: quem alterou um documento num determinado dia.",
          "Clique em <strong>\"Exportar CSV\"</strong> para gerar um relatório de auditoria para compliance ou investigação.",
          "A coluna <strong>\"Resumo\"</strong> mostra quais campos foram alterados num UPDATE — sem precisar abrir os dados completos."
        ]
      ),
      side: "right",
    },
    {
      page: "/admin/logs",
      element: '[data-tour="admin-nav-logs"]',
      title: "🐛 Logs do Sistema",
      description: step(
        "Monitora a saúde técnica do sistema. Quando algo falha nos bastidores (IA, e-mail, integrações), o erro aparece aqui com diagnóstico automático.",
        [
          "Verifique periodicamente os logs com nível <strong>\"Erro\"</strong> (em vermelho) — eles indicam falhas que precisam de atenção.",
          "Clique em um log para ver os <strong>detalhes completos</strong> e a <strong>sugestão de correção</strong> gerada automaticamente.",
          "Siga as instruções de correção (ex: chave de API expirada → vá em Integrações e atualize a chave).",
          "Após resolver o problema, clique em <strong>\"Marcar como Resolvido\"</strong> e registre o que foi feito para histórico."
        ]
      ),
      side: "right",
    },
    {
      page: "/admin/configuracoes",
      element: '[data-tour="admin-nav-configuracoes"]',
      title: "⚙️ Configurações do Sistema",
      description: step(
        "Ajustes gerais do sistema e visualização do status de todos os serviços em tempo real.",
        [
          "Verifique o painel de <strong>Status do Sistema</strong> — todos os itens devem estar verdes. Se algum estiver vermelho, vá em <em>Integrações</em> para corrigir.",
          "Atualize os dados da empresa administradora (nome, contato) no formulário de informações.",
          "Acesse a aba <strong>Branding</strong> para fazer configurações visuais globais do sistema.",
          "Mantenha as configurações atualizadas — elas aparecem em e-mails e documentos gerados automaticamente."
        ]
      ),
      side: "right",
    },
    {
      title: "🎉 Tour Concluído!",
      description: `<p>Parabéns! Você conhece agora todas as funcionalidades e sabe o que fazer em cada seção.</p><br/><p style="font-weight:600;color:hsl(161 55% 23%);margin-bottom:6px">🚀 Ordem recomendada para começar:</p><ol style="margin:0;padding-left:20px;list-style:decimal"><li style="margin-bottom:5px">Configure as <strong>Integrações</strong> (especialmente OpenAI e Resend)</li><li style="margin-bottom:5px">Cadastre as primeiras <strong>Organizações</strong> clientes</li><li style="margin-bottom:5px">Pré-cadastre os <strong>Consultores</strong> e vincule aos clientes</li><li style="margin-bottom:5px">Defina o <strong>Catálogo</strong> de documentos necessários</li><li style="margin-bottom:5px">Configure o <strong>Branding</strong> de cada organização</li></ol><br/><p>💡 Este tour fica disponível a qualquer momento no botão <strong>(?)</strong> no cabeçalho.</p>`,
    },
  ],
};

/* ─────────────────────────────────────────────────────────────────────────────
   TOUR DO CONSULTOR — 11 passos
──────────────────────────────────────────────────────────────────────────── */
const consultorTour: TourDefinition = {
  key: "consultor-onboarding",
  title: "Tour do Portal do Consultor",
  description: "Descubra o que fazer em cada ferramenta para gerar resultados reais para seus clientes.",
  roles: ["admin", "consultor"],
  icon: "👨‍💼",
  estimatedMinutes: 9,
  steps: [
    {
      title: "👋 Bem-vindo ao Portal do Consultor!",
      description: `<p>O <strong>Portal do Consultor</strong> é sua central de trabalho. Aqui você gerencia clientes, gera documentos com IA e acompanha o progresso de cada programa de compliance.</p><br/><p>Este tour mostrará <strong>exatamente o que fazer</strong> em cada seção para obter os melhores resultados. Vamos lá!</p>`,
    },
    {
      page: "/consultor",
      element: '[data-tour="dashboard"]',
      title: "📊 Dashboard do Consultor",
      description: step(
        "Resumo centralizado de toda a sua carteira de clientes, tarefas e atividades pendentes.",
        [
          "Acesse o Dashboard <strong>no início de cada dia</strong> de trabalho.",
          "Clique nos cards de <strong>\"Tarefas Vencendo\"</strong> ou <strong>\"Documentos Pendentes\"</strong> para ir direto ao que precisa de atenção.",
          "Observe o card de <strong>\"Próximas Reuniões\"</strong> para se preparar para os atendimentos do dia.",
          "Se um cliente estiver com o programa parado, acesse a organização e verifique o que está bloqueando o avanço."
        ]
      ),
      side: "right",
    },
    {
      page: "/consultor/clientes",
      element: '[data-tour="menu-organizacoes"]',
      title: "🏢 Meus Clientes",
      description: step(
        "Lista de todas as organizações clientes sob sua responsabilidade.",
        [
          "Clique em uma organização para <strong>abrir o projeto completo</strong> daquele cliente.",
          "Dentro do projeto você acessa o diagnóstico, documentos, tarefas e histórico de reuniões.",
          "Use os filtros <strong>\"Por Status\"</strong> ou <strong>\"Por Progresso\"</strong> para identificar quais clientes precisam de mais atenção.",
          "Para adicionar um novo cliente à sua carteira, solicite ao administrador que cadastre a organização e a vincule ao seu perfil."
        ]
      ),
      side: "right",
    },
    {
      page: "/consultor/documentos",
      element: '[data-tour="menu-documentos"]',
      title: "📄 Geração de Documentos com IA",
      description: step(
        "O módulo mais poderoso do sistema. A IA gera documentos completos e personalizados automaticamente — trabalho de dias feito em segundos.",
        [
          "Selecione a <strong>organização</strong> no campo de filtro no topo da página.",
          "Clique em <strong>\"Gerar Documento com IA\"</strong> e escolha o tipo: <em>Código de Ética</em>, <em>Política Interna</em> ou <em>Relatório de Diagnóstico</em>.",
          "A IA analisa o diagnóstico respondido pela empresa e gera o documento personalizado em segundos.",
          "Revise o documento gerado. Se necessário, edite diretamente no editor de texto.",
          "Clique em <strong>\"Aprovar e Publicar\"</strong> para disponibilizar o documento no portal do cliente."
        ]
      ),
      side: "right",
    },
    {
      page: "/consultor/tarefas",
      element: '[data-tour="menu-tarefas"]',
      title: "✅ Gestão de Tarefas",
      description: step(
        "Organize e acompanhe todas as atividades do programa — suas e dos clientes.",
        [
          "Clique em <strong>\"Nova Tarefa\"</strong> para criar uma atividade.",
          "Selecione o <strong>cliente</strong>, escreva o título e a descrição, defina o <strong>prazo</strong> e o <strong>responsável</strong> (você ou o cliente).",
          "Tarefas atribuídas ao cliente aparecem no portal deles como obrigações a cumprir.",
          "Use o filtro <strong>\"Vencendo Hoje\"</strong> para priorizar o que é urgente.",
          "Ao concluir uma tarefa, clique em <strong>\"Marcar como Concluída\"</strong> para registrar o progresso."
        ]
      ),
      side: "right",
    },
    {
      page: "/consultor/adesao-etica",
      element: '[data-tour="menu-adesao-etica"]',
      title: "📋 Adesão ao Código de Ética",
      description: step(
        "Gerencia o processo de assinatura digital do Código de Ética pelos colaboradores da empresa cliente.",
        [
          "<strong>Pré-requisito:</strong> O Código de Ética da organização já deve estar aprovado (gerado e publicado em Documentos).",
          "Selecione a <strong>organização</strong> e clique em <strong>\"Enviar para Adesão\"</strong>.",
          "Adicione os <strong>e-mails dos colaboradores</strong> que devem assinar (pode importar de uma lista CSV).",
          "Os colaboradores receberão um e-mail com link para ler e assinar digitalmente.",
          "Acompanhe o painel de adesão: veja quem assinou ✅ e quem está pendente ⏳. Clique em <strong>\"Enviar Lembrete\"</strong> para os que ainda não assinaram."
        ]
      ),
      side: "right",
    },
    {
      page: "/consultor/compliance",
      element: '[data-tour="menu-compliance"]',
      title: "🛡️ Compliance — Módulo GRC Completo",
      description: step(
        "Central de Governança, Risco e Compliance com 9 abas integradas. Todos os módulos de conformidade da organização em um único lugar.",
        [
          "Aba <strong>Políticas</strong>: gerencie políticas corporativas (anticorrupção, LGPD, trabalhista…) com fluxo de aprovação rascunho → publicado. Acompanhe o percentual de adesão dos colaboradores.",
          "Aba <strong>Conflito de Interesses</strong>: colete declarações anuais de todos os colaboradores. Veja quem ainda não declarou e analise as declarações recebidas.",
          "Aba <strong>LGPD</strong>: inventarie os dados pessoais tratados (bases legais, titular, finalidade) e gerencie solicitações de titulares (DSR) com prazo de 15 dias.",
          "Aba <strong>Riscos</strong>: registre e priorize riscos com matriz de probabilidade × impacto. Adicione ações de mitigação e acompanhe cada uma.",
          "Aba <strong>Due Diligence</strong>: avalie fornecedores e parceiros com questionários estruturados de due diligence. Score de risco calculado automaticamente.",
          "Aba <strong>KPIs</strong>: painel unificado com índice de conformidade, documentos por status, projetos por fase e progresso de treinamentos.",
          "Use a aba <strong>Consulta CEIS</strong> para verificar empresas antes de assinar contratos."
        ]
      ),
      side: "right",
    },
    {
      page: "/consultor/compliance-calendar",
      element: '[data-tour="menu-calendar"]',
      title: "📅 Calendário Regulatório",
      description: step(
        "Agenda centralizada de todas as obrigações regulatórias e prazos de compliance das organizações. Nunca mais perca um prazo legal.",
        [
          "Clique em <strong>\"Nova Obrigação\"</strong> para cadastrar um compromisso regulatório (ex: Relatório Anual ANPD, Reunião de Governança Trimestral).",
          "Defina a <strong>periodicidade</strong>: única, mensal, trimestral, semestral ou anual. O sistema recalcula automaticamente a próxima data.",
          "Preencha <strong>Lei de Referência</strong> e <strong>Órgão Regulador</strong> para rastreabilidade (ex: Lei 13.709/2018 — ANPD).",
          "Obrigações vencidas ficam marcadas em <strong>vermelho</strong> automaticamente — priorize-as imediatamente.",
          "Ao cumprir uma obrigação, clique em <strong>\"Concluir\"</strong> — o sistema registra a data de conclusão e cria a próxima ocorrência automaticamente."
        ]
      ),
      side: "right",
    },
    {
      page: "/consultor/esg",
      element: '[data-tour="menu-esg"]',
      title: "🌿 Dashboard ESG",
      description: step(
        "Acompanhe e gerencie os indicadores ESG (Ambiental, Social e Governança) das organizações. Ferramenta essencial para relatórios de sustentabilidade e exigências de grandes clientes.",
        [
          "Selecione a <strong>organização</strong> e clique em <strong>\"+ Indicador\"</strong> para cadastrar métricas ESG.",
          "Organize por <strong>pilar</strong>: Ambiental 🌿 (ex: consumo de energia, emissões CO₂), Social 🤝 (ex: diversidade, treinamentos) ou Governança ⚖️ (ex: políticas implementadas).",
          "Defina <strong>meta</strong> e <strong>valor atual</strong> — o sistema calcula o score de atingimento automaticamente.",
          "O <strong>Radar ESG</strong> visualiza o desempenho nos 3 pilares de forma gráfica — ideal para apresentações à diretoria.",
          "O <strong>Score ESG Geral</strong> (0–100) é calculado automaticamente com base na média dos indicadores com meta definida.",
          "Use esta ferramenta para gerar dados concretos para relatórios de sustentabilidade e responder exigências de fornecedores ou investidores."
        ]
      ),
      side: "right",
    },
    {
      page: "/consultor/board",
      element: '[data-tour="menu-board"]',
      title: "📊 Board Reporting",
      description: step(
        "Gera relatórios executivos consolidados para apresentar ao conselho ou à diretoria — sem necessidade de login. Compartilhe um link seguro com validade de 30 dias.",
        [
          "Selecione a <strong>organização</strong> e clique em <strong>\"Gerar Relatório Executivo\"</strong>.",
          "O sistema cria automaticamente um <strong>snapshot</strong> com os dados atuais: riscos críticos, denúncias em aberto, score ESG e KPIs de compliance.",
          "Um <strong>link público</strong> é gerado — válido por 30 dias, sem necessidade de login para visualizar.",
          "Compartilhe o link com diretores ou conselheiros diretamente do botão <strong>\"Copiar Link\"</strong>.",
          "Cada snapshot fica salvo no histórico para comparação entre períodos.",
          "Ideal para <strong>reuniões de conselho</strong>, <strong>apresentações a investidores</strong> ou <strong>auditorias externas</strong>."
        ]
      ),
      side: "right",
    },
    {
      page: "/consultor",
      title: "✨ IntelliX AI — Chat no Header",
      description: step(
        "O assistente de IA da IntelliX agora está fixo no cabeçalho do Portal do Consultor — disponível em qualquer página sem precisar procurar um botão flutuante.",
        [
          "Clique no ícone <strong>✨</strong> no cabeçalho (entre o sino e o botão ?) para abrir o chat.",
          "Pergunte: <em>\"Quais clientes têm documentos pendentes?\"</em> ou <em>\"Resuma o status dos projetos\"</em>.",
          "O assistente acessa os dados do sistema e responde em linguagem natural.",
          "Clique em <strong>Minimizar (—)</strong> para recolher o painel sem fechar a conversa.",
          "Clique no ícone novamente para fechar — a conversa é reiniciada a cada sessão."
        ]
      ),
    },
    {
      page: "/consultor/relatorios",
      element: '[data-tour="menu-relatorios"]',
      title: "📈 Relatórios de Progresso",
      description: step(
        "Gera relatórios detalhados do programa de compliance para apresentar ao cliente e documentar a evolução.",
        [
          "Selecione a <strong>organização</strong> e o <strong>mês de referência</strong> no topo da página.",
          "Clique em <strong>\"Gerar Relatório\"</strong> — o sistema calculará automaticamente o índice de conformidade com base nas atividades registradas.",
          "O relatório inclui: documentos entregues, tarefas concluídas, treinamentos realizados, adesões ao código de ética e progresso geral.",
          "Clique em <strong>\"Exportar PDF\"</strong> para baixar o relatório formatado e apresentar ao cliente.",
          "Gere relatórios <strong>mensalmente</strong> — eles compõem o histórico de evolução do programa."
        ]
      ),
      side: "right",
    },
    {
      page: "/consultor/agendamento",
      element: '[data-tour="menu-reunioes"]',
      title: "📅 Agendamento de Reuniões",
      description: step(
        "Agende reuniões com os clientes e gere atas automaticamente com IA após cada encontro.",
        [
          "Clique em <strong>\"Agendar Reunião\"</strong>, selecione o cliente e defina data, hora e pauta.",
          "Os participantes receberão convite por <strong>e-mail</strong> com todas as informações.",
          "Após a reunião, volte aqui e clique em <strong>\"Registrar Resultado\"</strong>.",
          "Cole a <strong>transcrição da reunião</strong> (do Fireflies, Teams, Meet ou qualquer sistema) no campo indicado.",
          "Clique em <strong>\"Gerar Ata com IA\"</strong> — a IA identificará decisões, responsáveis e prazos e formatará a ata profissional automaticamente."
        ]
      ),
      side: "right",
    },
    {
      page: "/consultor/denuncias",
      element: '[data-tour="menu-denuncias"]',
      title: "🔔 Canal de Denúncias",
      description: step(
        "Acompanha as denúncias anônimas recebidas pelas organizações clientes. A identidade do denunciante é protegida em todas as etapas.",
        [
          "Quando uma nova denúncia aparecer, clique nela para ver o <strong>relato completo</strong>.",
          "Altere o status para <strong>\"Em Análise\"</strong> para indicar que a investigação começou.",
          "Registre no campo de <strong>notas internas</strong> cada ação tomada durante a investigação.",
          "Ao concluir, atualize o status para <strong>\"Concluída\"</strong> e documente o resultado e as medidas adotadas.",
          "O denunciante pode acompanhar o andamento pelo <strong>número de protocolo</strong> recebido — sem revelar sua identidade."
        ]
      ),
      side: "right",
    },
    {
      page: "/consultor/codigo-etica",
      element: '[data-tour="menu-codigo-etica"]',
      title: "✨ IA: Gerador de Código de Ética",
      description: step(
        "Gera um Código de Ética completo e personalizado para o cliente em minutos, usando Inteligência Artificial.",
        [
          "Selecione a <strong>organização cliente</strong> no campo de seleção.",
          "A IA usará as respostas do diagnóstico respondido pela empresa — <strong>certifique-se de que o diagnóstico foi respondido</strong> antes de gerar.",
          "Clique em <strong>\"Gerar Código de Ética\"</strong> e aguarde alguns segundos.",
          "Revise o documento gerado. Você pode <strong>editar qualquer trecho</strong> diretamente no editor.",
          "Quando estiver satisfeito, clique em <strong>\"Aprovar e Publicar\"</strong> — o código ficará disponível no portal do cliente para leitura e adesão."
        ]
      ),
      side: "right",
    },
    {
      page: "/consultor/atas",
      element: '[data-tour="menu-atas"]',
      title: "📝 IA: Gerador de Atas de Reunião",
      description: step(
        "Transforma a transcrição de qualquer reunião em uma ata profissional e estruturada, automaticamente.",
        [
          "Após uma reunião, obtenha a <strong>transcrição completa</strong> (do Fireflies, Microsoft Teams, Google Meet ou outro sistema).",
          "Cole toda a transcrição no campo de texto desta página.",
          "Selecione a <strong>organização</strong> e o <strong>tipo de reunião</strong> (ex: reunião mensal de compliance).",
          "Clique em <strong>\"Gerar Ata com IA\"</strong> — a IA identificará automaticamente decisões tomadas, responsáveis e prazos.",
          "Revise a ata gerada, faça ajustes se necessário e clique em <strong>\"Exportar PDF\"</strong> ou <strong>\"Enviar para Participantes\"</strong>."
        ]
      ),
      side: "right",
    },
    {
      title: "🎉 Tour do Consultor Concluído!",
      description: `<p>Agora você sabe exatamente o que fazer em cada ferramenta!</p><br/><p style="font-weight:600;color:hsl(161 55% 23%);margin-bottom:6px">🚀 Fluxo de trabalho recomendado:</p><ol style="margin:0;padding-left:20px;list-style:decimal"><li style="margin-bottom:5px">Acesse <em>Meus Clientes</em> e verifique a carteira</li><li style="margin-bottom:5px">Garanta que o diagnóstico do cliente foi respondido</li><li style="margin-bottom:5px">Gere o <strong>Código de Ética</strong> usando o módulo de IA</li><li style="margin-bottom:5px">Envie o código para <strong>adesão</strong> dos colaboradores</li><li style="margin-bottom:5px">Configure as <strong>Políticas Corporativas</strong> em Compliance</li><li style="margin-bottom:5px">Colete as <strong>Declarações de Conflito de Interesses</strong> anuais</li><li style="margin-bottom:5px">Registre e priorize os <strong>Riscos</strong> da organização</li><li style="margin-bottom:5px">Acompanhe as obrigações no <strong>Calendário Regulatório</strong></li><li style="margin-bottom:5px">Atualize os <strong>Indicadores ESG</strong> periodicamente</li><li style="margin-bottom:5px">Ao final do mês, gere o <strong>Relatório de Progresso</strong> e o <strong>Board Report</strong></li></ol><br/><p>💡 Lembre: o assistente <strong>✨ IntelliX AI</strong> está sempre disponível no cabeçalho. Este tour pode ser acessado novamente pelo botão <strong>(?)</strong>.</p>`,
    },
  ],
};

/* ─────────────────────────────────────────────────────────────────────────────
   TOUR DO CLIENTE — 8 passos
──────────────────────────────────────────────────────────────────────────── */
const clienteTour: TourDefinition = {
  key: "cliente-onboarding",
  title: "Tour do Portal do Cliente",
  description: "Saiba o que você precisa fazer em cada seção para avançar no programa de compliance.",
  roles: ["cliente", "colaborador", "admin", "consultor"],
  icon: "🏗️",
  estimatedMinutes: 5,
  steps: [
    {
      title: "👋 Bem-vindo ao seu Portal!",
      description: `<p>Este é o seu portal personalizado para participar do <strong>Programa de Governança e Compliance</strong> da sua empresa.</p><br/><p>Aqui você encontra tudo o que precisa: diagnóstico, documentos, treinamentos e mais. Este tour mostrará <strong>o que você precisa fazer</strong> em cada seção.</p><br/><p>São apenas alguns minutos — vamos lá! 🚀</p>`,
    },
    {
      page: "/meu-projeto",
      element: '[data-tour="dashboard"]',
      title: "🏠 Meu Projeto",
      description: step(
        "A página principal mostra o resumo completo do seu progresso no programa de compliance.",
        [
          "Observe o <strong>percentual de conclusão</strong> do programa — o objetivo é chegar a 100%.",
          "Clique nos cards de <strong>\"Documentos Pendentes\"</strong> para ver o que falta enviar.",
          "Verifique a data da <strong>próxima reunião</strong> com o consultor para se preparar.",
          "Acesse aqui sempre que quiser ter uma visão geral do que ainda precisa ser feito."
        ]
      ),
      side: "right",
    },
    {
      page: "/meu-projeto/diagnostico",
      element: '[data-tour="menu-diagnosticos"]',
      title: "🔍 Diagnóstico de Maturidade",
      description: step(
        "Um questionário que avalia o nível de maturidade em compliance da sua empresa. As respostas são usadas para personalizar todo o seu programa.",
        [
          "Clique em <strong>\"Iniciar Diagnóstico\"</strong> para começar.",
          "Responda cada pergunta com honestidade — não há respostas certas ou erradas.",
          "Reserve cerca de <strong>20 minutos</strong> para completar sem interrupções.",
          "O progresso é salvo automaticamente — você pode pausar e continuar depois.",
          "Ao terminar, clique em <strong>\"Enviar Diagnóstico\"</strong>. O consultor e a IA usarão suas respostas para personalizar o Código de Ética e o programa."
        ]
      ),
      side: "right",
    },
    {
      page: "/meu-projeto/documentos-necessarios",
      element: '[data-tour="menu-documentos-necessarios"]',
      title: "📋 Documentos Necessários",
      description: step(
        "Lista de todos os documentos que sua empresa precisa enviar para o programa. O progresso só avança quando os documentos são entregues e aprovados.",
        [
          "Clique em um documento com status <strong>\"Pendente\"</strong> para ver as instruções detalhadas.",
          "Leia com atenção o que é solicitado e prepare o arquivo no formato indicado (PDF, imagem ou planilha).",
          "Clique em <strong>\"Fazer Upload\"</strong> e selecione o arquivo do seu computador.",
          "Após o envio, o status muda para <strong>\"Em Revisão\"</strong> — aguarde a aprovação do consultor.",
          "Se o documento for reprovado, você receberá uma notificação explicando o que precisa ser corrigido."
        ]
      ),
      side: "right",
    },
    {
      page: "/meu-projeto/documentos",
      element: '[data-tour="menu-repositorio"]',
      title: "🗂️ Repositório de Documentos",
      description: step(
        "Todos os documentos do seu programa em um só lugar — os que você enviou e os que a consultoria gerou para sua empresa.",
        [
          "Use o <strong>campo de busca</strong> para encontrar rapidamente um documento pelo nome.",
          "Clique no <strong>ícone de download</strong> ao lado de qualquer documento para salvar uma cópia.",
          "Documentos gerados pelo consultor (como o <em>Código de Ética</em>) também aparecem aqui após aprovação.",
          "Guarde os documentos aprovados — eles são as <strong>evidências do seu programa de compliance</strong>."
        ]
      ),
      side: "right",
    },
    {
      page: "/meu-projeto/treinamentos",
      element: '[data-tour="menu-treinamentos"]',
      title: "🎓 Treinamentos de Compliance",
      description: step(
        "Cursos e materiais disponibilizados pelo consultor para capacitar você e sua equipe em conformidade e ética.",
        [
          "Clique em um <strong>treinamento disponível</strong> para abrir.",
          "Assista ao conteúdo completo — vídeos, textos e materiais de apoio.",
          "Responda as perguntas ou quiz ao final de cada módulo para confirmar o aprendizado.",
          "Seu progresso é salvo automaticamente — você pode pausar e retomar a qualquer momento.",
          "Ao concluir, clique em <strong>\"Obter Certificado\"</strong> para registrar a conclusão. Os treinamentos são obrigatórios para o programa."
        ]
      ),
      side: "right",
    },
    {
      page: "/meu-projeto/codigo-etica",
      element: '[data-tour="menu-codigo-etica-cliente"]',
      title: "📜 Código de Ética",
      description: step(
        "O Código de Ética personalizado da sua empresa, criado com IA com base no diagnóstico respondido. Todos os colaboradores devem ler e aderir.",
        [
          "<strong>Leia o documento completo</strong> — ele define os valores, princípios e condutas esperados na sua empresa.",
          "Após a leitura, clique em <strong>\"Registrar Minha Adesão\"</strong> para confirmar que você leu e concorda.",
          "Compartilhe o link com todos os <strong>colaboradores</strong> da empresa — cada um deve fazer sua adesão individualmente.",
          "O histórico de quem aderiu fica registrado automaticamente como evidência de conformidade."
        ]
      ),
      side: "right",
    },
    {
      title: "🎉 Tour Concluído!",
      description: `<p>Você sabe agora o que fazer em cada seção do seu portal!</p><br/><p style="font-weight:600;color:hsl(161 55% 23%);margin-bottom:6px">🚀 Ordem recomendada para começar:</p><ol style="margin:0;padding-left:20px;list-style:decimal"><li style="margin-bottom:5px">Responda o <strong>Diagnóstico de Maturidade</strong> completo</li><li style="margin-bottom:5px">Envie os <strong>Documentos Necessários</strong> um a um</li><li style="margin-bottom:5px">Complete os <strong>Treinamentos</strong> disponíveis</li><li style="margin-bottom:5px">Leia e registre a adesão ao <strong>Código de Ética</strong></li></ol><br/><p>Dúvidas? Clique no botão <strong>(?)</strong> no cabeçalho a qualquer momento!</p>`,
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
