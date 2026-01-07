import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HelpCircle, PlayCircle, BookOpen, FileText, Bot, Users } from "lucide-react";
import { TutorialGuide } from "./TutorialGuide";
import { tutorials } from "@/config/tutorials";
import { useTutorial } from "@/hooks/useTutorial";

interface TutorialOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  steps: any[];
  roles: string[]; // Perfis que podem ver este tutorial
}

const tutorialOptions: TutorialOption[] = [
  {
    id: "onboarding",
    title: "Tour de Boas-vindas",
    description: "Conheça as principais funcionalidades do sistema",
    icon: <PlayCircle className="h-4 w-4" />,
    steps: [], // Será preenchido dinamicamente baseado no perfil
    roles: ["admin", "consultor", "cliente", "colaborador"],
  },
  {
    id: "enviar-documentos",
    title: "Como Enviar Documentos",
    description: "Aprenda a fazer upload dos documentos solicitados",
    icon: <FileText className="h-4 w-4" />,
    steps: tutorials.comoEnviarDocumentos,
    roles: ["cliente"],
  },
  {
    id: "responder-diagnostico",
    title: "Como Responder Diagnóstico",
    description: "Guia completo para preencher o questionário de governança",
    icon: <BookOpen className="h-4 w-4" />,
    steps: tutorials.comoResponderDiagnostico,
    roles: ["cliente"],
  },
  {
    id: "gerar-documentos-ia",
    title: "Gerar Documentos com IA",
    description: "Aprenda a usar a IA para gerar políticas e códigos",
    icon: <Bot className="h-4 w-4" />,
    steps: tutorials.comoGerarDocumentosIA,
    roles: ["admin", "consultor"],
  },
];

interface TutorialHelpButtonProps {
  userRole?: string;
}

export function TutorialHelpButton({ userRole = "cliente" }: TutorialHelpButtonProps) {
  const [selectedTutorial, setSelectedTutorial] = useState<TutorialOption | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const onboardingTutorial = useTutorial("onboarding");

  // Determinar qual tutorial de onboarding usar baseado no perfil
  const getOnboardingSteps = () => {
    switch (userRole) {
      case "admin":
      case "consultor":
        return tutorials.consultorOnboarding;
      case "colaborador":
        return tutorials.colaboradorOnboarding;
      default:
        return tutorials.clienteOnboarding;
    }
  };

  const handleSelectTutorial = (tutorial: TutorialOption) => {
    setSelectedTutorial(tutorial);
    setShowDialog(false);

    // Iniciar tutorial
    if (tutorial.id === "onboarding") {
      onboardingTutorial.resetTutorial();
      setTimeout(() => {
        onboardingTutorial.startTutorial(getOnboardingSteps());
      }, 100);
    }
  };

  const availableTutorials = tutorialOptions.filter((t) =>
    t.roles.includes(userRole)
  );

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            title="Ajuda e Tutoriais"
          >
            <HelpCircle className="h-5 w-5" />
            {!onboardingTutorial.isCompleted && (
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full animate-pulse" />
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Ajuda e Tutoriais</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {availableTutorials.map((tutorial) => (
            <DropdownMenuItem
              key={tutorial.id}
              onClick={() => handleSelectTutorial(tutorial)}
              className="cursor-pointer"
            >
              <div className="flex items-start gap-3 w-full">
                <div className="mt-0.5">{tutorial.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{tutorial.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {tutorial.description}
                  </p>
                </div>
              </div>
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => setShowDialog(true)}>
            <Users className="h-4 w-4 mr-2" />
            Ver Todos os Tutoriais
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Tutorial Guide */}
      {selectedTutorial && (
        <TutorialGuide
          steps={
            selectedTutorial.id === "onboarding"
              ? getOnboardingSteps()
              : selectedTutorial.steps
          }
          tutorialType={selectedTutorial.id}
          onComplete={() => setSelectedTutorial(null)}
        />
      )}

      {/* Dialog com lista completa */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tutoriais Disponíveis</DialogTitle>
            <DialogDescription>
              Escolha um tutorial para aprender sobre uma funcionalidade específica
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 py-4">
            {availableTutorials.map((tutorial) => (
              <Button
                key={tutorial.id}
                variant="outline"
                className="h-auto py-4 justify-start text-left"
                onClick={() => handleSelectTutorial(tutorial)}
              >
                <div className="flex items-start gap-3 w-full">
                  <div className="mt-1">{tutorial.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{tutorial.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {tutorial.description}
                    </p>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
