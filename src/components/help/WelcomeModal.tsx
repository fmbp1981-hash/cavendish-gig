import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sparkles, Award, Target } from "lucide-react";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTour: () => void;
  userRole: "admin" | "consultor" | "cliente";
}

const roleConfig = {
  admin: {
    title: "Bem-vindo ao Sistema GIG!",
    subtitle: "Você agora tem acesso total como Administrador",
    features: [
      {
        icon: Award,
        title: "Gestão Completa",
        description: "Gerencie usuários, organizações e configurações do sistema",
      },
      {
        icon: Target,
        title: "Integrações",
        description: "Configure integrações com Google Drive, IA e muito mais",
      },
      {
        icon: Sparkles,
        title: "Branding",
        description: "Personalize o sistema com a identidade visual dos clientes",
      },
    ],
  },
  consultor: {
    title: "Bem-vindo ao Sistema GIG!",
    subtitle: "Sua plataforma de Governança e Compliance",
    features: [
      {
        icon: Award,
        title: "Gestão de Clientes",
        description: "Gerencie múltiplos clientes e acompanhe seus projetos",
      },
      {
        icon: Target,
        title: "IA Integrada",
        description: "Gere documentos, atas e relatórios automaticamente",
      },
      {
        icon: Sparkles,
        title: "Automação",
        description: "Tarefas, reuniões e relatórios mensais automáticos",
      },
    ],
  },
  cliente: {
    title: "Bem-vindo ao seu Portal GIG!",
    subtitle: "Sua central de Governança Corporativa",
    features: [
      {
        icon: Award,
        title: "Acompanhamento",
        description: "Veja o progresso do seu projeto em tempo real",
      },
      {
        icon: Target,
        title: "Documentos",
        description: "Envie documentos e acompanhe a análise do consultor",
      },
      {
        icon: Sparkles,
        title: "Treinamentos",
        description: "Gerencie treinamentos dos seus colaboradores",
      },
    ],
  },
};

export function WelcomeModal({
  isOpen,
  onClose,
  onStartTour,
  userRole,
}: WelcomeModalProps) {
  const config = roleConfig[userRole] || roleConfig.cliente;

  const handleStartTour = () => {
    onClose();
    onStartTour();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            {config.title}
          </DialogTitle>
          <DialogDescription className="text-center text-base mt-2">
            {config.subtitle}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-6">
          {config.features.map((feature, index) => (
            <div
              key={index}
              className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">{feature.title}</h4>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Explorar por conta própria
          </Button>
          <Button onClick={handleStartTour} className="flex-1">
            <Sparkles className="h-4 w-4 mr-2" />
            Fazer Tour Guiado (5 min)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
