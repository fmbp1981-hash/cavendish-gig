import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield } from "lucide-react";

const CTA = () => {
  return (
    <section id="contact" className="py-20 lg:py-32 bg-sidebar relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative">
        <div className="max-w-3xl mx-auto text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-sidebar-primary/20 mb-8">
            <Shield className="w-8 h-8 text-sidebar-primary" />
          </div>

          {/* Headline */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-sidebar-foreground mb-6">
            Pronto para elevar a governança da sua empresa?
          </h2>

          {/* Subtext */}
          <p className="text-lg text-sidebar-foreground/70 mb-10 max-w-2xl mx-auto">
            Junte-se a dezenas de empresas que já transformaram sua gestão com o 
            Cavendish GIG. Comece hoje com uma demonstração gratuita.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/auth?mode=register">
              <Button size="xl" className="bg-sidebar-primary hover:bg-sidebar-primary/90 text-sidebar-primary-foreground shadow-lg group">
                Agendar demonstração
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <a href="mailto:contato@cavendish.com.br">
              <Button 
                variant="outline" 
                size="xl" 
                className="border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                Falar com especialista
              </Button>
            </a>
          </div>

          {/* Trust Badges */}
          <div className="flex items-center justify-center gap-6 mt-12 text-sidebar-foreground/50 text-sm">
            <span>✓ Sem cartão de crédito</span>
            <span>✓ Setup em 24h</span>
            <span>✓ Cancelamento fácil</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
