import { useAuth } from '@/contexts/AuthContext';
import { ClienteLayout } from '@/components/layout/ClienteLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import {
  Handshake,
  ClipboardCheck,
  GraduationCap,
  ScrollText,
  FileText,
  FolderOpen,
  ArrowRight,
} from 'lucide-react';

const acessos = [
  {
    title: 'Diagnóstico de Maturidade',
    description: 'Responda o questionário de governança da organização.',
    icon: ClipboardCheck,
    href: '/meu-projeto/diagnostico',
    color: 'text-blue-600',
  },
  {
    title: 'Treinamentos',
    description: 'Acesse os módulos de compliance e integridade.',
    icon: GraduationCap,
    href: '/meu-projeto/treinamentos',
    color: 'text-green-600',
  },
  {
    title: 'Código de Ética',
    description: 'Visualize e assine o Código de Ética da organização.',
    icon: ScrollText,
    href: '/meu-projeto/codigo-etica',
    color: 'text-amber-600',
  },
  {
    title: 'Documentos Necessários',
    description: 'Checklist de documentos requeridos pelo programa.',
    icon: FileText,
    href: '/meu-projeto/documentos-necessarios',
    color: 'text-purple-600',
  },
  {
    title: 'Repositório de Documentos',
    description: 'Envie e visualize documentos da organização.',
    icon: FolderOpen,
    href: '/meu-projeto/documentos',
    color: 'text-indigo-600',
  },
];

export default function ParceiroDashboard() {
  const { profile } = useAuth();

  return (
    <ClienteLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-primary/10">
            <Handshake className="w-8 h-8 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">
                Bem-vindo, {profile?.nome || 'Parceiro'}
              </h1>
              <Badge variant="outline" className="border-primary text-primary">
                Parceiro
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              Acesse as funcionalidades do programa de Governança, Integridade e Compliance.
            </p>
          </div>
        </div>

        {/* Acesso rápido */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Acesso Rápido</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {acessos.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.href} className="hover:shadow-md transition-shadow group">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Icon className={`w-5 h-5 ${item.color}`} />
                      {item.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                    <Button variant="outline" size="sm" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors" asChild>
                      <Link to={item.href}>
                        Acessar
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Info */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">
              Como <strong>parceiro</strong>, você tem acesso às funcionalidades de compliance e governança.
              Para dúvidas ou solicitações adicionais, entre em contato com o consultor responsável pela sua organização.
            </p>
          </CardContent>
        </Card>
      </div>
    </ClienteLayout>
  );
}
