import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Scale } from "lucide-react";
import {
  useRiscos,
  Risco,
  CATEGORIA_LABEL,
  STATUS_LABEL,
  nivelLabel,
} from "@/hooks/useRiscos";
import { useOrganizacoes } from "@/hooks/useConsultorData";
import { RiscoHeatmap } from "./RiscoHeatmap";
import { RiscoFormDialog } from "./RiscoFormDialog";
import { RiscoDetalhes } from "./RiscoDetalhes";
import { cn } from "@/lib/utils";

const NIVEL_BADGE = (n: number) =>
  n >= 17 ? "bg-red-100 text-red-800 border-red-300" :
  n >= 10 ? "bg-orange-100 text-orange-800 border-orange-300" :
  n >= 5  ? "bg-yellow-100 text-yellow-800 border-yellow-300" :
            "bg-green-100 text-green-800 border-green-300";

export function RiscosTab() {
  const { data: orgs, isLoading: orgsLoading } = useOrganizacoes();
  const [selectedOrg, setSelectedOrg] = useState<string>("");
  const [novoOpen, setNovoOpen] = useState(false);
  const [riscoDetalhe, setRiscoDetalhe] = useState<Risco | null>(null);
  const [view, setView] = useState<"lista" | "heatmap">("lista");

  const orgId = selectedOrg || undefined;
  const { data: riscos, isLoading } = useRiscos(orgId);

  const orgsOptions = orgs ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Seletor de organização */}
          <Select value={selectedOrg} onValueChange={setSelectedOrg}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Todas as organizações" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas as organizações</SelectItem>
              {orgsOptions.map((org: any) => (
                <SelectItem key={org.id} value={org.id}>{org.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Toggle view */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setView("lista")}
              className={cn(
                "px-3 py-1.5 text-xs font-medium transition-colors",
                view === "lista"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted"
              )}
            >
              Lista
            </button>
            <button
              onClick={() => setView("heatmap")}
              className={cn(
                "px-3 py-1.5 text-xs font-medium transition-colors",
                view === "heatmap"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted"
              )}
            >
              Heatmap
            </button>
          </div>
        </div>

        <Button
          size="sm"
          onClick={() => setNovoOpen(true)}
          disabled={!selectedOrg}
          title={!selectedOrg ? "Selecione uma organização para adicionar riscos" : ""}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Novo Risco
        </Button>
      </div>

      {isLoading || orgsLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !riscos || riscos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 gap-3 text-center">
            <Scale className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm font-medium">Nenhum risco cadastrado</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              {selectedOrg
                ? "Cadastre o primeiro risco clicando em 'Novo Risco'."
                : "Selecione uma organização para ver ou cadastrar riscos."}
            </p>
          </CardContent>
        </Card>
      ) : view === "heatmap" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Matriz de Riscos (5×5)</CardTitle>
            <CardDescription>
              Clique em uma célula com riscos para ver os detalhes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RiscoHeatmap riscos={riscos} onSelect={setRiscoDetalhe} />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {riscos.map((risco) => {
            const nivel = risco.nivel_risco ?? risco.probabilidade * risco.impacto;
            return (
              <Card
                key={risco.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => setRiscoDetalhe(risco)}
              >
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Nível indicator */}
                      <div
                        className={cn(
                          "w-1.5 rounded-full self-stretch shrink-0",
                          nivel >= 17 ? "bg-red-500" :
                          nivel >= 10 ? "bg-orange-400" :
                          nivel >= 5  ? "bg-yellow-400" :
                                        "bg-green-400"
                        )}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{risco.titulo}</p>
                        <p className="text-xs text-muted-foreground">
                          {CATEGORIA_LABEL[risco.categoria]} · {STATUS_LABEL[risco.status]}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground font-mono">
                        P{risco.probabilidade}×I{risco.impacto}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn("text-xs", NIVEL_BADGE(nivel))}
                      >
                        {nivel} — {nivelLabel(nivel)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialogs */}
      {selectedOrg && (
        <RiscoFormDialog
          open={novoOpen}
          onOpenChange={setNovoOpen}
          organizacaoId={selectedOrg}
        />
      )}

      <RiscoDetalhes
        risco={riscoDetalhe}
        organizacaoId={selectedOrg}
        onClose={() => setRiscoDetalhe(null)}
      />
    </div>
  );
}
