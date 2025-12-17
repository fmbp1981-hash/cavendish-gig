import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useOrganizacoes, useProjetosAll } from "@/hooks/useConsultorData";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  Search, 
  Building2, 
  FolderOpen,
  Calendar,
  Plus,
  Users
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AdminOrganizacoes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [createDialog, setCreateDialog] = useState(false);
  const [newOrg, setNewOrg] = useState({ nome: "", cnpj: "" });
  const [isCreating, setIsCreating] = useState(false);
  
  const { data: organizacoes, isLoading } = useOrganizacoes();
  const { data: projetos } = useProjetosAll();
  const queryClient = useQueryClient();

  const filteredOrgs = organizacoes?.filter(org => 
    org.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.cnpj?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getProjectCount = (orgId: string) => {
    return projetos?.filter(p => p.organizacao_id === orgId).length || 0;
  };

  const handleCreateOrg = async () => {
    if (!newOrg.nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    setIsCreating(true);
    try {
      const { error } = await supabase
        .from("organizacoes")
        .insert({ 
          nome: newOrg.nome.trim(),
          cnpj: newOrg.cnpj.trim() || null
        });

      if (error) throw error;

      toast.success("Organização criada com sucesso");
      queryClient.invalidateQueries({ queryKey: ["organizacoes"] });
      setCreateDialog(false);
      setNewOrg({ nome: "", cnpj: "" });
    } catch (error) {
      console.error("Error creating organization:", error);
      toast.error("Erro ao criar organização");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Organizações</h1>
            <p className="text-muted-foreground">Gerencie todas as organizações do sistema</p>
          </div>
          <Dialog open={createDialog} onOpenChange={setCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Organização
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Organização</DialogTitle>
                <DialogDescription>
                  Adicione uma nova empresa ao sistema
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome da Organização *</Label>
                  <Input
                    id="nome"
                    value={newOrg.nome}
                    onChange={(e) => setNewOrg({ ...newOrg, nome: e.target.value })}
                    placeholder="Nome da empresa"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={newOrg.cnpj}
                    onChange={(e) => setNewOrg({ ...newOrg, cnpj: e.target.value })}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateOrg} disabled={isCreating}>
                  {isCreating ? "Criando..." : "Criar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Organizações</CardTitle>
                <CardDescription>
                  {organizacoes?.length || 0} organizações cadastradas
                </CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar organizações..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
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
            ) : filteredOrgs?.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhuma organização encontrada</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organização</TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>Projetos</TableHead>
                    <TableHead>Cadastrada em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrgs?.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {org.nome}
                        </div>
                      </TableCell>
                      <TableCell>
                        {org.cnpj || <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FolderOpen className="h-4 w-4 text-muted-foreground" />
                          <Badge variant="secondary">{getProjectCount(org.id)}</Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {format(new Date(org.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
