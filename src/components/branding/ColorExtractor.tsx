import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles, Check } from "lucide-react";
import { extractColorsFromImage, hexToHSL, generateColorPalettes } from "@/lib/colorUtils";
import { cn } from "@/lib/utils";

interface ColorPalette {
  primary: { hex: string; hsl: string };
  secondary: { hex: string; hsl: string };
  accent: { hex: string; hsl: string };
}

interface ColorExtractorProps {
  logoUrl: string;
  onSelectPalette: (palette: ColorPalette) => void;
  selectedPalette?: ColorPalette;
}

export function ColorExtractor({ logoUrl, onSelectPalette, selectedPalette }: ColorExtractorProps) {
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedColors, setExtractedColors] = useState<string[]>([]);
  const [suggestedPalettes, setSuggestedPalettes] = useState<ColorPalette[]>([]);
  const [error, setError] = useState<string | null>(null);

  const extractColors = useCallback(async () => {
    setIsExtracting(true);
    setError(null);

    try {
      const colors = await extractColorsFromImage(logoUrl);
      setExtractedColors(colors);

      // Gera 3 paletas sugeridas baseadas nas cores dominantes
      const palettes = colors.slice(0, 3).map((color) => generateColorPalettes(color));
      setSuggestedPalettes(palettes);
    } catch (err) {
      console.error("Erro ao extrair cores:", err);
      setError("Não foi possível extrair cores da imagem. Tente outra imagem.");
    } finally {
      setIsExtracting(false);
    }
  }, [logoUrl]);

  useEffect(() => {
    if (logoUrl) {
      extractColors();
    }
  }, [logoUrl, extractColors]);

  const isPaletteSelected = (palette: ColorPalette) => {
    return (
      selectedPalette?.primary.hex === palette.primary.hex &&
      selectedPalette?.secondary.hex === palette.secondary.hex &&
      selectedPalette?.accent.hex === palette.accent.hex
    );
  };

  if (isExtracting) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-sm text-muted-foreground">Extraindo cores da logo...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-destructive mb-3">{error}</p>
            <Button size="sm" onClick={extractColors} variant="outline">
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (extractedColors.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Cores Extraídas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Cores Extraídas da Logo
          </CardTitle>
          <CardDescription className="text-xs">
            Detectamos automaticamente as cores dominantes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {extractedColors.map((color, index) => (
              <div
                key={index}
                className="flex-1 h-16 rounded-md border border-border"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Paletas Sugeridas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Paletas Sugeridas</CardTitle>
          <CardDescription className="text-xs">
            Escolha uma combinação harmônica baseada nas cores da logo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {suggestedPalettes.map((palette, index) => (
            <button
              key={index}
              onClick={() => onSelectPalette(palette)}
              className={cn(
                "w-full p-3 rounded-lg border-2 transition-all hover:shadow-md",
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

              <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                <span>Principal</span>
                <span>Secundária</span>
                <span>Destaque</span>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
