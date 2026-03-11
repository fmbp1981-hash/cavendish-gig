import { ConsultorLayout } from "@/components/layout/ConsultorLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useOrganizacoes, useProjetosAll } from "@/hooks/useConsultorData";
import { Building2, Search, ArrowRight, FolderOpen, QrCode } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const faseLabels: Record<string, string> = {
  diagnostico: "Diagnóstico",
  implementacao: "Implementação",
  recorrencia: "Recorrência",
};

const faseColors: Record<string, string> = {
  diagnostico: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  implementacao: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  recorrencia: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
};

// ─── QR Code Dialog ───────────────────────────────────────────────────────────

function QrCodeDenunciasDialog({
  orgId,
  orgNome,
  open,
  onOpenChange,
}: {
  orgId: string;
  orgNome: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const url = `${window.location.origin}/denuncia/${orgId}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;

  const handleCopiar = () => {
    navigator.clipboard.writeText(url);
    toast.success("Link copiado!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Canal de Denúncias</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-2">
          <p className="text-sm text-muted-foreground text-center">{orgNome}</p>
          <img
            src={qrUrl}
            alt="QR Code do canal de denúncias"
            className="rounded-lg border"
            width={200}
            height={200}
          />
          <div className="w-full space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Link público</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-muted px-2 py-1.5 rounded break-all">{url}</code>
              <Button size="sm" variant="outline" onClick={handleCopiar} className="shrink-0">
                Copiar
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Compartilhe este QR Code ou link com seus colaboradores para denúncias anônimas
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ConsultorClientes() {
  const [search, setSearch] = useState("");
  const [qrOrg, setQrOrg] = useState<{ id: string; nome: string } | null>(null);
  const { data: projetos, isLoading } = useProjetosAll();

  const filteredProjetos = useMemo(() => {
    if (!projetos) return [];
    if (!search) return projetos;
    
    const searchLower = search.toLowerCase();
    return projetos.filter((p: any) => 
      p.nome?.toLowerCase().includes(searchLower) ||
      p.organizacoes?.nome?.toLowerCase().includes(searchLower)
    );
  }, [projetos, search]);

  return (
    <ConsultorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
            <p className="text-muted-foreground">Gerencie organizações e projetos</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente ou projeto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Projects list */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : filteredProjetos.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjetos.map((projeto: any) => (
              <Card key={projeto.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{projeto.organizacoes?.nome}</CardTitle>
                        <CardDescription className="text-xs">
                          {projeto.organizacoes?.cnpj || "CNPJ não informado"}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{projeto.nome}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Badge className={faseColors[projeto.fase_atual]}>
                      {faseLabels[projeto.fase_atual]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {projeto.data_inicio 
                        ? format(new Date(projeto.data_inicio), "dd/MM/yyyy", { locale: ptBR })
                        : "Sem data"}
                    </span>
                  </div>

                  <div className="flex gap-2 mt-2">
                    <Button asChild variant="outline" className="flex-1">
                      <Link to={`/consultor/clientes/${projeto.organizacoes?.id}`}>
                        Ver Detalhes
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      title="Link de Denúncias"
                      onClick={() =>
                        setQrOrg({
                          id: projeto.organizacoes?.id,
                          nome: projeto.organizacoes?.nome ?? "Organização",
                        })
                      }
                    >
                      <QrCode className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Nenhum cliente encontrado</h3>
              <p className="text-sm text-muted-foreground">
                {search ? "Tente uma busca diferente" : "Ainda não há clientes cadastrados"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {qrOrg && (
        <QrCodeDenunciasDialog
          orgId={qrOrg.id}
          orgNome={qrOrg.nome}
          open={!!qrOrg}
          onOpenChange={v => !v && setQrOrg(null)}
        />
      )}
    </ConsultorLayout>
  );
}
