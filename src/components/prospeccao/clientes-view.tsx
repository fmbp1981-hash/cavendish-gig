import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Building2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useClientesGeral, type ClienteGeral } from "@/hooks/useClientesGeral";
import { CategoryBadge } from "./category-badge";
import { ExportMenuButton } from "./export-menu-button";
import { EmptyState } from "./empty-state";
import { FinderPageHeader } from "./finder-page-header";
import { SortableTableHead, type SortDirection } from "./sortable-table-head";
import { TableSkeletonRows } from "./table-skeleton-rows";
import type { ExportColumn } from "@/lib/export/table-export";
import { getCategoriaLabel } from "@/lib/prospeccao/categorias";
import { STATUS_TOKENS } from "@/lib/prospeccao/status-tokens";
import { cn } from "@/lib/utils";

type SortField = "nome" | "cnpj" | "origem" | "categoria" | "representante" | "desde";

export function ClientesView() {
  const { data: clientes, isLoading } = useClientesGeral();
  const [busca, setBusca] = useState("");

  const filtrados = useMemo(() => {
    if (!busca.trim()) return clientes ?? [];
    const termo = busca.trim().toLowerCase();
    return (clientes ?? []).filter((c) => c.nome.toLowerCase().includes(termo) || c.cnpj?.toLowerCase().includes(termo));
  }, [clientes, busca]);

  const [sort, setSort] = useState<{ campo: SortField; direcao: SortDirection } | null>(null);
  const toggleSort = (campo: SortField) =>
    setSort((prev) => (prev?.campo === campo ? { campo, direcao: prev.direcao === "asc" ? "desc" : "asc" } : { campo, direcao: "asc" }));

  const sortGetters = useMemo<Record<SortField, (c: ClienteGeral) => string | number>>(
    () => ({
      nome: (c) => c.nome.toLowerCase(),
      cnpj: (c) => (c.cnpj ?? "").toLowerCase(),
      origem: (c) => (c.origem === "finder" ? "finder" : "direto"),
      categoria: (c) => (c.categoriaProspeccao ? getCategoriaLabel(c.categoriaProspeccao).toLowerCase() : ""),
      representante: (c) => (c.representanteNome ?? "").toLowerCase(),
      desde: (c) => new Date(c.createdAt).getTime(),
    }),
    []
  );

  const ordenados = useMemo(() => {
    if (!sort) return filtrados;
    const getter = sortGetters[sort.campo];
    const lista = [...filtrados].sort((a, b) => {
      const va = getter(a);
      const vb = getter(b);
      return typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb), "pt-BR");
    });
    return sort.direcao === "asc" ? lista : lista.reverse();
  }, [filtrados, sort, sortGetters]);

  const colunasExport = useMemo<ExportColumn<ClienteGeral>[]>(
    () => [
      { label: "Empresa", getValue: (c) => c.nome },
      { label: "CNPJ", getValue: (c) => c.cnpj ?? "" },
      { label: "Origem", getValue: (c) => (c.origem === "finder" ? "Finder (Prospecção)" : "Cadastro Direto") },
      { label: "Categoria de prospecção", getValue: (c) => (c.categoriaProspeccao ? getCategoriaLabel(c.categoriaProspeccao) : "") },
      { label: "Representante", getValue: (c) => c.representanteNome ?? "" },
      { label: "Cliente desde", getValue: (c) => format(new Date(c.createdAt), "dd/MM/yyyy", { locale: ptBR }) },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <FinderPageHeader
        icon={Building2}
        title="Todos os Clientes"
        subtitle="Todas as organizações clientes do sistema, com a origem de cada uma"
        actions={<ExportMenuButton rows={ordenados} columns={colunasExport} titulo="Clientes" />}
      />

      <div className="relative w-64">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input className="pl-8" placeholder="Buscar por nome ou CNPJ..." value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden animate-fade-in">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableTableHead label="Empresa" active={sort?.campo === "nome"} direction={sort?.direcao} onClick={() => toggleSort("nome")} />
            <SortableTableHead label="CNPJ" active={sort?.campo === "cnpj"} direction={sort?.direcao} onClick={() => toggleSort("cnpj")} />
            <SortableTableHead label="Origem" active={sort?.campo === "origem"} direction={sort?.direcao} onClick={() => toggleSort("origem")} />
            <SortableTableHead
              label="Categoria de prospecção"
              active={sort?.campo === "categoria"}
              direction={sort?.direcao}
              onClick={() => toggleSort("categoria")}
            />
            <SortableTableHead
              label="Representante"
              active={sort?.campo === "representante"}
              direction={sort?.direcao}
              onClick={() => toggleSort("representante")}
            />
            <SortableTableHead
              label="Cliente desde"
              active={sort?.campo === "desde"}
              direction={sort?.direcao}
              onClick={() => toggleSort("desde")}
            />
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableSkeletonRows columns={6} />
          ) : (
            <>
              {ordenados.map((c) => (
                <TableRow key={c.organizacaoId}>
                  <TableCell className="font-medium">{c.nome}</TableCell>
                  <TableCell className="text-muted-foreground">{c.cnpj || "—"}</TableCell>
                  <TableCell>
                    {c.origem === "finder" ? (
                      <Badge className={cn(STATUS_TOKENS.info.badge, "hover:bg-sky-100")}>Finder (Prospecção)</Badge>
                    ) : (
                      <Badge variant="outline">Cadastro Direto</Badge>
                    )}
                  </TableCell>
                  <TableCell>{c.categoriaProspeccao ? <CategoryBadge categoria={c.categoriaProspeccao} /> : "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{c.representanteNome || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{format(new Date(c.createdAt), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                </TableRow>
              ))}
              {ordenados.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <EmptyState
                      icon={Building2}
                      title={busca.trim() ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado ainda"}
                      description={busca.trim() ? "Ajuste a busca por nome ou CNPJ." : "Clientes aparecem aqui assim que uma organização é criada ou convertida a partir do Finder."}
                    />
                  </TableCell>
                </TableRow>
              )}
            </>
          )}
        </TableBody>
      </Table>
      </div>
    </div>
  );
}
