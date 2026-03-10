import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle, Users, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ConflitosInteresse,
  STATUS_LABEL,
  STATUS_COR,
  useDeclaracoesPorOrg,
  usePendentesDeclaracao,
  useAnalisarDeclaracao,
} from "@/hooks/useConflitosInteresse";
import { useOrganizacoes } from "@/hooks/useConsultorData";
import { cn } from "@/lib/utils";

// ─── Análise Dialog ───────────────────────────────────────────────────────────

function AnaliseDialog({
  declaracao,
  open,
  onOpenChange,
}: {
  declaracao: ConflitosInteresse | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [observacao, setObservacao] = useState("");
  const analisar = useAnalisarDeclaracao();

  const handleSave = async () => {
    if (!declaracao) return;
    await analisar.mutateAsync({ id: declaracao.id, observacao });
    setObservacao("");
    onOpenChange(false);
  };

  if (!declaracao) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Analisar Declaração</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="rounded-lg bg-muted/40 p-3 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Declarante</span>
              <span className="font-medium">
                {(declaracao as any).profiles_declarante?.nome ?? (declaracao as any).profiles_declarante?.email ?? "—"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Ano</span>
              <span className="font-medium">{declaracao.ano_referencia}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Tem conflito?</span>
              <Badge variant={declaracao.tem_conflito ? "destructive" : "secondary"}>
                {declaracao.tem_conflito ? "Sim" : "Não"}
              </Badge>
            </div>
            {declaracao.descricao && (
              <div>
                <p className="text-muted-foreground mb-1">Descrição</p>
                <p className="text-xs">{declaracao.descricao}</p>
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Observação da análise</Label>
            <Textarea
              placeholder="Registre sua análise e conclusão..."
              value={observacao}
              onChange={e => setObservacao(e.target.value)}
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={analisar.isPending}>
            {analisar.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Marcar como analisado
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────

const ANO_ATUAL = new Date().getFullYear();

export function ConflitosTab() {
  const { data: orgs } = useOrganizacoes();
  const [selectedOrg, setSelectedOrg] = useState("");
  const [anoRef, setAnoRef] = useState(ANO_ATUAL);
  const [analiseTarget, setAnaliseTarget] = useState<ConflitosInteresse | null>(null);
  const [analiseOpen, setAnaliseOpen] = useState(false);

  const { data: declaracoes, isLoading } = useDeclaracoesPorOrg(selectedOrg || undefined, anoRef);
  const { data: pendentes, isLoading: loadPend } = usePendentesDeclaracao(selectedOrg, anoRef);

  const anos = [ANO_ATUAL, ANO_ATUAL - 1, ANO_ATUAL - 2];

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={selectedOrg || "__all__"} onValueChange={v => setSelectedOrg(v === "__all__" ? "" : v)}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Todas as organizações" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todas as organizações</SelectItem>
            {(orgs ?? []).map((org: any) => (
              <SelectItem key={org.id} value={org.id}>{org.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={String(anoRef)} onValueChange={v => setAnoRef(Number(v))}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {anos.map(a => (
              <SelectItem key={a} value={String(a)}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Pendentes */}
      {selectedOrg && pendentes && pendentes.length > 0 && (
        <Alert className="border-amber-400/40 bg-amber-50 dark:bg-amber-900/20">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 dark:text-amber-300">
            <strong>{pendentes.length}</strong> colaborador{pendentes.length > 1 ? "es" : ""} ainda não
            enviaram declaração em {anoRef}:{" "}
            {pendentes.slice(0, 3).map((m: any) => m.profiles?.nome ?? m.profiles?.email ?? "—").join(", ")}
            {pendentes.length > 3 && ` e mais ${pendentes.length - 3}`}.
          </AlertDescription>
        </Alert>
      )}

      {/* Lista */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : !declaracoes || declaracoes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 gap-3 text-center">
            <Users className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm font-medium">Nenhuma declaração encontrada</p>
            <p className="text-xs text-muted-foreground">
              {selectedOrg
                ? `Nenhuma declaração para ${anoRef} nesta organização.`
                : "Selecione uma organização para ver declarações."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {declaracoes.map(d => (
            <Card key={d.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-sm font-medium">
                      {(d as any).profiles_declarante?.nome ?? (d as any).profiles_declarante?.email ?? "—"}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">{d.ano_referencia}</span>
                      <Badge
                        variant={d.tem_conflito ? "destructive" : "outline"}
                        className="text-[10px]"
                      >
                        {d.tem_conflito ? "Conflito declarado" : "Sem conflito"}
                      </Badge>
                      <Badge variant="outline" className={cn("text-[10px]", STATUS_COR[d.status])}>
                        {STATUS_LABEL[d.status]}
                      </Badge>
                    </div>
                    {d.descricao && (
                      <p className="text-xs text-muted-foreground line-clamp-1">{d.descricao}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {d.status !== "analisado" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setAnaliseTarget(d); setAnaliseOpen(true); }}
                      >
                        Analisar
                      </Button>
                    )}
                    {d.status === "analisado" && (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AnaliseDialog
        declaracao={analiseTarget}
        open={analiseOpen}
        onOpenChange={v => { setAnaliseOpen(v); if (!v) setAnaliseTarget(null); }}
      />
    </div>
  );
}
