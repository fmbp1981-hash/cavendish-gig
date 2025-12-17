import { useState } from "react";
import { useDocumentoVersoes, DocumentoVersao } from "@/hooks/useDocumentoVersoes";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { History, RotateCcw, FileText, Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocumentoHistoricoProps {
  documentoId: string;
  documentoNome: string;
}

export function DocumentoHistorico({
  documentoId,
  documentoNome,
}: DocumentoHistoricoProps) {
  const [open, setOpen] = useState(false);
  const [versaoParaRestaurar, setVersaoParaRestaurar] = useState<DocumentoVersao | null>(null);

  const {
    versoes,
    isLoading,
    isRestoring,
    restaurar,
    getTotalVersoes,
    hasVersoesAntigas,
    formatarMudanca,
    formatarDataRelativa,
  } = useDocumentoVersoes(documentoId);

  const handleRestaurar = () => {
    if (versaoParaRestaurar) {
      restaurar(versaoParaRestaurar.version_number, {
        onSuccess: () => {
          setVersaoParaRestaurar(null);
          setOpen(false);
        },
      });
    }
  };

  const getIconePorTipo = (changeType: string) => {
    switch (changeType) {
      case 'create':
        return <FileText className="h-4 w-4 text-green-500" />;
      case 'update':
        return <RotateCcw className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCorBadgePorTipo = (changeType: string) => {
    switch (changeType) {
      case 'create':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'update':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <History className="h-4 w-4 mr-2" />
            Histórico
            {hasVersoesAntigas() && (
              <Badge variant="secondary" className="ml-2">
                {getTotalVersoes()}
              </Badge>
            )}
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Histórico de Versões</DialogTitle>
            <DialogDescription>
              {documentoNome} • {getTotalVersoes()} versão{getTotalVersoes() !== 1 ? 'ões' : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : versoes && versoes.length > 0 ? (
              <div className="space-y-4 pb-4">
                {versoes.map((versao, index) => (
                  <Card
                    key={versao.id}
                    className={cn(
                      "p-4 relative",
                      index === 0 && "border-primary border-2"
                    )}
                  >
                    {/* Timeline dot */}
                    {index !== versoes.length - 1 && (
                      <div className="absolute left-7 top-12 bottom-0 w-0.5 bg-gray-200" />
                    )}

                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <Avatar className="h-10 w-10 mt-1">
                        <AvatarImage src={versao.created_by_avatar || ''} />
                        <AvatarFallback>
                          {versao.created_by_name?.charAt(0) || <User className="h-5 w-5" />}
                        </AvatarFallback>
                      </Avatar>

                      {/* Conteúdo */}
                      <div className="flex-1 space-y-2">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className={cn("px-2 py-0.5", getCorBadgePorTipo(versao.change_type))}>
                              <span className="flex items-center gap-1">
                                {getIconePorTipo(versao.change_type)}
                                v{versao.version_number}
                              </span>
                            </Badge>
                            {index === 0 && (
                              <Badge variant="default">Atual</Badge>
                            )}
                          </div>

                          <span className="text-xs text-muted-foreground">
                            {formatarDataRelativa(versao.created_at)}
                          </span>
                        </div>

                        {/* Autor */}
                        <div className="text-sm">
                          <span className="font-medium">{versao.created_by_name || 'Sistema'}</span>
                          <span className="text-muted-foreground mx-1">•</span>
                          <span className="text-muted-foreground">{formatarMudanca(versao)}</span>
                        </div>

                        {/* Detalhes da versão */}
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div>Nome: {versao.nome}</div>
                          {versao.descricao && (
                            <div>Descrição: {versao.descricao}</div>
                          )}
                          {versao.tamanho && (
                            <div>Tamanho: {(versao.tamanho / 1024 / 1024).toFixed(2)} MB</div>
                          )}
                        </div>

                        {/* Campos alterados */}
                        {versao.changed_fields && versao.changed_fields.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {versao.changed_fields.map((campo) => (
                              <Badge
                                key={campo}
                                variant="outline"
                                className="text-xs"
                              >
                                {campo}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Ações */}
                        {index !== 0 && (
                          <div className="flex gap-2 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setVersaoParaRestaurar(versao)}
                              disabled={isRestoring}
                            >
                              <RotateCcw className="h-3 w-3 mr-1" />
                              Restaurar
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(versao.url, '_blank')}
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              Visualizar
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma versão encontrada
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Restauração */}
      <AlertDialog open={!!versaoParaRestaurar} onOpenChange={() => setVersaoParaRestaurar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurar versão {versaoParaRestaurar?.version_number}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá substituir o documento atual pela versão selecionada.
              A versão atual será salva no histórico e poderá ser restaurada posteriormente.
              <div className="mt-4 p-3 bg-muted rounded-md text-sm">
                <strong>Versão a ser restaurada:</strong>
                <div className="mt-1">{versaoParaRestaurar?.nome}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {versaoParaRestaurar && formatarDataRelativa(versaoParaRestaurar.created_at)}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRestoring}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestaurar}
              disabled={isRestoring}
              className="bg-primary"
            >
              {isRestoring ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Restaurando...
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Restaurar Versão
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
