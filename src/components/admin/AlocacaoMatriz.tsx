import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useConsultores, useAllOrganizacoes } from "@/hooks/useAdminData";
import {
  useAlocacoes,
  useAlocarConsultor,
  useDesalocarConsultor,
} from "@/hooks/useAlocacoesConsultor";
import { Building2, UserCheck, UserMinus, Users } from "lucide-react";

export function AlocacaoMatriz() {
  const [selectedConsultor, setSelectedConsultor] = useState<string>("");
  const [selectedOrg, setSelectedOrg] = useState<string>("");

  const { data: consultores, isLoading: loadingConsultores } = useConsultores();
  const { data: organizacoes, isLoading: loadingOrgs } = useAllOrganizacoes();
  const { data: alocacoes, isLoading: loadingAlocacoes } = useAlocacoes();
  const alocarMutation = useAlocarConsultor();
  const desalocarMutation = useDesalocarConsultor();

  const loading = loadingConsultores || loadingOrgs || loadingAlocacoes;

  const getAlocacoesDoConsultor = (consultorId: string) =>
    alocacoes?.filter((a) => a.consultor_id === consultorId) ?? [];

  const getAlocacoesDaOrg = (orgId: string) =>
    alocacoes?.filter((a) => a.organizacao_id === orgId) ?? [];

  const isAlocado = (consultorId: string, orgId: string) =>
    alocacoes?.some((a) => a.consultor_id === consultorId && a.organizacao_id === orgId) ?? false;

  const getAlocacaoId = (consultorId: string, orgId: string) =>
    alocacoes?.find((a) => a.consultor_id === consultorId && a.organizacao_id === orgId)?.id;

  const getConsultorNome = (consultorId: string) => {
    const c = consultores?.find((c) => c.user_id === consultorId);
    return (c?.profiles as { nome?: string; email?: string } | null)?.nome
      || (c?.profiles as { nome?: string; email?: string } | null)?.email
      || consultorId;
  };

  const getOrgNome = (orgId: string) =>
    organizacoes?.find((o) => o.id === orgId)?.nome ?? orgId;

  const handleAlocar = () => {
    if (!selectedConsultor || !selectedOrg) return;
    alocarMutation.mutate({ consultorId: selectedConsultor, organizacaoId: selectedOrg });
    setSelectedOrg("");
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Painel de nova alocação */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Nova Alocação
          </CardTitle>
          <CardDescription>
            Vincule um consultor a uma organização-cliente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Select value={selectedConsultor} onValueChange={setSelectedConsultor}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar consultor..." />
                </SelectTrigger>
                <SelectContent>
                  {consultores?.map((c) => {
                    const profile = c.profiles as { nome?: string; email?: string } | null;
                    return (
                      <SelectItem key={c.user_id} value={c.user_id}>
                        {profile?.nome || profile?.email || c.user_id}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Select
                value={selectedOrg}
                onValueChange={setSelectedOrg}
                disabled={!selectedConsultor}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar organização..." />
                </SelectTrigger>
                <SelectContent>
                  {organizacoes
                    ?.filter((o) => !isAlocado(selectedConsultor, o.id))
                    .map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.nome}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleAlocar}
              disabled={!selectedConsultor || !selectedOrg || alocarMutation.isPending}
            >
              {alocarMutation.isPending ? "Alocando..." : "Alocar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Visão por consultor */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
          <Users className="h-4 w-4" />
          Alocações por Consultor
        </h3>
        <div className="space-y-3">
          {consultores?.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum consultor cadastrado.</p>
          )}
          {consultores?.map((c) => {
            const profile = c.profiles as { nome?: string; email?: string } | null;
            const nome = profile?.nome || profile?.email || c.user_id;
            const alocacoesDoConsultor = getAlocacoesDoConsultor(c.user_id);

            return (
              <Card key={c.user_id} className="border-muted">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2 min-w-0">
                      <UserCheck className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="font-medium text-sm truncate">{nome}</span>
                      <Badge variant="secondary" className="shrink-0">
                        {alocacoesDoConsultor.length}{" "}
                        {alocacoesDoConsultor.length === 1 ? "cliente" : "clientes"}
                      </Badge>
                    </div>
                  </div>

                  {alocacoesDoConsultor.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {alocacoesDoConsultor.map((a) => (
                        <div
                          key={a.id}
                          className="flex items-center gap-1 bg-muted rounded-md px-2 py-1 text-xs"
                        >
                          <Building2 className="h-3 w-3 text-muted-foreground" />
                          <span>{getOrgNome(a.organizacao_id)}</span>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button className="ml-1 text-muted-foreground hover:text-destructive transition-colors">
                                <UserMinus className="h-3 w-3" />
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remover alocação?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  <strong>{nome}</strong> perderá acesso imediato aos documentos
                                  de <strong>{getOrgNome(a.organizacao_id)}</strong>.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => desalocarMutation.mutate(a.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Remover
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Sem clientes alocados
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Visão por organização */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Consultores por Organização
        </h3>
        <div className="space-y-3">
          {organizacoes?.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma organização cadastrada.</p>
          )}
          {organizacoes?.map((o) => {
            const alocacoesDaOrg = getAlocacoesDaOrg(o.id);
            return (
              <Card key={o.id} className="border-muted">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="font-medium text-sm truncate">{o.nome}</span>
                    <Badge variant="secondary" className="shrink-0">
                      {alocacoesDaOrg.length}{" "}
                      {alocacoesDaOrg.length === 1 ? "consultor" : "consultores"}
                    </Badge>
                  </div>

                  {alocacoesDaOrg.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {alocacoesDaOrg.map((a) => (
                        <div
                          key={a.id}
                          className="flex items-center gap-1 bg-muted rounded-md px-2 py-1 text-xs"
                        >
                          <UserCheck className="h-3 w-3 text-muted-foreground" />
                          <span>{getConsultorNome(a.consultor_id)}</span>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button className="ml-1 text-muted-foreground hover:text-destructive transition-colors">
                                <UserMinus className="h-3 w-3" />
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remover alocação?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  <strong>{getConsultorNome(a.consultor_id)}</strong> perderá
                                  acesso imediato aos documentos de{" "}
                                  <strong>{o.nome}</strong>.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => desalocarMutation.mutate(a.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Remover
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Sem consultores alocados
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
