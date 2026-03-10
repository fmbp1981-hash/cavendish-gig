import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Shield,
  Bell,
  Webhook,
  Server,
  CheckCircle2,
  Palette,
  AlertCircle,
} from "lucide-react";

// ── Status do sistema ─────────────────────────────────────────────────────────

const STATUS_ITEMS = [
  { label: "Segurança dos Dados", desc: "Isolamento por organização (RLS) ativo", ok: true },
  { label: "Criptografia", desc: "TLS 1.2+ em trânsito · AES-256 em repouso", ok: true },
  { label: "Banco de Dados", desc: "Multi-tenant operacional", ok: true },
  { label: "Backups", desc: "Backups automáticos diários", ok: true },
];

// ── Página principal ──────────────────────────────────────────────────────────

export default function AdminConfiguracoes() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground">Configurações gerais do sistema</p>
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
                { label: "Google Drive",     desc: "Armazenamento de documentos dos clientes" },
                { label: "Google Calendar",  desc: "Agendamento de reuniões e Google Meet" },
                { label: "E-mail (Resend)",  desc: "Envio de e-mails transacionais" },
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

        {/* ── Identidade Visual — link para Branding ───────────────────── */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              <CardTitle>Identidade Visual</CardTitle>
            </div>
            <CardDescription>
              Personalize logo, cores e nome exibido para cada organização cliente (white-label)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-foreground">
                  Editor completo disponível em uma página dedicada
                </p>
                <p className="text-sm text-muted-foreground">
                  Configure logo (com upload), favicon, paleta de cores extraída automaticamente
                  da logo e preview em tempo real — tudo em <strong>Admin → Branding</strong>.
                </p>
              </div>
              <Button asChild className="shrink-0">
                <a href="/admin/branding">
                  <Palette className="h-4 w-4 mr-2" />
                  Abrir Editor de Branding
                </a>
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
