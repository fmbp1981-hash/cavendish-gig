import { RepresentanteLayout } from "@/components/layout/RepresentanteLayout";
import { BuscaView } from "@/components/prospeccao/busca-view";
import { useAuth } from "@/contexts/AuthContext";

export default function RepresentanteFinderBusca() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <RepresentanteLayout>
      <BuscaView isAdmin={false} currentUserId={user.id} leadsHref="/representante/finder/leads" />
    </RepresentanteLayout>
  );
}
