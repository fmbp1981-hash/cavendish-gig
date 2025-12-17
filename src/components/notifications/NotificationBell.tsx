import { useState } from 'react';
import { Bell, Check, CheckCheck, FileCheck, FileX, FilePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useNotificacoes } from '@/hooks/useNotificacoes';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const tipoIcons: Record<string, React.ReactNode> = {
  documento_enviado: <FilePlus className="h-4 w-4 text-primary" />,
  documento_aprovado: <FileCheck className="h-4 w-4 text-secondary" />,
  documento_rejeitado: <FileX className="h-4 w-4 text-destructive" />,
};

const tipoBg: Record<string, string> = {
  documento_enviado: 'bg-primary/10',
  documento_aprovado: 'bg-secondary/10',
  documento_rejeitado: 'bg-destructive/10',
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const {
    notificacoes,
    countNaoLidas,
    isLoading,
    marcarComoLida,
    marcarTodasComoLidas,
  } = useNotificacoes();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {countNaoLidas > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center font-medium animate-scale-in">
              {countNaoLidas > 9 ? '9+' : countNaoLidas}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h4 className="font-semibold text-foreground">Notificações</h4>
          {countNaoLidas > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => marcarTodasComoLidas()}
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Marcar todas como lidas
            </Button>
          )}
        </div>

        {/* Content */}
        <ScrollArea className="h-[320px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : notificacoes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center px-4">
              <Bell className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">
                Nenhuma notificação
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notificacoes.map((notificacao) => (
                <button
                  key={notificacao.id}
                  onClick={() => {
                    if (!notificacao.lida) {
                      marcarComoLida(notificacao.id);
                    }
                  }}
                  className={cn(
                    'w-full text-left p-4 hover:bg-muted/50 transition-colors',
                    !notificacao.lida && 'bg-primary/5'
                  )}
                >
                  <div className="flex gap-3">
                    <div
                      className={cn(
                        'h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0',
                        tipoBg[notificacao.tipo] || 'bg-muted'
                      )}
                    >
                      {tipoIcons[notificacao.tipo] || (
                        <Bell className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={cn(
                            'text-sm',
                            !notificacao.lida
                              ? 'font-medium text-foreground'
                              : 'text-muted-foreground'
                          )}
                        >
                          {notificacao.titulo}
                        </p>
                        {!notificacao.lida && (
                          <span className="h-2 w-2 bg-primary rounded-full flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      {notificacao.mensagem && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {notificacao.mensagem}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        {formatDistanceToNow(new Date(notificacao.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
