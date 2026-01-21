import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import {
  HelpCircle,
  BookOpen,
  PlayCircle,
  Video,
  MessageCircle,
  RotateCcw,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useTutorial } from "@/hooks/useTutorial";
import {
  consultorOnboarding,
  clienteOnboarding,
  comoEnviarDocumentos,
  comoResponderDiagnostico,
  comoGerarDocumentosIA,
} from "@/config/tutorials";

export function HelpButton() {
  const { isAdmin, isConsultor, isCliente } = useAuth();
  const navigate = useNavigate();
  const { startTutorial, stopTutorial } = useTutorial("onboarding");
  const [isOpen, setIsOpen] = useState(false);

  const handleRestartMainTour = () => {
    stopTutorial();
    if (isAdmin || isConsultor) {
      startTutorial(consultorOnboarding);
    } else if (isCliente) {
      startTutorial(clienteOnboarding);
    }
    setIsOpen(false);
  };

  const handleStartSpecificTutorial = (steps: any[]) => {
    stopTutorial();
    startTutorial(steps);
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-primary text-primary-foreground hover:bg-primary/90 border-0"
          aria-label="Central de Ajuda"
        >
          <HelpCircle className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-64 animate-scale-in"
        sideOffset={8}
      >
        <DropdownMenuLabel className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-primary" />
          Central de Ajuda
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Reiniciar Tour Principal */}
        <DropdownMenuItem onClick={handleRestartMainTour} className="cursor-pointer">
          <RotateCcw className="h-4 w-4 mr-2" />
          Reiniciar Tour Completo
        </DropdownMenuItem>

        {/* Tutoriais Específicos */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="cursor-pointer">
            <PlayCircle className="h-4 w-4 mr-2" />
            Tutoriais Específicos
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-56">
            {(isAdmin || isConsultor) && (
              <>
                <DropdownMenuItem
                  onClick={() =>
                    handleStartSpecificTutorial(comoGerarDocumentosIA)
                  }
                  className="cursor-pointer"
                >
                  <Video className="h-4 w-4 mr-2" />
                  Como Gerar Documentos com IA
                </DropdownMenuItem>
              </>
            )}
            {isCliente && (
              <>
                <DropdownMenuItem
                  onClick={() =>
                    handleStartSpecificTutorial(comoEnviarDocumentos)
                  }
                  className="cursor-pointer"
                >
                  <Video className="h-4 w-4 mr-2" />
                  Como Enviar Documentos
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    handleStartSpecificTutorial(comoResponderDiagnostico)
                  }
                  className="cursor-pointer"
                >
                  <Video className="h-4 w-4 mr-2" />
                  Como Responder Diagnóstico
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        {/* Manual do Usuário */}
        <DropdownMenuItem
          onClick={() => {
            navigate("/help");
            setIsOpen(false);
          }}
          className="cursor-pointer"
        >
          <BookOpen className="h-4 w-4 mr-2" />
          Manual do Usuário
        </DropdownMenuItem>

        {/* Contatar Suporte */}
        <DropdownMenuItem
          onClick={() => {
            window.open("https://wa.me/5511999999999?text=Olá, preciso de ajuda com o Sistema GIG", "_blank");
            setIsOpen(false);
          }}
          className="cursor-pointer"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Contatar Suporte
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
