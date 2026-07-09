import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Search, Building2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useClientesGeral } from "@/hooks/useClientesGeral";
import { CategoryBadge } from "./category-badge";

export function ClientesView() {
  const { data: clientes, isLoading } = useClientesGeral();
  const [busca, setBusca] = useState("");

  const filtrados = useMemo(() => {
    if (!busca.trim()) return clientes ?? [];
    const termo = busca.trim().toLowerCase();
    return (clientes ?? []).filter((c) => c.nome.toLowerCase().includes(termo) || c.cnpj?.toLowerCase().includes(termo));
  }, [clientes, busca]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" />
          Todos os Clientes
        </h1>
        <p className="text-muted-foreground">Todas as organizações clientes do sistema, com a origem de cada uma</p>
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
                    <Badge className="bg-sky-100 text-sky-800 border-sky-300 hover:bg-sky-100">Finder (Prospecção)</Badge>
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
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Nenhum cliente cadastrado ainda.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
