import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ExternalLink, RefreshCw, Target, MapPin, Hash, Database, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getCategoriaLabel } from "@/lib/prospeccao/categorias";
import type { ProspeccaoBusca } from "@/types/prospeccao";

interface BuscaHistoricoProps {
  historico?: ProspeccaoBusca[];
  isLoading: boolean;
  leadsHref: string;
  onReprocessar: (busca: ProspeccaoBusca) => void;
  reprocessandoId?: string | null;
}

export function BuscaHistorico({ historico, isLoading, leadsHref, onReprocessar, reprocessandoId }: BuscaHistoricoProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!historico || historico.length === 0) {
    return <p className="text-center text-muted-foreground py-8">Nenhuma busca realizada ainda.</p>;
  }

  return (
    <div className="space-y-3">
      {historico.map((busca) => (
        <Card key={busca.id}>
          <CardContent className="pt-6 space-y-2">
            <div className="flex items-center justify-between">
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-100">
                {busca.total_resultados > 0 ? "Concluída" : "Sem resultados"}
              </Badge>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {format(new Date(busca.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </span>
            </div>

            <div className="grid gap-1 text-sm">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Nicho:</span>
                <span>{busca.termo || "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Localização:</span>
                <span>{busca.localizacao || "Não especificada"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Categoria:</span>
                <span>{getCategoriaLabel(busca.categoria)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Salvos no CRM:</span>
                <Badge variant="secondary">{busca.total_importados} lead(s)</Badge>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button size="sm" onClick={() => navigate(`${leadsHref}?busca_id=${busca.id}`)}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Ver Leads ({busca.total_importados})
              </Button>
              <Button size="sm" variant="outline" onClick={() => onReprocessar(busca)} disabled={reprocessandoId === busca.id}>
                {reprocessandoId === busca.id ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Reprocessar
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
