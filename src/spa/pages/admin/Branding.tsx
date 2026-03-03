import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Sparkles, Loader2, Building2, AlertCircle } from "lucide-react";
import { LogoUploader } from "@/components/branding/LogoUploader";
import { ColorExtractor } from "@/components/branding/ColorExtractor";
import { PaletteSelector } from "@/components/branding/PaletteSelector";
import { BrandingPreview } from "@/components/branding/BrandingPreview";
import { useTenantBranding } from "@/hooks/useTenantBranding";
import { useSaveBranding } from "@/hooks/useSaveBranding";
import { useAllOrganizacoes } from "@/hooks/useAdminData";
import { toast } from "sonner";

interface ColorPalette {
  primary: { hex: string; hsl: string };
  secondary: { hex: string; hsl: string };
  accent: { hex: string; hsl: string };
}

export default function Branding() {
  const navigate = useNavigate();
  const { data: organizacoes, isLoading: orgLoading } = useAllOrganizacoes();
  const [organizacaoId, setOrganizacaoId] = useState<string>("");

  // Form state
  const [companyName, setCompanyName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");
  const [selectedPalette, setSelectedPalette] = useState<ColorPalette | undefined>();

  // Auto-seleciona a primeira organização
  useEffect(() => {
    if (organizacaoId) return;
    if (organizacoes && organizacoes.length > 0) {
      setOrganizacaoId(organizacoes[0].id);
    }
  }, [organizacoes, organizacaoId]);

  const { data: currentBranding, isLoading: isLoadingBranding } = useTenantBranding(
    organizacaoId || undefined
  );
  const { mutate: saveBranding, isPending: isSaving } = useSaveBranding();

  // Reseta os campos quando troca de organização
  useEffect(() => {
    setCompanyName("");
    setLogoUrl("");
    setFaviconUrl("");
    setSelectedPalette(undefined);
  }, [organizacaoId]);

  // Carrega branding existente quando disponível
  useEffect(() => {
    if (currentBranding) {
      setCompanyName(currentBranding.company_name || "");
      setLogoUrl(currentBranding.logo_url || "");
      setFaviconUrl(currentBranding.favicon_url || "");
      setSelectedPalette({
        primary: { hex: "", hsl: currentBranding.primary_hsl },
        secondary: { hex: "", hsl: currentBranding.secondary_hsl },
        accent: { hex: "", hsl: currentBranding.accent_hsl },
      });
    }
  }, [currentBranding]);

  const orgSelecionada = (organizacoes || []).find((o: any) => o.id === organizacaoId);
  const isReady = !!organizacaoId && !isLoadingBranding;

  const handleSave = () => {
    if (!organizacaoId) {
      toast.error("Selecione uma organização antes de salvar");
      return;
    }

    if (!companyName.trim()) {
      toast.error("Informe o nome da organização");
      return;
    }

    if (!selectedPalette) {
      toast.error("Selecione uma paleta de cores");
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container max-w-7xl mx-auto py-6 px-6">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Identidade Visual</h1>
                <p className="text-muted-foreground">
                  Configure logo, cores e nome exibido para cada organização cliente
                </p>
              </div>
            </div>

            <Button onClick={handleSave} disabled={isSaving || !isReady} size="lg">
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
      <div className="container max-w-7xl mx-auto py-8 px-6 space-y-6">

        {/* Seleção de organização */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">Organização</CardTitle>
            </div>
            <CardDescription>
              Selecione qual organização deseja personalizar. Cada organização tem sua própria identidade visual independente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 flex-wrap">
              <Select
                value={organizacaoId}
                onValueChange={setOrganizacaoId}
                disabled={orgLoading}
              >
                <SelectTrigger className="w-72">
                  <SelectValue
                    placeholder={
                      orgLoading ? "Carregando..." : "Selecione uma organização"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {(organizacoes || []).map((org: any) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {orgSelecionada && (
                <div className="text-sm text-muted-foreground">
                  Editando:{" "}
                  <span className="font-medium text-foreground">{orgSelecionada.nome}</span>
                  {orgSelecionada.cnpj ? (
                    <span> · CNPJ {orgSelecionada.cnpj}</span>
                  ) : null}
                  {currentBranding ? (
                    <span className="ml-2 text-green-600">· Configuração existente carregada</span>
                  ) : (
                    <span className="ml-2 text-amber-600">· Nenhuma configuração salva ainda</span>
                  )}
                </div>
              )}
            </div>

            {!orgLoading && (!organizacoes || organizacoes.length === 0) && (
              <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mt-3 w-fit">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Nenhuma organização cadastrada. Crie uma em{" "}
                <a href="/admin/organizacoes" className="underline font-medium">
                  Organizações
                </a>
                .
              </div>
            )}
          </CardContent>
        </Card>

        {/* Formulário principal (só aparece quando org selecionada) */}
        {isLoadingBranding && organizacaoId ? (
          <div className="flex items-center gap-3 text-muted-foreground py-8">
            <Loader2 className="h-5 w-5 animate-spin" />
            Carregando configurações de branding...
          </div>
        ) : organizacaoId ? (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Coluna esquerda — Configuração */}
            <div className="lg:col-span-2 space-y-6">

              {/* Nome da organização */}
              <Card>
                <CardHeader>
                  <CardTitle>Nome exibido no sistema</CardTitle>
                  <CardDescription>
                    Este nome aparece no cabeçalho, e-mails automáticos e relatórios enviados para os usuários desta organização.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="company-name">Nome da Organização</Label>
                    <input
                      id="company-name"
                      type="text"
                      placeholder="Ex: Empresa ABC Ltda"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                    <p className="text-xs text-muted-foreground">
                      Será exibido como:{" "}
                      <strong>"Sistema GIG — {companyName || "Nome da Organização"}"</strong>
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Logo */}
              <Card>
                <CardHeader>
                  <CardTitle>Logo da organização</CardTitle>
                  <CardDescription>
                    Aparece no cabeçalho do sistema. Arraste e solte o arquivo ou clique para selecionar. Formatos aceitos: PNG, JPG ou SVG (máx. 2MB). Recomendado: fundo transparente, mínimo 200px de largura.
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

              {/* Favicon */}
              <Card>
                <CardHeader>
                  <CardTitle>Ícone da aba do navegador (Favicon)</CardTitle>
                  <CardDescription>
                    Pequeno ícone exibido na aba do navegador ao lado do título da página. Ideal: imagem quadrada 32×32px ou 64×64px (PNG ou ICO, máx. 512KB).
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

              {/* Extração automática de cores (só aparece quando há logo) */}
              {logoUrl && (
                <>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Paleta extraída da logo</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Detectamos automaticamente as cores da sua logo e sugerimos paletas harmônicas prontas para usar. Clique em uma paleta para selecioná-la.
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

              {/* Paletas pré-definidas */}
              <div>
                <h3 className="text-lg font-semibold mb-1">
                  {logoUrl ? "Ou escolha uma paleta pré-definida" : "Escolha uma paleta de cores"}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Paletas profissionais prontas para usar. A paleta define as cores de botões, fundos e destaques do sistema para esta organização.
                </p>
                <PaletteSelector
                  onSelectPalette={setSelectedPalette}
                  selectedPalette={selectedPalette}
                />
              </div>
            </div>

            {/* Coluna direita — Preview */}
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <p className="text-sm font-medium text-muted-foreground mb-3">
                  Preview em tempo real
                </p>
                <BrandingPreview
                  logoUrl={logoUrl}
                  companyName={companyName}
                  palette={selectedPalette}
                />
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Esta é uma prévia de como ficará o sistema após salvar.
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
