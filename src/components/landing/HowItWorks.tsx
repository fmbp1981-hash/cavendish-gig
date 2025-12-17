import { ArrowRight } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Onboarding Inteligente",
    description: "Preencha um formulário rápido e nossa plataforma cria automaticamente a estrutura do projeto: pastas no Drive, contrato gerado e kickoff agendado.",
  },
  {
    number: "02",
    title: "Diagnóstico & Planejamento",
    description: "Execute o diagnóstico de maturidade, identifique riscos e crie um plano de ação personalizado com prazos e responsáveis.",
  },
  {
    number: "03",
    title: "Execução Automatizada",
    description: "Reuniões são transcritas, atas geradas com IA, tarefas criadas automaticamente e documentos arquivados de forma segura.",
  },
  {
    number: "04",
    title: "Acompanhamento Contínuo",
    description: "Dashboard em tempo real com evolução da governança, relatórios mensais e alertas para manter o compliance em dia.",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-20 lg:py-32 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block text-sm font-semibold text-primary uppercase tracking-wider mb-4">
            Como Funciona
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Da contratação aos resultados em{" "}
            <span className="text-gradient-primary">4 passos simples</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Um processo estruturado que transforma a complexidade da governança 
            em entregáveis tangíveis e mensuráveis.
          </p>
        </div>

        {/* Steps */}
        <div className="max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="absolute left-6 top-16 w-0.5 h-16 bg-border hidden md:block" />
              )}

              <div className="flex gap-6 mb-8 group">
                {/* Step Number */}
                <div className="shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                    {step.number}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 pb-8 border-b border-border/50 last:border-0">
                  <h3 className="text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
                    {step.title}
                    <ArrowRight className="w-4 h-4 text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
