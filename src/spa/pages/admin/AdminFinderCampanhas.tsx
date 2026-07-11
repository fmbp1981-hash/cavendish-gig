import { AdminLayout } from "@/components/layout/AdminLayout";
import { CampanhasView } from "@/components/prospeccao/campanhas-view";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminFinderCampanhas() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <AdminLayout>
      <CampanhasView isAdmin currentUserId={user.id} />
    </AdminLayout>
  );
}
