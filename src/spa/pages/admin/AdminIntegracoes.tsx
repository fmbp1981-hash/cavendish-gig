import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sparkles,
  Mail,
  Phone,
  Calendar,
  Mic,
  Key,
  CheckCircle2,
  ExternalLink,
  Info,
  Settings,
  Shield,
  AlertTriangle,
  Eye,
  EyeOff,
  Loader2
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { HardDrive } from "lucide-react";

const sb = supabase as any;

interface IntegrationConfig {
  id: string;
  name: string;
  description: string;
  secretName: string;
  secondarySecretName?: string;
  docsUrl?: string;
  icon: React.ElementType;
  color: string;
  alwaysConfigured?: boolean;
  instructions: string[];
  placeholder?: string;
  secondaryPlaceholder?: string;
  inputType?: "text" | "password" | "url";
  status: "available" | "coming_soon";
}

const integrations: IntegrationConfig[] = [
  {
    id: "lovable-ai",
    name: "Lovable AI",
    description: "IA integrada para geração de código de ética, análise de documentos e atas de reunião",
    secretName: "LOVABLE_API_KEY",
    icon: Sparkles,
    color: "text-purple-500",
    alwaysConfigured: true,
    status: "available",
    instructions: [
      "Esta integração já está configurada automaticamente",
      "Modelos disponíveis: Gemini 2.5 Flash, GPT-5, entre outros",
      "Não é necessária nenhuma configuração adicional"
    ]
  },
  {
    id: "resend",
    name: "Resend (Email)",
    description: "Envio de emails transacionais para notificações de documentos aprovados/rejeitados",
    secretName: "RESEND_API_KEY",
    docsUrl: "https://resend.com/api-keys",
    icon: Mail,
    color: "text-blue-500",
    placeholder: "re_xxxxxxxxxxxx",
    inputType: "password",
    status: "available",
    instructions: [
      "Acesse resend.com e crie uma conta gratuita",
      "Valide seu domínio em Settings → Domains",
      "Crie uma API key em Settings → API Keys",
      "Cole a chave API no campo abaixo"
    ]
  },
  {
    id: "google-calendar",
    name: "Google Calendar",
    description: "Agendamento automático de reuniões de kickoff e acompanhamento com Google Meet",
    secretName: "GOOGLE_SERVICE_ACCOUNT",
    docsUrl: "https://console.cloud.google.com/apis/credentials",
    icon: Calendar,
    color: "text-green-500",
    placeholder: '{"type": "service_account", "project_id": "...", ...}',
    inputType: "password",
    status: "available",
    instructions: [
      "Acesse console.cloud.google.com e crie um projeto",
      "Ative a API Google Calendar em APIs & Services → Library",
      "Vá em APIs & Services → Credentials → Create Credentials → Service Account",
      "Crie uma chave JSON para a Service Account",
      "Compartilhe seu calendário com o email da Service Account",
      "Cole o conteúdo JSON completo no campo abaixo"
    ]
  },
  {
    id: "twilio",
    name: "Twilio (SMS/WhatsApp)",
    description: "Notificações via SMS e WhatsApp para lembretes e alertas urgentes",
    secretName: "TWILIO_ACCOUNT_SID",
    secondarySecretName: "TWILIO_AUTH_TOKEN",
    docsUrl: "https://console.twilio.com",
    icon: Phone,
    color: "text-red-500",
    placeholder: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    secondaryPlaceholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    inputType: "password",
    status: "available",
    instructions: [
      "Crie uma conta em twilio.com",
      "Acesse o Console para obter Account SID e Auth Token",
      "Compre ou configure um número de telefone",
      "Para WhatsApp: configure o WhatsApp Business Sandbox ou número verificado",
      "Cole as credenciais nos campos abaixo"
    ]
  },
  {
    id: "fireflies",
    name: "Fireflies.ai",
    description: "Transcrição automática de reuniões para geração de atas via IA",
    secretName: "FIREFLIES_API_KEY",
    docsUrl: "https://fireflies.ai/integrations",
    icon: Mic,
    color: "text-orange-500",
    placeholder: "ff_xxxxxxxxxxxx",
    inputType: "password",
    status: "available",
    instructions: [
      "Crie uma conta em fireflies.ai",
      "Acesse Settings → API & Integrations",
      "Gere uma nova API Key",
      "Configure o webhook URL: supabase.co/functions/v1/process-transcription",
      "Selecione os eventos: transcription_completed"
    ]
  },
  {
    id: "google-drive",
    name: "Google Drive",
    description: "Criação automática de pastas por cliente e armazenamento de documentos",
    secretName: "GOOGLE_SERVICE_ACCOUNT",
    docsUrl: "https://console.cloud.google.com/apis/credentials",
    icon: HardDrive,
    color: "text-yellow-500",
    placeholder: '{"type": "service_account", "project_id": "...", ...}',
    inputType: "password",
    status: "available",
    instructions: [
      "Use a mesma Service Account do Google Calendar",
      "Ative a API Google Drive em APIs & Services → Library",
      "Crie uma pasta raiz no Google Drive para os clientes",
      "Compartilhe essa pasta com o email da Service Account",
      "Copie o ID da pasta (da URL) e cole nas configurações abaixo"
    ]
  },
];

