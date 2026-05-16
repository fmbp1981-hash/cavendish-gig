import { useState, useRef, useCallback } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { BibliotecaCard } from "@/components/biblioteca/BibliotecaCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Library,
  Plus,
  Upload,
  Search,
  X,
  FolderOpen,
  Trash2,
  Filter,
} from "lucide-react";
import {
  useBibliotecaCategorias,
  useBibliotecaArquivos,
  useUploadBibliotecaArquivo,
  useDeleteBibliotecaArquivo,
  useCreateCategoria,
  useDeleteCategoria,
} from "@/hooks/useBiblioteca";

// ─── Upload queue item ────────────────────────────────────────────────────────

interface QueueItem {
  file: File;
  nome: string;
  descricao: string;
  categoriaId: string;
  tags: string;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminBiblioteca() {
  // Filters
  const [selectedCategoriaId, setSelectedCategoriaId] = useState<string>("all");
  const [busca, setBusca] = useState("");
  const [formatoFilter, setFormatoFilter] = useState("all");

  // Upload dialog
  const [uploadOpen, setUploadOpen] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Category management
  const [newCategoriaNome, setNewCategoriaNome] = useState("");
  const [showCategorias, setShowCategorias] = useState(false);

  // Hooks
  const { data: categorias = [] } = useBibliotecaCategorias();
  const { data: arquivos = [], isLoading } = useBibliotecaArquivos({
    categoriaId: selectedCategoriaId === "all" ? undefined : selectedCategoriaId,
    busca: busca || undefined,
    formato: formatoFilter === "all" ? undefined : formatoFilter,
  });
  const uploadMutation = useUploadBibliotecaArquivo();
  const deleteMutation = useDeleteBibliotecaArquivo();
  const createCategoria = useCreateCategoria();
  const deleteCategoria = useDeleteCategoria();

  // ── File drag & drop ─────────────────────────────────────────────────────────

  function addFiles(files: FileList | File[]) {
    const newItems: QueueItem[] = Array.from(files).map((file) => ({
      file,
      nome: file.name.replace(/\.[^/.]+$/, ""),
      descricao: "",
      categoriaId: "none",
      tags: "",
      status: "pending",
    }));
    setQueue((prev) => [...prev, ...newItems]);
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  function updateQueueItem(index: number, updates: Partial<QueueItem>) {
    setQueue((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...updates } : item))
    );
  }

  function removeQueueItem(index: number) {
    setQueue((prev) => prev.filter((_, i) => i !== index));
  }

  // ── Upload ───────────────────────────────────────────────────────────────────

