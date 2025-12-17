import { useState } from "react";
import { ConsultorLayout } from "@/components/layout/ConsultorLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  FileCheck, 
  Users, 
  Building2, 
  CheckCircle2, 
  Clock,
  Search,
  Loader2,
  TrendingUp,
  AlertTriangle
} from "lucide-react";
import {
  useTodasAdesoes,
  useEstatisticasAdesao,
  useCodigoEticaAtivo,
} from "@/hooks/useCodigoEtica";

export default function ConsultorAdesaoEtica() {
  const [busca, setBusca] = useState("");
  const { data: versaoAtiva, isLoading: loadingVersao } = useCodigoEticaAtivo();
  const { data: adesoes, isLoading: loadingAdesoes } = useTodasAdesoes();
  const { data: estatisticas, isLoading: loadingStats } = useEstatisticasAdesao();

  const adesoesFiltradas = adesoes?.filter(adesao => {
    const termo = busca.toLowerCase();
    return (
      adesao.profiles?.nome?.toLowerCase().includes(termo) ||
      adesao.profiles?.email?.toLowerCase().includes(termo) ||
      adesao.organizacoes?.nome?.toLowerCase().includes(termo)
    );
  });

  const totalAdesoes = adesoes?.length || 0;
  const orgComAdesao = estatisticas?.filter(e => e.total_adesoes > 0).length || 0;
  const orgTotal = estatisticas?.length || 0;
  const mediaAdesao = estatisticas?.length 
    ? Math.round(estatisticas.reduce((acc, e) => acc + e.percentual, 0) / estatisticas.length)
    : 0;

  if (loadingVersao || loadingAdesoes || loadingStats) {
    return (
      <ConsultorLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </ConsultorLayout>
    );
  }

  return (
    <ConsultorLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Adesão ao Código de Ética</h1>
          <p className="text-muted-foreground">
            Acompanhe as adesões ao Código de Ética por organização
          </p>
        </div>

        {/* Cards de resumo */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-full bg-primary/10">
                  <FileCheck className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Versão Ativa</p>
                  <p className="text-xl font-bold">{versaoAtiva?.versao || "-"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Adesões</p>
                  <p className="text-xl font-bold">{totalAdesoes}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
                  <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Organizações</p>
                  <p className="text-xl font-bold">{orgComAdesao}/{orgTotal}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900">
                  <TrendingUp className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Média Adesão</p>
                  <p className="text-xl font-bold">{mediaAdesao}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="organizacoes">
          <TabsList>
            <TabsTrigger value="organizacoes">Por Organização</TabsTrigger>
            <TabsTrigger value="adesoes">Todas as Adesões</TabsTrigger>
          </TabsList>

          <TabsContent value="organizacoes" className="space-y-4 mt-4">
            {estatisticas?.map((org) => (
              <Card key={org.organizacao_id}>
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{org.organizacao_nome}</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            <Users className="w-3 h-3 mr-1" />
                            {org.total_adesoes}/{org.total_membros}
                          </Badge>
                          {org.percentual === 100 ? (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              100%
                            </Badge>
                          ) : org.percentual >= 50 ? (
                            <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                              <Clock className="w-3 h-3 mr-1" />
                              {org.percentual}%
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              {org.percentual}%
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Progress value={org.percentual} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {estatisticas?.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhuma organização cadastrada</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="adesoes" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Registro de Adesões</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome ou e-mail..."
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Colaborador</TableHead>
                      <TableHead>Organização</TableHead>
                      <TableHead>Versão</TableHead>
                      <TableHead>Data/Hora Adesão</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adesoesFiltradas?.map((adesao) => (
                      <TableRow key={adesao.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{adesao.profiles?.nome || "Sem nome"}</p>
                            <p className="text-sm text-muted-foreground">{adesao.profiles?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{adesao.organizacoes?.nome}</TableCell>
                        <TableCell>
                          <Badge variant="outline">v{adesao.codigo_etica_versoes?.versao}</Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(adesao.aceito_em).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                    {adesoesFiltradas?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          Nenhuma adesão encontrada
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ConsultorLayout>
  );
}
