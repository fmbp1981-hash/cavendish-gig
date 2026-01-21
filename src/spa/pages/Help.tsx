import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  BookOpen,
  Video,
  MessageCircle,
  ArrowLeft,
  FileText,
  Users,
  Settings,
  BarChart,
  Shield,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function Help() {
  const navigate = useNavigate();
  const { isAdmin, isConsultor, isCliente } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const adminTopics = [
    {
      icon: Users,
      title: "Gestão de Usuários",
      description: "Como adicionar, editar e gerenciar usuários e permissões",
      path: "/help/admin/gestao-usuarios",
    },
    {
      icon: Settings,
      title: "Configurações do Sistema",
      description: "Configure integrações, branding e parâmetros globais",
      path: "/help/admin/configuracoes",
    },
    {
      icon: Shield,
      title: "Segurança e Permissões",
      description: "Gerenciar roles, políticas de acesso e auditoria",
      path: "/help/admin/seguranca",
    },
    {
      icon: Sparkles,
      title: "Branding e Personalização",
      description: "Personalize o sistema com a identidade visual dos clientes",
      path: "/help/admin/branding",
    },
  ];

  const consultorTopics = [
    {
      icon: Users,
      title: "Gerenciar Clientes",
      description: "Como adicionar clientes, criar projetos e acompanhar progresso",
      path: "/help/consultor/gerenciar-clientes",
    },
    {
      icon: Sparkles,
      title: "Gerar Documentos com IA",
      description: "Use IA para criar Código de Ética, políticas e outros documentos",
      path: "/help/consultor/gerar-documentos-ia",
    },
    {
      icon: FileText,
      title: "Atas Automáticas",
      description: "Como gerar atas de reunião automaticamente com IA",
      path: "/help/consultor/atas-automaticas",
    },
    {
      icon: BarChart,
      title: "Relatórios Mensais",
      description: "Sistema de relatórios automáticos e envio por email",
      path: "/help/consultor/relatorios",
    },
  ];

  const clienteTopics = [
    {
      icon: FileText,
      title: "Enviar Documentos",
      description: "Como fazer upload dos documentos solicitados",
      path: "/help/cliente/enviar-documentos",
    },
    {
      icon: BarChart,
      title: "Responder Diagnóstico",
      description: "Como responder o questionário de governança (50 perguntas)",
      path: "/help/cliente/responder-diagnostico",
    },
    {
      icon: Users,
      title: "Gerenciar Treinamentos",
      description: "Como cadastrar colaboradores e acompanhar treinamentos",
      path: "/help/cliente/treinamentos",
    },
    {
      icon: MessageCircle,
      title: "Canal de Denúncias",
      description: "Como funciona o canal de denúncias anônimas",
      path: "/help/cliente/canal-denuncias",
    },
  ];

  const topics = isAdmin
    ? adminTopics
    : isConsultor
    ? consultorTopics
    : clienteTopics;

  const faqs = [
    {
      question: "Como resetar minha senha?",
      answer:
        "Clique em 'Esqueceu a senha?' na tela de login e siga as instruções enviadas por email.",
    },
    {
      question: "Posso acessar o sistema pelo celular?",
      answer:
        "Sim! O Sistema GIG é responsivo e funciona perfeitamente em smartphones e tablets.",
    },
    {
      question: "Como entro em contato com o suporte?",
      answer:
        'Clique no botão "?" no canto inferior direito e selecione "Contatar Suporte".',
    },
    {
      question: "Os dados estão seguros?",
      answer:
        "Sim! Todos os dados são criptografados e armazenados de forma segura no Supabase com backup automático.",
    },
  ];

  const filteredTopics = topics.filter(
    (topic) =>
      topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container max-w-5xl mx-auto py-6 px-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>

          <div className="flex items-center gap-4 mb-6">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Central de Ajuda</h1>
              <p className="text-muted-foreground">
                Tudo que você precisa saber sobre o Sistema GIG
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por tópicos, tutoriais..."
              className="pl-10 h-11"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-5xl mx-auto py-8 px-6">
        <Tabs defaultValue="topics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="topics">Tópicos</TabsTrigger>
            <TabsTrigger value="videos">Vídeos</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
          </TabsList>

          {/* Topics Tab */}
          <TabsContent value="topics" className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Tópicos Principais</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {filteredTopics.map((topic, index) => (
                <Card
                  key={index}
                  className="cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/50"
                  onClick={() => navigate(topic.path)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <topic.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base mb-1">
                          {topic.title}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {topic.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Videos Tab */}
          <TabsContent value="videos" className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Vídeos Tutoriais</h2>
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Video className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">Em breve!</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Estamos preparando vídeos tutoriais completos para você.
                    Enquanto isso, explore os tutoriais interativos clicando no
                    botão "?" no canto inferior direito.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FAQ Tab */}
          <TabsContent value="faq" className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">
              Perguntas Frequentes
            </h2>
            <div className="space-y-3">
              {faqs.map((faq, index) => (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">
                      {faq.question}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground">
                      {faq.answer}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Contact Support */}
        <Card className="mt-8 bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageCircle className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">
                  Não encontrou o que procura?
                </h3>
                <p className="text-sm text-muted-foreground">
                  Entre em contato com nosso suporte. Estamos aqui para ajudar!
                </p>
              </div>
              <Button
                onClick={() =>
                  window.open(
                    "https://wa.me/5511999999999?text=Olá, preciso de ajuda com o Sistema GIG",
                    "_blank"
                  )
                }
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Falar com Suporte
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
