import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAllUsers, useConsultorOrganizacoes, useAllOrganizacoes } from "@/hooks/useAdminData";
import {
  useUserPreRegistrations,
  useAddUserPreRegistration,
  useRemoveUserPreRegistration,
} from "@/hooks/useConsultorPreRegistration";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  Search, 
  MoreHorizontal, 
  Shield, 
  Mail,
  Calendar,
  Building2,
  UserPlus,
  Trash2,
  CheckCircle2,
  Clock,
  UserCog,
  AlertCircle
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
  
  // Pre-registration states
  const [preRegDialogOpen, setPreRegDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newNome, setNewNome] = useState("");
  const [newRole, setNewRole] = useState<AppRole>("consultor");

  const [selectedRole, setSelectedRole] = useState<AppRole>("cliente");
  const [selectedOrgs, setSelectedOrgs] = useState<string[]>([]);
  const [savingAssignment, setSavingAssignment] = useState(false);
  const [assignSelectionInitialized, setAssignSelectionInitialized] = useState(false);
  
  const { data: users, isLoading } = useAllUsers();
  const { data: organizacoes } = useAllOrganizacoes();
  const { data: consultorOrgs, isLoading: loadingConsultorOrgs } = useConsultorOrganizacoes(assignDialog.consultorId);
  
  const { data: preRegistrations, isLoading: loadingPreRegs } = useUserPreRegistrations();
  const addPreRegMutation = useAddUserPreRegistration();
  const removePreRegMutation = useRemoveUserPreRegistration();

  const queryClient = useQueryClient();

  const filteredUsers = users?.filter(user => 
    user.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (roles: { role: string }[] | null | string) => {
    let role = "";
    if (typeof roles === "string") {
      role = roles;
    } else {
      if (!roles || roles.length === 0) {
        return <Badge variant="outline">Sem role</Badge>;
      }
      role = roles[0]?.role;
    }
    
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

  const handleAssignDialogOpen = (open: boolean) => {
    if (!open) {
      setAssignDialog({ open: false, consultorId: "", consultorName: "" });
      setSelectedOrgs([]);
      setAssignSelectionInitialized(false);
    }
  };

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
      
      const currentOrgIds = consultorOrgs?.map(co => co.organizacao_id) || [];
      
      const toAdd = selectedOrgs.filter(id => !currentOrgIds.includes(id));
      const toRemove = currentOrgIds.filter(id => !selectedOrgs.includes(id));

      if (toRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from("consultor_organizacoes")
          .delete()
          .eq("consultor_id", assignDialog.consultorId)
          .in("organizacao_id", toRemove);

        if (deleteError) throw deleteError;
      }

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

  const handleAddPreRegistration = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newEmail.trim()) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return;
    }

    await addPreRegMutation.mutateAsync({
      email: newEmail,
      nome: newNome || undefined,
      role: newRole
    });

    setNewEmail("");
    setNewNome("");
    setNewRole("consultor");
    setPreRegDialogOpen(false);
  };

  const handleRemovePreReg = async (id: string) => {
    await removePreRegMutation.mutateAsync(id);
  };

  const pendingCount = preRegistrations?.filter(p => !p.used_at).length || 0;
  const usedCount = preRegistrations?.filter(p => p.used_at).length || 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestão de Usuários e Perfis</h1>
            <p className="text-muted-foreground">Gerencie todos os usuários do sistema, convites e perfis de acesso</p>
          </div>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="users">Usuários Cadastrados</TabsTrigger>
            <TabsTrigger value="prenovos">Convites & Pré-registros</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
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
                                  {(isConsultor && (
                                    <DropdownMenuItem 
                                      onClick={() => handleOpenAssignDialog(user.id, user.nome || user.email || "Consultor")}
                                    >
                                      <Building2 className="mr-2 h-4 w-4" />
                                      Atribuir Organizações
                                    </DropdownMenuItem>
                                  ))}
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
          </TabsContent>

          <TabsContent value="prenovos" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Convites & Pré-registros</h3>
                <p className="text-sm text-muted-foreground">
                  Adicione emails que receberão automaticamente um perfil específico (Consultor, Parceiro, Admin) ao criar conta.
                </p>
              </div>

              <Dialog open={preRegDialogOpen} onOpenChange={setPreRegDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Novo Pré-registro
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleAddPreRegistration}>
                    <DialogHeader>
                      <DialogTitle>Novo Pré-registro de Usuário</DialogTitle>
                      <DialogDescription>
                        Ao adicionar o email aqui, ele será associado a um perfil específico assim que a conta for gerada.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="usuario@empresa.com"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nome">Nome (opcional)</Label>
                        <Input
                          id="nome"
                          type="text"
                          placeholder="Nome do usuário"
                          value={newNome}
                          onChange={(e) => setNewNome(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Perfil de Acesso (Role) *</Label>
                        <Select value={newRole} onValueChange={(val: AppRole) => setNewRole(val)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um perfil" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="consultor">Consultor</SelectItem>
                            <SelectItem value="parceiro">Parceiro</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="cliente">Cliente (Padrão)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setPreRegDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={addPreRegMutation.isPending}>
                        {addPreRegMutation.isPending ? "Salvando..." : "Salvar"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Pré-registros</CardTitle>
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{preRegistrations?.length || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Aguardando Cadastro</CardTitle>
                  <Clock className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pendingCount}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Já Cadastrados no Sistema</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{usedCount}</div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="font-medium">Como funcionam os Pré-registros?</p>
                    <p className="mt-1 text-blue-700 dark:text-blue-300">
                      Na Área do Admin, você tem controle total sobre os perfis dos usuários. Você pode alterar o perfil de <strong>usuários já cadastrados</strong> na aba anterior, ou preparar o caminho adicionando o email do novo colaborador/parceiro <strong>antes dele se cadastrar</strong>.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Histórico de Convites e Pré-registros</CardTitle>
                <CardDescription>
                  Acompanhe os emails que aguardam cadastro ou que já ativaram seu perfil
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingPreRegs ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : preRegistrations && preRegistrations.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Perfil Solicitado</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Criado em</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preRegistrations.map((reg) => (
                        <TableRow key={reg.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{reg.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>{reg.nome || "-"}</TableCell>
                          <TableCell>
                            {getRoleBadge(reg.role)}
                          </TableCell>
                          <TableCell>
                            {reg.used_at ? (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                Cadastrado
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-yellow-600 border-yellow-400">
                                <Clock className="mr-1 h-3 w-3" />
                                Aguardando
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(reg.created_at), "dd/MM/yyyy", { locale: ptBR })}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {!reg.used_at && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Remover convite?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      O email <strong>{reg.email}</strong> não será mais vinculado automaticamente ao perfil desejado.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleRemovePreReg(reg.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Remover convite
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <UserCog className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
                    <p>Nenhum email aguardando cadastro ou convidado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
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
              Selecione as organizações que este consultor poderá gerenciar
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