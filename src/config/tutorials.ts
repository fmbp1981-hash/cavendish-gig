import { TutorialStep } from "@/hooks/useTutorial";

// TUTORIAL PARA CONSULTOR
export const consultorOnboarding: TutorialStep[] = [
  {
    id: "consultor-1",
    title: "Bem-vindo ao GIG!",
    content: "Olá! Vou te guiar pelas principais funcionalidades do sistema GIG. Este tutorial levará cerca de 5 minutos.",
    placement: "center",
  },
  {
    id: "consultor-2",
    title: "Dashboard do Consultor",
    content: "Aqui você tem uma visão geral da sua carteira de clientes, próximas reuniões, tarefas urgentes e clientes que precisam de atenção.",
    target: "[data-tour='dashboard']",
    placement: "center",
  },
  {
    id: "consultor-3",
    title: "Organizações",
    content: "No menu Organizações você gerencia todos os seus clientes. Pode filtrar por Prospectos, Ativos ou Pausados.",
    target: "[data-tour='menu-organizacoes']",
    placement: "right",
  },
  {
    id: "consultor-4",
    title: "Projetos",
    content: "Aqui você acompanha o andamento dos projetos nas 3 fases: Diagnóstico, Implementação e Recorrência.",
    target: "[data-tour='menu-projetos']",
    placement: "right",
  },
  {
    id: "consultor-5",
    title: "Reuniões com IA",
    content: "Agende reuniões e deixe que a IA gere atas automaticamente! Basta fazer upload da transcrição e clicar em 'Gerar Ata com IA'.",
    target: "[data-tour='menu-reunioes']",
    placement: "right",
  },
  {
    id: "consultor-6",
    title: "Documentos com IA",
    content: "Gere Código de Ética, políticas e outros documentos automaticamente usando IA. A IA personaliza baseado nas informações do cliente.",
    target: "[data-tour='menu-documentos']",
    placement: "right",
  },
  {
    id: "consultor-7",
    title: "Tarefas Automáticas",
    content: "As tarefas são criadas automaticamente quando você gera uma ata. Você pode criar tarefas manuais também.",
    target: "[data-tour='menu-tarefas']",
    placement: "right",
  },
  {
    id: "consultor-8",
    title: "Relatórios Automáticos",
    content: "Todo dia 1 de cada mês, o sistema gera automaticamente um relatório completo para cada cliente e envia por email!",
    target: "[data-tour='menu-relatorios']",
    placement: "right",
  },
  {
    id: "consultor-9",
    title: "Pronto!",
    content: "Você está pronto para começar! Lembre-se: você pode acessar este tutorial novamente clicando no ícone de ajuda (?) no canto superior direito.",
    placement: "center",
  },
];

// TUTORIAL PARA CLIENTE (SÓCIO/DIRETOR)
export const clienteOnboarding: TutorialStep[] = [
  {
    id: "cliente-1",
    title: "Bem-vindo ao seu Portal GIG!",
    content: "Olá! Este é o seu painel de governança corporativa. Vou te mostrar como acompanhar o projeto e suas tarefas.",
    placement: "center",
  },
  {
    id: "cliente-2",
    title: "Progresso do Projeto",
    content: "Aqui você acompanha em tempo real o progresso do seu projeto de governança. Veja em qual fase está e a previsão de conclusão.",
    target: "[data-tour='progresso-projeto']",
    placement: "bottom",
  },
  {
    id: "cliente-3",
    title: "Próxima Reunião",
    content: "Visualize sua próxima reunião agendada com o consultor. Você pode entrar direto no Google Meet clicando no botão.",
    target: "[data-tour='proxima-reuniao']",
    placement: "bottom",
  },
  {
    id: "cliente-4",
    title: "Documentos Necessários",
    content: "Aqui você vê quantos documentos já foram enviados. IMPORTANTE: É fundamental enviar todos os documentos solicitados para o projeto avançar.",
    target: "[data-tour='documentos-necessarios']",
    placement: "bottom",
  },
  {
    id: "cliente-5",
    title: "Suas Tarefas",
    content: "Fique de olho nas suas tarefas pendentes! Elas aparecem aqui com os prazos. Não deixe atrasar!",
    target: "[data-tour='tarefas-pendentes']",
    placement: "top",
  },
  {
    id: "cliente-6",
    title: "Enviar Documentos",
    content: "Vá em 'Documentos Necessários' no menu para fazer upload dos documentos solicitados. O consultor vai analisar e aprovar.",
    target: "[data-tour='menu-documentos-necessarios']",
    placement: "right",
  },
  {
    id: "cliente-7",
    title: "Diagnóstico de Governança",
    content: "Você precisará responder um questionário de governança (50 perguntas). Não se preocupe, pode salvar e continuar depois!",
    target: "[data-tour='menu-diagnosticos']",
    placement: "right",
  },
  {
    id: "cliente-8",
    title: "Reuniões e Atas",
    content: "Todas as reuniões ficam registradas aqui com as atas geradas automaticamente. Você pode consultar a qualquer momento.",
    target: "[data-tour='menu-reunioes']",
    placement: "right",
  },
  {
    id: "cliente-9",
    title: "Treinamentos dos Colaboradores",
    content: "Acompanhe quantos colaboradores já concluíram os treinamentos obrigatórios de compliance.",
    target: "[data-tour='menu-treinamentos']",
    placement: "right",
  },
  {
    id: "cliente-10",
    title: "Tudo Pronto!",
    content: "Agora você sabe usar o sistema! Qualquer dúvida, clique no ícone de ajuda (?) no canto superior direito. Bom trabalho!",
    placement: "center",
  },
];

