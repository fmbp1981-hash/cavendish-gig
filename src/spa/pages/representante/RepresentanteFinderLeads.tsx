import { RepresentanteLayout } from "@/components/layout/RepresentanteLayout";
import { LeadsView } from "@/components/prospeccao/leads-view";
import { useAuth } from "@/contexts/AuthContext";

export default function RepresentanteFinderLeads() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <RepresentanteLayout>
      <LeadsView isAdmin={false} currentUserId={user.id} />
    </RepresentanteLayout>
  );
}
