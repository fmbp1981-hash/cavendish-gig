import { useState, useEffect } from "react";
import { useTemplates, Template, TemplateCategoria } from "@/hooks/useTemplates";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Save, X, Eye, Code, FileText, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TemplateEditorProps {
  template?: Template | null;
  open: boolean;
  onClose: () => void;
  onSave?: (template: Template) => void;
}

const categorias: { value: TemplateCategoria; label: string }[] = [
  { value: "codigo_etica", label: "Código de Ética" },
  { value: "politica", label: "Política" },
  { value: "procedimento", label: "Procedimento" },
  { value: "manual", label: "Manual" },
  { value: "relatorio", label: "Relatório" },
  { value: "contrato", label: "Contrato" },
  { value: "termo", label: "Termo" },
  { value: "outro", label: "Outro" },
];

export function TemplateEditor({ template, open, onClose, onSave }: TemplateEditorProps) {
  const { criarTemplate, atualizarTemplate, extrairVariaveis, isCriando, isAtualizando } =
    useTemplates();

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState<TemplateCategoria>("outro");
  const [conteudo, setConteudo] = useState("");
  const [isPublico, setIsPublico] = useState(true);
  const [tags, setTags] = useState("");
  const [previewMode, setPreviewMode] = useState(false);

  // Carregar dados do template ao editar
  useEffect(() => {
    if (template) {
      setNome(template.nome);
      setDescricao(template.descricao || "");
      setCategoria(template.categoria);
      setConteudo(template.conteudo || "");
      setIsPublico(template.is_publico);
      setTags(template.tags?.join(", ") || "");
    } else {
      // Resetar ao criar novo
      setNome("");
      setDescricao("");
      setCategoria("outro");
      setConteudo("");
      setIsPublico(true);
      setTags("");
    }
  }, [template, open]);

  const variaveis = extrairVariaveis(conteudo);

  const handleSave = () => {
    const tagsArray = tags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const templateData = {
      nome,
      descricao,
      categoria,
      conteudo,
      formato: "html" as const,
      is_publico: isPublico,
      tags: tagsArray,
      variaveis_disponiveis: variaveis,
      status: "ativo" as const,
    };

    if (template?.id) {
      // Atualizar existente
      atualizarTemplate(
        { id: template.id, ...templateData },
        {
          onSuccess: (updated) => {
            onSave?.(updated);
            onClose();
          },
        }
      );
    } else {
      // Criar novo
      criarTemplate(templateData, {
        onSuccess: (created) => {
          onSave?.(created);
          onClose();
        },
      });
    }
  };

  const inserirVariavel = (variavel: string) => {
    setConteudo((prev) => prev + `{{${variavel}}}`);
  };

  const variaveisSugeridas = [
    "organizacao.nome",
    "organizacao.cnpj",
    "organizacao.cidade",
    "organizacao.estado",
    "organizacao.endereco",
    "responsavel.nome",
    "responsavel.cargo",
    "responsavel.email",
    "data.atual",
    "data.vigencia",
    "projeto.nome",
    "projeto.fase",
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {template ? "Editar Template" : "Novo Template"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Informações Básicas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Template *</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Código de Ética Empresarial"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria *</Label>
              <Select value={categoria} onValueChange={(v) => setCategoria(v as TemplateCategoria)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Breve descrição do template..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="compliance, governança, lgpd"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="publico"
              checked={isPublico}
              onCheckedChange={setIsPublico}
            />
            <Label htmlFor="publico" className="cursor-pointer">
              Template público (disponível para todas as organizações)
            </Label>
          </div>

          {/* Editor de Conteúdo */}
          <Tabs value={previewMode ? "preview" : "editor"} onValueChange={(v) => setPreviewMode(v === "preview")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="editor">
                <Code className="h-4 w-4 mr-2" />
                Editor
              </TabsTrigger>
              <TabsTrigger value="preview">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </TabsTrigger>
            </TabsList>

            <TabsContent value="editor" className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Conteúdo do Template *</Label>
                <div className="flex gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {variaveis.length} variável{variaveis.length !== 1 ? "is" : ""}
                  </Badge>
                </div>
              </div>

              <Textarea
                value={conteudo}
                onChange={(e) => setConteudo(e.target.value)}
                placeholder="Digite o conteúdo HTML do template aqui...

Dica: Use {{variavel}} para inserir valores dinâmicos.
Exemplo: {{organizacao.nome}}, {{data.atual}}"
                rows={15}
                className="font-mono text-sm"
              />

              {/* Variáveis Sugeridas */}
              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Variáveis Sugeridas (clique para inserir)
                </Label>
                <div className="flex flex-wrap gap-2">
                  {variaveisSugeridas.map((v) => (
                    <Badge
                      key={v}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      onClick={() => inserirVariavel(v)}
                    >
                      {v}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Variáveis Detectadas */}
              {variaveis.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm">Variáveis Detectadas no Template</Label>
                  <div className="flex flex-wrap gap-2">
                    {variaveis.map((v) => (
                      <Badge key={v} variant="secondary">
                        {v}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="preview" className="space-y-3">
              <div className="border rounded-lg p-6 bg-white min-h-[400px]">
                <div
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: conteudo }}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {template ? `Versão ${template.versao}` : "Nova versão 1"}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={!nome || !conteudo || isCriando || isAtualizando}
            >
              {isCriando || isAtualizando ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Template
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
