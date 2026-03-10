import { useState } from "react";
import { ConsultorLayout } from "@/components/layout/ConsultorLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Loader2, Plus, Trash2, Edit2, Leaf, Users, Scale } from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  ESGIndicador,
  ESGPilar,
  PILAR_LABEL,
  PILAR_COR,
  PILAR_ICON,
  calcularScorePilar,
  useESGIndicadores,
  useCriarESGIndicador,
  useAtualizarESGIndicador,
  useExcluirESGIndicador,
} from "@/hooks/useESG";
import { useOrganizacoes } from "@/hooks/useConsultorData";
import { cn } from "@/lib/utils";

// ─── Form Dialog ──────────────────────────────────────────────────────────────

function IndicadorFormDialog({
  open, onOpenChange, organizacaoId, indicador,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  organizacaoId: string;
  indicador?: ESGIndicador | null;
}) {
  const isEdit = !!indicador;
  const criar = useCriarESGIndicador();
  const atualizar = useAtualizarESGIndicador();

  const [pilar, setPilar] = useState<ESGPilar>(indicador?.pilar ?? "ambiental");
  const [nome, setNome] = useState(indicador?.nome ?? "");
  const [unidade, setUnidade] = useState(indicador?.unidade ?? "número");
  const [meta, setMeta] = useState(indicador?.meta != null ? String(indicador.meta) : "");
  const [valorAtual, setValorAtual] = useState(indicador?.valor_atual != null ? String(indicador.valor_atual) : "");
  const [periodo, setPeriodo] = useState(indicador?.periodo_referencia ?? new Date().getFullYear().toString());
  const [descricao, setDescricao] = useState(indicador?.descricao ?? "");

  const saving = criar.isPending || atualizar.isPending;

  const handleSave = async () => {
    if (!nome.trim()) return;
    const payload = {
      pilar, nome, unidade,
      meta: meta ? Number(meta) : undefined,
      valor_atual: valorAtual ? Number(valorAtual) : undefined,
      periodo_referencia: periodo || undefined,
      descricao: descricao || undefined,
    };
    if (isEdit && indicador) {
      await atualizar.mutateAsync({ id: indicador.id, ...payload });
    } else {
      await criar.mutateAsync({ organization_id: organizacaoId, ...payload });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Indicador" : "Novo Indicador ESG"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Pilar</Label>
              <Select value={pilar} onValueChange={v => setPilar(v as ESGPilar)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["ambiental", "social", "governanca"] as ESGPilar[]).map(p => (
                    <SelectItem key={p} value={p}>{PILAR_ICON[p]} {PILAR_LABEL[p]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Período</Label>
              <Input placeholder="Ex: 2026, Q1 2026" value={periodo} onChange={e => setPeriodo(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Nome do indicador *</Label>
            <Input placeholder="Ex: Consumo de energia (kWh)" value={nome} onChange={e => setNome(e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Unidade</Label>
              <Input placeholder="kWh, %, tCO2" value={unidade} onChange={e => setUnidade(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Meta</Label>
              <Input type="number" placeholder="100" value={meta} onChange={e => setMeta(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Valor atual</Label>
              <Input type="number" placeholder="75" value={valorAtual} onChange={e => setValorAtual(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Textarea placeholder="Contexto ou fonte do indicador..." value={descricao} onChange={e => setDescricao(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!nome.trim() || saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {isEdit ? "Salvar" : "Criar indicador"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Pilar Card ───────────────────────────────────────────────────────────────

function PilarCard({
  pilar, indicadores, onEdit, onExcluir,
}: {
  pilar: ESGPilar;
  indicadores: ESGIndicador[];
  onEdit: (i: ESGIndicador) => void;
  onExcluir: (id: string) => void;
}) {
  const score = calcularScorePilar(indicadores);
  const PILAR_ICONS = { ambiental: Leaf, social: Users, governanca: Scale };
  const Icon = PILAR_ICONS[pilar];

  return (
    <Card className={cn("border", PILAR_COR[pilar].split(" ").find(c => c.startsWith("border-")))}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Icon className={cn("h-4 w-4", PILAR_COR[pilar].split(" ").find(c => c.startsWith("text-")))} />
          {PILAR_ICON[pilar]} {PILAR_LABEL[pilar]}
        </CardTitle>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Score geral</span>
            <span className="font-bold">{score}%</span>
          </div>
          <Progress value={score} className="h-1.5" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {indicadores.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">Nenhum indicador cadastrado.</p>
        ) : (
          indicadores.map(ind => {
            const pct = ind.meta && ind.valor_atual != null
              ? Math.min(Math.round((ind.valor_atual / ind.meta) * 100), 100)
              : null;
            return (
              <div key={ind.id} className="rounded-lg bg-muted/30 px-3 py-2 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium truncate">{ind.nome}</p>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => onEdit(ind)} className="text-muted-foreground hover:text-foreground p-0.5">
                      <Edit2 className="h-3 w-3" />
                    </button>
                    <button onClick={() => onExcluir(ind.id)} className="text-muted-foreground hover:text-destructive p-0.5">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    {ind.valor_atual != null ? ind.valor_atual : "—"} {ind.unidade}
                    {ind.meta != null && ` / meta: ${ind.meta}`}
                  </span>
                  {pct !== null && (
                    <span className={cn(
                      "font-medium",
                      pct >= 80 ? "text-green-600" :
                      pct >= 60 ? "text-yellow-600" :
                      "text-red-600"
                    )}>
                      {pct}%
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const PILARES: ESGPilar[] = ["ambiental", "social", "governanca"];

export default function ESGDashboard() {
  const { data: orgs } = useOrganizacoes();
  const [selectedOrg, setSelectedOrg] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ESGIndicador | null>(null);
  const excluir = useExcluirESGIndicador();

  const { data: indicadores, isLoading } = useESGIndicadores(selectedOrg || undefined);

  const porPilar = (pilar: ESGPilar) =>
    (indicadores ?? []).filter(i => i.pilar === pilar);

  const radarData = PILARES.map(p => ({
    pilar: PILAR_LABEL[p],
    score: calcularScorePilar(porPilar(p)),
  }));

  const totalScore = PILARES.length > 0
    ? Math.round(radarData.reduce((s, d) => s + d.score, 0) / PILARES.length)
    : 0;

  return (
    <ConsultorLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">Dashboard ESG</h1>
            <p className="text-muted-foreground">Indicadores Ambientais, Sociais e de Governança</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedOrg} onValueChange={setSelectedOrg}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Selecione a organização" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                {(orgs ?? []).map((org: any) => (
                  <SelectItem key={org.id} value={org.id}>{org.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={() => { setEditTarget(null); setFormOpen(true); }} disabled={!selectedOrg}>
              <Plus className="h-4 w-4 mr-1.5" />Indicador
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <>
            {/* Score total + RadarChart */}
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle className="text-base">Score ESG Geral</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <p className={cn(
                      "text-6xl font-bold",
                      totalScore >= 80 ? "text-green-600" :
                      totalScore >= 60 ? "text-yellow-600" :
                      totalScore >= 40 ? "text-orange-600" :
                      "text-red-600"
                    )}>
                      {totalScore}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">de 100</p>
                  </div>
                  <div className="space-y-3 mt-4">
                    {PILARES.map(p => {
                      const score = calcularScorePilar(porPilar(p));
                      return (
                        <div key={p} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>{PILAR_ICON[p]} {PILAR_LABEL[p]}</span>
                            <span className="font-medium">{score}%</span>
                          </div>
                          <Progress value={score} className="h-1.5" />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Radar ESG</CardTitle>
                  <CardDescription>Performance por pilar</CardDescription>
                </CardHeader>
                <CardContent>
                  {radarData.every(d => d.score === 0) ? (
                    <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
                      Adicione indicadores com metas para visualizar o radar
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <RadarChart data={radarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="pilar" tick={{ fontSize: 12 }} />
                        <Radar
                          name="Score"
                          dataKey="score"
                          stroke="hsl(var(--primary))"
                          fill="hsl(var(--primary))"
                          fillOpacity={0.25}
                        />
                        <Tooltip formatter={(v: number) => [`${v}%`, "Score"]} />
                      </RadarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Cards por pilar */}
            <div className="grid gap-4 md:grid-cols-3">
              {PILARES.map(p => (
                <PilarCard
                  key={p}
                  pilar={p}
                  indicadores={porPilar(p)}
                  onEdit={i => { setEditTarget(i); setFormOpen(true); }}
                  onExcluir={id => {
                    if (window.confirm("Remover este indicador?")) excluir.mutate(id);
                  }}
                />
              ))}
            </div>
          </>
        )}

        {selectedOrg && (
          <IndicadorFormDialog
            open={formOpen}
            onOpenChange={v => { setFormOpen(v); if (!v) setEditTarget(null); }}
            organizacaoId={selectedOrg}
            indicador={editTarget}
          />
        )}
      </div>
    </ConsultorLayout>
  );
}
