import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDocumentoCatalogo } from "@/hooks/useAdminData";
import { useSolicitarDocComplementar } from "@/hooks/useDocumentosComplementares";
import { FileText, Plus, Search } from "lucide-react";
import { toast } from "sonner";

interface SolicitarDocComplementarDialogProps {
  open: boolean;
  onClose: () => void;
  projetoId: string;
  organizacaoId: string;
}

export function SolicitarDocComplementarDialog({
  open,
  onClose,
  projetoId,
  organizacaoId,
}: SolicitarDocComplementarDialogProps) {
  const [tab, setTab] = useState<"catalogo" | "custom">("catalogo");
  const [searchCatalogo, setSearchCatalogo] = useState("");
  const [nomeCustom, setNomeCustom] = useState("");
  const [descricaoCustom, setDescricaoCustom] = useState("");
  const [selectedCatalogoId, setSelectedCatalogoId] = useState<string | null>(null);

  const { data: catalogo } = useDocumentoCatalogo();
  const solicitarMutation = useSolicitarDocComplementar();

  const catalogoComplementar = catalogo?.filter(
    (d) =>
      d.is_complementar &&
      (searchCatalogo === "" ||
        d.nome.toLowerCase().includes(searchCatalogo.toLowerCase()))
  );

  const selectedItem = catalogo?.find((d) => d.id === selectedCatalogoId);

  const handleSubmit = async () => {
    if (tab === "catalogo" && !selectedCatalogoId) {
      toast.error("Selecione um documento do catálogo");
      return;
    }
    if (tab === "custom" && !nomeCustom.trim()) {
      toast.error("Informe o nome do documento");
      return;
    }

    try {
      await solicitarMutation.mutateAsync({
        projetoId,
        organizacaoId,
        nome: tab === "catalogo" ? selectedItem!.nome : nomeCustom.trim(),
        descricao:
          tab === "catalogo"
            ? selectedItem?.descricao ?? undefined
            : descricaoCustom.trim() || undefined,
        catalogoId: tab === "catalogo" ? selectedCatalogoId! : undefined,
        formatos_aceitos:
          tab === "catalogo" ? selectedItem?.formatos_aceitos?.join(",") : undefined,
        tamanho_maximo_mb:
          tab === "catalogo" ? selectedItem?.tamanho_maximo_mb : undefined,
      });

      toast.success("Documento solicitado ao cliente com sucesso!");
      handleClose();
    } catch {
      toast.error("Erro ao solicitar documento. Tente novamente.");
    }
  };

  const handleClose = () => {
    setTab("catalogo");
    setSearchCatalogo("");
    setNomeCustom("");
    setDescricaoCustom("");
    setSelectedCatalogoId(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Solicitar Documento Complementar</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "catalogo" | "custom")}>
          <TabsList className="w-full">
            <TabsTrigger value="catalogo" className="flex-1">
              Do Catálogo
            </TabsTrigger>
            <TabsTrigger value="custom" className="flex-1">
              Documento Avulso
            </TabsTrigger>
          </TabsList>

          <TabsContent value="catalogo" className="space-y-3 mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar no catálogo complementar..."
                value={searchCatalogo}
                onChange={(e) => setSearchCatalogo(e.target.value)}
                className="pl-9"
              />
            </div>

            {catalogoComplementar?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                Nenhum item complementar no catálogo.
                <br />
                Marque documentos como "Complementar" no Catálogo Admin.
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {catalogoComplementar?.map((doc) => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() =>
                      setSelectedCatalogoId(
                        selectedCatalogoId === doc.id ? null : doc.id
                      )
                    }
                    className={`w-full text-left p-3 rounded-md border transition-colors ${
                      selectedCatalogoId === doc.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{doc.nome}</p>
                        {doc.descricao && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {doc.descricao}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="custom" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="nome-custom">Nome do documento *</Label>
              <Input
                id="nome-custom"
                placeholder="Ex: Certidão negativa de débitos"
                value={nomeCustom}
                onChange={(e) => setNomeCustom(e.target.value)}
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc-custom">
                Instruções ao cliente{" "}
                <span className="text-muted-foreground font-normal">(opcional)</span>
              </Label>
              <Textarea
                id="desc-custom"
                placeholder="Descreva o que o cliente deve enviar..."
                value={descricaoCustom}
                onChange={(e) => setDescricaoCustom(e.target.value)}
                maxLength={500}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {descricaoCustom.length}/500
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex items-center gap-2 mt-2">
          <Badge variant="outline" className="text-xs">
            Opcional
          </Badge>
          <p className="text-xs text-muted-foreground">
            O cliente verá este documento como complementar — não bloqueia progresso da fase.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={solicitarMutation.isPending}>
            <Plus className="h-4 w-4 mr-2" />
            Solicitar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
