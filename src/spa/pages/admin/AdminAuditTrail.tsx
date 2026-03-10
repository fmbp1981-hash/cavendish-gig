import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Download, Search, ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface AuditLog {
  id: string;
  table_name: string;
  operation: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  user_id: string | null;
  created_at: string;
}

const OP_COR: Record<string, string> = {
  INSERT: "bg-green-100 text-green-800",
  UPDATE: "bg-blue-100 text-blue-800",
  DELETE: "bg-red-100 text-red-800",
};

function exportCSV(logs: AuditLog[]) {
  const headers = ["Data/Hora", "Tabela", "Operação", "Usuário", "Dados Anteriores", "Dados Novos"];
  const rows = logs.map(l => [
    format(parseISO(l.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR }),
    l.table_name,
    l.operation,
    l.user_id ?? "Sistema",
    l.old_data ? JSON.stringify(l.old_data) : "",
    l.new_data ? JSON.stringify(l.new_data) : "",
  ]);

  const csv = [headers, ...rows]
    .map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `audit_trail_${format(new Date(), "yyyyMMdd_HHmm")}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  toast.success("Exportação concluída!");
}

export default function AdminAuditTrail() {
  const [searchTable, setSearchTable] = useState("");
  const [searchOp, setSearchOp] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs", searchTable, searchOp, dateFrom, dateTo, page],
    queryFn: async () => {
      let q = (supabase as any)
        .from("audit_logs")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (searchTable) q = q.ilike("table_name", `%${searchTable}%`);
      if (searchOp) q = q.eq("operation", searchOp);
      if (dateFrom) q = q.gte("created_at", `${dateFrom}T00:00:00`);
      if (dateTo) q = q.lte("created_at", `${dateTo}T23:59:59`);

      const { data, error, count } = await q;
      if (error) throw error;
      return { logs: (data ?? []) as AuditLog[], total: count ?? 0 };
    },
  });

  const logs = data?.logs ?? [];
  const total = data?.total ?? 0;

  const handleExportar = () => {
    if (logs.length === 0) {
      toast.error("Nenhum dado para exportar.");
      return;
    }
    exportCSV(logs);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            Audit Trail
          </h1>
          <p className="text-muted-foreground">
            Log imutável de todas as ações no sistema — {total.toLocaleString("pt-BR")} registros
          </p>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="space-y-1.5 w-48">
                <Label className="text-xs">Tabela</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    className="pl-8 h-8 text-sm"
                    placeholder="Ex: documentos"
                    value={searchTable}
                    onChange={e => { setSearchTable(e.target.value); setPage(0); }}
                  />
                </div>
              </div>
              <div className="space-y-1.5 w-36">
                <Label className="text-xs">Operação</Label>
                <Select value={searchOp} onValueChange={v => { setSearchOp(v); setPage(0); }}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Todas" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
                    <SelectItem value="INSERT">INSERT</SelectItem>
                    <SelectItem value="UPDATE">UPDATE</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">De</Label>
                <Input type="date" className="h-8 text-sm w-36" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(0); }} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Até</Label>
                <Input type="date" className="h-8 text-sm w-36" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(0); }} />
              </div>
              <Button size="sm" variant="outline" onClick={handleExportar}>
                <Download className="h-3.5 w-3.5 mr-1.5" />Exportar CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabela */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-10 text-sm text-muted-foreground">
                Nenhum registro encontrado com os filtros aplicados.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-44">Data/Hora</TableHead>
                      <TableHead>Tabela</TableHead>
                      <TableHead className="w-24">Operação</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Resumo da alteração</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map(log => {
                      // Monta resumo das colunas alteradas
                      let resumo = "";
                      if (log.operation === "UPDATE" && log.old_data && log.new_data) {
                        const changed = Object.keys(log.new_data).filter(
                          k => JSON.stringify(log.new_data![k]) !== JSON.stringify(log.old_data![k]) &&
                               k !== "updated_at"
                        );
                        resumo = changed.slice(0, 3).join(", ") + (changed.length > 3 ? `... +${changed.length - 3}` : "");
                      } else if (log.operation === "INSERT" && log.new_data) {
                        const keys = Object.keys(log.new_data).filter(k => log.new_data![k] != null);
                        resumo = keys.slice(0, 4).join(", ");
                      } else if (log.operation === "DELETE" && log.old_data) {
                        const id = log.old_data.id ?? log.old_data.ticket_id ?? "";
                        resumo = id ? `id: ${String(id).slice(0, 8)}...` : "—";
                      }

                      return (
                        <TableRow key={log.id}>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {format(parseISO(log.created_at), "dd/MM/yy HH:mm:ss", { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{log.table_name}</code>
                          </TableCell>
                          <TableCell>
                            <Badge className={`text-[10px] ${OP_COR[log.operation] ?? ""}`}>
                              {log.operation}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {log.user_id ? log.user_id.slice(0, 8) + "..." : "Sistema"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[250px] truncate">
                            {resumo || "—"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Paginação */}
        {total > PAGE_SIZE && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Exibindo {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} de {total.toLocaleString("pt-BR")}
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
                Anterior
              </Button>
              <Button size="sm" variant="outline" onClick={() => setPage(p => p + 1)} disabled={(page + 1) * PAGE_SIZE >= total}>
                Próximo
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
