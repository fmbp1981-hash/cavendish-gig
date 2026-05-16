import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BibliotecaCategoria {
  id: string;
  nome: string;
  descricao: string | null;
  icone: string | null;
  ordem: number;
  ativo: boolean;
}

export interface BibliotecaArquivo {
  id: string;
  categoria_id: string | null;
  nome: string;
  descricao: string | null;
  arquivo_url: string;
  storage_path: string;
  formato: string;
  tamanho_bytes: number | null;
  tags: string[];
  download_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  categoria?: BibliotecaCategoria | null;
}

export interface UploadBibliotecaPayload {
  file: File;
  nome: string;
  descricao?: string;
  categoriaId?: string | null;
  tags?: string[];
}

interface ArquivosFilters {
  categoriaId?: string;
  busca?: string;
  formato?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Extract a short format string from MIME type or file extension */
export function extractFormato(file: File): string {
  const mimeMap: Record<string, string> = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "application/vnd.ms-excel": "xls",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
    "application/vnd.ms-powerpoint": "ppt",
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/gif": "gif",
    "image/webp": "webp",
    "text/plain": "txt",
    "text/csv": "csv",
  };

  if (file.type && mimeMap[file.type]) {
    return mimeMap[file.type];
  }

  const ext = file.name.split(".").pop();
  return ext ? ext.toLowerCase() : "arquivo";
}

export function formatBytes(bytes: number | null): string {
  if (bytes === null || bytes === 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function getFormatoColor(formato: string): string {
  const map: Record<string, string> = {
    pdf: "text-red-600",
    docx: "text-blue-600",
    doc: "text-blue-600",
    xlsx: "text-green-600",
    xls: "text-green-600",
    pptx: "text-orange-600",
    ppt: "text-orange-600",
    png: "text-purple-600",
    jpg: "text-purple-600",
    jpeg: "text-purple-600",
    gif: "text-purple-600",
    webp: "text-purple-600",
    csv: "text-teal-600",
    txt: "text-gray-600",
  };
  return map[formato.toLowerCase()] ?? "text-gray-500";
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useBibliotecaCategorias() {
  return useQuery({
    queryKey: ["biblioteca_categorias"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("biblioteca_categorias" as unknown as "ai_generations")
        .select("*")
        .eq("ativo" as never, true)
        .order("ordem" as never, { ascending: true });

      if (error) throw error;
      return (data ?? []) as unknown as BibliotecaCategoria[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useBibliotecaArquivos(filters?: ArquivosFilters) {
  return useQuery({
    queryKey: ["biblioteca_arquivos", filters],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query: any = supabase
        .from("biblioteca_arquivos" as unknown as "ai_generations")
        .select("*, categoria:biblioteca_categorias(*)");

      if (filters?.categoriaId) {
        query = query.eq("categoria_id", filters.categoriaId);
      }
      if (filters?.formato) {
        query = query.eq("formato", filters.formato);
      }
      if (filters?.busca) {
        query = query.ilike("nome", `%${filters.busca}%`);
      }

      query = query.order("created_at", { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as BibliotecaArquivo[];
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useUploadBibliotecaArquivo() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UploadBibliotecaPayload) => {
      const { file, nome, descricao, categoriaId, tags } = payload;

      const folder = categoriaId ?? "sem-categoria";
      const storagePath = `biblioteca/${folder}/${Date.now()}_${file.name}`;

      // 1. Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("biblioteca-modelos")
        .upload(storagePath, file, { upsert: false });

      if (uploadError) throw uploadError;

      // 2. Get public URL
      const { data: urlData } = supabase.storage
        .from("biblioteca-modelos")
        .getPublicUrl(storagePath);

      const publicUrl = urlData.publicUrl;

      // 3. Get current user
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id ?? null;

      // 4. Insert record
      const formato = extractFormato(file);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: insertError } = await (supabase as any)
        .from("biblioteca_arquivos")
        .insert({
          nome,
          descricao: descricao ?? null,
          categoria_id: categoriaId ?? null,
          arquivo_url: publicUrl,
          storage_path: storagePath,
          formato,
          tamanho_bytes: file.size,
          tags: tags ?? [],
          created_by: userId,
        })
        .select("*, categoria:biblioteca_categorias(*)")
        .single();

      if (insertError) {
        // Cleanup: remove uploaded file if DB insert fails
        await supabase.storage.from("biblioteca-modelos").remove([storagePath]);
        throw insertError;
      }

      return data as unknown as BibliotecaArquivo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["biblioteca_arquivos"] });
      toast({
        title: "Arquivo enviado",
        description: "O arquivo foi adicionado à biblioteca.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao enviar arquivo",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteBibliotecaArquivo() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, storagePath }: { id: string; storagePath: string }) => {
      // 1. Delete from storage
      const { error: storageError } = await supabase.storage
        .from("biblioteca-modelos")
        .remove([storagePath]);

      if (storageError) {
        console.warn("Storage delete warning:", storageError.message);
        // Continue anyway — DB record must be removed
      }

      // 2. Delete from DB
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("biblioteca_arquivos")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["biblioteca_arquivos"] });
      toast({
        title: "Arquivo removido",
        description: "O arquivo foi excluído da biblioteca.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover arquivo",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useIncrementDownloadCount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).rpc("increment_biblioteca_download", {
        arquivo_id: id,
      });

      if (error) {
        // Fallback: manual increment
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: current } = await (supabase as any)
          .from("biblioteca_arquivos")
          .select("download_count")
          .eq("id", id)
          .single();

        const count = (current as { download_count: number } | null)?.download_count ?? 0;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: updateError } = await (supabase as any)
          .from("biblioteca_arquivos")
          .update({ download_count: count + 1 })
          .eq("id", id);

        if (updateError) throw updateError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["biblioteca_arquivos"] });
    },
  });
}

export function useCreateCategoria() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { nome: string; descricao?: string; icone?: string; ordem?: number }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("biblioteca_categorias")
        .insert({
          nome: payload.nome,
          descricao: payload.descricao ?? null,
          icone: payload.icone ?? null,
          ordem: payload.ordem ?? 99,
          ativo: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data as unknown as BibliotecaCategoria;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["biblioteca_categorias"] });
      toast({
        title: "Categoria criada",
        description: "A categoria foi adicionada com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar categoria",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteCategoria() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Check if there are files in this category
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count, error: countError } = await (supabase as any)
        .from("biblioteca_arquivos")
        .select("*", { count: "exact", head: true })
        .eq("categoria_id", id);

      if (countError) throw countError;
      if ((count ?? 0) > 0) {
        throw new Error(
          `Não é possível excluir: existem ${count} arquivo(s) nesta categoria. Mova ou exclua os arquivos primeiro.`
        );
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("biblioteca_categorias")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["biblioteca_categorias"] });
      toast({
        title: "Categoria removida",
        description: "A categoria foi excluída.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover categoria",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
