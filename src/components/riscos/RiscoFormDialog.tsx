import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Risco,
  RiscoCategoria,
  RiscoStatus,
  CATEGORIA_LABEL,
  STATUS_LABEL,
  nivelLabel,
  useCriarRisco,
  useAtualizarRisco,
} from "@/hooks/useRiscos";

interface RiscoFormDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  organizacaoId: string;
  risco?: Risco | null;
}

const NIVEL_BG = (n: number) => {
  if (n <= 4)  return "bg-green-100 text-green-800";
  if (n <= 9)  return "bg-yellow-100 text-yellow-800";
  if (n <= 16) return "bg-orange-100 text-orange-800";
  return "bg-red-100 text-red-800";
};

export function RiscoFormDialog({ open, onOpenChange, organizacaoId, risco }: RiscoFormDialogProps) {
  const isEdit = !!risco;
  const criar = useCriarRisco();
  const atualizar = useAtualizarRisco();

  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState<RiscoCategoria>("operacional");
  const [prob, setProb] = useState(1);
  const [imp, setImp] = useState(1);
  const [status, setStatus] = useState<RiscoStatus>("identificado");
  const [planoAcao, setPlanoAcao] = useState("");
  const [prazo, setPrazo] = useState("");

  useEffect(() => {
    if (risco) {
      setTitulo(risco.titulo);
      setCategoria(risco.categoria);
      setProb(risco.probabilidade ?? 1);
      setImp(risco.impacto ?? 1);
      setStatus(risco.status);
      setPlanoAcao(risco.plano_acao ?? "");
      setPrazo(risco.prazo ?? "");
    } else {
      setTitulo(""); setCategoria("operacional"); setProb(1); setImp(1);
      setStatus("identificado"); setPlanoAcao(""); setPrazo("");
    }
  }, [risco, open]);

  const nivel = prob * imp;

  const handleSave = async () => {
    if (!titulo.trim()) return;

    if (isEdit && risco) {
      await atualizar.mutateAsync({
        id: risco.id,
        titulo,
        categoria,
        probabilidade: prob,
        impacto: imp,
        status,
        plano_acao: planoAcao || null,
        prazo: prazo || null,
      });
    } else {
      await criar.mutateAsync({
        organizacao_id: organizacaoId,
        titulo,
        categoria,
        probabilidade: prob,
        impacto: imp,
        status,
        plano_acao: planoAcao || null,
        prazo: prazo || null,
      });
    }
    onOpenChange(false);
  };

  const saving = criar.isPending || atualizar.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Risco" : "Novo Risco"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Título */}
          <div className="space-y-1.5">
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              placeholder="Ex: Não conformidade com LGPD no RH"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </div>

          {/* Categoria + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select value={categoria} onValueChange={(v) => setCategoria(v as RiscoCategoria)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORIA_LABEL).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as RiscoStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABEL).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Probabilidade */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Probabilidade</Label>
              <Badge variant="outline" className="font-mono">{prob}/5</Badge>
            </div>
            <Slider
              min={1} max={5} step={1}
              value={[prob]}
              onValueChange={([v]) => setProb(v)}
              className="cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground px-0.5">
              <span>Raro</span><span>Improvável</span><span>Possível</span><span>Provável</span><span>Quase certo</span>
            </div>
          </div>

          {/* Impacto */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Impacto</Label>
              <Badge variant="outline" className="font-mono">{imp}/5</Badge>
            </div>
            <Slider
              min={1} max={5} step={1}
              value={[imp]}
              onValueChange={([v]) => setImp(v)}
              className="cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground px-0.5">
              <span>Insignif.</span><span>Baixo</span><span>Moderado</span><span>Alto</span><span>Catastrófico</span>
            </div>
          </div>

          {/* Nível calculado */}
          <div className={`flex items-center justify-between rounded-lg px-4 py-2.5 ${NIVEL_BG(nivel)}`}>
            <span className="text-sm font-medium">Nível de Risco Calculado</span>
            <span className="font-bold text-base">{nivel} — {nivelLabel(nivel)}</span>
          </div>

          {/* Plano de ação */}
          <div className="space-y-1.5">
            <Label htmlFor="plano">Plano de Ação</Label>
            <Textarea
              id="plano"
              placeholder="Descreva as ações previstas para tratar este risco..."
              value={planoAcao}
              onChange={(e) => setPlanoAcao(e.target.value)}
              rows={3}
            />
          </div>

          {/* Prazo */}
          <div className="space-y-1.5">
            <Label htmlFor="prazo">Prazo para resolução</Label>
            <Input
              id="prazo"
              type="date"
              value={prazo}
              onChange={(e) => setPrazo(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!titulo.trim() || saving}>
            {saving ? "Salvando..." : isEdit ? "Salvar alterações" : "Cadastrar risco"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
