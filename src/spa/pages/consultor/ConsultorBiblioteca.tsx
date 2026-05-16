import { useState } from "react";
import { ConsultorLayout } from "@/components/layout/ConsultorLayout";
import { BibliotecaCard } from "@/components/biblioteca/BibliotecaCard";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Library, Search, X, FolderOpen, Filter } from "lucide-react";
import {
  useBibliotecaCategorias,
  useBibliotecaArquivos,
} from "@/hooks/useBiblioteca";

export default function ConsultorBiblioteca() {
  const [selectedCategoriaId, setSelectedCategoriaId] = useState<string>("all");
  const [busca, setBusca] = useState("");
  const [formatoFilter, setFormatoFilter] = useState("all");

  const { data: categorias = [] } = useBibliotecaCategorias();
  const { data: arquivos = [], isLoading } = useBibliotecaArquivos({
    categoriaId: selectedCategoriaId === "all" ? undefined : selectedCategoriaId,
    busca: busca || undefined,
    formato: formatoFilter === "all" ? undefined : formatoFilter,
  });

  const formatos = Array.from(new Set(arquivos.map((a) => a.formato))).sort();

  return (
    <ConsultorLayout>
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Library className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Biblioteca de Modelos</h1>
            <p className="text-sm text-muted-foreground">
              Documentos e templates disponíveis para download
            </p>
          </div>
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

        {/* Results count */}
        {!isLoading && arquivos.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {arquivos.length} arquivo{arquivos.length !== 1 ? "s" : ""} encontrado
            {arquivos.length !== 1 ? "s" : ""}
          </p>
        )}

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
                {busca || selectedCategoriaId !== "all" || formatoFilter !== "all"
                  ? "Tente remover os filtros para ver mais resultados."
                  : "A biblioteca ainda não possui arquivos disponíveis."}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {arquivos.map((arquivo) => (
              <BibliotecaCard
                key={arquivo.id}
                arquivo={arquivo}
                isAdmin={false}
              />
            ))}
          </div>
        )}
      </div>
    </ConsultorLayout>
  );
}
