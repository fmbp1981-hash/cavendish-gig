import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Save, Sparkles, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { LogoUploader } from "@/components/branding/LogoUploader";
import { ColorExtractor } from "@/components/branding/ColorExtractor";
import { PaletteSelector } from "@/components/branding/PaletteSelector";
import { BrandingPreview } from "@/components/branding/BrandingPreview";
import { useTenantBranding } from "@/hooks/useTenantBranding";
import { useSaveBranding } from "@/hooks/useSaveBranding";
import { toast } from "sonner";

interface ColorPalette {
  primary: { hex: string; hsl: string };
  secondary: { hex: string; hsl: string };
  accent: { hex: string; hsl: string };
}

export default function Branding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [organizacaoId, setOrganizacaoId] = useState<string>("");

  // Form state
  const [companyName, setCompanyName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");
  const [selectedPalette, setSelectedPalette] = useState<ColorPalette | undefined>();

  // Get current branding
  const { data: currentBranding, isLoading: isLoadingBranding } = useTenantBranding(organizacaoId);
  const { mutate: saveBranding, isPending: isSaving } = useSaveBranding();

  // Load organizacao_id from user
  useEffect(() => {
    if (user) {
      // For this demo, we'll use a placeholder organization ID
      // In production, you would fetch the user's organization
      setOrganizacaoId("demo-org-id");
    }
  }, [user]);

  // Load existing branding when available
  useEffect(() => {
    if (currentBranding) {
      setCompanyName(currentBranding.company_name || "");
      setLogoUrl(currentBranding.logo_url || "");
      setFaviconUrl(currentBranding.favicon_url || "");
      setSelectedPalette({
        primary: {
          hex: "",
          hsl: currentBranding.primary_hsl,
        },
        secondary: {
          hex: "",
          hsl: currentBranding.secondary_hsl,
        },
        accent: {
          hex: "",
          hsl: currentBranding.accent_hsl,
        },
      });
    }
  }, [currentBranding]);

  const handleSave = () => {
    if (!companyName.trim()) {
      toast.error("Por favor, insira o nome da empresa");
      return;
    }

    if (!selectedPalette) {
      toast.error("Por favor, selecione uma paleta de cores");
      return;
    }

    saveBranding({
      organizacao_id: organizacaoId,
      company_name: companyName,
      logo_url: logoUrl,
      favicon_url: faviconUrl,
      primary_hsl: selectedPalette.primary.hsl,
      secondary_hsl: selectedPalette.secondary.hsl,
      accent_hsl: selectedPalette.accent.hsl,
    });
  };

  if (isLoadingBranding) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container max-w-7xl mx-auto py-6 px-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Branding e Personalização</h1>
                <p className="text-muted-foreground">
                  Configure a identidade visual do sistema para seus clientes
                </p>
              </div>
            </div>

            <Button onClick={handleSave} disabled={isSaving} size="lg">
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-7xl mx-auto py-8 px-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Configuration */}
          <div className="lg:col-span-2 space-y-6">
            {/* Company Name */}
            <Card>
              <CardHeader>
                <CardTitle>Identificação da Empresa</CardTitle>
                <CardDescription>
                  O nome da empresa será exibido em todo o sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="company-name">Nome da Empresa</Label>
                  <Input
                    id="company-name"
                    placeholder="Ex: Acme Corporation"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Será exibido como: "Sistema GIG - {companyName || "Sua Empresa"}"
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Logo Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Logotipo</CardTitle>
                <CardDescription>
                  Faça upload da logo da empresa (PNG, JPG ou SVG)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LogoUploader
                  organizacaoId={organizacaoId}
                  currentLogoUrl={logoUrl}
                  onLogoUploaded={setLogoUrl}
                  type="logo"
                />
              </CardContent>
            </Card>

            {/* Favicon Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Favicon</CardTitle>
                <CardDescription>
                  Ícone exibido na aba do navegador (PNG ou ICO, 32x32px)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LogoUploader
                  organizacaoId={organizacaoId}
                  currentLogoUrl={faviconUrl}
                  onLogoUploaded={setFaviconUrl}
                  type="favicon"
                />
              </CardContent>
            </Card>

            <Separator />

            {/* Color Extraction */}
            {logoUrl && (
              <>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Extração Automática de Cores</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Detectamos automaticamente as cores da sua logo e sugerimos paletas harmônicas
                  </p>
                  <ColorExtractor
                    logoUrl={logoUrl}
                    onSelectPalette={setSelectedPalette}
                    selectedPalette={selectedPalette}
                  />
                </div>

                <Separator />
              </>
            )}

            {/* Predefined Palettes */}
            <div>
              <h3 className="text-lg font-semibold mb-2">
                {logoUrl ? "Ou escolha uma paleta pré-definida" : "Paletas Pré-Definidas"}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Paletas profissionais prontas para usar
              </p>
              <PaletteSelector
                onSelectPalette={setSelectedPalette}
                selectedPalette={selectedPalette}
              />
            </div>
          </div>

          {/* Right Column - Preview */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <BrandingPreview
                logoUrl={logoUrl}
                companyName={companyName}
                palette={selectedPalette}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
