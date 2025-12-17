import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useTemplates, Template } from "@/hooks/useTemplates";
import { TemplateEditor } from "@/components/templates/TemplateEditor";
import { TemplateLibrary } from "@/components/templates/TemplateLibrary";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Plus,
  Library,
  Settings,
  Trash2,
  Edit,
  TrendingUp,
  FileText,
} from "lucide-react";

export default function Templates() {
  const { templates, templatesPopulares, deletarTemplate, isDeletando } = useTemplates();
  const [editorOpen, setEditorOpen] = useState(false);
  const [templateSelecionado, setTemplateSelecionado] = useState<Template | null>(null);
  const [templateParaDeletar, setTemplateParaDeletar] = useState<Template | null>(null);

  const handleNovoTemplate = () => {
    setTemplateSelecionado(null);
    setEditorOpen(true);
  };

  const handleEditarTemplate = (template: Template) => {
    setTemplateSelecionado(template);
    setEditorOpen(true);
  };

  const handleDeletarTemplate = () => {
    if (templateParaDeletar) {
      deletarTemplate(templateParaDeletar.id, {
        onSuccess: () => {
          setTemplateParaDeletar(null);
        },
      });
    }
  };

  // Estatísticas
  const totalTemplates = templates?.length || 0;
  const templatesAtivos = templates?.filter((t) => t.status === "ativo").length || 0;
  const totalUsos =
    templates?.reduce((sum, t) => sum + (t.usado_count || 0), 0) || 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Biblioteca de Templates
            </h1>
            <p className="text-muted-foreground">
              Crie e gerencie templates reutilizáveis de documentos
            </p>
          </div>
          <Button onClick={handleNovoTemplate}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Template
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total de Templates
                  </p>
                  <p className="text-2xl font-bold">{totalTemplates}</p>
                </div>
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Templates Ativos
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {templatesAtivos}
                  </p>
                </div>
                <Library className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total de Usos
                  </p>
                  <p className="text-2xl font-bold">{totalUsos}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Mais Usado
                  </p>
                  <p className="text-sm font-bold truncate max-w-[150px]">
                    {templatesPopulares && templatesPopulares[0]
                      ? templatesPopulares[0].nome
                      : "-"}
                  </p>
                </div>
                <Settings className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="todos" className="space-y-4">
          <TabsList>
            <TabsTrigger value="todos">Todos os Templates</TabsTrigger>
            <TabsTrigger value="publicos">Públicos</TabsTrigger>
            <TabsTrigger value="rascunhos">Rascunhos</TabsTrigger>
          </TabsList>

          <TabsContent value="todos" className="space-y-4">
            <TemplateLibrary
              onSelectTemplate={handleEditarTemplate}
              onPreviewTemplate={handleEditarTemplate}
              showOnlyPublic={false}
            />
          </TabsContent>

          <TabsContent value="publicos" className="space-y-4">
            <TemplateLibrary
              onSelectTemplate={handleEditarTemplate}
              onPreviewTemplate={handleEditarTemplate}
              showOnlyPublic={true}
            />
          </TabsContent>

          <TabsContent value="rascunhos" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates
                ?.filter((t) => t.status === "rascunho")
                .map((template) => (
                  <Card key={template.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6 space-y-4">
                      <div>
                        <h3 className="font-semibold">{template.nome}</h3>
                        <p className="text-sm text-muted-foreground">
                          {template.descricao || "Sem descrição"}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleEditarTemplate(template)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setTemplateParaDeletar(template)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>

            {templates?.filter((t) => t.status === "rascunho").length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Nenhum rascunho</h3>
                  <p className="text-muted-foreground text-center max-w-md mt-2">
                    Rascunhos de templates aparecerão aqui.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Info Card */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Library className="h-4 w-4" />
              Como usar os templates
            </h3>
            <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
              <li>
                Use <code className="bg-white px-1 rounded">{'{{variavel}}'}</code> para inserir valores
                dinâmicos
              </li>
              <li>Exemplos: {'{{organizacao.nome}}'}, {'{{responsavel.email}}'}</li>
              <li>Templates públicos ficam disponíveis para todas as organizações</li>
              <li>O sistema detecta automaticamente as variáveis usadas</li>
              <li>Cada alteração cria uma nova versão do template</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Template Editor Dialog */}
      <TemplateEditor
        template={templateSelecionado}
        open={editorOpen}
        onClose={() => {
          setEditorOpen(false);
          setTemplateSelecionado(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!templateParaDeletar}
        onOpenChange={() => setTemplateParaDeletar(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar template?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar o template "
              {templateParaDeletar?.nome}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletarTemplate}
              disabled={isDeletando}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeletando ? "Deletando..." : "Deletar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
