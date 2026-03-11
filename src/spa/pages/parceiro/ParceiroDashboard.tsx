import { useAuth } from '@/contexts/AuthContext';
import { ParceiroLayout } from '@/components/layout/ParceiroLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import {
  Handshake,
  ShieldCheck,
  FileCheck,
  CalendarCheck,
  Leaf,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

const acessos = [
  {
    title: 'Compliance',
    description: 'Gestão integrada do programa de compliance com KPIs, riscos, políticas e mais.',
    icon: ShieldCheck,
    href: '/parceiro/compliance',
    color: 'text-primary',
  },
  {
    title: 'Adesão Ética',
    description: 'Acompanhe as adesões ao Código de Ética por organização e colaborador.',
    icon: FileCheck,
    href: '/parceiro/adesao-etica',
    color: 'text-green-600',
  },
  {
    title: 'Calendário Regulatório',
    description: 'Agenda de obrigações legais e regulatórias com alertas de vencimento.',
    icon: CalendarCheck,
    href: '/parceiro/compliance-calendar',
    color: 'text-blue-600',
  },
  {
    title: 'ESG',
    description: 'Indicadores Ambientais, Sociais e de Governança das organizações.',
    icon: Leaf,
    href: '/parceiro/esg',
    color: 'text-emerald-600',
  },
  {
    title: 'Código de Ética',
    description: 'Geração de códigos de ética personalizados usando inteligência artificial.',
    icon: Sparkles,
    href: '/parceiro/codigo-etica',
    color: 'text-amber-600',
  },
];

export default function ParceiroDashboard() {
  const { profile } = useAuth();

  return (
    <ParceiroLayout>
      <div className="space-y-6">
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
              <Badge variant="outline" className="border-emerald-600 text-emerald-700">
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
              Como <strong>parceiro</strong>, você tem acesso às funcionalidades de compliance, ESG e governança.
              Para dúvidas ou solicitações adicionais, entre em contato com o consultor responsável pela sua organização.
            </p>
          </CardContent>
        </Card>
      </div>
    </ParceiroLayout>
  );
}
