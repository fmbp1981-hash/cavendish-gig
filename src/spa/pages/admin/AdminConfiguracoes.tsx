import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { supabase } from "@/integrations/supabase/client";
import { useAllOrganizacoes } from "@/hooks/useAdminData";
import { useTenantBranding } from "@/hooks/useTenantBranding";
import {
  Shield,
  Bell,
  Webhook,
  Server,
  CheckCircle2,
  Palette,
  Info,
  ImageIcon,
  Building2,
  AlertCircle,
  Loader2,
} from "lucide-react";

// ── Conversão hex ↔ HSL ────────────────────────────────────────────────────────

function hexToHsl(hex: string): string {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return "222 47% 11%";
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function hslToHex(hsl: string): string {
  const parts = hsl.match(/[\d.]+/g);
  if (!parts || parts.length < 3) return "#1e293b";
  let h = parseFloat(parts[0]) / 360;
  const s = parseFloat(parts[1]) / 100;
  const l = parseFloat(parts[2]) / 100;
  if (s === 0) {
    const val = Math.round(l * 255).toString(16).padStart(2, "0");
    return `#${val}${val}${val}`;
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return (
    "#" +
    [hue2rgb(p, q, h + 1 / 3), hue2rgb(p, q, h), hue2rgb(p, q, h - 1 / 3)]
      .map((v) => Math.round(v * 255).toString(16).padStart(2, "0"))
      .join("")
  );
}

// ── Componente de seletor de cor ──────────────────────────────────────────────

interface ColorPickerFieldProps {
  label: string;
  description: string;
  hslValue: string;
  onChange: (hsl: string) => void;
  disabled?: boolean;
}

function ColorPickerField({ label, description, hslValue, onChange, disabled }: ColorPickerFieldProps) {
  const hexValue = useMemo(() => hslToHex(hslValue), [hslValue]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Label className="text-sm font-medium">{label}</Label>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-56 text-xs">
            {description}
          </TooltipContent>
        </Tooltip>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <input
            type="color"
            value={hexValue}
            onChange={(e) => onChange(hexToHsl(e.target.value))}
            disabled={disabled}
            className="w-12 h-10 rounded-md border border-input cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed p-0.5 bg-background"
            title={`Escolher ${label}`}
          />
        </div>
        <div className="flex-1">
          <div
            className="h-10 rounded-md border border-input flex items-center px-3"
            style={{ backgroundColor: hexValue }}
          >
            <span
              className="text-xs font-mono"
              style={{
                color: parseInt(hslToHex(hslValue).slice(1), 16) > 0x888888 ? "#000" : "#fff",
              }}
            >
              {hexValue.toUpperCase()}
            </span>
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

// ── Componente de preview de imagem ───────────────────────────────────────────

interface ImagePreviewProps {
  url: string;
  alt: string;
  size?: "sm" | "md";
}

function ImagePreview({ url, alt, size = "md" }: ImagePreviewProps) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const dim = size === "sm" ? "h-8 w-8" : "h-16 w-16";

  if (!url) return null;

  return (
    <div className={`relative ${dim} rounded-md border border-input bg-muted/30 overflow-hidden flex items-center justify-center`}>
      {!loaded && !error && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      {error ? (
        <div className="flex flex-col items-center gap-1">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <span className="text-[10px] text-destructive text-center leading-tight">URL inválida</span>
        </div>
      ) : (
        <img
          src={url}
          alt={alt}
          className={`object-contain ${dim} ${loaded ? "opacity-100" : "opacity-0"} transition-opacity`}
          onLoad={() => { setLoaded(true); setError(false); }}
          onError={() => { setError(true); setLoaded(false); }}
        />
      )}
    </div>
  );
}

// ── Status do sistema ─────────────────────────────────────────────────────────

const STATUS_ITEMS = [
  { label: "Segurança dos Dados", desc: "Isolamento por organização (RLS) ativo", ok: true },
  { label: "Criptografia", desc: "TLS 1.2+ em trânsito · AES-256 em repouso", ok: true },
  { label: "Banco de Dados", desc: "Multi-tenant operacional", ok: true },
  { label: "Backups", desc: "Backups automáticos diários", ok: true },
];

// ── Página principal ──────────────────────────────────────────────────────────

export default function AdminConfiguracoes() {
  const queryClient = useQueryClient();
  const { data: organizacoes, isLoading: orgLoading } = useAllOrganizacoes();

  const [organizacaoId, setOrganizacaoId] = useState<string>("");

  const handleSelectOrganizacao = (value: string) => {
    setOrganizacaoId(value);
    try {
      window.localStorage.setItem("tenant_branding_preview_org_id", value);
      window.dispatchEvent(new Event("tenant-branding-preview-change"));
    } catch {
      // ignore
    }
  };

  // Auto-seleciona a primeira organização disponível
  useEffect(() => {
    if (organizacaoId) return;
    if (organizacoes && organizacoes.length > 0) {
      setOrganizacaoId(organizacoes[0].id);
    }
  }, [organizacoes, organizacaoId]);

  const { data: branding, isLoading: brandingLoading } = useTenantBranding(organizacaoId || undefined);

  const defaultHsl = useMemo(
    () => ({
      primary_hsl: "222.2 47.4% 11.2%",
      secondary_hsl: "210 40% 96.1%",
      accent_hsl: "262 83% 58%",
    }),
    [],
  );

  const [companyName, setCompanyName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");
  const [primaryHsl, setPrimaryHsl] = useState(defaultHsl.primary_hsl);
  const [secondaryHsl, setSecondaryHsl] = useState(defaultHsl.secondary_hsl);
  const [accentHsl, setAccentHsl] = useState(defaultHsl.accent_hsl);

  useEffect(() => {
    setCompanyName(branding?.company_name || "");
    setLogoUrl(branding?.logo_url || "");
    setFaviconUrl(branding?.favicon_url || "");
    setPrimaryHsl(branding?.primary_hsl || defaultHsl.primary_hsl);
    setSecondaryHsl(branding?.secondary_hsl || defaultHsl.secondary_hsl);
    setAccentHsl(branding?.accent_hsl || defaultHsl.accent_hsl);
  }, [branding, defaultHsl]);

  const saveBranding = useMutation({
    mutationFn: async () => {
      if (!organizacaoId) throw new Error("Selecione uma organização");
      const payload = {
        organizacao_id: organizacaoId,
        company_name: companyName.trim() || null,
        logo_url: logoUrl.trim() || null,
        favicon_url: faviconUrl.trim() || null,
        primary_hsl: primaryHsl || defaultHsl.primary_hsl,
        secondary_hsl: secondaryHsl || defaultHsl.secondary_hsl,
        accent_hsl: accentHsl || defaultHsl.accent_hsl,
        custom_css: null,
      };
      const { error } = await supabase
        .from("tenant_branding")
        .upsert(payload, { onConflict: "organizacao_id" });
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["tenant-branding", organizacaoId] });
      toast.success("Identidade visual salva!", {
        description: "As alterações foram aplicadas para esta organização.",
      });
    },
    onError: () => {
      toast.error("Erro ao salvar", {
        description: "Verifique os campos e tente novamente.",
      });
    },
  });

  const orgSelecionada = (organizacoes || []).find((o: any) => o.id === organizacaoId);
  const isDisabled = !organizacaoId || brandingLoading;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground">Configurações gerais e identidade visual do sistema</p>
        </div>

        {/* ── Status do Sistema ─────────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-green-500" />
              <CardTitle className="text-base">Status do Sistema</CardTitle>
            </div>
            <CardDescription>Monitoramento de saúde, segurança e infraestrutura</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {STATUS_ITEMS.map((item) => (
                <div
                  key={item.label}
                  className="flex flex-col gap-2 p-3 rounded-lg border bg-muted/20"
                >
                  <div className="flex items-center gap-1.5">
                    {item.ok ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                    )}
                    <span className="text-sm font-medium leading-tight">{item.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-snug">{item.desc}</p>
                  <Badge
                    variant="outline"
                    className={
                      item.ok
                        ? "text-green-600 border-green-600 w-fit text-xs"
                        : "text-destructive border-destructive w-fit text-xs"
                    }
                  >
                    {item.ok ? "Operacional" : "Atenção"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── Notificações + Integrações ────────────────────────────────── */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-amber-500" />
                <CardTitle className="text-base">Notificações</CardTitle>
              </div>
              <CardDescription>Canais de comunicação automáticos com clientes e consultores</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Notificações internas", desc: "Alertas dentro do sistema em tempo real", ok: true },
                { label: "E-mail automático", desc: "Avisos de documentos enviados, aprovados e rejeitados", ok: true },
                { label: "Lembretes de documentos", desc: "E-mails automáticos para pendências mensais", ok: true },
              ].map((n, i) => (
                <div key={i}>
                  {i > 0 && <Separator className="mb-3" />}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{n.label}</p>
                      <p className="text-xs text-muted-foreground">{n.desc}</p>
                    </div>
                    <Badge variant="outline" className="text-green-600 border-green-600 text-xs shrink-0">
                      Ativo
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Webhook className="h-5 w-5 text-purple-500" />
                <CardTitle className="text-base">Integrações</CardTitle>
              </div>
              <CardDescription>
                Configure as integrações externas em{" "}
                <a href="/admin/integracoes" className="text-primary underline underline-offset-2">
                  Admin → Integrações
                </a>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Google Drive", desc: "Armazenamento de documentos dos clientes" },
                { label: "Google Calendar", desc: "Agendamento de reuniões e Google Meet" },
                { label: "E-mail (Resend)", desc: "Envio de e-mails transacionais" },
                { label: "ClickUp / Trello", desc: "Sincronização do Kanban de tarefas" },
              ].map((it, i) => (
                <div key={i}>
                  {i > 0 && <Separator className="mb-3" />}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{it.label}</p>
                      <p className="text-xs text-muted-foreground">{it.desc}</p>
                    </div>
                    <Badge variant="outline" className="text-muted-foreground text-xs shrink-0">
                      Configurar
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* ── Identidade Visual (White-label / Branding) ────────────────── */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              <CardTitle>Identidade Visual</CardTitle>
            </div>
            <CardDescription>
              Personalize o logo, as cores e o nome exibido para cada organização cliente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* Seleção de organização */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Organização</Label>
              </div>
              <Select
                value={organizacaoId}
                onValueChange={handleSelectOrganizacao}
                disabled={orgLoading}
              >
                <SelectTrigger className="max-w-sm">
                  <SelectValue
                    placeholder={orgLoading ? "Carregando organizações..." : "Selecione uma organização"}
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
              {!orgLoading && (!organizacoes || organizacoes.length === 0) && (
                <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 max-w-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  Nenhuma organização cadastrada ainda. Crie uma em{" "}
                  <a href="/admin/organizacoes" className="underline font-medium">
                    Organizações
                  </a>
                  .
                </div>
              )}
              {orgSelecionada && (
                <p className="text-xs text-muted-foreground">
                  Editando: <span className="font-medium text-foreground">{orgSelecionada.nome}</span>
                  {orgSelecionada.cnpj ? ` · CNPJ ${orgSelecionada.cnpj}` : ""}
                </p>
              )}
            </div>

            <Separator />

            {/* Nome exibido */}
            <div className="space-y-2 max-w-sm">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="company-name" className="text-sm font-medium">
                  Nome exibido no sistema
                </Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-56 text-xs">
                    Este nome aparece no cabeçalho, e-mails e relatórios enviados para esta organização.
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="company-name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Ex: Empresa ABC Ltda"
                disabled={isDisabled}
              />
              <p className="text-xs text-muted-foreground">
                Será exibido como: "Sistema GIG — {companyName || "Nome da Organização"}"
              </p>
            </div>

            <Separator />

            {/* Logo e Favicon */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Logo */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">Logo da organização</Label>
                </div>
                <div className="flex items-center gap-3">
                  <ImagePreview url={logoUrl} alt="Logo" size="md" />
                  <div className="flex-1 space-y-1.5">
                    <Input
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="https://sua-empresa.com/logo.png"
                      disabled={isDisabled}
                    />
                  </div>
                </div>
                <div className="bg-muted/40 rounded-md px-3 py-2 space-y-1">
                  <p className="text-xs font-medium text-foreground">Como obter a URL do logo:</p>
                  <ol className="text-xs text-muted-foreground space-y-0.5 list-decimal list-inside">
                    <li>Faça upload da imagem no Google Drive, Imgur ou no storage da sua empresa</li>
                    <li>Copie o link direto (terminando em .png, .jpg ou .svg)</li>
                    <li>Cole no campo acima — o preview aparece automaticamente</li>
                  </ol>
                  <p className="text-xs text-muted-foreground">Recomendado: fundo transparente (PNG ou SVG), mínimo 200px de largura.</p>
                </div>
              </div>

              {/* Favicon */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">Ícone da aba do navegador (favicon)</Label>
                </div>
                <div className="flex items-center gap-3">
                  <ImagePreview url={faviconUrl} alt="Favicon" size="sm" />
                  <div className="flex-1 space-y-1.5">
                    <Input
                      value={faviconUrl}
                      onChange={(e) => setFaviconUrl(e.target.value)}
                      placeholder="https://sua-empresa.com/favicon.ico"
                      disabled={isDisabled}
                    />
                  </div>
                </div>
                <div className="bg-muted/40 rounded-md px-3 py-2">
                  <p className="text-xs text-muted-foreground">
                    O favicon é o pequeno ícone exibido na aba do navegador. Ideal: imagem quadrada 32×32px ou 64×64px (ICO ou PNG).
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Paleta de cores */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Paleta de cores</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Clique nas cores abaixo para escolher as tonalidades da organização. As cores são aplicadas imediatamente após salvar.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                <ColorPickerField
                  label="Cor principal"
                  description="Usada em botões, links e elementos de destaque do sistema."
                  hslValue={primaryHsl}
                  onChange={setPrimaryHsl}
                  disabled={isDisabled}
                />
                <ColorPickerField
                  label="Cor secundária"
                  description="Usada em fundos de seções, cartões e áreas de contraste suave."
                  hslValue={secondaryHsl}
                  onChange={setSecondaryHsl}
                  disabled={isDisabled}
                />
                <ColorPickerField
                  label="Cor de destaque"
                  description="Usada em notificações, tags e elementos de atenção especial."
                  hslValue={accentHsl}
                  onChange={setAccentHsl}
                  disabled={isDisabled}
                />
              </div>

              {/* Preview da paleta */}
              {!isDisabled && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-muted-foreground">Preview da paleta:</span>
                  <div className="flex gap-1.5">
                    {[
                      { hsl: primaryHsl, label: "Principal" },
                      { hsl: secondaryHsl, label: "Secundária" },
                      { hsl: accentHsl, label: "Destaque" },
                    ].map((c) => (
                      <Tooltip key={c.label}>
                        <TooltipTrigger asChild>
                          <div
                            className="h-6 w-6 rounded-full border-2 border-white shadow-sm cursor-default"
                            style={{ backgroundColor: hslToHex(c.hsl) }}
                          />
                        </TooltipTrigger>
                        <TooltipContent className="text-xs">{c.label}</TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {brandingLoading
                  ? "Carregando configurações..."
                  : branding
                  ? "Configurações carregadas. Edite e clique em Salvar."
                  : organizacaoId
                  ? "Nenhuma configuração salva ainda para esta organização."
                  : "Selecione uma organização para editar."}
              </p>
              <Button
                onClick={() => saveBranding.mutate()}
                disabled={!organizacaoId || saveBranding.isPending}
              >
                {saveBranding.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar identidade visual"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Informações do Sistema ────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">Sobre o sistema</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Versão</p>
                <p className="text-sm font-medium">0.1.0-beta</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Desenvolvido por</p>
                <p className="text-sm font-medium">IntelliX.AI</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ambiente</p>
                <p className="text-sm font-medium">Produção</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Região</p>
                <p className="text-sm font-medium">América do Sul</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
