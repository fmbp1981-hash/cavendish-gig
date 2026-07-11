import { AdminLayout } from "@/components/layout/AdminLayout";
import { FunilView } from "@/components/prospeccao/funil-view";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminFinderFunil() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <AdminLayout>
      <FunilView isAdmin currentUserId={user.id} />
    </AdminLayout>
  );
}
