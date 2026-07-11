import { RepresentanteLayout } from "@/components/layout/RepresentanteLayout";
import { FunilView } from "@/components/prospeccao/funil-view";
import { useAuth } from "@/contexts/AuthContext";

export default function RepresentanteFinderFunil() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <RepresentanteLayout>
      <FunilView isAdmin={false} currentUserId={user.id} />
    </RepresentanteLayout>
  );
}
