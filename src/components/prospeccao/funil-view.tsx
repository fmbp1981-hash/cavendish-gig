import { useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Kanban } from "lucide-react";
import { useProspeccaoLeads } from "@/hooks/useProspeccaoLeads";
import { useProspeccaoFunilPadrao, useProspeccaoFunilEtapas, useMoverLeadEtapa } from "@/hooks/useProspeccaoFunis";
import { useRepresentantes } from "@/hooks/useRepresentantes";
import { PROSPECCAO_CATEGORIAS } from "@/types/prospeccao";
import { getCategoriaLabel } from "@/lib/prospeccao/categorias";
import { getEtapaCores } from "@/lib/prospeccao/funil-etapa-cores";
import { KanbanBoard } from "./kanban-board";
import { LeadCard } from "./lead-card";
import { LeadDetailDrawer } from "./lead-detail-drawer";
import { FinderPageHeader } from "./finder-page-header";
import { EmptyState } from "./empty-state";
import type { ProspeccaoCategoria, ProspeccaoLead, ProspeccaoFunilEtapa } from "@/types/prospeccao";

interface FunilViewProps {
  isAdmin: boolean;
  currentUserId: string;
}

export function FunilView({ isAdmin, currentUserId }: FunilViewProps) {
  const [categoria, setCategoria] = useState<ProspeccaoCategoria>(PROSPECCAO_CATEGORIAS[0]);
  const [leadSelecionado, setLeadSelecionado] = useState<ProspeccaoLead | null>(null);

  const { data: funil, isLoading: carregandoFunil } = useProspeccaoFunilPadrao(categoria);
  const { data: etapas, isLoading: carregandoEtapas } = useProspeccaoFunilEtapas(funil?.id);
  const { data: leads, isLoading: carregandoLeads } = useProspeccaoLeads({
    categoria,
    responsavelId: isAdmin ? undefined : currentUserId,
  });
  const { data: representantes } = useRepresentantes();
  const moverLeadEtapa = useMoverLeadEtapa();

  const representanteNomeMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of representantes ?? []) map.set(r.id, r.nome || r.email);
    return map;
  }, [representantes]);

  const columns = useMemo(
    () => (etapas ?? []).map((e) => ({ id: e.id, title: e.nome, posicao: e.posicao, isTerminal: e.is_terminal })),
    [etapas]
  );
  const leadsComEtapa = useMemo(() => (leads ?? []).filter((l) => !!l.funil_etapa_id), [leads]);
  const etapaPorId = useMemo(() => {
    const map = new Map<string, ProspeccaoFunilEtapa>();
    for (const e of etapas ?? []) map.set(e.id, e);
    return map;
  }, [etapas]);

  const isLoading = carregandoFunil || carregandoEtapas || carregandoLeads;

  return (
    <div className="space-y-6">
      <FinderPageHeader
        icon={Kanban}
        title="Funil — Finder"
        subtitle="Acompanhe os leads por etapa do funil comercial"
        actions={
          <Select value={categoria} onValueChange={(v) => setCategoria(v as ProspeccaoCategoria)}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROSPECCAO_CATEGORIAS.map((c) => (
                <SelectItem key={c} value={c}>
                  {getCategoriaLabel(c)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !funil ? (
        <EmptyState icon={Kanban} title="Nenhum funil configurado para esta categoria ainda" />
      ) : (
        <KanbanBoard
          columns={columns}
          items={leadsComEtapa}
          getColumnId={(lead) => lead.funil_etapa_id as string}
          onMoveItem={(leadId, toColumnId) => {
            const etapa = (etapas ?? []).find((e) => e.id === toColumnId);
            const lead = leadsComEtapa.find((l) => l.id === leadId);
            if (!etapa || !lead) return;
            moverLeadEtapa.mutate({ leadId, etapa, statusAtual: lead.status });
          }}
          renderCard={(lead, ctx) => {
            const etapa = etapaPorId.get(lead.funil_etapa_id as string);
            const cores = etapa ? getEtapaCores(etapa.nome, etapa.posicao, etapa.is_terminal) : undefined;
            return (
              <LeadCard
                lead={lead}
                responsavelNome={isAdmin ? representanteNomeMap.get(lead.responsavel_id) : undefined}
                onClick={() => setLeadSelecionado(lead)}
                accentClassName={cores?.bar}
                columns={ctx.columns}
                currentColumnId={ctx.currentColumnId}
                onMoveToColumn={ctx.moveTo}
              />
            );
          }}
        />
      )}

      <LeadDetailDrawer lead={leadSelecionado} onClose={() => setLeadSelecionado(null)} podeExcluir={isAdmin} />
    </div>
  );
}
