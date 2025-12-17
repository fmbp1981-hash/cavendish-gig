import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MessageSquare,
  Send,
  Reply,
  Edit2,
  Trash2,
  MoreVertical,
  X
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  useDocumentoComentarios,
  useAdicionarComentario,
  useEditarComentario,
  useDeletarComentario,
  type DocumentoComentario,
} from "@/hooks/useDocumentoComentarios";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

interface DocumentoComentariosProps {
  documentoId: string;
}

function ComentarioItem({
  comentario,
  documentoId,
  nivel = 0
}: {
  comentario: DocumentoComentario;
  documentoId: string;
  nivel?: number;
}) {
  const [respondendo, setRespondendo] = useState(false);
  const [editando, setEditando] = useState(false);
  const [deletando, setDeletando] = useState(false);
  const [respostaTexto, setRespostaTexto] = useState("");
  const [edicaoTexto, setEdicaoTexto] = useState(comentario.comentario);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  const adicionarComentario = useAdicionarComentario();
  const editarComentario = useEditarComentario();
  const deletarComentario = useDeletarComentario();

  // Get current user
  useState(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setCurrentUserId(data.user.id);
    });
  });

  const handleResponder = async () => {
    if (!respostaTexto.trim()) return;

    await adicionarComentario.mutateAsync({
      documentoId,
      comentario: respostaTexto,
      parentId: comentario.id,
    });

    setRespostaTexto("");
    setRespondendo(false);
  };

  const handleEditar = async () => {
    if (!edicaoTexto.trim()) return;

    await editarComentario.mutateAsync({
      comentarioId: comentario.id,
      novoComentario: edicaoTexto,
      documentoId,
    });

    setEditando(false);
  };

  const handleDeletar = async () => {
    await deletarComentario.mutateAsync({
      comentarioId: comentario.id,
      documentoId,
    });
    setDeletando(false);
  };

  const isOwner = currentUserId === comentario.user_id;
  const maxNivel = 3; // Máximo de níveis de respostas

  return (
    <div className={`${nivel > 0 ? "ml-8 mt-3" : "mb-4"}`}>
      <div className="flex gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={comentario.profiles?.avatar_url || undefined} />
          <AvatarFallback>
            {comentario.profiles?.nome?.charAt(0).toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-start justify-between mb-1">
              <div>
                <p className="text-sm font-medium">
                  {comentario.profiles?.nome || "Usuário"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comentario.created_at), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                  {comentario.updated_at !== comentario.created_at && " (editado)"}
                </p>
              </div>

              {isOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditando(true)}>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setDeletando(true)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Deletar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {editando ? (
              <div className="space-y-2">
                <Textarea
                  value={edicaoTexto}
                  onChange={(e) => setEdicaoTexto(e.target.value)}
                  className="min-h-[60px]"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleEditar}
                    disabled={editarComentario.isPending}
                  >
                    Salvar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditando(false);
                      setEdicaoTexto(comentario.comentario);
                    }}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm whitespace-pre-wrap">{comentario.comentario}</p>
            )}
          </div>

          {!editando && nivel < maxNivel && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-1 h-7 text-xs"
              onClick={() => setRespondendo(!respondendo)}
            >
              <Reply className="h-3 w-3 mr-1" />
              Responder
            </Button>
          )}

          {respondendo && (
            <div className="mt-2 space-y-2">
              <Textarea
                placeholder="Escreva sua resposta..."
                value={respostaTexto}
                onChange={(e) => setRespostaTexto(e.target.value)}
                className="min-h-[60px]"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleResponder}
                  disabled={adicionarComentario.isPending || !respostaTexto.trim()}
                >
                  <Send className="h-4 w-4 mr-1" />
                  Enviar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setRespondendo(false);
                    setRespostaTexto("");
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* Renderizar respostas */}
          {comentario.respostas && comentario.respostas.length > 0 && (
            <div className="mt-3">
              {comentario.respostas.map((resposta) => (
                <ComentarioItem
                  key={resposta.id}
                  comentario={resposta}
                  documentoId={documentoId}
                  nivel={nivel + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deletando} onOpenChange={setDeletando}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar comentário?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O comentário e todas as suas respostas serão
              removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletar}>
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function DocumentoComentarios({ documentoId }: DocumentoComentariosProps) {
  const [novoComentario, setNovoComentario] = useState("");
  const { data: comentarios, isLoading } = useDocumentoComentarios(documentoId);
  const adicionarComentario = useAdicionarComentario();

  const handleAdicionarComentario = async () => {
    if (!novoComentario.trim()) return;

    await adicionarComentario.mutateAsync({
      documentoId,
      comentario: novoComentario,
    });

    setNovoComentario("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comentários
        </CardTitle>
        <CardDescription>
          Discussão e anotações sobre este documento
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Adicionar novo comentário */}
        <div className="space-y-2">
          <Textarea
            placeholder="Adicione um comentário..."
            value={novoComentario}
            onChange={(e) => setNovoComentario(e.target.value)}
            className="min-h-[80px]"
          />
          <Button
            onClick={handleAdicionarComentario}
            disabled={adicionarComentario.isPending || !novoComentario.trim()}
          >
            <Send className="h-4 w-4 mr-2" />
            Comentar
          </Button>
        </div>

        {/* Lista de comentários */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : comentarios && comentarios.length > 0 ? (
          <div className="space-y-1">
            {comentarios.map((comentario) => (
              <ComentarioItem
                key={comentario.id}
                comentario={comentario}
                documentoId={documentoId}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhum comentário ainda. Seja o primeiro a comentar!
          </p>
        )}
      </CardContent>
    </Card>
  );
}
