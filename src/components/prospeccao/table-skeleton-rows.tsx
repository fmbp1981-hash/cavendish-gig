import { TableCell, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface TableSkeletonRowsProps {
  rows?: number;
  columns: number;
}

/** Linhas de carregamento no formato real da tabela (em vez de um spinner central) — o
 * conteúdo aparece "montando" onde vai ficar, o que lê como mais rápido do que um spinner
 * genérico. Usado em leads-view.tsx e clientes-view.tsx. */
export function TableSkeletonRows({ rows = 6, columns }: TableSkeletonRowsProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: columns }).map((__, j) => (
            <TableCell key={j}>
              <Skeleton className="h-4 w-full max-w-32" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}
