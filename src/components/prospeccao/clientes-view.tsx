import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Search, Building2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useClientesGeral, type ClienteGeral } from "@/hooks/useClientesGeral";
import { CategoryBadge } from "./category-badge";
import { ExportMenuButton } from "./export-menu-button";
import { EmptyState } from "./empty-state";
import type { ExportColumn } from "@/lib/export/table-export";
import { getCategoriaLabel } from "@/lib/prospeccao/categorias";
import { STATUS_TOKENS } from "@/lib/prospeccao/status-tokens";
import { cn } from "@/lib/utils";

export function ClientesView() {
  const { data: clientes, isLoading } = useClientesGeral();
  const [busca, setBusca] = useState("");

  const filtrados = useMemo(() => {
    if (!busca.trim()) return clientes ?? [];
    const termo = busca.trim().toLowerCase();
    return (clientes ?? []).filter((c) => c.nome.toLowerCase().includes(termo) || c.cnpj?.toLowerCase().includes(termo));
  }, [clientes, busca]);

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
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            Todos os Clientes
          </h1>
          <p className="text-muted-foreground">Todas as organizações clientes do sistema, com a origem de cada uma</p>
        </div>
        <ExportMenuButton rows={filtrados} columns={colunasExport} titulo="Clientes" />
      </div>

      <div className="relative w-64">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input className="pl-8" placeholder="Buscar por nome ou CNPJ..." value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Categoria de prospecção</TableHead>
              <TableHead>Representante</TableHead>
              <TableHead>Cliente desde</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtrados.map((c) => (
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
            {filtrados.length === 0 && (
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
          </TableBody>
        </Table>
      )}
    </div>
  );
}
