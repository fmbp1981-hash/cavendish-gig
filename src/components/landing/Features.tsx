import { 
  FileText, 
  Shield, 
  BarChart3, 
  Bot, 
  Calendar, 
  Users,
  CheckCircle2 
} from "lucide-react";

const features = [
  {
    icon: Bot,
    title: "Atas Automáticas com IA",
    description: "Transcreva reuniões e gere atas com decisões, responsáveis e prazos automaticamente.",
    highlights: ["Integração Fireflies", "Extração inteligente", "Tarefas automáticas"],
  },
  {
    icon: FileText,
    title: "Documentos Inteligentes",
    description: "Gere códigos de ética, contratos e relatórios com templates personalizados e IA.",
    highlights: ["Templates prontos", "Geração com LLM", "PDFs estilizados"],
  },
  {
    icon: BarChart3,
    title: "Diagnóstico de Maturidade",
    description: "Avalie o nível de governança da empresa com matriz de riscos e relatórios detalhados.",
    highlights: ["Matriz de riscos", "Scores visuais", "Planos de ação"],
  },
  {
    icon: Shield,
    title: "Canal de Denúncias",
    description: "Canal público e anônimo com garantia técnica de impossibilidade de identificação.",
    highlights: ["100% anônimo", "Sem rastreamento", "Compliance LGPD"],
  },
  {
    icon: Calendar,
    title: "Rituais Recorrentes",
    description: "Automatize o ciclo mensal de governança com agendamentos e follow-ups.",
    highlights: ["Google Calendar", "Lembretes auto", "Relatórios mensais"],
  },
  {
    icon: Users,
    title: "Portal do Cliente",
    description: "Dashboard exclusivo para acompanhar evolução, documentos e tarefas pendentes.",
    highlights: ["Visão em tempo real", "Acesso seguro", "Métricas claras"],
  },
];

const Features = () => {
  return (
    <section id="solution" className="py-20 lg:py-32 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block text-sm font-semibold text-primary uppercase tracking-wider mb-4">
            Solução Completa
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Tudo que você precisa para uma{" "}
            <span className="text-gradient-primary">gestão exemplar</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Automatize processos, gere entregáveis de valor e acompanhe a evolução 
            da governança corporativa com uma única plataforma.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-6 lg:p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/20 hover:shadow-lg transition-all duration-300"
            >
              {/* Icon */}
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/15 transition-colors">
                <feature.icon className="w-7 h-7 text-primary" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground mb-5">
                {feature.description}
              </p>

              {/* Highlights */}
              <ul className="space-y-2">
                {feature.highlights.map((highlight, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-secondary shrink-0" />
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
