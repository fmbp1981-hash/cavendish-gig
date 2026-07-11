import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Upload, Users, X } from "lucide-react";
import { useProspeccaoLeads } from "@/hooks/useProspeccaoLeads";
import { useRepresentantes } from "@/hooks/useRepresentantes";
import { PROSPECCAO_CATEGORIAS } from "@/types/prospeccao";
import { getCategoriaLabel } from "@/lib/prospeccao/categorias";
import { CategoryBadge } from "./category-badge";
import { LeadFormDialog } from "./lead-form-dialog";
import { LeadDetailDrawer } from "./lead-detail-drawer";
import { ImportLeadsDialog } from "./import-leads-dialog";
import { ExportMenuButton } from "./export-menu-button";
import { EmptyState } from "./empty-state";
import { SortableTableHead, type SortDirection } from "./sortable-table-head";
import { TableSkeletonRows } from "./table-skeleton-rows";
import type { ExportColumn } from "@/lib/export/table-export";
import type { ProspeccaoCategoria, ProspeccaoLead, ProspeccaoStatus } from "@/types/prospeccao";

type SortField = "nome" | "categoria" | "status" | "cidade" | "responsavel" | "score";

const STATUS_LABEL: Record<ProspeccaoStatus, string> = {
  novo: "Novo",
  contatado: "Contatado",
  qualificando: "Qualificando",
  qualificado: "Qualificado",
  proposta_enviada: "Proposta Enviada",
  negociando: "Negociando",
  convertido: "Convertido",
  perdido: "Perdido",
  sem_resposta: "Sem Resposta",
};

interface LeadsViewProps {
  isAdmin: boolean;
  currentUserId: string;
}

