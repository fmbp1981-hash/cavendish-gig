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
  Loader2,
  LogIn,
  Wifi,
  Search,
  MessageCircle,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { HardDrive } from "lucide-react";

const sb = supabase;

interface IntegrationConfig {
  id: string;
  name: string;
  description: string;
  secretName: string;
  secondarySecretName?: string;
  tertiarySecretName?: string;
  quaternarySecretName?: string;
  configFields?: Array<{ name: string; label: string; placeholder: string }>;
  docsUrl?: string;
  icon: React.ElementType;
  color: string;
  alwaysConfigured?: boolean;
  instructions: string[];
  placeholder?: string;
  secondaryPlaceholder?: string;
  tertiaryPlaceholder?: string;
  quaternaryPlaceholder?: string;
  inputType?: "text" | "password" | "url";
  status: "available" | "coming_soon";
}

const integrations: IntegrationConfig[] = [
  {
    id: "resend",
    name: "Resend (Email)",
    description: "Envio de emails transacionais para notificações de documentos aprovados/rejeitados",
    secretName: "RESEND_API_KEY",
    configFields: [
      { name: "from_email", label: "Email Remetente (De:)", placeholder: "Cavendish Consultoria <noreply@contato.cavendishconsultoria.com.br>" },
      { name: "sender_name", label: "Nome do Remetente", placeholder: "Cavendish Consultoria" },
      { name: "signature_name", label: "Assinatura dos Emails", placeholder: "Equipe Cavendish Consultoria" },
    ],
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
      "Cole a chave API no campo abaixo",
      "Informe o email remetente no campo 'Email Remetente' (deve usar o domínio verificado)"
    ]
  },
  {
    id: "google-calendar",
    name: "Google Calendar",
    description: "Agendamento automático de reuniões de kickoff, acompanhamento e fechamento comercial (Finder) com Google Meet",
    secretName: "GOOGLE_SERVICE_ACCOUNT",
    configFields: [
      { name: "alberto_calendar_id", label: "Calendário do Alberto (Finder — fechamento)", placeholder: "alberto@cavendish.com.br" },
    ],
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
      "Cole o conteúdo JSON completo no campo abaixo",
      "Peça para o Alberto compartilhar seu Google Calendar pessoal com o email da Service Account (permissão 'Fazer alterações em eventos') e informe o ID do calendário dele (geralmente o próprio email) no campo abaixo — usado pelo Finder para agendar reuniões de fechamento"
    ]
  },
  {
    id: "fireflies",
    name: "Fireflies.ai",
    description: "Transcrição automática de reuniões para geração de atas via IA",
    secretName: "FIREFLIES_API_KEY",
    secondarySecretName: "TRANSCRIPTION_WEBHOOK_SECRET",
    docsUrl: "https://fireflies.ai/integrations",
    icon: Mic,
    color: "text-orange-500",
    placeholder: "ff_xxxxxxxxxxxx",
    secondaryPlaceholder: "seu_segredo_webhook",
    inputType: "password",
    status: "available",
    instructions: [
      "Crie uma conta em fireflies.ai",
      "Acesse Settings → API & Integrations",
      "Gere uma nova API Key",
      "Configure o webhook URL: supabase.co/functions/v1/process-transcription",
      "Configure o header x-webhook-secret com o mesmo valor salvo em TRANSCRIPTION_WEBHOOK_SECRET"
    ]
  },
  {
    id: "onedrive",
    name: "Microsoft OneDrive",
    description: "Criação automática de pastas por cliente e armazenamento de documentos no OneDrive Personal (Microsoft 365)",
    secretName: "AZURE_CLIENT_ID",
    secondarySecretName: "AZURE_CLIENT_SECRET",
    docsUrl: "https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade",
    icon: HardDrive,
    color: "text-blue-600",
    placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    secondaryPlaceholder: "sua_client_secret_value",
    inputType: "text",
    status: "available",
    instructions: [
      "PASSO 1 — Criar o App Registration no Azure (conta pessoal Microsoft):",
      "Acesse portal.azure.com e faça login com a conta Microsoft pessoal que tem o OneDrive",
      "Na barra de pesquisa, digite 'App registrations' e clique no resultado",
      "Clique em '+ New registration'",
      "Name: 'Sistema GIG' | Supported account types: 'Personal Microsoft accounts only' → Clique em 'Register'",
      "PASSO 2 — Copiar o Client ID:",
      "Na página do app criado, copie o 'Application (client) ID' → este é o AZURE_CLIENT_ID",
      "PASSO 3 — Criar o Client Secret:",
      "No menu lateral, clique em 'Certificates & secrets' → '+ New client secret'",
      "Description: 'GIG-Secret' | Expires: '24 months' → Clique em 'Add'",
      "ATENÇÃO: Copie imediatamente o valor na coluna 'Value' (ele some após sair da página)",
      "Este valor é o AZURE_CLIENT_SECRET",
      "PASSO 4 — Adicionar permissões delegadas:",
      "No menu lateral, clique em 'API permissions' → '+ Add a permission'",
      "Clique em 'Microsoft Graph' → 'Delegated permissions'",
      "Pesquise e marque: 'Files.ReadWrite' e 'offline_access'",
      "Clique em 'Add permissions'",
      "PASSO 5 — Configurar a Redirect URI:",
      "No menu lateral, clique em 'Authentication' → '+ Add a platform' → 'Web'",
      "Em Redirect URIs, adicione a URL do sistema terminando em /admin/integracoes",
      "Exemplo: https://seu-dominio.com/admin/integracoes",
      "Marque 'ID tokens' e 'Access tokens' → Clique em 'Save'",
      "PASSO 6 — Cole as 2 credenciais abaixo e salve",
      "PASSO 7 — Após salvar, clique em 'Conectar com Microsoft' para autorizar o acesso ao OneDrive"
    ]
  },
  {
    id: "google-places",
    name: "Google Places (Finder)",
    description: "Busca de leads B2B por termo + localização no módulo Finder de prospecção",
    secretName: "GOOGLE_PLACES_API_KEY",
    docsUrl: "https://console.cloud.google.com/google/maps-apis/credentials",
    icon: Search,
    color: "text-red-500",
    placeholder: "AIzaSy...",
    inputType: "password",
    status: "available",
    instructions: [
      "Acesse console.cloud.google.com e crie (ou reutilize) um projeto",
      "Ative a API 'Places API' em APIs & Services → Library",
      "Vá em APIs & Services → Credentials → Create Credentials → API Key",
      "Restrinja a chave à Places API (recomendado, evita uso indevido)",
      "Cole a chave no campo abaixo"
    ]
  },
];

