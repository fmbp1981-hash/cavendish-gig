import { AdminLayout } from "@/components/layout/AdminLayout";
import { BuscaView } from "@/components/prospeccao/busca-view";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminFinderBusca() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <AdminLayout>
      <BuscaView isAdmin currentUserId={user.id} />
    </AdminLayout>
  );
}