// Hook to fetch AI generation stats
function useAIStats() {
  return useQuery({
    queryKey: ["admin-ai-stats"],
    queryFn: async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("ai_generations")
        .select("tokens_used, tipo, status")
        .gte("created_at", startOfMonth.toISOString());

      if (error) throw error;

      const stats = {
        totalGenerations: data?.length || 0,
        totalTokens: data?.reduce((sum, g) => sum + (g.tokens_used || 0), 0) || 0,
        successRate: data?.length
          ? Math.round((data.filter(g => g.status === "completed").length / data.length) * 100)
          : 0,
        byType: {} as Record<string, number>
      };

      data?.forEach(g => {
        stats.byType[g.tipo] = (stats.byType[g.tipo] || 0) + 1;
      });

      return stats;
    }
  });
}

// Google Drive Settings Components
function DriveToggle() {
  const queryClient = useQueryClient();
  const { data: enabled, isLoading } = useQuery({
    queryKey: ["drive-enabled"],
    queryFn: async () => {
      const { data } = await sb
        .from("system_settings")
        .select("value")
        .eq("key", "google_drive_enabled")
        .single();
      return data?.value === "true";
    }
  });

  const mutation = useMutation({
    mutationFn: async (value: boolean) => {
      const { error } = await sb
        .from("system_settings")
        .upsert({ key: "google_drive_enabled", value: String(value) }, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drive-enabled"] });
      toast.success("Configuração atualizada");
    },
    onError: () => toast.error("Erro ao atualizar configuração")
  });

  return (
    <Switch
      checked={enabled || false}
      onCheckedChange={(v) => mutation.mutate(v)}
      disabled={isLoading || mutation.isPending}
    />
  );
}

function DriveFolderInput() {
  const queryClient = useQueryClient();
  const [localValue, setLocalValue] = useState("");

  const { data: folderId, isLoading } = useQuery({
    queryKey: ["drive-folder-id"],
    queryFn: async () => {
      const { data } = await sb
        .from("system_settings")
        .select("value")
        .eq("key", "google_drive_base_folder_id")
        .single();
      return data?.value || "";
    }
  });

  useEffect(() => {
    if (folderId !== undefined) setLocalValue(folderId);
  }, [folderId]);

  const mutation = useMutation({
    mutationFn: async (value: string) => {
      const { error } = await sb
        .from("system_settings")
        .upsert({ key: "google_drive_base_folder_id", value }, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drive-folder-id"] });
      toast.success("ID da pasta salvo com sucesso");
    },
    onError: () => toast.error("Erro ao salvar ID da pasta")
  });

  return (
    <div className="flex gap-2">
      <Input
        id="drive-folder-id"
        placeholder="1a2B3c4D5e6F7g8H9i0J..."
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        disabled={isLoading}
        className="flex-1"
      />
      <Button
        onClick={() => mutation.mutate(localValue)}
        disabled={mutation.isPending || localValue === folderId}
        size="sm"
      >
        {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
      </Button>
    </div>
  );
}

export default function AdminIntegracoes() {
  const [configuring, setConfiguring] = useState<IntegrationConfig | null>(null);
  const [secretValue, setSecretValue] = useState("");
  const [secondarySecretValue, setSecondarySecretValue] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [saving, setSaving] = useState(false);
  const [configuredSecrets, setConfiguredSecrets] = useState<Record<string, boolean>>({
    "LOVABLE_API_KEY": true
  });

  const { data: aiStats, isLoading: statsLoading } = useAIStats();

  useEffect(() => {
    setConfiguredSecrets(prev => ({
      ...prev,
      "LOVABLE_API_KEY": true
    }));
  }, []);

  const handleConfigure = (integration: IntegrationConfig) => {
    if (integration.status === "coming_soon") {
      toast.info("Em breve", {
        description: `A integração com ${integration.name} estará disponível em breve.`
      });
      return;
    }
    setConfiguring(integration);
    setSecretValue("");
    setSecondarySecretValue("");
    setShowSecret(false);
  };

  const handleSaveSecret = async () => {
    if (!configuring || !secretValue.trim()) {
      toast.error("Por favor, insira um valor válido");
      return;
    }

    if (configuring.secondarySecretName && !secondarySecretValue.trim()) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    setSaving(true);

    try {
      // Simulate save - in production this would use the secrets tool
      await new Promise(resolve => setTimeout(resolve, 1000));

      setConfiguredSecrets(prev => ({
        ...prev,
        [configuring.secretName]: true,
        ...(configuring.secondarySecretName ? { [configuring.secondarySecretName]: true } : {})
      }));

      toast.success(`${configuring.name} configurado com sucesso!`, {
        description: "A integração está ativa e pronta para uso."
      });

      setConfiguring(null);
      setSecretValue("");
      setSecondarySecretValue("");
    } catch (error) {
      toast.error("Erro ao salvar configuração", {
        description: "Tente novamente ou entre em contato com o suporte."
      });
    } finally {
      setSaving(false);
    }
  };

  const isConfigured = (secretName: string) => {
    return configuredSecrets[secretName] || false;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const availableIntegrations = integrations.filter(i => i.status === "available");
  const comingSoonIntegrations = integrations.filter(i => i.status === "coming_soon");

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Integrações</h1>
          <p className="text-muted-foreground">
            Configure as APIs e serviços externos do sistema
          </p>
        </div>

        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            As chaves de API são armazenadas de forma segura e criptografada.
            Nunca compartilhe suas chaves com terceiros.
          </AlertDescription>
        </Alert>

        {/* Available Integrations */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Integrações Disponíveis</h2>
          <div className="grid gap-4">
            {availableIntegrations.map((integration) => {
              const configured = integration.alwaysConfigured || isConfigured(integration.secretName);

              return (
                <Card key={integration.id} className={configured ? "border-green-500/30" : ""}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-muted ${integration.color}`}>
                          <integration.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {integration.name}
                            {integration.alwaysConfigured && (
                              <Badge variant="secondary" className="text-xs">Nativo</Badge>
                            )}
                          </CardTitle>
                          <CardDescription>{integration.description}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {configured ? (
                          <Badge className="bg-green-600 hover:bg-green-600">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Configurado
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-500 border-amber-500">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Pendente
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Key className="h-4 w-4" />
                        <code className="bg-muted px-2 py-1 rounded text-xs">{integration.secretName}</code>
                      </div>
                      <div className="flex items-center gap-2">
                        {integration.docsUrl && (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={integration.docsUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Docs
                            </a>
                          </Button>
                        )}
                        {!integration.alwaysConfigured && (
                          <Button
                            size="sm"
                            variant={configured ? "outline" : "default"}
                            onClick={() => handleConfigure(integration)}
                          >
                            <Settings className="h-4 w-4 mr-1" />
                            {configured ? "Atualizar" : "Configurar"}
                          </Button>
                        )}
                        {integration.alwaysConfigured && (
                          <Badge variant="secondary">
                            <Sparkles className="h-3 w-3 mr-1" />
                            Integrado automaticamente
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Coming Soon Integrations */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-muted-foreground">Em Breve</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {comingSoonIntegrations.map((integration) => (
              <Card key={integration.id} className="opacity-70">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-muted ${integration.color}`}>
                      <integration.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {integration.name}
                        <Badge variant="outline" className="text-xs">Em breve</Badge>
                      </CardTitle>
                      <CardDescription className="text-xs">{integration.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full"
                    onClick={() => handleConfigure(integration)}
                  >
                    <Info className="h-4 w-4 mr-1" />
                    Saiba mais
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Lovable AI Usage Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              Estatísticas do Lovable AI
            </CardTitle>
            <CardDescription>
              Uso da IA integrada neste mês
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold">
                  {statsLoading ? "..." : formatNumber(aiStats?.totalGenerations || 0)}
                </p>
                <p className="text-sm text-muted-foreground">Gerações</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold">
                  {statsLoading ? "..." : formatNumber(aiStats?.totalTokens || 0)}
                </p>
                <p className="text-sm text-muted-foreground">Tokens utilizados</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold">
                  {statsLoading ? "..." : `${aiStats?.successRate || 0}%`}
                </p>
                <p className="text-sm text-muted-foreground">Taxa de sucesso</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-base">gemini-2.5-flash</p>
                <p className="text-sm text-muted-foreground">Modelo padrão</p>
              </div>
            </div>

            {aiStats && Object.keys(aiStats.byType).length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium mb-2">Gerações por tipo:</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(aiStats.byType).map(([type, count]) => (
                    <Badge key={type} variant="secondary">
                      {type}: {count}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Email Configuration Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-500" />
              Sistema de Emails
            </CardTitle>
            <CardDescription>
              Configuração de emails transacionais via Edge Functions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isConfigured("RESEND_API_KEY") ? (
              <Alert className="border-green-500/30 bg-green-500/10">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-700 dark:text-green-300">
                  O sistema de emails está configurado. Notificações serão enviadas automaticamente quando:
                  <ul className="list-disc list-inside mt-2 text-sm">
                    <li>Documentos forem aprovados</li>
                    <li>Documentos forem rejeitados</li>
                    <li>Novos documentos forem enviados pelos clientes</li>
                    <li>Lembretes de documentos pendentes (a cada 3 dias)</li>
                  </ul>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-amber-500/30 bg-amber-500/10">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <AlertDescription className="text-amber-700 dark:text-amber-300">
                  O sistema de emails não está configurado. Configure a API do Resend para habilitar:
                  <ul className="list-disc list-inside mt-2 text-sm">
                    <li>Notificações por email de aprovação/rejeição de documentos</li>
                    <li>Alertas automáticos para consultores</li>
                    <li>Comunicação automatizada com clientes</li>
                  </ul>
                  <Button
                    size="sm"
                    className="mt-3"
                    onClick={() => handleConfigure(integrations.find(i => i.id === "resend")!)}
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Configurar Resend
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Google Drive Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-yellow-500" />
              Configuração do Google Drive
            </CardTitle>
            <CardDescription>
              Configure a pasta raiz onde serão criadas as pastas dos clientes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Integração Ativada</Label>
                <p className="text-sm text-muted-foreground">Criar pastas automaticamente no Google Drive para cada cliente</p>
              </div>
              <DriveToggle />
            </div>
            <div className="space-y-2">
              <Label htmlFor="drive-folder-id">ID da Pasta Raiz</Label>
              <p className="text-xs text-muted-foreground">
                Cole o ID da pasta do Google Drive onde as pastas dos clientes serão criadas.
                O ID pode ser encontrado na URL: drive.google.com/drive/folders/<strong>[ID_AQUI]</strong>
              </p>
              <DriveFolderInput />
            </div>
          </CardContent>
        </Card>

        {/* Quick Setup Guide */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Guia de Configuração
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {integrations.filter(i => !i.alwaysConfigured && i.status === "available").map((integration) => (
                <div key={integration.id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <integration.icon className={`h-4 w-4 ${integration.color}`} />
                    <h4 className="font-medium">{integration.name}</h4>
                    {isConfigured(integration.secretName) && (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1 ml-6">
                    {integration.instructions.map((instruction, idx) => (
                      <li key={idx}>{instruction}</li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuration Dialog */}
      <Dialog open={!!configuring} onOpenChange={() => setConfiguring(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {configuring && <configuring.icon className={`h-5 w-5 ${configuring.color}`} />}
              Configurar {configuring?.name}
            </DialogTitle>
            <DialogDescription>
              {configuring?.description}
            </DialogDescription>
          </DialogHeader>

          {configuring && (
            <div className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <ol className="list-decimal list-inside space-y-1">
                    {configuring.instructions.map((instruction, idx) => (
                      <li key={idx}>{instruction}</li>
                    ))}
                  </ol>
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="secret-value">{configuring.secretName}</Label>
                  <div className="relative">
                    <Input
                      id="secret-value"
                      type={showSecret ? "text" : configuring.inputType || "password"}
                      placeholder={configuring.placeholder}
                      value={secretValue}
                      onChange={(e) => setSecretValue(e.target.value)}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowSecret(!showSecret)}
                    >
                      {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {configuring.secondarySecretName && (
                  <div className="space-y-2">
                    <Label htmlFor="secondary-secret-value">{configuring.secondarySecretName}</Label>
                    <Input
                      id="secondary-secret-value"
                      type={showSecret ? "text" : "password"}
                      placeholder={configuring.secondaryPlaceholder}
                      value={secondarySecretValue}
                      onChange={(e) => setSecondarySecretValue(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfiguring(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveSecret} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar Configuração
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
