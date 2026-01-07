import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAllUsers, useConsultorOrganizacoes, useAllOrganizacoes } from "@/hooks/useAdminData";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  Search, 
  MoreHorizontal, 
  Shield, 
  Mail,
  Calendar,
  Building2
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type AppRole = "admin" | "consultor" | "cliente" | "parceiro";

export default function AdminUsuarios() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleDialog, setRoleDialog] = useState<{ open: boolean; userId: string; currentRole?: string }>({
    open: false,
    userId: "",
  });
  const [assignDialog, setAssignDialog] = useState<{ open: boolean; consultorId: string; consultorName: string }>({
    open: false,
    consultorId: "",
    consultorName: "",
  });
  const [selectedRole, setSelectedRole] = useState<AppRole>("cliente");
  const [selectedOrgs, setSelectedOrgs] = useState<string[]>([]);
  const [savingAssignment, setSavingAssignment] = useState(false);
  const [assignSelectionInitialized, setAssignSelectionInitialized] = useState(false);
  
  const { data: users, isLoading } = useAllUsers();
  const { data: organizacoes } = useAllOrganizacoes();
  const { data: consultorOrgs, isLoading: loadingConsultorOrgs } = useConsultorOrganizacoes(assignDialog.consultorId);
  const queryClient = useQueryClient();

  const filteredUsers = users?.filter(user => 
    user.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (roles: { role: string }[] | null) => {
    if (!roles || roles.length === 0) {
      return <Badge variant="outline">Sem role</Badge>;
    }
    
    const role = roles[0]?.role;
    switch (role) {
      case "admin":
        return <Badge variant="destructive">Admin</Badge>;
      case "consultor":
        return <Badge className="bg-blue-500 hover:bg-blue-600">Consultor</Badge>;
      case "parceiro":
        return <Badge className="bg-purple-500 hover:bg-purple-600">Parceiro</Badge>;
      default:
        return <Badge variant="secondary">Cliente</Badge>;
    }
  };

  const handleUpdateRole = async () => {
    try {
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", roleDialog.userId)
        .maybeSingle();

      if (existingRole) {
        const { error } = await supabase
          .from("user_roles")
          .update({ role: selectedRole })
          .eq("user_id", roleDialog.userId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: roleDialog.userId, role: selectedRole });

        if (error) throw error;
      }

      toast.success("Role atualizada com sucesso");
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
      setRoleDialog({ open: false, userId: "" });
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Erro ao atualizar role");
    }
  };

  const handleOpenAssignDialog = (userId: string, userName: string) => {
    setAssignDialog({ open: true, consultorId: userId, consultorName: userName });
  };

  // Sync selectedOrgs when consultorOrgs loads
  const handleAssignDialogOpen = (open: boolean) => {
    if (!open) {
      setAssignDialog({ open: false, consultorId: "", consultorName: "" });
      setSelectedOrgs([]);
      setAssignSelectionInitialized(false);
    }
  };

  // Initialize selected orgs from DB once when the dialog opens (or consultor changes)
  useEffect(() => {
    if (!assignDialog.open) return;
    setAssignSelectionInitialized(false);
  }, [assignDialog.open, assignDialog.consultorId]);

  useEffect(() => {
    if (!assignDialog.open) return;
    if (assignSelectionInitialized) return;
    if (!consultorOrgs) return;
    setSelectedOrgs(consultorOrgs.map((co) => co.organizacao_id));
    setAssignSelectionInitialized(true);
  }, [assignDialog.open, consultorOrgs, assignSelectionInitialized]);

  const handleSaveAssignments = async () => {
    try {
      setSavingAssignment(true);
      
      // Get current assignments
      const currentOrgIds = consultorOrgs?.map(co => co.organizacao_id) || [];
      
      // Find orgs to add and remove
      const toAdd = selectedOrgs.filter(id => !currentOrgIds.includes(id));
      const toRemove = currentOrgIds.filter(id => !selectedOrgs.includes(id));

      // Remove unselected orgs
      if (toRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from("consultor_organizacoes")
          .delete()
          .eq("consultor_id", assignDialog.consultorId)
          .in("organizacao_id", toRemove);

        if (deleteError) throw deleteError;
      }

      // Add new orgs
      if (toAdd.length > 0) {
        const { error: insertError } = await supabase
          .from("consultor_organizacoes")
          .insert(
            toAdd.map(orgId => ({
              consultor_id: assignDialog.consultorId,
              organizacao_id: orgId,
            }))
          );

        if (insertError) throw insertError;
      }

      toast.success("Organizações atribuídas com sucesso");
      queryClient.invalidateQueries({ queryKey: ["consultor-organizacoes"] });
      setAssignDialog({ open: false, consultorId: "", consultorName: "" });
      setSelectedOrgs([]);
    } catch (error) {
      console.error("Error saving assignments:", error);
      toast.error("Erro ao atribuir organizações");
    } finally {
      setSavingAssignment(false);
    }
  };

  const toggleOrg = (orgId: string) => {
    setSelectedOrgs(prev => 
      prev.includes(orgId) 
        ? prev.filter(id => id !== orgId)
        : [...prev, orgId]
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestão de Usuários</h1>
            <p className="text-muted-foreground">Gerencie todos os usuários do sistema</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Usuários</CardTitle>
                <CardDescription>
                  {users?.length || 0} usuários cadastrados
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar usuários..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Cadastrado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers?.map((user) => {
                    const isConsultor = user.user_roles?.some(r => r.role === "consultor");
                    return (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.nome || "Sem nome"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            {user.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getRoleBadge(user.user_roles)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => {
                                  setSelectedRole(user.user_roles?.[0]?.role as AppRole || "cliente");
                                  setRoleDialog({ 
                                    open: true, 
                                    userId: user.id,
                                    currentRole: user.user_roles?.[0]?.role
                                  });
                                }}
                              >
                                <Shield className="mr-2 h-4 w-4" />
                                Alterar Role
                              </DropdownMenuItem>
                              {isConsultor && (
                                <DropdownMenuItem 
                                  onClick={() => handleOpenAssignDialog(user.id, user.nome || user.email || "Consultor")}
                                >
                                  <Building2 className="mr-2 h-4 w-4" />
                                  Atribuir Organizações
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Role Dialog */}
      <Dialog open={roleDialog.open} onOpenChange={(open) => setRoleDialog({ ...roleDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Role do Usuário</DialogTitle>
            <DialogDescription>
              Selecione a nova role para este usuário
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedRole} onValueChange={(value: AppRole) => setSelectedRole(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cliente">Cliente</SelectItem>
                <SelectItem value="consultor">Consultor</SelectItem>
                <SelectItem value="parceiro">Parceiro</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialog({ open: false, userId: "" })}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateRole}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Organizations Dialog */}
      <Dialog open={assignDialog.open} onOpenChange={handleAssignDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Atribuir Organizações</DialogTitle>
            <DialogDescription>
              Selecione as organizações que o consultor <strong>{assignDialog.consultorName}</strong> poderá gerenciar
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 max-h-80 overflow-y-auto">
            {loadingConsultorOrgs ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : organizacoes && organizacoes.length > 0 ? (
              <div className="space-y-2">
                {organizacoes.map((org) => (
                  <div
                    key={org.id}
                    className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-accent/50 cursor-pointer"
                    onClick={() => toggleOrg(org.id)}
                  >
                    <Checkbox
                      checked={selectedOrgs.includes(org.id)}
                      onCheckedChange={() => toggleOrg(org.id)}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{org.nome}</p>
                      {org.cnpj && (
                        <p className="text-xs text-muted-foreground">{org.cnpj}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma organização cadastrada
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleAssignDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveAssignments} disabled={savingAssignment}>
              {savingAssignment ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}