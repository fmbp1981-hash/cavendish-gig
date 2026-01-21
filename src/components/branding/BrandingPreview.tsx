import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, LayoutDashboard, FileText } from "lucide-react";

interface ColorPalette {
  primary: { hex: string; hsl: string };
  secondary: { hex: string; hsl: string };
  accent: { hex: string; hsl: string };
}

interface BrandingPreviewProps {
  logoUrl?: string;
  companyName?: string;
  palette?: ColorPalette;
}

export function BrandingPreview({ logoUrl, companyName, palette }: BrandingPreviewProps) {
  const primaryColor = palette?.primary.hex || "#0F66E8";
  const secondaryColor = palette?.secondary.hex || "#10B981";
  const accentColor = palette?.accent.hex || "#EAB308";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Eye className="h-4 w-4 text-primary" />
          Preview em Tempo Real
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border-2 border-border overflow-hidden bg-background">
          {/* Mini Sidebar */}
          <div className="flex">
            <div
              className="w-16 p-3 flex flex-col items-center gap-3"
              style={{ backgroundColor: "#2A3441" }}
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="h-8 w-8 object-contain rounded"
                />
              ) : (
                <div
                  className="h-8 w-8 rounded flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  GIG
                </div>
              )}

              <div className="space-y-2">
                <div
                  className="h-8 w-8 rounded flex items-center justify-center"
                  style={{ backgroundColor: `${primaryColor}20` }}
                >
                  <LayoutDashboard className="h-4 w-4" style={{ color: primaryColor }} />
                </div>
                <div
                  className="h-8 w-8 rounded flex items-center justify-center"
                  style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                >
                  <FileText className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-4 space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">
                  {companyName ? `Sistema GIG - ${companyName}` : "Sistema GIG"}
                </h3>
                <div className="flex gap-1">
                  <div className="h-6 w-6 rounded-full bg-muted" />
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 rounded border border-border">
                  <div className="text-xs text-muted-foreground mb-1">Clientes</div>
                  <div className="text-lg font-bold" style={{ color: primaryColor }}>
                    24
                  </div>
                </div>
                <div className="p-2 rounded border border-border">
                  <div className="text-xs text-muted-foreground mb-1">Projetos</div>
                  <div className="text-lg font-bold" style={{ color: secondaryColor }}>
                    18
                  </div>
                </div>
                <div className="p-2 rounded border border-border">
                  <div className="text-xs text-muted-foreground mb-1">Score</div>
                  <div className="text-lg font-bold" style={{ color: accentColor }}>
                    78%
                  </div>
                </div>
              </div>

              {/* Button Preview */}
              <div className="flex gap-2 pt-2">
                <button
                  className="px-3 py-1.5 rounded text-xs font-medium text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  Botão Principal
                </button>
                <button
                  className="px-3 py-1.5 rounded text-xs font-medium"
                  style={{
                    backgroundColor: `${secondaryColor}10`,
                    color: secondaryColor,
                  }}
                >
                  Botão Secundário
                </button>
              </div>

              {/* Info Box */}
              <div
                className="p-2 rounded text-xs"
                style={{
                  backgroundColor: `${accentColor}10`,
                  borderLeft: `3px solid ${accentColor}`,
                }}
              >
                Exemplo de destaque com cor de acento
              </div>
            </div>
          </div>
        </div>

        {/* Color Codes */}
        {palette && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="text-xs font-medium mb-2">Códigos de Cores:</div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="h-3 w-3 rounded"
                    style={{ backgroundColor: primaryColor }}
                  />
                  <span className="text-muted-foreground">Principal</span>
                </div>
                <code className="text-xs">{palette.primary.hex}</code>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="h-3 w-3 rounded"
                    style={{ backgroundColor: secondaryColor }}
                  />
                  <span className="text-muted-foreground">Secundária</span>
                </div>
                <code className="text-xs">{palette.secondary.hex}</code>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="h-3 w-3 rounded"
                    style={{ backgroundColor: accentColor }}
                  />
                  <span className="text-muted-foreground">Destaque</span>
                </div>
                <code className="text-xs">{palette.accent.hex}</code>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
