import { Badge } from "@/components/ui/badge";
import { PROSPECCAO_CATEGORIA_INFO, getCategoriaLabel } from "@/lib/prospeccao/categorias";
import type { ProspeccaoCategoria } from "@/types/prospeccao";

export function CategoryBadge({ categoria }: { categoria: ProspeccaoCategoria }) {
  return (
    <Badge variant="outline" className={PROSPECCAO_CATEGORIA_INFO[categoria]?.className}>
      {getCategoriaLabel(categoria)}
    </Badge>
  );
}