  async function handleUpload() {
    if (queue.length === 0) return;

    const pendingItems = queue.filter((q) => q.status === "pending");

    // Mark all as uploading
    setQueue((prev) =>
      prev.map((item) =>
        item.status === "pending" ? { ...item, status: "uploading" } : item
      )
    );

    await Promise.allSettled(
      pendingItems.map(async (item, rawIndex) => {
        const index = queue.indexOf(item);
        try {
          await uploadMutation.mutateAsync({
            file: item.file,
            nome: item.nome,
            descricao: item.descricao || undefined,
            categoriaId: item.categoriaId === "none" ? null : item.categoriaId,
            tags: item.tags
              ? item.tags
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean)
              : [],
          });
          setQueue((prev) =>
            prev.map((q, i) => (i === index ? { ...q, status: "done" } : q))
          );
        } catch (err) {
          const message = err instanceof Error ? err.message : "Erro ao enviar";
          setQueue((prev) =>
            prev.map((q, i) =>
              i === index ? { ...q, status: "error", error: message } : q
            )
          );
        }
        void rawIndex;
      })
    );
  }

  function closeUploadDialog() {
    setUploadOpen(false);
    setQueue([]);
  }

  const allDone = queue.length > 0 && queue.every((q) => q.status === "done" || q.status === "error");

  // ── Delete arquivo ────────────────────────────────────────────────────────────

  function handleDelete(id: string) {
    const arquivo = arquivos.find((a) => a.id === id);
    if (!arquivo) return;
    deleteMutation.mutate({ id, storagePath: arquivo.storage_path });
  }

  // ── Category actions ──────────────────────────────────────────────────────────

  function handleCreateCategoria() {
    if (!newCategoriaNome.trim()) return;
    createCategoria.mutate(
      { nome: newCategoriaNome.trim(), ordem: categorias.length + 1 },
      {
        onSuccess: () => setNewCategoriaNome(""),
      }
    );
  }

  // ── Unique formatos for filter ────────────────────────────────────────────────

  const formatos = Array.from(new Set(arquivos.map((a) => a.formato))).sort();

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Library className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Biblioteca de Modelos</h1>
              <p className="text-sm text-muted-foreground">
                Repositório de documentos e templates para consultores
              </p>
            </div>
          </div>
          <Button onClick={() => setUploadOpen(true)} className="gap-2 self-start sm:self-auto">
            <Plus className="h-4 w-4" />
            Novo Arquivo
          </Button>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col gap-3">
          {/* Category chips */}
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={selectedCategoriaId === "all" ? "default" : "outline"}
              className="cursor-pointer select-none px-3 py-1.5 text-xs"
              onClick={() => setSelectedCategoriaId("all")}
            >
              Todos
            </Badge>
            {categorias.map((cat) => (
              <Badge
                key={cat.id}
                variant={selectedCategoriaId === cat.id ? "default" : "outline"}
                className="cursor-pointer select-none px-3 py-1.5 text-xs"
                onClick={() => setSelectedCategoriaId(cat.id)}
              >
                {cat.nome}
              </Badge>
            ))}
          </div>

          {/* Search + format filter */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar arquivos..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9"
              />
              {busca && (
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setBusca("")}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {formatos.length > 0 && (
              <div className="flex items-center gap-2 sm:w-48">
                <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <Select value={formatoFilter} onValueChange={setFormatoFilter}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Formato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os formatos</SelectItem>
                    {formatos.map((f) => (
                      <SelectItem key={f} value={f}>
                        .{f.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {/* File grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-52 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : arquivos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="p-4 bg-muted rounded-full">
              <FolderOpen className="h-10 w-10 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">Nenhum arquivo encontrado</p>
              <p className="text-sm text-muted-foreground mt-1">
                Clique em "Novo Arquivo" para adicionar documentos à biblioteca.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {arquivos.map((arquivo) => (
              <BibliotecaCard
                key={arquivo.id}
                arquivo={arquivo}
                isAdmin={true}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Category management */}
        <div className="border border-border rounded-lg">
          <button
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors rounded-lg"
            onClick={() => setShowCategorias((v) => !v)}
          >
            <span className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Gerenciar Categorias ({categorias.length})
            </span>
            <span className="text-muted-foreground">{showCategorias ? "▲" : "▼"}</span>
          </button>

          {showCategorias && (
            <div className="px-4 pb-4 flex flex-col gap-3">
              {/* Add category */}
              <div className="flex gap-2">
                <Input
                  placeholder="Nome da nova categoria..."
                  value={newCategoriaNome}
                  onChange={(e) => setNewCategoriaNome(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateCategoria();
                  }}
                  className="flex-1"
                />
                <Button
                  size="sm"
                  onClick={handleCreateCategoria}
                  disabled={!newCategoriaNome.trim() || createCategoria.isPending}
                  className="gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar
                </Button>
              </div>

              {/* Category list */}
              {categorias.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma categoria cadastrada.</p>
              ) : (
                <div className="flex flex-col gap-1">
                  {categorias.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50"
                    >
                      <span className="text-sm">{cat.nome}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteCategoria.mutate(cat.id)}
                        disabled={deleteCategoria.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="sr-only">Excluir categoria</span>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Upload dialog */}
      <Dialog open={uploadOpen} onOpenChange={(v) => { if (!v) closeUploadDialog(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Adicionar Arquivos à Biblioteca
            </DialogTitle>
          </DialogHeader>

          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50 hover:bg-muted/30"
            }`}
          >
            <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="font-medium text-sm">
              Arraste arquivos aqui ou clique para selecionar
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Suporta PDF, DOCX, XLSX, PPTX e outros formatos
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) addFiles(e.target.files);
              }}
            />
          </div>

          {/* Queue items */}
          {queue.length > 0 && (
            <div className="flex flex-col gap-3 mt-2">
              {queue.map((item, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-3 flex flex-col gap-2 ${
                    item.status === "done"
                      ? "border-green-300 bg-green-50"
                      : item.status === "error"
                      ? "border-red-300 bg-red-50"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground truncate">
                      {item.file.name}
                    </span>
                    {item.status === "pending" && (
                      <button
                        className="text-muted-foreground hover:text-foreground flex-shrink-0"
                        onClick={() => removeQueueItem(index)}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                    {item.status === "done" && (
                      <span className="text-xs text-green-600 font-medium flex-shrink-0">
                        Enviado
                      </span>
                    )}
                    {item.status === "uploading" && (
                      <span className="text-xs text-blue-600 font-medium flex-shrink-0">
                        Enviando...
                      </span>
                    )}
                    {item.status === "error" && (
                      <span className="text-xs text-red-600 font-medium flex-shrink-0">
                        Erro
                      </span>
                    )}
                  </div>

                  {item.status === "error" && item.error && (
                    <p className="text-xs text-red-600">{item.error}</p>
                  )}

                  {item.status === "pending" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="sm:col-span-2">
                        <Input
                          placeholder="Nome do arquivo"
                          value={item.nome}
                          onChange={(e) => updateQueueItem(index, { nome: e.target.value })}
                          className="text-sm"
                        />
                      </div>
                      <Textarea
                        placeholder="Descrição (opcional)"
                        value={item.descricao}
                        onChange={(e) => updateQueueItem(index, { descricao: e.target.value })}
                        className="text-sm resize-none h-16 sm:col-span-2"
                      />
                      <Select
                        value={item.categoriaId}
                        onValueChange={(v) => updateQueueItem(index, { categoriaId: v })}
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sem categoria</SelectItem>
                          {categorias.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Tags (separadas por vírgula)"
                        value={item.tags}
                        onChange={(e) => updateQueueItem(index, { tags: e.target.value })}
                        className="text-sm"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={closeUploadDialog}>
              {allDone ? "Fechar" : "Cancelar"}
            </Button>
            {!allDone && queue.length > 0 && (
              <Button
                onClick={handleUpload}
                disabled={
                  uploadMutation.isPending ||
                  queue.every((q) => q.status !== "pending")
                }
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Enviar {queue.filter((q) => q.status === "pending").length} arquivo
                {queue.filter((q) => q.status === "pending").length !== 1 ? "s" : ""}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
