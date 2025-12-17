import { Button } from "@/components/ui/button";
import { Check, Star } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Essencial",
    description: "Para empresas iniciando a jornada de governança",
    price: "1.997",
    period: "/mês",
    features: [
      "Diagnóstico de maturidade",
      "Código de ética básico",
      "Canal de denúncias anônimo",
      "1 reunião mensal",
      "Portal do cliente",
      "Suporte por email",
    ],
    cta: "Começar agora",
    popular: false,
  },
  {
    name: "Executivo",
    description: "Para empresas que buscam excelência operacional",
    price: "3.997",
    period: "/mês",
    features: [
      "Tudo do Essencial +",
      "Atas automáticas com IA",
      "Matriz de riscos completa",
      "Integração ClickUp/Trello",
      "2 reuniões mensais",
      "Relatórios automatizados",
      "Suporte prioritário",
    ],
    cta: "Escolher Executivo",
    popular: true,
  },
  {
    name: "Premium",
    description: "Governança completa com acompanhamento dedicado",
    price: "7.997",
    period: "/mês",
    features: [
      "Tudo do Executivo +",
      "Consultor dedicado",
      "Treinamentos ilimitados",
      "Certificados automáticos",
      "White-label disponível",
      "4 reuniões mensais",
      "SLA garantido",
      "Suporte 24/7",
    ],
    cta: "Falar com especialista",
    popular: false,
  },
];

const Plans = () => {
  return (
    <section id="plans" className="py-20 lg:py-32 bg-surface-sunken">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block text-sm font-semibold text-primary uppercase tracking-wider mb-4">
            Planos & Preços
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Escolha o plano ideal para sua empresa
          </h2>
          <p className="text-lg text-muted-foreground">
            Todos os planos incluem acesso completo à plataforma, 
            integrações e suporte técnico.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative p-6 lg:p-8 rounded-2xl transition-all duration-300 ${
                plan.popular
                  ? "bg-card border-2 border-primary shadow-lg shadow-primary/10 scale-[1.02] lg:scale-105"
                  : "bg-card border border-border/50 hover:border-primary/20 hover:shadow-md"
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-semibold shadow-md">
                    <Star className="w-4 h-4 fill-current" />
                    Mais popular
                  </span>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
                <p className="text-muted-foreground text-sm mb-6">{plan.description}</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-sm text-muted-foreground">R$</span>
                  <span className="text-4xl lg:text-5xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Check className={`w-5 h-5 shrink-0 mt-0.5 ${plan.popular ? 'text-primary' : 'text-secondary'}`} />
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link to="/auth?mode=register" className="block">
                <Button
                  variant={plan.popular ? "hero" : "outline"}
                  size="lg"
                  className="w-full"
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>

        {/* Bottom Note */}
        <p className="text-center text-sm text-muted-foreground mt-12">
          Todos os preços em Reais (BRL). Pagamento mensal ou anual com desconto.
        </p>
      </div>
    </section>
  );
};

export default Plans;