// TUTORIAL PARA COLABORADOR
export const colaboradorOnboarding: TutorialStep[] = [
  {
    id: "colaborador-1",
    title: "Bem-vindo ao Portal GIG!",
    content: "Olá! Você foi convidado para fazer os treinamentos obrigatórios da empresa. É rápido e fácil!",
    placement: "center",
  },
  {
    id: "colaborador-2",
    title: "Seus Treinamentos",
    content: "Aqui estão os treinamentos que você precisa fazer. Os obrigatórios têm um prazo e aparecem em vermelho se pendentes.",
    target: "[data-tour='treinamentos-list']",
    placement: "center",
  },
  {
    id: "colaborador-3",
    title: "Como Fazer um Treinamento",
    content: "1) Clique em 'Iniciar'\n2) Assista ao conteúdo (vídeo ou texto)\n3) Faça o quiz no final\n4) Precisa de 70% para passar\n5) Se reprovar, pode tentar de novo em 24h",
    target: "[data-tour='treinamentos-list']",
    placement: "center",
  },
  {
    id: "colaborador-4",
    title: "Certificados",
    content: "Quando concluir um treinamento, você pode baixar o certificado clicando em 'Ver Certificado'.",
    placement: "center",
  },
  {
    id: "colaborador-5",
    title: "Canal de Denúncias",
    content: "IMPORTANTE: Se presenciar qualquer irregularidade (assédio, fraude, corrupção, etc), use o Canal de Denúncias. É anônimo e seguro!",
    target: "[data-tour='canal-denuncias']",
    placement: "top",
  },
  {
    id: "colaborador-6",
    title: "Pronto!",
    content: "É só isso! Agora vá fazer seus treinamentos. Qualquer dúvida, clique no ícone de ajuda (?). Sucesso!",
    placement: "center",
  },
];

// TUTORIAL ESPECÍFICO: Como enviar documentos (Cliente)
export const comoEnviarDocumentos: TutorialStep[] = [
  {
    id: "docs-1",
    title: "Como Enviar Documentos",
    content: "Vou te ensinar passo a passo como enviar os documentos solicitados pelo consultor.",
    placement: "center",
  },
  {
    id: "docs-2",
    title: "Passo 1: Acesse Documentos Necessários",
    content: "Clique aqui no menu 'Documentos Necessários'.",
    target: "[data-tour='menu-documentos-necessarios']",
    placement: "right",
  },
  {
    id: "docs-3",
    title: "Passo 2: Veja a Lista",
    content: "Você verá uma lista com ☐ para pendentes e ✓ para enviados. Os obrigatórios são marcados com (obrigatório).",
    placement: "center",
  },
  {
    id: "docs-4",
    title: "Passo 3: Fazer Upload",
    content: "Clique no botão 'Fazer Upload' ao lado do documento que deseja enviar. Arraste o arquivo PDF ou clique para selecionar.",
    placement: "center",
  },
  {
    id: "docs-5",
    title: "Passo 4: Aguardar Análise",
    content: "Após enviar, o status muda para 'Aguardando análise'. O consultor vai revisar e aprovar ou solicitar correção.",
    placement: "center",
  },
  {
    id: "docs-6",
    title: "Pronto!",
    content: "É simples assim! Envie todos os documentos solicitados para o projeto avançar. Dúvidas? Fale com seu consultor.",
    placement: "center",
  },
];

