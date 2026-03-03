import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface DocumentoComentario {
  id: string;
  documento_id: string;
  user_id: string;
  comentario: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    id: string;
    nome: string | null;
    email: string | null;
    avatar_url: string | null;
  };
  respostas?: DocumentoComentario[];
}

export function useDocumentoComentarios(documentoId: string | undefined) {
  return useQuery({
    queryKey: ["documento-comentarios", documentoId],
    queryFn: async () => {
      if (!documentoId) return [];

      const { data, error } = await supabase
          .from("documento_comentarios")
        .select(`
          *,
          profiles:user_id (
            id,
            nome,
            email,
            avatar_url
          )
        `)
        .eq("documento_id", documentoId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Organizar comentários em árvore (parent -> respostas)
      const comentariosMap = new Map<string, DocumentoComentario>();
      const comentariosRaiz: DocumentoComentario[] = [];

      // Primeiro passo: criar mapa de todos os comentários
      data.forEach((comentario: any) => {
        comentariosMap.set(comentario.id, {
          ...comentario,
          respostas: [],
        });
      });

      // Segundo passo: organizar em árvore
      data.forEach((comentario: any) => {
        const comentarioCompleto = comentariosMap.get(comentario.id)!;

        if (comentario.parent_id) {
          // É uma resposta, adicionar ao parent
          const parent = comentariosMap.get(comentario.parent_id);
          if (parent) {
            parent.respostas!.push(comentarioCompleto);
          }
        } else {
          // É um comentário raiz
          comentariosRaiz.push(comentarioCompleto);
        }
      });

      return comentariosRaiz;
    },
    enabled: !!documentoId,
  });
}

export function useAdicionarComentario() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      documentoId,
      comentario,
      parentId,
    }: {
      documentoId: string;
      comentario: string;
      parentId?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
          .from("documento_comentarios")
        .insert({
          documento_id: documentoId,
          user_id: user.id,
          comentario,
          parent_id: parentId || null,
        })
        .select(`
          *,
          profiles:user_id (
            id,
            nome,
            email,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["documento-comentarios", variables.documentoId],
      });
      toast({
        title: "Comentário adicionado",
        description: "Seu comentário foi publicado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao adicionar comentário",
        description: error.message || "Não foi possível adicionar o comentário.",
        variant: "destructive",
      });
    },
  });
}

export function useEditarComentario() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      comentarioId,
      novoComentario,
      documentoId,
    }: {
      comentarioId: string;
      novoComentario: string;
      documentoId: string;
    }) => {
      const { data, error } = await supabase
          .from("documento_comentarios")
        .update({ comentario: novoComentario })
        .eq("id", comentarioId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["documento-comentarios", variables.documentoId],
      });
      toast({
        title: "Comentário atualizado",
        description: "Seu comentário foi atualizado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar comentário",
        description: error.message || "Não foi possível atualizar o comentário.",
        variant: "destructive",
      });
    },
  });
}

export function useDeletarComentario() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      comentarioId,
      documentoId,
    }: {
      comentarioId: string;
      documentoId: string;
    }) => {
      const { error } = await supabase
          .from("documento_comentarios")
        .delete()
        .eq("id", comentarioId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["documento-comentarios", variables.documentoId],
      });
      toast({
        title: "Comentário removido",
        description: "Seu comentário foi removido com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover comentário",
        description: error.message || "Não foi possível remover o comentário.",
        variant: "destructive",
      });
    },
  });
}