export function LeadsView({ isAdmin, currentUserId }: LeadsViewProps) {
  const [categoria, setCategoria] = useState<ProspeccaoCategoria | "todas">("todas");
  const [status, setStatus] = useState<ProspeccaoStatus | "todos">("todos");
  const [busca, setBusca] = useState("");
  const [criarAberto, setCriarAberto] = useState(false);
  const [importarAberto, setImportarAberto] = useState(false);
  const [leadSelecionado, setLeadSelecionado] = useState<ProspeccaoLead | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const buscaIdFiltro = searchParams.get("busca_id") ?? undefined;

  const { data: leads, isLoading } = useProspeccaoLeads({
    categoria: categoria === "todas" ? undefined : categoria,
    status: status === "todos" ? undefined : status,
    responsavelId: isAdmin ? undefined : currentUserId,
    buscaId: buscaIdFiltro,
  });
  const { data: representantes } = useRepresentantes();

  const representanteNomeMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of representantes ?? []) map.set(r.id, r.nome || r.email);
    return map;
  }, [representantes]);

  const leadsFiltrados = useMemo(() => {
    if (!busca.trim()) return leads ?? [];
    const termo = busca.trim().toLowerCase();
    return (leads ?? []).filter((l) => l.nome.toLowerCase().includes(termo) || l.cidade?.toLowerCase().includes(termo));
  }, [leads, busca]);

  const [sort, setSort] = useState<{ campo: SortField; direcao: SortDirection } | null>(null);
  const toggleSort = (campo: SortField) =>
    setSort((prev) => (prev?.campo === campo ? { campo, direcao: prev.direcao === "asc" ? "desc" : "asc" } : { campo, direcao: "asc" }));

  const sortGetters = useMemo<Record<SortField, (l: ProspeccaoLead) => string | number>>(
    () => ({
      nome: (l) => l.nome.toLowerCase(),
      categoria: (l) => getCategoriaLabel(l.categoria).toLowerCase(),
      status: (l) => STATUS_LABEL[l.status].toLowerCase(),
      cidade: (l) => (l.cidade ?? "").toLowerCase(),
      responsavel: (l) => (representanteNomeMap.get(l.responsavel_id) ?? "").toLowerCase(),
      score: (l) => (typeof l.ai_score === "number" ? l.ai_score : -1),
    }),
    [representanteNomeMap]
  );

  const leadsOrdenados = useMemo(() => {
    if (!sort) return leadsFiltrados;
    const getter = sortGetters[sort.campo];
    const ordenados = [...leadsFiltrados].sort((a, b) => {
      const va = getter(a);
      const vb = getter(b);
      return typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb), "pt-BR");
    });
    return sort.direcao === "asc" ? ordenados : ordenados.reverse();
  }, [leadsFiltrados, sort, sortGetters]);

  const colunasExport = useMemo<ExportColumn<ProspeccaoLead>[]>(() => {
    const colunas: ExportColumn<ProspeccaoLead>[] = [
      { label: "Empresa", getValue: (l) => l.nome },
      { label: "CNPJ", getValue: (l) => l.cnpj ?? "" },
      { label: "Categoria", getValue: (l) => getCategoriaLabel(l.categoria) },
      { label: "Status", getValue: (l) => STATUS_LABEL[l.status] },
      { label: "Telefone", getValue: (l) => l.telefone ?? "" },
      { label: "Email", getValue: (l) => l.email ?? "" },
      { label: "Cidade", getValue: (l) => l.cidade ?? "" },
      { label: "Estado", getValue: (l) => l.estado ?? "" },
    ];
    if (isAdmin) {
      colunas.push({ label: "Responsável", getValue: (l) => representanteNomeMap.get(l.responsavel_id) ?? "" });
    }
    colunas.push({ label: "Score", getValue: (l) => (typeof l.ai_score === "number" ? String(l.ai_score) : "") });
    return colunas;
  }, [isAdmin, representanteNomeMap]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">{isAdmin ? "Leads — Finder" : "Meus Leads"}</h1>
          <p className="text-muted-foreground">Prospecção de leads B2B para o Sistema GIG</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportMenuButton rows={leadsOrdenados} columns={colunasExport} titulo="Leads" />
          <Button variant="outline" onClick={() => setImportarAberto(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Importar
          </Button>
          <Button onClick={() => setCriarAberto(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Lead
          </Button>
        </div>
      </div>

      {buscaIdFiltro && (
        <Badge variant="secondary" className="gap-1 pr-1 w-fit">
          Filtrado pela busca
          <button
            type="button"
            onClick={() => setSearchParams((prev) => { prev.delete("busca_id"); return prev; })}
            className="rounded-full hover:bg-muted-foreground/20 p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      <div className="flex flex-wrap gap-3">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Buscar por nome ou cidade..." value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <Select value={categoria} onValueChange={(v) => setCategoria(v as ProspeccaoCategoria | "todas")}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as categorias</SelectItem>
            {PROSPECCAO_CATEGORIAS.map((c) => (
              <SelectItem key={c} value={c}>
                {getCategoriaLabel(c)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => setStatus(v as ProspeccaoStatus | "todos")}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            {Object.entries(STATUS_LABEL).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <SortableTableHead label="Empresa" active={sort?.campo === "nome"} direction={sort?.direcao} onClick={() => toggleSort("nome")} />
            <SortableTableHead
              label="Categoria"
              active={sort?.campo === "categoria"}
              direction={sort?.direcao}
              onClick={() => toggleSort("categoria")}
            />
            <SortableTableHead label="Status" active={sort?.campo === "status"} direction={sort?.direcao} onClick={() => toggleSort("status")} />
            <SortableTableHead
              label="Cidade/UF"
              active={sort?.campo === "cidade"}
              direction={sort?.direcao}
              onClick={() => toggleSort("cidade")}
            />
            {isAdmin && (
              <SortableTableHead
                label="Responsável"
                active={sort?.campo === "responsavel"}
                direction={sort?.direcao}
                onClick={() => toggleSort("responsavel")}
              />
            )}
            <SortableTableHead label="Score" active={sort?.campo === "score"} direction={sort?.direcao} onClick={() => toggleSort("score")} />
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableSkeletonRows columns={isAdmin ? 6 : 5} />
          ) : (
            <>
              {leadsOrdenados.map((lead) => (
                <TableRow key={lead.id} className="cursor-pointer hover:bg-muted/40" onClick={() => setLeadSelecionado(lead)}>
                  <TableCell className="font-medium">{lead.nome}</TableCell>
                  <TableCell>
                    <CategoryBadge categoria={lead.categoria} />
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{STATUS_LABEL[lead.status]}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {lead.cidade ? `${lead.cidade}${lead.estado ? " - " + lead.estado : ""}` : "—"}
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-muted-foreground">
                      {representanteNomeMap.get(lead.responsavel_id) ?? "—"}
                    </TableCell>
                  )}
                  <TableCell>{typeof lead.ai_score === "number" ? lead.ai_score : "—"}</TableCell>
                </TableRow>
              ))}
              {leadsOrdenados.length === 0 && (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 6 : 5}>
                    <EmptyState
                      icon={Users}
                      title="Nenhum lead encontrado"
                      description={
                        busca.trim() || categoria !== "todas" || status !== "todos" || buscaIdFiltro
                          ? "Ajuste os filtros ou a busca para ver mais resultados."
                          : "Use \"Novo Lead\" ou \"Importar\" para começar a preencher esta lista."
                      }
                    />
                  </TableCell>
                </TableRow>
              )}
            </>
          )}
        </TableBody>
      </Table>

      <LeadFormDialog open={criarAberto} onOpenChange={setCriarAberto} currentUserId={currentUserId} allowAssignResponsavel={isAdmin} />
      <ImportLeadsDialog open={importarAberto} onOpenChange={setImportarAberto} currentUserId={currentUserId} />
      <LeadDetailDrawer lead={leadSelecionado} onClose={() => setLeadSelecionado(null)} podeExcluir={isAdmin} />
    </div>
  );
}
