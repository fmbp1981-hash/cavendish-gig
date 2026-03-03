import { useState, useMemo } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  Bug,
  CheckCircle2,
  ChevronRight,
  Clock,
  Filter,
  Info,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  Zap,
} from "lucide-react";

import {
  useSystemLogs,
  useLogStats,
  useResolveLog,
  useReopenLog,
  type SystemLog,
  type LogFilters,
} from "@/hooks/useSystemLogs";

// ── Mapa de "causa + correção" por padrão de mensagem ────────────────────────

function getSuggestedFix(log: SystemLog): { causa: string; correcao: string } {
  const msg = (log.message + " " + JSON.stringify(log.details ?? "")).toLowerCase();

  // ── Integrações / Chaves de API ──────────────────────────────────────────
  if (msg.includes("resend") || msg.includes("resend_api_key") || msg.includes("email service not configured"))
    return {
      causa:    "Chave da API do Resend não configurada ou inválida.",
      correcao: "Acesse Admin → Integrações → E-mail (Resend) e informe a API Key.",
    };
  if (msg.includes("openai") || msg.includes("openai_api_key") || msg.includes("nenhum provedor de ia"))
    return {
      causa:    "Provedor de IA (OpenAI) não configurado ou a chave é inválida.",
      correcao: "Acesse Admin → Integrações → OpenAI e informe a API Key correta.",
    };
  if (msg.includes("google") || msg.includes("google_service_account") || msg.includes("drive") || msg.includes("calendar"))
    return {
      causa:    "Credenciais do Google (Service Account) ausentes ou com permissão insuficiente.",
      correcao: "Acesse Admin → Integrações → Google e cole o JSON do Service Account. Verifique se o Drive e Calendar estão habilitados no projeto GCP.",
    };
  if (msg.includes("twilio") || msg.includes("twilio_account_sid"))
    return {
      causa:    "Credenciais do Twilio (Account SID / Auth Token) não configuradas.",
      correcao: "Acesse Admin → Integrações → WhatsApp/SMS (Twilio) e informe as credenciais.",
    };
  if (msg.includes("fireflies") || msg.includes("transcription"))
    return {
      causa:    "Webhook do Fireflies.ai não configurado ou token inválido.",
      correcao: "Configure o webhook no painel do Fireflies.ai apontando para a Edge Function process-transcription e verifique o TRANSCRIPTION_WEBHOOK_SECRET.",
    };
  if (msg.includes("integrations_encryption_key"))
    return {
      causa:    "Secret INTEGRATIONS_ENCRYPTION_KEY não configurado no Supabase.",
      correcao: "O secret foi gerado e setado durante o deploy. Se persistir, rode: supabase secrets set INTEGRATIONS_ENCRYPTION_KEY=<nova-chave-base64-32bytes>",
    };

  // ── Banco de Dados / RLS ─────────────────────────────────────────────────
  if (msg.includes("pgrst116") || msg.includes("not found") || msg.includes("0 rows"))
    return {
      causa:    "Registro não encontrado no banco de dados.",
      correcao: "Verifique se o ID informado existe na tabela. Pode ser um dado excluído ou um ID incorreto passado pelo frontend.",
    };
  if (msg.includes("23505") || msg.includes("duplicate") || msg.includes("unique"))
    return {
      causa:    "Violação de unicidade: já existe um registro com os mesmos dados únicos.",
      correcao: "Verifique se o cadastro já existe antes de inserir. Use upsert quando adequado.",
    };
  if (msg.includes("42501") || msg.includes("permission denied") || msg.includes("rls"))
    return {
      causa:    "Permissão negada pela política de RLS (Row Level Security).",
      correcao: "Verifique se o usuário tem o role correto (admin / consultor / cliente) e se a política RLS da tabela permite a operação para esse role.",
    };
  if (msg.includes("23503") || msg.includes("foreign key") || msg.includes("violates foreign"))
    return {
      causa:    "Violação de chave estrangeira: o registro referenciado não existe.",
      correcao: "Verifique se a organização, usuário ou projeto relacionado existe antes de inserir/atualizar.",
    };
  if (msg.includes("42p01") || msg.includes("does not exist"))
    return {
      causa:    "Tabela ou coluna não encontrada no banco de dados.",
      correcao: "Execute as migrations pendentes: supabase db push --linked",
    };

  // ── Autenticação ─────────────────────────────────────────────────────────
  if (msg.includes("invalid login") || msg.includes("invalid credentials"))
    return {
      causa:    "Credenciais de login inválidas.",
      correcao: "O usuário pode estar usando senha incorreta ou a conta não existe. Verifique em Admin → Usuários.",
    };
  if (msg.includes("jwt") || msg.includes("token") || msg.includes("session"))
    return {
      causa:    "Token JWT inválido, expirado ou ausente.",
      correcao: "Solicite que o usuário faça logout e login novamente. Se persistir, verifique se a SUPABASE_ANON_KEY está correta no Vercel.",
    };
  if (msg.includes("email not confirmed"))
    return {
      causa:    "O e-mail do usuário não foi confirmado.",
      correcao: "Peça ao usuário que verifique a caixa de entrada e clique no link de confirmação. Ou confirme manualmente em Admin → Usuários.",
    };

  // ── Rede / Fetch ─────────────────────────────────────────────────────────
  if (msg.includes("fetch") || msg.includes("econnrefused") || msg.includes("network") || msg.includes("timeout"))
    return {
      causa:    "Erro de rede ou timeout ao chamar serviço externo.",
      correcao: "Verifique a conectividade do Supabase com o serviço externo. Pode ser instabilidade temporária — tente novamente. Se persistir, verifique se a URL da integração está correta.",
    };

  // ── Frontend ─────────────────────────────────────────────────────────────
  if (log.source === "frontend")
    return {
      causa:    "Erro de JavaScript não tratado no browser do usuário.",
      correcao: "Verifique os detalhes (stack trace) para identificar o componente. Pode ser um estado inválido ou dado nulo não tratado.",
    };

  // ── Cron ─────────────────────────────────────────────────────────────────
  if (log.source === "cron")
    return {
      causa:    "Falha na execução do job agendado.",
      correcao: "Verifique se o CRON_SECRET está configurado e se a Edge Function correspondente está deployada.",
    };

  return {
    causa:    "Erro interno não categorizado.",
    correcao: "Analise o campo 'Detalhes técnicos' abaixo para identificar a causa raiz. Se persistir, contate o suporte da IntelliX.AI.",
  };
}

