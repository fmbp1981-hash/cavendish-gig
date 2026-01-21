import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Palette } from "lucide-react";
import { predefinedPalettes } from "@/lib/colorUtils";
import { cn } from "@/lib/utils";

interface ColorPalette {
  primary: { hex: string; hsl: string };
  secondary: { hex: string; hsl: string };
  accent: { hex: string; hsl: string };
}

interface PaletteSelectorProps {
  onSelectPalette: (palette: ColorPalette) => void;
  selectedPalette?: ColorPalette;
}

export function PaletteSelector({ onSelectPalette, selectedPalette }: PaletteSelectorProps) {
  const isPaletteSelected = (palette: ColorPalette) => {
    return (
      selectedPalette?.primary.hex === palette.primary.hex &&
      selectedPalette?.secondary.hex === palette.secondary.hex &&
      selectedPalette?.accent.hex === palette.accent.hex
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Palette className="h-4 w-4 text-primary" />
          Paletas Pré-Definidas
        </CardTitle>
        <CardDescription className="text-xs">
          Escolha uma paleta profissional pronta para usar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {Object.entries(predefinedPalettes).map(([key, palette]) => (
          <button
            key={key}
            onClick={() => onSelectPalette(palette)}
            className={cn(
              "w-full p-3 rounded-lg border-2 transition-all hover:shadow-md text-left",
              isPaletteSelected(palette)
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            )}
          >
            <div className="flex items-center gap-3">
              <div className="flex gap-1 flex-1">
                <div
                  className="h-10 flex-1 rounded"
                  style={{ backgroundColor: palette.primary.hex }}
                  title={`Primary: ${palette.primary.hex}`}
                />
                <div
                  className="h-10 flex-1 rounded"
                  style={{ backgroundColor: palette.secondary.hex }}
                  title={`Secondary: ${palette.secondary.hex}`}
                />
                <div
                  className="h-10 flex-1 rounded"
                  style={{ backgroundColor: palette.accent.hex }}
                  title={`Accent: ${palette.accent.hex}`}
                />
              </div>

              {isPaletteSelected(palette) && (
                <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mt-2">
              <span className="text-sm font-medium">{palette.name}</span>
              <div className="flex gap-2 text-xs text-muted-foreground">
                <span>Principal</span>
                <span>•</span>
                <span>Secundária</span>
                <span>•</span>
                <span>Destaque</span>
              </div>
            </div>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}
