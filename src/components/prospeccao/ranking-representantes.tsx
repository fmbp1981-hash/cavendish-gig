import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { RankingRepresentanteLinha } from "@/hooks/useProspeccaoDashboard";

interface RankingRepresentantesProps {
  ranking: RankingRepresentanteLinha[];
}

export function RankingRepresentantes({ ranking }: RankingRepresentantesProps) {
  if (ranking.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum representante cadastrado.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Representante</TableHead>
          <TableHead className="text-right">Leads</TableHead>
          <TableHead className="text-right">Contatados</TableHead>
          <TableHead className="text-right">Convertidos</TableHead>
          <TableHead className="text-right">Taxa</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ranking.map((linha) => (
          <TableRow key={linha.representanteId}>
            <TableCell className="font-medium">{linha.nome}</TableCell>
            <TableCell className="text-right">{linha.leads}</TableCell>
            <TableCell className="text-right">
              {linha.contatados}
              {linha.metaLeadsContatados != null && (
                <span className="text-muted-foreground"> / {linha.metaLeadsContatados}</span>
              )}
            </TableCell>
            <TableCell className="text-right">
              {linha.convertidos}
              {linha.metaConversoes != null && <span className="text-muted-foreground"> / {linha.metaConversoes}</span>}
            </TableCell>
            <TableCell className="text-right">{linha.taxaConversao}%</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
