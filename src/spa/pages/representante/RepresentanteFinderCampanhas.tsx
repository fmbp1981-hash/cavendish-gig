import { RepresentanteLayout } from "@/components/layout/RepresentanteLayout";
import { CampanhasView } from "@/components/prospeccao/campanhas-view";
import { useAuth } from "@/contexts/AuthContext";

export default function RepresentanteFinderCampanhas() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <RepresentanteLayout>
      <CampanhasView isAdmin={false} currentUserId={user.id} />
    </RepresentanteLayout>
  );
}
