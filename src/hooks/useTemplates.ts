import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type TemplateCategoria =
  | "codigo_etica"
  | "politica"
  | "procedimento"
  | "manual"
  | "relatorio"
  | "contrato"
  | "termo"
  | "outro";

export type TemplateStatus = "rascunho" | "ativo" | "arquivado";

export interface Template {
  id: string;
  nome: string;
  descricao?: string;
  categoria: TemplateCategoria;
  status: TemplateStatus;
  conteudo: string;
  formato: "html" | "markdown";
  variaveis_disponiveis?: string[];
  thumbnail_url?: string;
  tags?: string[];
  versao: number;
  usado_count: number;
  is_publico: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TemplateVersao {
  id: string;
  template_id: string;
  versao: number;
  conteudo: string;
  formato: string;
  change_description?: string;
  created_at: string;
}

export interface VariavelTemplate {
  nome: string;
  label: string;
  tipo: "texto" | "data" | "numero" | "email";
  obrigatoria: boolean;
  exemplo?: string;
}

export function useTemplates() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sb = supabase;

  /**
   * Query: Listar todos os templates
   */
  const {
    data: templates,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["templates"],
    queryFn: async () => {
      const { data, error } = await sb
        .from("templates")
        .select("*")
        .order("usado_count", { ascending: false });

      if (error) throw error;
      return data as Template[];
    },
  });

  /**
   * Query: Templates ativos e públicos (para biblioteca)
   */
  const { data: templatesPublicos } = useQuery({
    queryKey: ["templates", "publicos"],
    queryFn: async () => {
      const { data, error } = await sb
        .from("templates")
        .select("*")
        .eq("status", "ativo")
        .eq("is_publico", true)
        .order("usado_count", { ascending: false });

      if (error) throw error;
      return data as Template[];
    },
  });

  /**
   * Query: Templates populares
   */
  const { data: templatesPopulares } = useQuery({
    queryKey: ["templates", "populares"],
    queryFn: async () => {
      const { data, error } = await sb
        .from("templates_populares")
        .select("*")
        .limit(10);

      if (error) throw error;
      return data;
    },
  });

  /**
   * Query: Buscar template por ID
   */
  const getTemplate = async (id: string): Promise<Template | null> => {
    const { data, error } = await sb
      .from("templates")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Erro ao buscar template:", error);
      return null;
    }

    return data as Template;
  };

  /**
   * Query: Buscar versões de um template
   */
  const getVersoes = async (templateId: string): Promise<TemplateVersao[]> => {
    const { data, error } = await sb
      .from("template_versoes")
      .select("*")
      .eq("template_id", templateId)
      .order("versao", { ascending: false });

    if (error) {
      console.error("Erro ao buscar versões:", error);
      return [];
    }

    return data as TemplateVersao[];
  };

  /**
   * Mutation: Criar novo template
   */
  const { mutate: criarTemplate, isPending: isCriando } = useMutation({
    mutationFn: async (novoTemplate: Partial<Template>) => {
      const { data, error } = await sb
        .from("templates")
        .insert({
          ...novoTemplate,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data as Template;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast({
        title: "✅ Template criado",
        description: "O template foi criado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar template",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  /**
   * Mutation: Atualizar template
   */
  const { mutate: atualizarTemplate, isPending: isAtualizando } = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Template> & { id: string }) => {
      const { data, error } = await sb
        .from("templates")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Template;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast({
        title: "✅ Template atualizado",
        description: "As alterações foram salvas.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar template",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  /**
   * Mutation: Deletar template
   */
  const { mutate: deletarTemplate, isPending: isDeletando } = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb
        .from("templates")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast({
        title: "✅ Template deletado",
        description: "O template foi removido.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao deletar template",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  /**
   * Mutation: Renderizar template com variáveis
   */
  const { mutate: renderizarTemplate, isPending: isRenderizando } = useMutation({
    mutationFn: async ({
      templateId,
      variaveis,
    }: {
      templateId: string;
      variaveis: Record<string, string>;
    }) => {
      const { data, error } = await sb.rpc("render_template", {
        p_template_id: templateId,
        p_variaveis: variaveis,
      });

      if (error) throw error;
      return data as string;
    },
  });

  /**
   * Helper: Extrair variáveis de um conteúdo
   */
  const extrairVariaveis = (conteudo: string): string[] => {
    const regex = /\{\{([a-zA-Z0-9._]+)\}\}/g;
    const matches = conteudo.matchAll(regex);
    const variaveis = Array.from(matches, m => m[1]);
    return [...new Set(variaveis)]; // Remove duplicatas
  };

  /**
   * Helper: Validar template
   */
  const validarTemplate = async (templateId: string) => {
    const { data, error } = await sb.rpc("validate_template", {
      p_template_id: templateId,
    });

    if (error) {
      console.error("Erro ao validar template:", error);
      return null;
    }

    return data;
  };

  /**
   * Helper: Formatar categoria
   */
  const formatarCategoria = (categoria: TemplateCategoria): string => {
    const categorias: Record<TemplateCategoria, string> = {
      codigo_etica: "Código de Ética",
      politica: "Política",
      procedimento: "Procedimento",
      manual: "Manual",
      relatorio: "Relatório",
      contrato: "Contrato",
      termo: "Termo",
      outro: "Outro",
    };
    return categorias[categoria] || categoria;
  };

  /**
   * Helper: Cor do badge por status
   */
  const getStatusColor = (status: TemplateStatus): string => {
    const cores: Record<TemplateStatus, string> = {
      rascunho: "bg-yellow-100 text-yellow-800",
      ativo: "bg-green-100 text-green-800",
      arquivado: "bg-gray-100 text-gray-800",
    };
    return cores[status] || "bg-gray-100 text-gray-800";
  };

  /**
   * Helper: Formatar status
   */
  const formatarStatus = (status: TemplateStatus): string => {
    const statusMap: Record<TemplateStatus, string> = {
      rascunho: "Rascunho",
      ativo: "Ativo",
      arquivado: "Arquivado",
    };
    return statusMap[status] || status;
  };

  /**
   * Helper: Filtrar templates por categoria
   */
  const filtrarPorCategoria = (categoria?: TemplateCategoria) => {
    if (!templates || !categoria) return templates;
    return templates.filter(t => t.categoria === categoria);
  };

  /**
   * Helper: Buscar templates por tag
   */
  const buscarPorTag = (tag: string) => {
    if (!templates) return [];
    return templates.filter(t =>
      t.tags?.some(t => t.toLowerCase().includes(tag.toLowerCase()))
    );
  };

  return {
    // Dados
    templates,
    templatesPublicos,
    templatesPopulares,
    error,

    // Estados
    isLoading,
    isCriando,
    isAtualizando,
    isDeletando,
    isRenderizando,

    // Ações
    criarTemplate,
    atualizarTemplate,
    deletarTemplate,
    renderizarTemplate,
    getTemplate,
    getVersoes,
    validarTemplate,
    refetch,

    // Helpers
    extrairVariaveis,
    formatarCategoria,
    getStatusColor,
    formatarStatus,
    filtrarPorCategoria,
    buscarPorTag,
  };
}