// ── Helpers de UI ─────────────────────────────────────────────────────────────

const LEVEL_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  error:   { label: "Erro",   color: "bg-red-50 text-red-700 border-red-200",    icon: <Bug className="h-3.5 w-3.5" /> },
  warning: { label: "Aviso",  color: "bg-amber-50 text-amber-700 border-amber-200", icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  info:    { label: "Info",   color: "bg-blue-50 text-blue-700 border-blue-200", icon: <Info className="h-3.5 w-3.5" /> },
};

const SOURCE_LABELS: Record<string, string> = {
  edge_function: "Edge Function",
  frontend:      "Frontend (Browser)",
  auth:          "Autenticação",
  cron:          "Job Agendado",
  integration:   "Integração",
  database:      "Banco de Dados",
};

function LevelBadge({ level }: { level: string }) {
  const cfg = LEVEL_CONFIG[level] ?? LEVEL_CONFIG.info;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function timeAgo(iso: string) {
  return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: ptBR });
}

function formatFull(iso: string) {
  return format(new Date(iso), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR });
}

// ── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  title, value, sub, icon, variant = "default",
}: {
  title: string; value: number | string; sub?: string;
  icon: React.ReactNode; variant?: "default" | "danger" | "warning" | "success";
}) {
  const colors = {
    default: "text-foreground",
    danger:  "text-red-600",
    warning: "text-amber-600",
    success: "text-green-600",
  };
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{title}</p>
            <p className={`text-3xl font-bold mt-1 ${colors[variant]}`}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          <div className="mt-0.5 opacity-70">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Detalhe do log ────────────────────────────────────────────────────────────

function LogDetailDialog({
  log,
  open,
  onClose,
}: {
  log: SystemLog | null;
  open: boolean;
  onClose: () => void;
}) {
  const [notes, setNotes] = useState("");
  const resolve = useResolveLog();
  const reopen  = useReopenLog();

  if (!log) return null;

  const { causa, correcao } = getSuggestedFix(log);

  const handleResolve = async () => {
    await resolve.mutateAsync({ id: log.id, resolution_notes: notes });
    toast.success("Log marcado como resolvido");
    onClose();
  };

  const handleReopen = async () => {
    await reopen.mutateAsync(log.id);
    toast.info("Log reaberto");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LevelBadge level={log.level} />
            <span className="text-base font-semibold">Detalhes do Registro</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-1">
          {/* Identificação */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Origem</p>
              <p className="font-medium mt-0.5">
                {SOURCE_LABELS[log.source] ?? log.source}
                {log.function_name && (
                  <span className="text-muted-foreground ml-1">→ {log.function_name}</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Data/Hora</p>
              <p className="font-medium mt-0.5">{formatFull(log.created_at)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Status</p>
              <p className="mt-0.5">
                {log.resolved ? (
                  <span className="text-green-600 font-medium flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" /> Resolvido
                  </span>
                ) : (
                  <span className="text-red-600 font-medium flex items-center gap-1">
                    <ShieldAlert className="h-4 w-4" /> Pendente
                  </span>
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">ID do Registro</p>
              <p className="font-mono text-xs text-muted-foreground mt-0.5 break-all">{log.id}</p>
            </div>
          </div>

          <Separator />

          {/* Mensagem */}
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">Mensagem do erro</p>
            <div className="bg-muted/40 rounded-md px-4 py-3 font-mono text-sm break-words">
              {log.message}
            </div>
          </div>

          {/* Causa + Correção */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
            <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm">
              <AlertTriangle className="h-4 w-4" />
              Diagnóstico automático
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Causa provável</p>
              <p className="text-sm text-amber-900">{causa}</p>
            </div>
            <Separator className="border-amber-200" />
            <div>
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">Como corrigir</p>
              <p className="text-sm text-green-900">{correcao}</p>
            </div>
          </div>

          {/* Detalhes técnicos */}
          {log.details && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Detalhes técnicos</p>
              <pre className="bg-zinc-900 text-green-400 rounded-md p-3 text-xs overflow-x-auto max-h-48 whitespace-pre-wrap break-all">
                {JSON.stringify(log.details, null, 2)}
              </pre>
            </div>
          )}

          {/* Notas de resolução existentes */}
          {log.resolved && log.resolution_notes && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3">
              <p className="text-xs font-semibold text-green-700 mb-1">Resolução registrada</p>
              <p className="text-sm text-green-900">{log.resolution_notes}</p>
              {log.resolved_at && (
                <p className="text-xs text-green-600 mt-1">{formatFull(log.resolved_at)}</p>
              )}
            </div>
          )}

          <Separator />

          {/* Ações */}
          {!log.resolved ? (
            <div className="space-y-3">
              <div>
                <Label htmlFor="resolution-notes" className="text-sm">
                  Nota de resolução <span className="text-muted-foreground font-normal">(opcional)</span>
                </Label>
                <Textarea
                  id="resolution-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Descreva o que foi feito para resolver este problema…"
                  className="mt-1.5 min-h-20 text-sm"
                />
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={handleResolve}
                  disabled={resolve.isPending}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {resolve.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  )}
                  Marcar como resolvido
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={handleReopen}
                disabled={reopen.isPending}
                size="sm"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reabrir
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Linha da tabela ───────────────────────────────────────────────────────────

function LogRow({ log, onClick }: { log: SystemLog; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left group hover:bg-muted/50 transition-colors border-b border-border last:border-0"
    >
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Level badge */}
        <div className="w-20 shrink-0">
          <LevelBadge level={log.level} />
        </div>

        {/* Origem + mensagem */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs text-muted-foreground font-medium">
              {SOURCE_LABELS[log.source] ?? log.source}
            </span>
            {log.function_name && (
              <>
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-mono">{log.function_name}</span>
              </>
            )}
          </div>
          <p className="text-sm text-foreground truncate font-medium">{log.message}</p>
        </div>

        {/* Status */}
        <div className="w-24 shrink-0 flex justify-center">
          {log.resolved ? (
            <span className="inline-flex items-center gap-1 text-xs text-green-600">
              <CheckCircle2 className="h-3.5 w-3.5" /> Resolvido
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-red-500">
              <ShieldAlert className="h-3.5 w-3.5" /> Pendente
            </span>
          )}
        </div>

        {/* Tempo */}
        <div className="w-32 shrink-0 text-right">
          <p className="text-xs text-muted-foreground" title={formatFull(log.created_at)}>
            {timeAgo(log.created_at)}
          </p>
        </div>

        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      </div>
    </button>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

const DATE_PRESETS = [
  { label: "Últimas 24h", hours: 24 },
  { label: "Últimos 7 dias", hours: 168 },
  { label: "Últimos 30 dias", hours: 720 },
];

export default function AdminLogs() {
  const [filters, setFilters] = useState<LogFilters>({ resolved: "all" as unknown as boolean });
  const [search, setSearch] = useState("");
  const [datePreset, setDatePreset] = useState<string>("168"); // 7 dias
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);

  const from = useMemo(() => {
    const h = parseInt(datePreset, 10);
    return new Date(Date.now() - h * 60 * 60 * 1000).toISOString();
  }, [datePreset]);

  const activeFilters: LogFilters = useMemo(() => ({
    ...filters,
    search: search.trim() || undefined,
    from,
  }), [filters, search, from]);

  const { data: logs = [], isLoading, refetch, isFetching } = useSystemLogs(activeFilters);
  const { data: stats } = useLogStats();

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Logs do Sistema</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Monitoramento de erros, avisos e falhas em Edge Functions, integrações e frontend
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Erros críticos pendentes"
            value={stats?.unresolvedError ?? "—"}
            sub="Requerem atenção"
            icon={<Bug className="h-6 w-6 text-red-500" />}
            variant={stats?.unresolvedError ? "danger" : "success"}
          />
          <StatCard
            title="Avisos pendentes"
            value={stats?.warnings ?? "—"}
            sub="Verificar oportunamente"
            icon={<AlertTriangle className="h-6 w-6 text-amber-500" />}
            variant={stats?.warnings ? "warning" : "default"}
          />
          <StatCard
            title="Registros (últimas 24h)"
            value={stats?.last24h ?? "—"}
            sub="Todos os níveis"
            icon={<Clock className="h-6 w-6 text-blue-500" />}
          />
          <StatCard
            title="Total resolvidos"
            value={
              stats
                ? `${stats.total - stats.unresolved} / ${stats.total}`
                : "—"
            }
            sub="Histórico completo"
            icon={<CheckCircle2 className="h-6 w-6 text-green-500" />}
            variant="success"
          />
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-semibold">Filtros</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-end gap-3">
              {/* Busca */}
              <div className="flex-1 min-w-48 space-y-1">
                <Label className="text-xs text-muted-foreground">Busca na mensagem</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por mensagem…"
                    className="pl-8 h-9 text-sm"
                  />
                </div>
              </div>

              {/* Nível */}
              <div className="space-y-1 w-36">
                <Label className="text-xs text-muted-foreground">Nível</Label>
                <Select
                  value={(filters.level as string) ?? "all"}
                  onValueChange={(v) => setFilters(f => ({ ...f, level: v as LogFilters["level"] }))}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os níveis</SelectItem>
                    <SelectItem value="error">Erro</SelectItem>
                    <SelectItem value="warning">Aviso</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Origem */}
              <div className="space-y-1 w-44">
                <Label className="text-xs text-muted-foreground">Origem</Label>
                <Select
                  value={(filters.source as string) ?? "all"}
                  onValueChange={(v) => setFilters(f => ({ ...f, source: v }))}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as origens</SelectItem>
                    <SelectItem value="edge_function">Edge Function</SelectItem>
                    <SelectItem value="frontend">Frontend</SelectItem>
                    <SelectItem value="auth">Autenticação</SelectItem>
                    <SelectItem value="cron">Job Agendado</SelectItem>
                    <SelectItem value="integration">Integração</SelectItem>
                    <SelectItem value="database">Banco de Dados</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div className="space-y-1 w-36">
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Select
                  value={
                    filters.resolved === undefined || (filters.resolved as unknown) === "all"
                      ? "all"
                      : filters.resolved
                      ? "resolved"
                      : "pending"
                  }
                  onValueChange={(v) =>
                    setFilters(f => ({
                      ...f,
                      resolved: v === "all" ? ("all" as unknown as boolean) : v === "resolved",
                    }))
                  }
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pending">Pendentes</SelectItem>
                    <SelectItem value="resolved">Resolvidos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Período */}
              <div className="space-y-1 w-40">
                <Label className="text-xs text-muted-foreground">Período</Label>
                <Select value={datePreset} onValueChange={setDatePreset}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DATE_PRESETS.map(p => (
                      <SelectItem key={p.hours} value={String(p.hours)}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Reset filtros */}
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-muted-foreground"
                onClick={() => {
                  setFilters({ resolved: "all" as unknown as boolean });
                  setSearch("");
                  setDatePreset("168");
                }}
              >
                Limpar filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de logs */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Registros
              {!isLoading && (
                <Badge variant="secondary" className="font-normal">
                  {logs.length} {logs.length === 1 ? "registro" : "registros"}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center gap-3 py-16 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Carregando logs…
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                <CheckCircle2 className="h-12 w-12 text-green-500 mb-3" />
                <p className="text-base font-semibold text-foreground">Nenhum registro encontrado</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {search || filters.level !== undefined
                    ? "Tente ajustar os filtros."
                    : "O sistema está funcionando sem erros ou avisos no período selecionado."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {/* Header da tabela */}
                <div className="flex items-center gap-3 px-4 py-2 bg-muted/30 text-xs text-muted-foreground font-medium border-b">
                  <div className="w-20">Nível</div>
                  <div className="flex-1">Origem / Mensagem</div>
                  <div className="w-24 text-center">Status</div>
                  <div className="w-32 text-right">Quando</div>
                  <div className="w-4" />
                </div>
                {logs.map(log => (
                  <LogRow key={log.id} log={log} onClick={() => setSelectedLog(log)} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <LogDetailDialog
        log={selectedLog}
        open={!!selectedLog}
        onClose={() => setSelectedLog(null)}
      />
    </AdminLayout>
  );
}
