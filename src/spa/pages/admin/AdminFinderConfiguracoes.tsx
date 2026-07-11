import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAgentConfigs } from "@/hooks/useProspeccaoAgentConfig";
import { AgentConfigForm } from "@/components/prospeccao/agent-config-form";
import { PROSPECCAO_CATEGORIAS } from "@/types/prospeccao";
import { getCategoriaLabel } from "@/lib/prospeccao/categorias";

export default function AdminFinderConfiguracoes() {
  const { data: configs, isLoading } = useAgentConfigs();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Finder — Configuração de Agentes</h1>
          <p className="text-muted-foreground">Um agente de IA por categoria de lead</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Agentes por categoria</CardTitle>
            <CardDescription>
              Prompt de sistema, provider de IA e parâmetros de conversa usados pelo agente ao qualificar leads.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <Tabs defaultValue={PROSPECCAO_CATEGORIAS[0]}>
                <TabsList className="mb-6 flex-wrap h-auto">
                  {PROSPECCAO_CATEGORIAS.map((categoria) => (
                    <TabsTrigger key={categoria} value={categoria}>
                      {getCategoriaLabel(categoria)}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {PROSPECCAO_CATEGORIAS.map((categoria) => {
                  const configsDaCategoria = (configs ?? []).filter((c) => c.categoria === categoria);
                  const configAtual =
                    configsDaCategoria.find((c) => c.ativo) ??
                    [...configsDaCategoria].sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0] ??
                    null;

                  return (
                    <TabsContent key={categoria} value={categoria}>
                      <AgentConfigForm categoria={categoria} config={configAtual} />
                    </TabsContent>
                  );
                })}
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
