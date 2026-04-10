import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    useConsultorPreRegistrations,
    useAddConsultorPreRegistration,
    useRemoveConsultorPreRegistration,
} from "@/hooks/useConsultorPreRegistration";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    UserPlus,
    Trash2,
    Mail,
    Calendar,
    CheckCircle2,
    Clock,
    UserCog,
    AlertCircle
} from "lucide-react";

export default function AdminConsultores() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [newEmail, setNewEmail] = useState("");
    const [newNome, setNewNome] = useState("");

    const { data: preRegistrations, isLoading } = useConsultorPreRegistrations();
    const addMutation = useAddConsultorPreRegistration();
    const removeMutation = useRemoveConsultorPreRegistration();

    const handleAddPreRegistration = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newEmail.trim()) return;

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newEmail)) {
            return;
        }

        await addMutation.mutateAsync({
            email: newEmail,
            nome: newNome || undefined
        });

        setNewEmail("");
        setNewNome("");
        setDialogOpen(false);
    };

    const handleRemove = async (id: string) => {
        await removeMutation.mutateAsync(id);
    };

    const pendingCount = preRegistrations?.filter(p => !p.used_at).length || 0;
    const usedCount = preRegistrations?.filter(p => p.used_at).length || 0;

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                            <UserCog className="h-6 w-6" />
                            Gerenciar Consultores
                        </h1>
                        <p className="text-muted-foreground">
                            Pré-cadastre emails para novos consultores
                        </p>
                    </div>

                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <UserPlus className="mr-2 h-4 w-4" />
                                Adicionar Email
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <form onSubmit={handleAddPreRegistration}>
                                <DialogHeader>
                                    <DialogTitle>Pré-registrar Consultor</DialogTitle>
                                    <DialogDescription>
                                        Adicione um email que será automaticamente registrado como consultor
                                        quando o usuário criar uma conta.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="py-4 space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email *</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="consultor@empresa.com"
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
                                            placeholder="Nome do consultor"
                                            value={newNome}
                                            onChange={(e) => setNewNome(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setDialogOpen(false)}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button type="submit" disabled={addMutation.isPending}>
                                        {addMutation.isPending ? "Salvando..." : "Salvar"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Stats */}
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
                            <CardTitle className="text-sm font-medium">Já Cadastrados</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{usedCount}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Info Card */}
                <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
                    <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                            <div className="text-sm text-blue-800 dark:text-blue-200">
                                <p className="font-medium">Como funciona?</p>
                                <p className="mt-1 text-blue-700 dark:text-blue-300">
                                    Quando você adiciona um email aqui, qualquer pessoa que criar uma conta
                                    com esse email será automaticamente registrada como <strong>Consultor</strong>,
                                    ao invés do perfil padrão (Cliente).
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Emails Pré-registrados</CardTitle>
                        <CardDescription>
                            Lista de emails que serão automaticamente consultores
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
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
                                                                <AlertDialogTitle>Remover pré-registro?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    O email <strong>{reg.email}</strong> não será mais registrado
                                                                    automaticamente como consultor. Esta ação não pode ser desfeita.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => handleRemove(reg.id)}
                                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                >
                                                                    Remover
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
                                <p>Nenhum email pré-registrado</p>
                                <p className="text-sm mt-1">
                                    Clique em "Adicionar Email" para pré-registrar um consultor
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