type IntegrationScope = "system" | "organization";

async function listVaultIntegrations(scope: IntegrationScope) {
  const { data, error } = await supabase.functions.invoke("integrations", {
    body: { action: "list", scope },
  });
  if (error) throw error;
  return (data?.data || []) as Array<{
    provider: string;
    scope: IntegrationScope;
    enabled: boolean;
    configured: boolean;
    updated_at: string;
    config: Record<string, any>;
  }>;
}

async function upsertVaultIntegration(params: {
  provider: string;
  scope: IntegrationScope;
  secrets?: Record<string, any>;
  config?: Record<string, any>;
  enabled?: boolean;
}) {
  const hasSecrets = !!params.secrets && Object.keys(params.secrets).length > 0;
  const hasConfig = typeof params.config !== "undefined";

  const { data, error } = await supabase.functions.invoke("integrations", {
    body: {
      action: "upsert",
      provider: params.provider,
      scope: params.scope,
      ...(typeof params.enabled === "boolean" ? { enabled: params.enabled } : {}),
      ...(hasConfig ? { config: params.config } : {}),
      ...(hasSecrets ? { secrets: params.secrets } : {}),
    },
  });
  if (error) throw error;
  return data?.data;
}

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

// OneDrive Settings Components
function DriveToggle() {
  const queryClient = useQueryClient();
  const { data: enabled, isLoading } = useQuery({
    queryKey: ["drive-enabled"],
    queryFn: async () => {
      const { data } = await sb
        .from("system_settings")
        .select("value")
        .eq("key", "onedrive_enabled")
        .single();
      return data?.value === "true";
    }
  });

  const mutation = useMutation({
    mutationFn: async (value: boolean) => {
      const { error } = await sb
        .from("system_settings")
        .upsert({ key: "onedrive_enabled", value: String(value) }, { onConflict: "key" });
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

  const { data: folderPath, isLoading } = useQuery({
    queryKey: ["drive-folder-id"],
    queryFn: async () => {
      const { data } = await sb
        .from("system_settings")
        .select("value")
        .eq("key", "onedrive_base_folder_path")
        .single();
      return data?.value || "";
    }
  });

  useEffect(() => {
    if (folderPath !== undefined) setLocalValue(folderPath);
  }, [folderPath]);

  const mutation = useMutation({
    mutationFn: async (value: string) => {
      const { error } = await sb
        .from("system_settings")
        .upsert({ key: "onedrive_base_folder_path", value }, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drive-folder-id"] });
      toast.success("Caminho da pasta salvo com sucesso");
    },
    onError: () => toast.error("Erro ao salvar caminho da pasta")
  });

  return (
    <div className="flex gap-2">
      <Input
        id="drive-folder-path"
        placeholder="Clientes GIG"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        disabled={isLoading}
        className="flex-1"
      />
      <Button
        onClick={() => mutation.mutate(localValue)}
        disabled={mutation.isPending || localValue === folderPath}
        size="sm"
      >
        {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
      </Button>
    </div>
  );
}

// AI Provider configurations
const aiProviders = [
  {
    id: "gemini",
    name: "Google Gemini",
    description: "IA do Google com excelente desempenho em português",
    color: "bg-blue-500",
    secretName: "GEMINI_API_KEY",
    instructions: [
      "Acesse aistudio.google.com/apikey",
      "Faça login com sua conta Google",
      "Clique em 'Create API key'",
      "Selecione um projeto existente ou crie um novo",
      "Copie a API Key gerada",
      "Cole no campo abaixo"
    ]
  },
  {
    id: "openai",
    name: "OpenAI (ChatGPT)",
    description: "GPT-4 e modelos da OpenAI",
    color: "bg-green-500",
    secretName: "OPENAI_API_KEY",
    instructions: [
      "Acesse platform.openai.com",
      "Faça login ou crie uma conta",
      "Vá em 'API keys' no menu lateral",
      "Clique em 'Create new secret key'",
      "Dê um nome (ex: 'Cavendish GIG')",
      "Copie a chave imediatamente (só aparece uma vez!)",
      "Cole no campo abaixo",
      "Obs: Requer créditos pagos na conta OpenAI"
    ]
  },
  {
    id: "claude",
    name: "Anthropic (Claude)",
    description: "Claude 3.5 Sonnet - excelente para análises",
    color: "bg-orange-500",
    secretName: "ANTHROPIC_API_KEY",
    instructions: [
      "Acesse console.anthropic.com",
      "Faça login ou crie uma conta",
      "Vá em 'API Keys' no menu",
      "Clique em 'Create Key'",
      "Dê um nome (ex: 'Cavendish GIG')",
      "Copie a chave gerada",
      "Cole no campo abaixo",
      "Obs: Requer plano pago da Anthropic"
    ]
  }
];

function AIProviderSelector() {
  const queryClient = useQueryClient();
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch current AI config
  const { data: currentConfig, isLoading } = useQuery({
    queryKey: ["ai-provider-config"],
    queryFn: async () => {
      const { data } = await sb
        .from("system_settings")
        .select("key, value")
        .in("key", ["ai_provider", "ai_configured"]);

      const settings: Record<string, string> = {};
      (data || []).forEach((row: any) => {
        settings[row.key] = row.value;
      });
      return settings;
    }
  });

  useEffect(() => {
    if (currentConfig?.ai_provider) {
      setSelectedProvider(currentConfig.ai_provider);
    }
  }, [currentConfig]);

  const handleSave = async () => {
    if (!selectedProvider || !apiKey.trim()) {
      toast.error("Selecione um provedor e insira a API Key");
      return;
    }

    setSaving(true);
    try {
      const providerConfig = aiProviders.find(p => p.id === selectedProvider);
      if (!providerConfig) throw new Error("Provedor inválido");

      // Save to vault via edge function
      await supabase.functions.invoke("integrations", {
        body: {
          action: "upsert",
          provider: "ai-provider",
          scope: "system",
          enabled: true,
          secrets: {
            [providerConfig.secretName]: apiKey.trim(),
            AI_PROVIDER: selectedProvider
          },
          config: {
            provider: selectedProvider,
            providerName: providerConfig.name
          }
        }
      });

      // Also save to system_settings for easy access
      await sb.from("system_settings").upsert([
        { key: "ai_provider", value: selectedProvider },
        { key: "ai_configured", value: "true" }
      ], { onConflict: "key" });

      queryClient.invalidateQueries({ queryKey: ["ai-provider-config"] });
      queryClient.invalidateQueries({ queryKey: ["integrations-vault", "system"] });

      toast.success(`${providerConfig.name} configurado com sucesso!`);
      setApiKey("");
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar configuração");
    } finally {
      setSaving(false);
    }
  };

  const selectedProviderConfig = aiProviders.find(p => p.id === selectedProvider);
  const isConfigured = currentConfig?.ai_configured === "true";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          Provedor de Inteligência Artificial
        </CardTitle>
        <CardDescription>
          Escolha qual IA será usada para gerar Código de Ética, analisar documentos e criar atas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? null : isConfigured && currentConfig?.ai_provider ? (
          <Alert className="border-green-500/30 bg-green-500/10">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-700 dark:text-green-300">
              Provedor ativo: <strong>{aiProviders.find(p => p.id === currentConfig.ai_provider)?.name}</strong>.
              O Agente de IA e todas as gerações usarão este provedor.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-amber-500/30 bg-amber-500/10">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-amber-700 dark:text-amber-300">
              <strong>Nenhum provedor configurado.</strong> O Agente de IA e as gerações de documentos estão inativas.
              Selecione um provedor abaixo e insira sua API Key para ativar.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-3 md:grid-cols-3">
          {aiProviders.map((provider) => (
            <div
              key={provider.id}
              onClick={() => setSelectedProvider(provider.id)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedProvider === provider.id
                ? "border-primary bg-primary/5"
                : "border-muted hover:border-primary/50"
                }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-3 h-3 rounded-full ${provider.color}`} />
                <span className="font-medium">{provider.name}</span>
              </div>
              <p className="text-xs text-muted-foreground">{provider.description}</p>
            </div>
          ))}
        </div>

        {selectedProviderConfig && (
          <div className="space-y-4 pt-4 border-t">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Como obter a API Key do {selectedProviderConfig.name}:</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                  {selectedProviderConfig.instructions.map((instruction, idx) => (
                    <li key={idx}>{instruction}</li>
                  ))}
                </ol>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="ai-api-key">{selectedProviderConfig.secretName}</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="ai-api-key"
                    type={showKey ? "text" : "password"}
                    placeholder="Cole sua API Key aqui..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowKey(!showKey)}
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <Button onClick={handleSave} disabled={saving || !apiKey.trim()}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Salvar
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// WhatsApp Provider configurations (módulo Finder) — dois caminhos possíveis, nenhum configurado
// ainda (sem credenciais). Estrutura pronta pra receber as credenciais quando disponíveis.
interface WhatsAppFieldDef {
  name: string;
  label: string;
  placeholder: string;
  secret: boolean;
}

const whatsappProviders: Array<{
  id: "evolution-api" | "whatsapp-official";
  name: string;
  description: string;
  color: string;
  fields: WhatsAppFieldDef[];
  instructions: string[];
}> = [
  {
    id: "evolution-api",
    name: "Evolution API",
    description: "Instância própria/terceirizada — mais rápida de configurar, não é canal oficial da Meta",
    color: "bg-emerald-500",
    fields: [
      { name: "baseUrl", label: "URL Base da Instância", placeholder: "https://sua-evolution.exemplo.com", secret: false },
      { name: "instanceName", label: "Nome da Instância", placeholder: "cavendish-gig", secret: false },
      { name: "EVOLUTION_API_KEY", label: "API Key", placeholder: "sua-api-key", secret: true },
      { name: "EVOLUTION_WEBHOOK_SECRET", label: "Segredo do Webhook (você define)", placeholder: "um-segredo-forte-qualquer", secret: true },
    ],
    instructions: [
      "Suba ou contrate uma instância da Evolution API e crie uma instância do WhatsApp nela",
      "Copie a URL base e o nome da instância",
      "Copie a API Key da instância",
      "Defina um segredo forte para EVOLUTION_WEBHOOK_SECRET (qualquer string) e configure o mesmo valor no painel da Evolution API como header x-webhook-secret ao apontar o webhook para " +
        "{SUPABASE_URL}/functions/v1/whatsapp-webhook",
    ],
  },
  {
    id: "whatsapp-official",
    name: "WhatsApp Cloud API (Meta oficial)",
    description: "Canal oficial da Meta — exige app verificado no Meta for Developers",
    color: "bg-blue-500",
    fields: [
      { name: "phoneNumberId", label: "Phone Number ID", placeholder: "1234567890", secret: false },
      { name: "WHATSAPP_ACCESS_TOKEN", label: "Access Token", placeholder: "EAAG...", secret: true },
      { name: "WHATSAPP_APP_SECRET", label: "App Secret", placeholder: "app secret do Meta for Developers", secret: true },
      { name: "WHATSAPP_VERIFY_TOKEN", label: "Verify Token (você define)", placeholder: "um-token-qualquer", secret: true },
    ],
    instructions: [
      "Crie um app em developers.facebook.com com o produto WhatsApp",
      "Configure um número de telefone e copie o Phone Number ID",
      "Gere um Access Token permanente (System User, recomendado para produção)",
      "Copie o App Secret em Configurações do App → Básico",
      "Defina um Verify Token (qualquer string) e configure o webhook em WhatsApp → Configuration apontando para " +
        "{SUPABASE_URL}/functions/v1/whatsapp-webhook, usando o mesmo Verify Token",
    ],
  },
];

function WhatsAppProviderSelector() {
  const queryClient = useQueryClient();
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: currentConfig, isLoading } = useQuery({
    queryKey: ["whatsapp-provider-config"],
    queryFn: async () => {
      const { data } = await sb
        .from("system_settings")
        .select("key, value")
        .in("key", ["whatsapp_provider", "whatsapp_configured"]);
      const settings: Record<string, string> = {};
      (data || []).forEach((row: any) => { settings[row.key] = row.value; });
      return settings;
    },
  });

  const selectedProviderConfig = whatsappProviders.find((p) => p.id === selectedProvider);
  const isConfigured = currentConfig?.whatsapp_configured === "true";

  const handleSave = async () => {
    if (!selectedProviderConfig) {
      toast.error("Selecione um provedor");
      return;
    }
    const faltando = selectedProviderConfig.fields.filter((f) => !fieldValues[f.name]?.trim());
    if (faltando.length > 0) {
      toast.error(`Preencha: ${faltando.map((f) => f.label).join(", ")}`);
      return;
    }

    setSaving(true);
    try {
      const config: Record<string, string> = { provider: selectedProviderConfig.id };
      const secrets: Record<string, string> = {};
      for (const field of selectedProviderConfig.fields) {
        if (field.secret) secrets[field.name] = fieldValues[field.name].trim();
        else config[field.name] = fieldValues[field.name].trim();
      }

      await supabase.functions.invoke("integrations", {
        body: { action: "upsert", provider: "whatsapp-provider", scope: "system", enabled: true, config, secrets },
      });

      await sb.from("system_settings").upsert(
        [
          { key: "whatsapp_provider", value: selectedProviderConfig.id },
          { key: "whatsapp_configured", value: "true" },
        ],
        { onConflict: "key" },
      );

      queryClient.invalidateQueries({ queryKey: ["whatsapp-provider-config"] });
      queryClient.invalidateQueries({ queryKey: ["integrations-vault", "system"] });
      toast.success(`${selectedProviderConfig.name} configurado com sucesso!`);
      setFieldValues({});
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar configuração");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-emerald-500" />
          WhatsApp (Módulo Finder)
        </CardTitle>
        <CardDescription>
          Escolha qual canal de WhatsApp o Finder usa para conversar com os leads
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? null : isConfigured && currentConfig?.whatsapp_provider ? (
          <Alert className="border-green-500/30 bg-green-500/10">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-700 dark:text-green-300">
              Canal ativo: <strong>{whatsappProviders.find((p) => p.id === currentConfig.whatsapp_provider)?.name}</strong>.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-amber-500/30 bg-amber-500/10">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-amber-700 dark:text-amber-300">
              <strong>Nenhum canal configurado ainda.</strong> O envio/recebimento de WhatsApp do Finder fica inativo
              até um dos dois provedores abaixo ser preenchido.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          {whatsappProviders.map((provider) => (
            <div
              key={provider.id}
              onClick={() => { setSelectedProvider(provider.id); setFieldValues({}); }}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedProvider === provider.id ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-3 h-3 rounded-full ${provider.color}`} />
                <span className="font-medium">{provider.name}</span>
              </div>
              <p className="text-xs text-muted-foreground">{provider.description}</p>
            </div>
          ))}
        </div>

        {selectedProviderConfig && (
          <div className="space-y-4 pt-4 border-t">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Como configurar o {selectedProviderConfig.name}:</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                  {selectedProviderConfig.instructions.map((instruction, idx) => (
                    <li key={idx}>{instruction}</li>
                  ))}
                </ol>
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              {selectedProviderConfig.fields.map((field) => (
                <div key={field.name} className="space-y-2">
                  <Label htmlFor={`wa-${field.name}`}>{field.label}</Label>
                  <div className="relative">
                    <Input
                      id={`wa-${field.name}`}
                      type={field.secret && !showSecrets ? "password" : "text"}
                      placeholder={field.placeholder}
                      value={fieldValues[field.name] || ""}
                      onChange={(e) => setFieldValues({ ...fieldValues, [field.name]: e.target.value })}
                      className={field.secret ? "pr-10" : undefined}
                    />
                    {field.secret && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowSecrets(!showSecrets)}
                      >
                        {showSecrets ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Salvar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminIntegracoes() {
  const [configuring, setConfiguring] = useState<IntegrationConfig | null>(null);
  const [secretValue, setSecretValue] = useState("");
  const [secondarySecretValue, setSecondarySecretValue] = useState("");
  const [tertiarySecretValue, setTertiarySecretValue] = useState("");
  const [quaternarySecretValue, setQuaternarySecretValue] = useState("");
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const [showSecret, setShowSecret] = useState(false);
  const [saving, setSaving] = useState(false);
  const [oneDriveConnecting, setOneDriveConnecting] = useState(false);

  const queryClient = useQueryClient();

  const { data: vaultIntegrations } = useQuery({
    queryKey: ["integrations-vault", "system"],
    queryFn: () => listVaultIntegrations("system"),
    staleTime: 30_000,
    retry: 1,
  });

  const { data: aiStats, isLoading: statsLoading } = useAIStats();

  // Detect OAuth callback from Microsoft after OneDrive authorization
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    // Only handle if there's a saved OneDrive OAuth state (avoids conflicts with other OAuth flows)
    if (!code || !state || !sessionStorage.getItem("onedrive_oauth_state")) return;

    const savedState = sessionStorage.getItem("onedrive_oauth_state");
    if (state !== savedState) {
      toast.error("Erro de segurança OAuth", { description: "State inválido. Tente novamente." });
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }

    sessionStorage.removeItem("onedrive_oauth_state");
    const redirectUri = `${window.location.origin}${window.location.pathname}`;
    window.history.replaceState({}, "", window.location.pathname);

    setOneDriveConnecting(true);
    supabase.functions.invoke("onedrive-auth", {
      body: { action: "callback", code, redirect_uri: redirectUri },
    }).then(({ error }) => {
      setOneDriveConnecting(false);
      if (error) {
        toast.error("Erro ao conectar OneDrive", { description: error.message });
      } else {
        toast.success("OneDrive conectado com sucesso!", {
          description: "O sistema está autorizado a acessar seu OneDrive."
        });
        queryClient.invalidateQueries({ queryKey: ["integrations-vault", "system"] });
      }
    });
  }, []);

  const handleOneDriveConnect = async () => {
    setOneDriveConnecting(true);
    try {
      const state = crypto.randomUUID();
      sessionStorage.setItem("onedrive_oauth_state", state);
      const redirectUri = `${window.location.origin}${window.location.pathname}`;

      const { data, error } = await supabase.functions.invoke("onedrive-auth", {
        body: { action: "init", state, redirect_uri: redirectUri },
      });

      if (error || !data?.authUrl) {
        toast.error("Erro ao iniciar autorização", { description: error?.message || "Tente novamente." });
        setOneDriveConnecting(false);
        return;
      }

      window.location.href = data.authUrl;
    } catch {
      toast.error("Erro inesperado ao conectar OneDrive");
      setOneDriveConnecting(false);
    }
  };

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
    setTertiarySecretValue("");
    setQuaternarySecretValue("");
    const row = getProviderRow(integration.id);
    const initial: Record<string, string> = {};
    if (integration.configFields) {
      for (const field of integration.configFields) {
        initial[field.name] = (row?.config?.[field.name] as string) || "";
      }
    }
    setConfigValues(initial);
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
    if (configuring.tertiarySecretName && !tertiarySecretValue.trim()) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }
    if (configuring.quaternarySecretName && !quaternarySecretValue.trim()) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    setSaving(true);

    try {
      const secrets: Record<string, string> = {
        [configuring.secretName]: secretValue.trim(),
      };
      if (configuring.secondarySecretName) {
        secrets[configuring.secondarySecretName] = secondarySecretValue.trim();
      }
      if (configuring.tertiarySecretName) {
        secrets[configuring.tertiarySecretName] = tertiarySecretValue.trim();
      }
      if (configuring.quaternarySecretName) {
        secrets[configuring.quaternarySecretName] = quaternarySecretValue.trim();
      }

      const config: Record<string, string> = {};
      if (configuring.configFields) {
        for (const field of configuring.configFields) {
          const val = configValues[field.name]?.trim();
          if (val) config[field.name] = val;
        }
      }

      await upsertVaultIntegration({
        provider: configuring.id,
        scope: "system",
        secrets,
        enabled: true,
        ...(Object.keys(config).length > 0 ? { config } : {}),
      });

      queryClient.invalidateQueries({ queryKey: ["integrations-vault", "system"] });

      toast.success(`${configuring.name} configurado com sucesso!`, {
        description: "A integração está ativa e pronta para uso."
      });

      setConfiguring(null);
      setSecretValue("");
      setSecondarySecretValue("");
      setTertiarySecretValue("");
      setConfigValues({});
    } catch (error) {
      toast.error("Erro ao salvar configuração", {
        description: "Tente novamente ou entre em contato com o suporte."
      });
    } finally {
      setSaving(false);
    }
  };

  const isProviderConfigured = (providerId: string) => {
    if (!vaultIntegrations) return false;
    const row = vaultIntegrations.find((r) => r.provider === providerId);
    return !!row?.configured;
  };

  const getProviderRow = (providerId: string) => {
    if (!vaultIntegrations) return null;
    return vaultIntegrations.find((r) => r.provider === providerId) || null;
  };

  const isProviderEnabled = (providerId: string) => {
    const row = getProviderRow(providerId);
    return !!row?.enabled;
  };

  const toggleProvider = async (providerId: string, enabled: boolean) => {
    await upsertVaultIntegration({
      provider: providerId,
      scope: "system",
      enabled,
      // Preserve config for providers that store additional non-secret settings
      config: getProviderRow(providerId)?.config,
    });
    queryClient.invalidateQueries({ queryKey: ["integrations-vault", "system"] });
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

        {/* AI Provider Selection */}
        <AIProviderSelector />

        {/* WhatsApp Provider Selection (Finder) */}
        <WhatsAppProviderSelector />

        {/* Available Integrations */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Integrações Disponíveis</h2>
          <div className="grid gap-4">
            {availableIntegrations.map((integration) => {
              const configured = integration.alwaysConfigured || isProviderConfigured(integration.id);
              const enabled = integration.alwaysConfigured || isProviderEnabled(integration.id);

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

                        {!integration.alwaysConfigured && configured && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Ativo</span>
                            <Switch
                              checked={enabled}
                              onCheckedChange={(value) => {
                                toggleProvider(integration.id, value).catch(() => {
                                  toast.error("Erro ao atualizar integração", {
                                    description: "Tente novamente."
                                  });
                                });
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Key className="h-4 w-4" />
                          <code className="bg-muted px-2 py-1 rounded text-xs">{integration.secretName}</code>
                        </div>
                        {integration.configFields && configured && (() => {
                          const row = getProviderRow(integration.id);
                          return integration.configFields
                            .filter(f => row?.config?.[f.name])
                            .map(f => (
                              <div key={f.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <span className="font-medium">{f.label}:</span>
                                <span className="truncate max-w-[260px]">{row?.config?.[f.name] as string}</span>
                              </div>
                            ));
                        })()}
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
                        {integration.id === "onedrive" && configured && (() => {
                          const row = getProviderRow("onedrive");
                          const authorized = !!row?.config?.oauth_authorized;
                          return authorized ? (
                            <Badge className="bg-green-700 hover:bg-green-700 text-white">
                              <Wifi className="h-3 w-3 mr-1" />
                              OneDrive Conectado
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              variant="default"
                              className="bg-blue-600 hover:bg-blue-700"
                              onClick={handleOneDriveConnect}
                              disabled={oneDriveConnecting}
                            >
                              {oneDriveConnecting
                                ? <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                : <LogIn className="h-4 w-4 mr-1" />}
                              Conectar com Microsoft
                            </Button>
                          );
                        })()}
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

        {/* AI Usage Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              Estatísticas de IA
            </CardTitle>
            <CardDescription>
              Uso do Agente e gerações de IA neste mês
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
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
            {isProviderConfigured("resend") ? (
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

        {/* OneDrive Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-blue-600" />
              Configuração do OneDrive
            </CardTitle>
            <CardDescription>
              Configure a pasta raiz no OneDrive for Business onde serão criadas as pastas dos clientes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Integração Ativada</Label>
                <p className="text-sm text-muted-foreground">Criar pastas automaticamente no OneDrive para cada cliente novo</p>
              </div>
              <DriveToggle />
            </div>
            <div className="space-y-2">
              <Label htmlFor="drive-folder-path">Nome da Pasta Raiz</Label>
              <p className="text-xs text-muted-foreground">
                Nome da pasta no OneDrive for Business onde as subpastas dos clientes serão criadas.
                Exemplo: <strong>Clientes GIG</strong>. A pasta deve existir no OneDrive da conta de serviço.
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
                    {isProviderConfigured(integration.id) && (
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
                <AlertDescription className="text-sm max-h-56 overflow-y-auto">
                  <div className="space-y-1">
                    {configuring.instructions.map((instruction, idx) => {
                      const isHeader = instruction.startsWith("PASSO") || instruction.startsWith("ATENÇÃO");
                      return isHeader ? (
                        <p key={idx} className="font-semibold mt-2 text-foreground">{instruction}</p>
                      ) : (
                        <p key={idx} className="ml-2 text-muted-foreground">• {instruction}</p>
                      );
                    })}
                  </div>
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

                {configuring.tertiarySecretName && (
                  <div className="space-y-2">
                    <Label htmlFor="tertiary-secret-value">{configuring.tertiarySecretName}</Label>
                    <Input
                      id="tertiary-secret-value"
                      type="text"
                      placeholder={configuring.tertiaryPlaceholder}
                      value={tertiarySecretValue}
                      onChange={(e) => setTertiarySecretValue(e.target.value)}
                    />
                  </div>
                )}

                {configuring.quaternarySecretName && (
                  <div className="space-y-2">
                    <Label htmlFor="quaternary-secret-value">{configuring.quaternarySecretName}</Label>
                    <Input
                      id="quaternary-secret-value"
                      type="text"
                      placeholder={configuring.quaternaryPlaceholder}
                      value={quaternarySecretValue}
                      onChange={(e) => setQuaternarySecretValue(e.target.value)}
                    />
                  </div>
                )}

                {configuring.configFields && configuring.configFields.length > 0 && (
                  <div className="space-y-3 pt-2 border-t">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Configurações de Email</p>
                    {configuring.configFields.map((field) => (
                      <div key={field.name} className="space-y-1.5">
                        <Label htmlFor={`config-${field.name}`}>{field.label}</Label>
                        <Input
                          id={`config-${field.name}`}
                          type="text"
                          placeholder={field.placeholder}
                          value={configValues[field.name] || ""}
                          onChange={(e) => setConfigValues(prev => ({ ...prev, [field.name]: e.target.value }))}
                        />
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground">
                      Email remetente: formato <code>Nome &lt;email@dominio.com&gt;</code> — deve usar o domínio verificado no Resend.
                    </p>
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
