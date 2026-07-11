import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useUpsertMeta } from "@/hooks/useProspeccaoMetas";
import type { RepresentanteOption } from "@/hooks/useRepresentantes";
import type { RankingRepresentanteLinha } from "@/hooks/useProspeccaoDashboard";

interface MetasFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  periodoMes: string;
  representantes: RepresentanteOption[];
  ranking: RankingRepresentanteLinha[];
}

/** Metas são por representante+mês (UNIQUE(representante_id, periodo_mes)) — o diálogo edita uma
 * de cada vez, prefiltrando o valor atual (se já existir) ao trocar o representante selecionado. */
export function MetasFormDialog({ open, onOpenChange, periodoMes, representantes, ranking }: MetasFormDialogProps) {
  const upsertMeta = useUpsertMeta();
  const [representanteId, setRepresentanteId] = useState("");
  const [metaLeadsContatados, setMetaLeadsContatados] = useState("0");
  const [metaConversoes, setMetaConversoes] = useState("0");

  useEffect(() => {
    if (open && representantes.length > 0) {
      setRepresentanteId((atual) => atual || representantes[0].id);
    }
  }, [open, representantes]);

  useEffect(() => {
    const atual = ranking.find((r) => r.representanteId === representanteId);
    setMetaLeadsContatados(String(atual?.metaLeadsContatados ?? 0));
    setMetaConversoes(String(atual?.metaConversoes ?? 0));
  }, [representanteId, ranking]);

  const handleSalvar = async () => {
    await upsertMeta.mutateAsync({
      representanteId,
      periodoMes,
      metaLeadsContatados: Number(metaLeadsContatados) || 0,
      metaConversoes: Number(metaConversoes) || 0,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Definir metas do mês</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Representante</Label>
            <Select value={representanteId} onValueChange={setRepresentanteId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {representantes.map((rep) => (
                  <SelectItem key={rep.id} value={rep.id}>
                    {rep.nome || rep.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Meta de leads contatados</Label>
              <Input type="number" min={0} value={metaLeadsContatados} onChange={(e) => setMetaLeadsContatados(e.target.value)} />
            </div>
            <div>
              <Label>Meta de conversões</Label>
              <Input type="number" min={0} value={metaConversoes} onChange={(e) => setMetaConversoes(e.target.value)} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSalvar} disabled={!representanteId || upsertMeta.isPending}>
            {upsertMeta.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
