import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface TourSuggestionProps {
  pageKey: string;
  title?: string;
  description?: string;
  onStartTour: () => void;
}

export function TourSuggestion({
  pageKey,
  title = "Primeira vez aqui?",
  description = "Que tal fazer um tour rápido para conhecer as funcionalidades?",
  onStartTour,
}: TourSuggestionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const storageKey = `tour-suggestion-dismissed-${pageKey}`;

  useEffect(() => {
    const isDismissed = localStorage.getItem(storageKey);
    const isFirstVisit = !localStorage.getItem(`visited-${pageKey}`);

    if (!isDismissed && isFirstVisit) {
      // Show suggestion after a brief delay
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }

    // Mark as visited
    localStorage.setItem(`visited-${pageKey}`, "true");
  }, [pageKey, storageKey]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(storageKey, "true");
  };

  const handleStartTour = () => {
    setIsVisible(false);
    localStorage.setItem(storageKey, "true");
    localStorage.setItem(`visited-${pageKey}`, "true");
    onStartTour();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-24 right-6 z-40 animate-slide-up">
      <Card className="w-80 shadow-lg border-primary/20">
        <CardContent className="pt-5 pb-4 px-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <h4 className="font-semibold text-sm">{title}</h4>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 -mt-1"
              onClick={handleDismiss}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mb-4">{description}</p>

          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleStartTour}
              className="flex-1 h-8"
            >
              Iniciar Tour
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-8"
            >
              Agora não
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
