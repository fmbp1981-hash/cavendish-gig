import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { supabase } from "@/integrations/supabase/client";
import { useAllOrganizacoes } from "@/hooks/useAdminData";
import { useTenantBranding } from "@/hooks/useTenantBranding";
import { 
  Shield, 
  Database, 
  Bell, 
  Webhook,
  Server,
  CheckCircle2,
  Palette
} from "lucide-react";

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

  useEffect(() => {
    if (organizacaoId) return;
    if (organizacoes && organizacoes.length > 0) setOrganizacaoId(organizacoes[0].id);
  }, [organizacoes, organizacaoId]);

  const { data: branding, isLoading: brandingLoading } = useTenantBranding(organizacaoId || undefined);

  const defaultHsl = useMemo(
    () => ({
      primary_hsl: "222.2 47.4% 11.2%",
      secondary_hsl: "210 40% 96.1%",
      accent_hsl: "210 40% 96.1%",
    }),
    [],
  );

  const [companyName, setCompanyName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");
  const [primaryHsl, setPrimaryHsl] = useState(defaultHsl.primary_hsl);
  const [secondaryHsl, setSecondaryHsl] = useState(defaultHsl.secondary_hsl);
  const [accentHsl, setAccentHsl] = useState(defaultHsl.accent_hsl);
  const [customCss, setCustomCss] = useState("");

  useEffect(() => {
    setCompanyName(branding?.company_name || "");
    setLogoUrl(branding?.logo_url || "");
    setFaviconUrl(branding?.favicon_url || "");
    setPrimaryHsl(branding?.primary_hsl || defaultHsl.primary_hsl);
    setSecondaryHsl(branding?.secondary_hsl || defaultHsl.secondary_hsl);
    setAccentHsl(branding?.accent_hsl || defaultHsl.accent_hsl);
    setCustomCss(branding?.custom_css || "");
  }, [branding, defaultHsl]);

  const saveBranding = useMutation({
    mutationFn: async () => {
      if (!organizacaoId) throw new Error("Selecione uma organização");

      const payload = {
        organizacao_id: organizacaoId,
        company_name: companyName.trim() ? companyName.trim() : null,
        logo_url: logoUrl.trim() ? logoUrl.trim() : null,
        favicon_url: faviconUrl.trim() ? faviconUrl.trim() : null,
        primary_hsl: primaryHsl.trim() || defaultHsl.primary_hsl,
        secondary_hsl: secondaryHsl.trim() || defaultHsl.secondary_hsl,
        accent_hsl: accentHsl.trim() || defaultHsl.accent_hsl,
        custom_css: customCss.trim() ? customCss : null,
      };

      const { error } = await supabase
        .from("tenant_branding")
        .upsert(payload, { onConflict: "organizacao_id" });

      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["tenant-branding", organizacaoId] });
      toast.success("Branding salvo", {
        description: "As alterações serão aplicadas para esta organização."
      });
    },
    onError: () => {
      toast.error("Erro ao salvar branding", {
        description: "Verifique os campos e tente novamente."
      });
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground">Configurações gerais do sistema</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Security */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-destructive" />
                <CardTitle>Segurança</CardTitle>
              </div>
              <CardDescription>Configurações de segurança do sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Row Level Security (RLS)</Label>
                  <p className="text-sm text-muted-foreground">Isolamento de dados por tenant</p>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <Badge variant="outline" className="text-green-600 border-green-600">Ativo</Badge>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Criptografia em Trânsito</Label>
                  <p className="text-sm text-muted-foreground">TLS 1.2+ para todas conexões</p>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <Badge variant="outline" className="text-green-600 border-green-600">Ativo</Badge>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Criptografia em Repouso</Label>
                  <p className="text-sm text-muted-foreground">AES-256 para dados sensíveis</p>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <Badge variant="outline" className="text-green-600 border-green-600">Ativo</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Database */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-500" />
                <CardTitle>Banco de Dados</CardTitle>
              </div>
              <CardDescription>Status e configurações do banco</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Multi-tenant</Label>
                  <p className="text-sm text-muted-foreground">Isolamento por organização</p>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <Badge variant="outline" className="text-green-600 border-green-600">Ativo</Badge>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Realtime</Label>
                  <p className="text-sm text-muted-foreground">Atualizações em tempo real</p>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <Badge variant="outline" className="text-green-600 border-green-600">Ativo</Badge>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Backups Automáticos</Label>
                  <p className="text-sm text-muted-foreground">Backup diário dos dados</p>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <Badge variant="outline" className="text-green-600 border-green-600">Ativo</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-amber-500" />
                <CardTitle>Notificações</CardTitle>
              </div>
              <CardDescription>Configurações de notificações</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificações Internas</Label>
                  <p className="text-sm text-muted-foreground">Sistema de notificações do app</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificações por Email</Label>
                  <p className="text-sm text-muted-foreground">Envio de emails automáticos</p>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Lembretes Automáticos</Label>
                  <p className="text-sm text-muted-foreground">Lembrar documentos pendentes</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* Integrations */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Webhook className="h-5 w-5 text-purple-500" />
                <CardTitle>Integrações</CardTitle>
              </div>
              <CardDescription>Integrações com sistemas externos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Webhooks n8n</Label>
                  <p className="text-sm text-muted-foreground">Automação de workflows</p>
                </div>
                <Badge variant="outline">Pendente</Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Google Drive</Label>
                  <p className="text-sm text-muted-foreground">Armazenamento de arquivos</p>
                </div>
                <Badge variant="outline">Pendente</Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>ClickUp/Trello</Label>
                  <p className="text-sm text-muted-foreground">Gestão de tarefas</p>
                </div>
                <Badge variant="outline">Pendente</Badge>
              </div>
            </CardContent>
          </Card>

          {/* White-label / Branding */}
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-muted-foreground" />
                <CardTitle>White-label / Branding</CardTitle>
              </div>
              <CardDescription>
                Configure logo, cores (HSL) e CSS customizado por organização
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Organização</Label>
                  <Select value={organizacaoId} onValueChange={handleSelectOrganizacao}>
                    <SelectTrigger disabled={orgLoading}>
                      <SelectValue placeholder={orgLoading ? "Carregando..." : "Selecione"} />
                    </SelectTrigger>
                    <SelectContent>
                      {(organizacoes || []).map((org: any) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Nome exibido</Label>
                  <Input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Nome da empresa"
                    disabled={!organizacaoId || brandingLoading}
                  />
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Logo URL</Label>
                  <Input
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://.../logo.png"
                    disabled={!organizacaoId || brandingLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Favicon URL</Label>
                  <Input
                    value={faviconUrl}
                    onChange={(e) => setFaviconUrl(e.target.value)}
                    placeholder="https://.../favicon.ico"
                    disabled={!organizacaoId || brandingLoading}
                  />
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Primary (HSL)</Label>
                  <Input
                    value={primaryHsl}
                    onChange={(e) => setPrimaryHsl(e.target.value)}
                    placeholder={defaultHsl.primary_hsl}
                    disabled={!organizacaoId || brandingLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Secondary (HSL)</Label>
                  <Input
                    value={secondaryHsl}
                    onChange={(e) => setSecondaryHsl(e.target.value)}
                    placeholder={defaultHsl.secondary_hsl}
                    disabled={!organizacaoId || brandingLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Accent (HSL)</Label>
                  <Input
                    value={accentHsl}
                    onChange={(e) => setAccentHsl(e.target.value)}
                    placeholder={defaultHsl.accent_hsl}
                    disabled={!organizacaoId || brandingLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>CSS Customizado (opcional)</Label>
                <Textarea
                  value={customCss}
                  onChange={(e) => setCustomCss(e.target.value)}
                  placeholder={"/* Ex.: .brand-logo { display:none; } */"}
                  className="min-h-32 font-mono"
                  disabled={!organizacaoId || brandingLoading}
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => saveBranding.mutate()}
                  disabled={!organizacaoId || saveBranding.isPending}
                >
                  {saveBranding.isPending ? "Salvando..." : "Salvar Branding"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Informações do Sistema</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Versão</p>
                <p className="text-sm text-muted-foreground">1.0.0-beta</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Ambiente</p>
                <p className="text-sm text-muted-foreground">Produção</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Database</p>
                <p className="text-sm text-muted-foreground">PostgreSQL (Supabase)</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Região</p>
                <p className="text-sm text-muted-foreground">South America</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
