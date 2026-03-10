import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Loader2, RefreshCw, Edit2, Trash2, AlertTriangle } from "lucide-react";
import {
  Risco,
  STATUS_LABEL,
  CATEGORIA_LABEL,
  nivelLabel,
  useRiscoAvaliacoes,
  useRegistrarAvaliacao,
  useExcluirRisco,
} from "@/hooks/useRiscos";
import { RiscoMitigacaoList } from "./RiscoMitigacaoList";
import { RiscoFormDialog } from "./RiscoFormDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const NIVEL_BG = (n: number) =>
  n >= 17 ? "bg-red-100 text-red-800 border-red-300" :
  n >= 10 ? "bg-orange-100 text-orange-800 border-orange-300" :
  n >= 5  ? "bg-yellow-100 text-yellow-800 border-yellow-300" :
            "bg-green-100 text-green-800 border-green-300";

interface RiscoDetalhesProps {
  risco: Risco | null;
  organizacaoId: string;
  onClose: () => void;
}

function ReavaliacaoDialog({
  risco,
  open,
  onOpenChange,
}: {
  risco: Risco;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const registrar = useRegistrarAvaliacao();
  const [prob, setProb] = useState(risco.probabilidade);
  const [imp, setImp] = useState(risco.impacto);
  const [justificativa, setJustificativa] = useState("");
  const nivel = prob * imp;

  const handleSave = async () => {
    await registrar.mutateAsync({
      risco_id: risco.id,
      probabilidade_anterior: risco.probabilidade,
      impacto_anterior: risco.impacto,
      probabilidade_nova: prob,
      impacto_nova: imp,
      justificativa: justificativa || undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reavaliar Risco</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Anterior: P={risco.probabilidade} × I={risco.impacto} = {risco.nivel_risco} ({nivelLabel(risco.nivel_risco)})
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Nova Probabilidade</Label>
              <Badge variant="outline">{prob}/5</Badge>
            </div>
            <Slider min={1} max={5} step={1} value={[prob]} onValueChange={([v]) => setProb(v)} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Novo Impacto</Label>
              <Badge variant="outline">{imp}/5</Badge>
            </div>
            <Slider min={1} max={5} step={1} value={[imp]} onValueChange={([v]) => setImp(v)} />
          </div>
          <div className={`flex items-center justify-between rounded-lg px-4 py-2 text-sm font-medium ${NIVEL_BG(nivel)}`}>
            Novo nível: {nivel} — {nivelLabel(nivel)}
          </div>
          <div className="space-y-1.5">
            <Label>Justificativa</Label>
            <Textarea
              placeholder="Motivo da reavaliação..."
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={registrar.isPending}>
            {registrar.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Registrar reavaliação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function RiscoDetalhes({ risco, organizacaoId, onClose }: RiscoDetalhesProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [reavalOpen, setReavalOpen] = useState(false);
  const excluir = useExcluirRisco();

  const { data: avaliacoes, isLoading: loadingAval } = useRiscoAvaliacoes(risco?.id ?? "");

  const handleExcluir = async () => {
    if (!risco || !window.confirm("Remover este risco permanentemente?")) return;
    await excluir.mutateAsync(risco.id);
    onClose();
  };

  if (!risco) return null;

  const nivel = risco.nivel_risco ?? risco.probabilidade * risco.impacto;

  return (
    <>
      <Sheet open={!!risco} onOpenChange={(v) => !v && onClose()}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="mb-4">
            <div className="flex items-start justify-between gap-2">
              <SheetTitle className="text-base leading-snug pr-2">{risco.titulo}</SheetTitle>
              <Badge variant="outline" className={`text-xs shrink-0 ${NIVEL_BG(nivel)}`}>
                {nivelLabel(nivel)}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2 mt-1">
              <Badge variant="secondary">{CATEGORIA_LABEL[risco.categoria]}</Badge>
              <Badge variant="outline">{STATUS_LABEL[risco.status]}</Badge>
              <Badge variant="outline" className="font-mono">P{risco.probabilidade} × I{risco.impacto} = {nivel}</Badge>
            </div>
          </SheetHeader>

          <div className="flex gap-2 mb-4">
            <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
              <Edit2 className="h-3.5 w-3.5 mr-1.5" />Editar
            </Button>
            <Button size="sm" variant="outline" onClick={() => setReavalOpen(true)}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />Reavaliar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={handleExcluir}
              disabled={excluir.isPending}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />Remover
            </Button>
          </div>

          <Tabs defaultValue="mitigacoes">
            <TabsList className="w-full">
              <TabsTrigger value="mitigacoes" className="flex-1">Ações de Mitigação</TabsTrigger>
              <TabsTrigger value="avaliacoes" className="flex-1">Histórico</TabsTrigger>
            </TabsList>

            <TabsContent value="mitigacoes" className="mt-4">
              {risco.plano_acao && (
                <div className="mb-4 rounded-lg bg-muted/50 px-3 py-2.5 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground text-xs mb-1">Plano de ação</p>
                  {risco.plano_acao}
                </div>
              )}
              <RiscoMitigacaoList riscoId={risco.id} />
            </TabsContent>

            <TabsContent value="avaliacoes" className="mt-4 space-y-3">
              {loadingAval ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : avaliacoes && avaliacoes.length > 0 ? (
                avaliacoes.map((av) => (
                  <div key={av.id} className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {format(new Date(av.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </span>
                      <span className="font-medium">
                        P{av.probabilidade_anterior}×I{av.impacto_anterior} →{" "}
                        P{av.probabilidade_nova}×I{av.impacto_nova} = {av.probabilidade_nova * av.impacto_nova}
                      </span>
                    </div>
                    {av.justificativa && (
                      <p className="text-xs text-muted-foreground">{av.justificativa}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma reavaliação registrada.
                </p>
              )}
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      <RiscoFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        organizacaoId={organizacaoId}
        risco={risco}
      />

      {reavalOpen && (
        <ReavaliacaoDialog
          risco={risco}
          open={reavalOpen}
          onOpenChange={setReavalOpen}
        />
      )}
    </>
  );
}
