import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HelpCircle, PlayCircle, Clock } from "lucide-react";
import { useTour } from "@/contexts/TourContext";
import { getToursByRole } from "@/config/tourDefinitions";

interface TutorialHelpButtonProps {
  userRole?: string;
}

export function TutorialHelpButton({ userRole = "cliente" }: TutorialHelpButtonProps) {
  const { startTour } = useTour();
  const availableTours = getToursByRole(userRole);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          title="Ajuda e Tutoriais"
        >
          <HelpCircle className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-sidebar-primary rounded-full" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="flex items-center gap-2">
          <PlayCircle className="h-4 w-4 text-primary" />
          Tours Interativos
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {availableTours.map((tour) => (
          <DropdownMenuItem
            key={tour.key}
            onClick={() => startTour(tour.key)}
            className="cursor-pointer py-3"
          >
            <div className="flex items-start gap-3 w-full">
              <span className="text-lg leading-none mt-0.5">{tour.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{tour.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {tour.description}
                </p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  ~{tour.estimatedMinutes} min
                </p>
              </div>
            </div>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />
        <div className="px-2 py-1.5">
          <p className="text-xs text-muted-foreground">
            💡 Os tours guiam você pelo sistema passo a passo, navegando pelas seções automaticamente.
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
