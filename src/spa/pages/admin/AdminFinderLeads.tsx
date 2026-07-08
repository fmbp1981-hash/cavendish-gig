import { AdminLayout } from "@/components/layout/AdminLayout";
import { LeadsView } from "@/components/prospeccao/leads-view";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminFinderLeads() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <AdminLayout>
      <LeadsView isAdmin currentUserId={user.id} />
    </AdminLayout>
  );
}
