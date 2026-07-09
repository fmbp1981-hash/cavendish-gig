import { AdminLayout } from "@/components/layout/AdminLayout";
import { ClientesView } from "@/components/prospeccao/clientes-view";

export default function AdminClientes() {
  return (
    <AdminLayout>
      <ClientesView />
    </AdminLayout>
  );
}
