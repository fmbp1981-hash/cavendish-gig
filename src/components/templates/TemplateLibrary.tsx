import { useState } from "react";
import { useTemplates, Template, TemplateCategoria } from "@/hooks/useTemplates";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Search,
  Star,
  Eye,
  Copy,
  Filter,
  TrendingUp,
} from "lucide-react";

interface TemplateLibraryProps {
  onSelectTemplate?: (template: Template) => void;
  onPreviewTemplate?: (template: Template) => void;
  showOnlyPublic?: boolean;
}

export function TemplateLibrary({
  onSelectTemplate,
  onPreviewTemplate,
  showOnlyPublic = false,
}: TemplateLibraryProps) {
  const {
    templates,
    templatesPublicos,
    templatesPopulares,
    isLoading,
    formatarCategoria,
    getStatusColor,
  } = useTemplates();

  const [searchTerm, setSearchTerm] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState<TemplateCategoria | "todos">("todos");

  // Decidir qual lista usar
  const templatesList = showOnlyPublic ? templatesPublicos : templates;

  // Filtrar templates
  const filteredTemplates = templatesList?.filter((template) => {
    const matchSearch =
      template.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.tags?.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchCategoria =
      categoriaFiltro === "todos" || template.categoria === categoriaFiltro;

    return matchSearch && matchCategoria;
  });

  // Agrupar por categoria
  const templatesPorCategoria = filteredTemplates?.reduce((acc, template) => {
    const cat = template.categoria;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(template);
    return acc;
  }, {} as Record<TemplateCategoria, Template[]>);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          value={categoriaFiltro}
          onValueChange={(v) => setCategoriaFiltro(v as TemplateCategoria | "todos")}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas as categorias</SelectItem>
            <SelectItem value="codigo_etica">Código de Ética</SelectItem>
            <SelectItem value="politica">Política</SelectItem>
            <SelectItem value="procedimento">Procedimento</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
            <SelectItem value="relatorio">Relatório</SelectItem>
            <SelectItem value="contrato">Contrato</SelectItem>
            <SelectItem value="termo">Termo</SelectItem>
            <SelectItem value="outro">Outro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Templates Populares */}
      {!searchTerm && categoriaFiltro === "todos" && templatesPopulares && templatesPopulares.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Mais Usados</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templatesPopulares.slice(0, 3).map((template: any) => (
              <TemplateCard
                key={template.id}
                template={template}
                onSelect={onSelectTemplate}
                onPreview={onPreviewTemplate}
                isPopular
              />
            ))}
          </div>
        </div>
      )}

      {/* Templates por Categoria */}
      {templatesPorCategoria && Object.keys(templatesPorCategoria).length > 0 ? (
        <div className="space-y-8">
          {Object.entries(templatesPorCategoria).map(([categoria, temps]) => (
            <div key={categoria}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {formatarCategoria(categoria as TemplateCategoria)}
                </h3>
                <Badge variant="secondary">{temps.length}</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {temps.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onSelect={onSelectTemplate}
                    onPreview={onPreviewTemplate}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Nenhum template encontrado</h3>
            <p className="text-muted-foreground text-center max-w-md mt-2">
              {searchTerm
                ? "Tente ajustar os filtros de busca."
                : "Nenhum template disponível nesta categoria."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface TemplateCardProps {
  template: Template | any;
  onSelect?: (template: Template) => void;
  onPreview?: (template: Template) => void;
  isPopular?: boolean;
}

function TemplateCard({ template, onSelect, onPreview, isPopular }: TemplateCardProps) {
  const { formatarCategoria, getStatusColor } = useTemplates();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base flex items-center gap-2">
              {template.nome}
              {isPopular && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
            </CardTitle>
            <CardDescription className="mt-1">
              {formatarCategoria(template.categoria)}
            </CardDescription>
          </div>
          <Badge className={getStatusColor(template.status)}>
            {template.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Descrição */}
        {template.descricao && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {template.descricao}
          </p>
        )}

        {/* Tags */}
        {template.tags && template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {template.tags.slice(0, 3).map((tag: string) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {template.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{template.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {template.usado_count !== undefined && (
            <div className="flex items-center gap-1">
              <Copy className="h-3 w-3" />
              {template.usado_count} uso{template.usado_count !== 1 ? "s" : ""}
            </div>
          )}
          {template.variaveis_disponiveis && (
            <div className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {Array.isArray(template.variaveis_disponiveis)
                ? template.variaveis_disponiveis.length
                : 0}{" "}
              var
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {onPreview && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onPreview(template)}
            >
              <Eye className="h-4 w-4 mr-1" />
              Preview
            </Button>
          )}
          {onSelect && (
            <Button
              size="sm"
              className="flex-1"
              onClick={() => onSelect(template)}
            >
              <Copy className="h-4 w-4 mr-1" />
              Usar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
