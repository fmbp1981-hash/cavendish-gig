import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Shield, 
  Database, 
  Bell, 
  Mail,
  Webhook,
  Globe,
  Lock,
  Server,
  CheckCircle2
} from "lucide-react";

export default function AdminConfiguracoes() {
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
