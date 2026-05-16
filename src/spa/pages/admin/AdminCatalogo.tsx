import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDocumentoCatalogo } from "@/hooks/useAdminData";
import { useToggleCatalogoComplementar } from "@/hooks/useDocumentosComplementares";
import {
  Search,
  FileText,
  CheckCircle2,
  Circle,
  Star,
  StarOff
} from "lucide-react";

type FaseProjeto = "diagnostico" | "implementacao" | "recorrencia";
type TabValue = FaseProjeto | "all" | "complementar";

const faseLabels: Record<FaseProjeto, string> = {
  diagnostico: "Diagnóstico",
  implementacao: "Implementação",
  recorrencia: "Recorrência"
};

const faseBadgeColors: Record<FaseProjeto, string> = {
  diagnostico: "bg-blue-500 hover:bg-blue-600",
  implementacao: "bg-amber-500 hover:bg-amber-600",
  recorrencia: "bg-green-500 hover:bg-green-600"
};

export default function AdminCatalogo() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState<TabValue>("all");

  const { data: catalogo, isLoading } = useDocumentoCatalogo();
  const toggleComplementar = useToggleCatalogoComplementar();

  const filteredDocs = catalogo?.filter(doc => {
    const matchesSearch = doc.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFase = selectedTab === "all" || doc.fase === selectedTab;
    return matchesSearch && matchesFase;
  });

  const complementarDocs = catalogo?.filter(doc => {
    const matchesSearch = doc.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
    return doc.is_complementar && matchesSearch;
  });

  const getDocsCount = (fase: FaseProjeto) => {
    return catalogo?.filter(doc => doc.fase === fase).length || 0;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Catálogo de Documentos</h1>
            <p className="text-muted-foreground">Gerencie os documentos requeridos por tipo de projeto</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{catalogo?.length || 0}</div>
              <p className="text-xs text-muted-foreground">documentos no catálogo</p>
            </CardContent>
          </Card>
          {(["diagnostico", "implementacao", "recorrencia"] as FaseProjeto[]).map((fase) => (
            <Card key={fase}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{faseLabels[fase]}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getDocsCount(fase)}</div>
                <p className="text-xs text-muted-foreground">documentos</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Documentos do Catálogo</CardTitle>
                <CardDescription>
                  Documentos base para novos projetos
                </CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar documentos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as TabValue)}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="diagnostico">Diagnóstico</TabsTrigger>
                <TabsTrigger value="implementacao">Implementação</TabsTrigger>
                <TabsTrigger value="recorrencia">Recorrência</TabsTrigger>
                <TabsTrigger value="complementar">Complementares</TabsTrigger>
              </TabsList>

              {/* Tabs de fase (all, diagnostico, implementacao, recorrencia) */}
              {(["all", "diagnostico", "implementacao", "recorrencia"] as TabValue[]).map((tab) => (
                <TabsContent key={tab} value={tab}>
                  {isLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : filteredDocs?.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Nenhum documento encontrado</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Documento</TableHead>
                          <TableHead>Fase</TableHead>
                          <TableHead>Obrigatório</TableHead>
                          <TableHead>Formatos</TableHead>
                          <TableHead>Tamanho Max</TableHead>
                          <TableHead>Complementar</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredDocs?.map((doc) => (
                          <TableRow key={doc.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-muted-foreground" />
                                  {doc.nome}
                                </div>
                                {doc.descricao && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {doc.descricao}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={faseBadgeColors[doc.fase as FaseProjeto]}>
                                {faseLabels[doc.fase as FaseProjeto]}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {doc.obrigatorio ? (
                                <div className="flex items-center gap-1 text-green-600">
                                  <CheckCircle2 className="h-4 w-4" />
                                  <span className="text-sm">Sim</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Circle className="h-4 w-4" />
                                  <span className="text-sm">Não</span>
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {doc.formatos_aceitos?.map((formato) => (
                                  <Badge key={formato} variant="outline" className="text-xs">
                                    {formato}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {doc.tamanho_maximo_mb} MB
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={toggleComplementar.isPending}
                                onClick={() =>
                                  toggleComplementar.mutate({
                                    id: doc.id,
                                    is_complementar: !doc.is_complementar,
                                  })
                                }
                                title={doc.is_complementar ? "Remover de complementares" : "Marcar como complementar"}
                              >
                                {doc.is_complementar ? (
                                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                                ) : (
                                  <StarOff className="h-4 w-4 text-muted-foreground" />
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>
              ))}

              {/* Tab Complementares */}
              <TabsContent value="complementar">
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : complementarDocs?.length === 0 ? (
                  <div className="text-center py-12">
                    <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Nenhum documento marcado como complementar</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Use o ícone ☆ nas outras abas para marcar documentos como complementares
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Documento</TableHead>
                        <TableHead>Fase</TableHead>
                        <TableHead>Formatos</TableHead>
                        <TableHead>Tamanho Max</TableHead>
                        <TableHead>Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {complementarDocs?.map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                                {doc.nome}
                              </div>
                              {doc.descricao && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {doc.descricao}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={faseBadgeColors[doc.fase as FaseProjeto]}>
                              {faseLabels[doc.fase as FaseProjeto]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {doc.formatos_aceitos?.map((formato) => (
                                <Badge key={formato} variant="outline" className="text-xs">
                                  {formato}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {doc.tamanho_maximo_mb} MB
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={toggleComplementar.isPending}
                              onClick={() =>
                                toggleComplementar.mutate({ id: doc.id, is_complementar: false })
                              }
                              title="Remover de complementares"
                            >
                              <StarOff className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
