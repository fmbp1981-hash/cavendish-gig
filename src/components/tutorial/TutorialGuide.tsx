import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { X, ChevronRight, ChevronLeft, SkipForward } from "lucide-react";
import { useTutorial, TutorialStep } from "@/hooks/useTutorial";
import { cn } from "@/lib/utils";

interface TutorialGuideProps {
  steps: TutorialStep[];
  tutorialType: string;
  onComplete?: () => void;
}

export function TutorialGuide({ steps, tutorialType, onComplete }: TutorialGuideProps) {
  const {
    isActive,
    currentStepIndex,
    nextStep,
    previousStep,
    skipTutorial,
    stopTutorial,
    isCompleted,
  } = useTutorial(tutorialType);

  const [targetPosition, setTargetPosition] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  const currentStep = steps[currentStepIndex];

  useEffect(() => {
    if (!isActive || !currentStep?.target) {
      setTargetPosition(null);
      return;
    }

    const element = document.querySelector(currentStep.target);
    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetPosition({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });

      // Scroll into view
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      setTargetPosition(null);
    }
  }, [isActive, currentStep, currentStepIndex]);

  if (!isActive || isCompleted) {
    return null;
  }

  const handleNext = async () => {
    await nextStep(steps);
    if (currentStepIndex === steps.length - 1) {
      onComplete?.();
    }
  };

  const handleSkip = async () => {
    await skipTutorial();
    onComplete?.();
  };

  const getTooltipPosition = () => {
    if (!targetPosition || !currentStep.placement || currentStep.placement === "center") {
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };
    }

    const offset = 20; // Espaço entre o tooltip e o elemento

    switch (currentStep.placement) {
      case "top":
        return {
          top: `${targetPosition.top - offset}px`,
          left: `${targetPosition.left + targetPosition.width / 2}px`,
          transform: "translate(-50%, -100%)",
        };
      case "bottom":
        return {
          top: `${targetPosition.top + targetPosition.height + offset}px`,
          left: `${targetPosition.left + targetPosition.width / 2}px`,
          transform: "translate(-50%, 0)",
        };
      case "left":
        return {
          top: `${targetPosition.top + targetPosition.height / 2}px`,
          left: `${targetPosition.left - offset}px`,
          transform: "translate(-100%, -50%)",
        };
      case "right":
        return {
          top: `${targetPosition.top + targetPosition.height / 2}px`,
          left: `${targetPosition.left + targetPosition.width + offset}px`,
          transform: "translate(0, -50%)",
        };
      default:
        return {
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        };
    }
  };

  return (
    <>
      {/* Overlay escuro */}
      <div
        className="fixed inset-0 bg-black/60 z-[9998]"
        onClick={stopTutorial}
      />

      {/* Highlight do elemento alvo */}
      {targetPosition && (
        <div
          className="fixed border-4 border-primary rounded-lg pointer-events-none z-[9999] transition-all duration-300"
          style={{
            top: targetPosition.top,
            left: targetPosition.left,
            width: targetPosition.width,
            height: targetPosition.height,
          }}
        />
      )}

      {/* Tooltip/Card do tutorial */}
      <div
        className="fixed z-[10000] transition-all duration-300"
        style={getTooltipPosition()}
      >
        <Card className="w-[400px] shadow-2xl">
          <CardHeader className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-2 h-6 w-6 p-0"
              onClick={stopTutorial}
            >
              <X className="h-4 w-4" />
            </Button>
            <CardTitle className="text-lg pr-8">{currentStep.title}</CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{
                    width: `${((currentStepIndex + 1) / steps.length) * 100}%`,
                  }}
                />
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {currentStepIndex + 1} de {steps.length}
              </span>
            </div>
          </CardHeader>

          <CardContent>
            <p className="text-sm text-foreground whitespace-pre-line">
              {currentStep.content}
            </p>
          </CardContent>

          <CardFooter className="flex justify-between">
            <div className="flex gap-2">
              {currentStep.skipable !== false && (
                <Button variant="ghost" size="sm" onClick={handleSkip}>
                  <SkipForward className="h-4 w-4 mr-1" />
                  Pular Tutorial
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              {currentStepIndex > 0 && (
                <Button variant="outline" size="sm" onClick={previousStep}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
              )}

              <Button size="sm" onClick={handleNext}>
                {currentStepIndex === steps.length - 1 ? (
                  "Finalizar"
                ) : (
                  <>
                    Próximo
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
