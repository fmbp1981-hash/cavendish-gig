import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload, FileText, Info } from "lucide-react";
import { toast } from "sonner";
import { useImportarArquivo } from "@/hooks/useProspeccaoImportacao";
import { guessColumnMapping, peekEstruturaArquivo, type ColumnMapping, type ParsedImportRow } from "@/lib/prospeccao/import-parser";
import { PROSPECCAO_CATEGORIAS } from "@/types/prospeccao";
import { getCategoriaLabel } from "@/lib/prospeccao/categorias";
import type { ProspeccaoCategoria } from "@/types/prospeccao";

interface ImportLeadsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId: string;
}

const CAMPOS_MAPEAVEIS: { campo: keyof ParsedImportRow; label: string }[] = [
  { campo: "nome", label: "Nome da empresa *" },
  { campo: "telefone", label: "Telefone" },
  { campo: "email", label: "Email" },
  { campo: "cnpj", label: "CNPJ" },
  { campo: "cidade", label: "Cidade" },
  { campo: "estado", label: "Estado (UF)" },
  { campo: "endereco", label: "Endereço" },
  { campo: "website", label: "Website" },
  { campo: "setor", label: "Setor" },
  { campo: "categoria", label: "Categoria (opcional — sobrepõe a categoria padrão abaixo)" },
];

const SEM_MAPEAMENTO = "__sem_mapeamento__";

export function ImportLeadsDialog({ open, onOpenChange, currentUserId }: ImportLeadsDialogProps) {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [categoriaPadrao, setCategoriaPadrao] = useState<ProspeccaoCategoria | "">("");
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [headers, setHeaders] = useState<string[]>([]);
  const [estruturado, setEstruturado] = useState<boolean | null>(null);
  const [analisando, setAnalisando] = useState(false);

  const importar = useImportarArquivo();

  const resetar = () => {
    setArquivo(null);
    setMapping({});
    setHeaders([]);
    setEstruturado(null);
  };

  const handleArquivoChange = async (file: File | null) => {
    setArquivo(file);
    setMapping({});
    setHeaders([]);
    setEstruturado(null);
    if (!file) return;

    setAnalisando(true);
    try {
      const info = await peekEstruturaArquivo(file);
      setEstruturado(info.estruturado);
      setHeaders(info.headers);
      if (info.estruturado && info.headers.length > 0) {
        setMapping(guessColumnMapping(info.headers));
      }
    } catch (err) {
      toast.error("Não foi possível ler o arquivo", { description: (err as Error).message });
      setArquivo(null);
    } finally {
      setAnalisando(false);
    }
  };

  const handleSubmit = async () => {
    if (!arquivo) {
      toast.error("Selecione um arquivo");
      return;
    }
    if (!categoriaPadrao) {
      toast.error("Selecione a categoria padrão");
      return;
    }
    if (estruturado && !mapping.nome) {
      toast.error("Mapeie ao menos a coluna do Nome da empresa");
      return;
    }

    await importar.mutateAsync({
      arquivo,
      mapping,
      responsavelId: currentUserId,
      categoriaPadrao,
    });
    resetar();
    setCategoriaPadrao("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetar(); onOpenChange(v); }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Leads</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Arquivo *</Label>
            <label className="mt-1 flex items-center gap-3 rounded-lg border border-dashed p-4 cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors">
              <input
                type="file"
                accept=".csv,.xlsx,.pdf,.txt,.docx"
                className="hidden"
                onChange={(e) => handleArquivoChange(e.target.files?.[0] ?? null)}
              />
              <Upload className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{arquivo ? arquivo.name : "Clique para selecionar um arquivo"}</p>
                <p className="text-xs text-muted-foreground">CSV, XLSX, PDF, TXT ou DOCX</p>
              </div>
            </label>
          </div>

          <div>
            <Label>Categoria padrão *</Label>
            <Select value={categoriaPadrao} onValueChange={(v) => setCategoriaPadrao(v as ProspeccaoCategoria)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o gatilho de compliance" />
              </SelectTrigger>
              <SelectContent>
                {PROSPECCAO_CATEGORIAS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {getCategoriaLabel(c)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Usada em todas as linhas que não tiverem uma categoria mapeada (e sempre para PDF/DOCX/TXT em texto livre).
            </p>
          </div>

          {analisando && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Analisando arquivo...
            </div>
          )}

          {!analisando && arquivo && estruturado && headers.length > 0 && (
            <div className="space-y-3 rounded-lg border p-3">
              <p className="text-sm font-medium flex items-center gap-1.5">
                <FileText className="h-4 w-4" />
                Mapeamento de colunas
              </p>
              <p className="text-xs text-muted-foreground -mt-2">
                Detectamos as colunas do arquivo e sugerimos um mapeamento — confira e ajuste se necessário.
              </p>
              {CAMPOS_MAPEAVEIS.map(({ campo, label }) => (
                <div key={campo} className="grid grid-cols-2 gap-2 items-center">
                  <Label className="text-xs">{label}</Label>
                  <Select
                    value={mapping[campo] ?? SEM_MAPEAMENTO}
                    onValueChange={(v) => setMapping((m) => ({ ...m, [campo]: v === SEM_MAPEAMENTO ? undefined : v }))}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="— não mapear —" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SEM_MAPEAMENTO}>— não mapear —</SelectItem>
                      {headers.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}

          {!analisando && arquivo && estruturado === false && (
            <div className="flex gap-2 rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <p>
                Este formato não tem colunas identificáveis — a extração é automática por linha/parágrafo: nome, telefone,
                email e CNPJ são reconhecidos por padrão no texto. Revise os leads importados depois, resultados podem
                variar conforme o layout do arquivo original.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={importar.isPending || analisando}>
            {importar.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Importar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