// TUTORIAL ESPECÍFICO: Como responder Diagnóstico (Cliente)
export const comoResponderDiagnostico: TutorialStep[] = [
  {
    id: "diag-1",
    title: "Como Responder o Diagnóstico",
    content: "O diagnóstico de governança tem 50 perguntas divididas em 5 etapas. Vou te mostrar como responder.",
    placement: "center",
  },
  {
    id: "diag-2",
    title: "Acessar Diagnósticos",
    content: "Vá em 'Diagnósticos' no menu lateral.",
    target: "[data-tour='menu-diagnosticos']",
    placement: "right",
  },
  {
    id: "diag-3",
    title: "Iniciar o Questionário",
    content: "Clique em 'Iniciar' no card do Diagnóstico de Governança.",
    placement: "center",
  },
  {
    id: "diag-4",
    title: "Responder as Perguntas",
    content: "Cada pergunta tem 3 opções:\n• Sim = Você tem isso implementado\n• Parcialmente = Tem mas não completo\n• Não = Não tem\n\nSeja honesto! Isso ajuda a criar um plano personalizado.",
    placement: "center",
  },
  {
    id: "diag-5",
    title: "Pode Pausar",
    content: "Não precisa responder tudo de uma vez! Você pode salvar e continuar depois. O progresso é salvo automaticamente.",
    placement: "center",
  },
  {
    id: "diag-6",
    title: "Resultado Automático",
    content: "Ao terminar, o sistema calcula automaticamente seu score e nível de maturidade em governança. Você verá um gráfico radar com as 5 dimensões.",
    placement: "center",
  },
  {
    id: "diag-7",
    title: "Concluído!",
    content: "Após o diagnóstico, o consultor agendará uma reunião para apresentar os resultados e o plano de ação. Boa sorte!",
    placement: "center",
  },
];

// TUTORIAL ESPECÍFICO: Como gerar documentos com IA (Consultor)
export const comoGerarDocumentosIA: TutorialStep[] = [
  {
    id: "ia-1",
    title: "Geração de Documentos com IA",
    content: "Vou te mostrar como usar a IA para gerar Código de Ética, políticas e outros documentos automaticamente!",
    placement: "center",
  },
  {
    id: "ia-2",
    title: "Acessar Projeto do Cliente",
    content: "Entre no projeto do cliente em: Projetos → Selecione o cliente → Documentos",
    placement: "center",
  },
  {
    id: "ia-3",
    title: "Escolher Documento",
    content: "Clique em um dos botões:\n• Gerar Código de Ética\n• Gerar Política Anticorrupção\n• Gerar Política de Conflito de Interesses\netc.",
    placement: "center",
  },
  {
    id: "ia-4",
    title: "IA Gera o Documento",
    content: "A IA usa GPT-4 para gerar um documento completo e personalizado baseado em:\n• Dados cadastrais do cliente\n• Respostas do diagnóstico\n• Segmento de atuação\n• Número de funcionários",
    placement: "center",
  },
  {
    id: "ia-5",
    title: "Revisar e Ajustar",
    content: "IMPORTANTE: Sempre revise o documento gerado! A IA é boa mas você é o especialista. Faça os ajustes necessários.",
    placement: "center",
  },
  {
    id: "ia-6",
    title: "Enviar para Aprovação",
    content: "Após revisar, clique em 'Enviar para Aprovação'. O cliente receberá uma notificação e poderá aprovar ou solicitar revisões.",
    placement: "center",
  },
  {
    id: "ia-7",
    title: "Publicar",
    content: "Após aprovação do cliente, clique em 'Publicar'. O documento será salvo no Google Drive e ficará disponível para todos.",
    placement: "center",
  },
  {
    id: "ia-8",
    title: "Pronto!",
    content: "Economize horas de trabalho! Use a IA para gerar documentos e foque em análises estratégicas. A IA é sua parceira!",
    placement: "center",
  },
];

// Função helper para pegar tutorial baseado no perfil
export function getTutorialForRole(role: string): TutorialStep[] {
  switch (role) {
    case "admin":
    case "consultor":
      return consultorOnboarding;
    case "cliente":
    case "parceiro":
      return clienteOnboarding;
    case "colaborador":
      return colaboradorOnboarding;
    default:
      return clienteOnboarding;
  }
}

export const tutorials = {
  consultorOnboarding,
  clienteOnboarding,
  colaboradorOnboarding,
  comoEnviarDocumentos,
  comoResponderDiagnostico,
  comoGerarDocumentosIA,
};
