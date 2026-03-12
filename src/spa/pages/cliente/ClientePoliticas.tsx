import { useState } from "react";
import { ClienteLayout } from "@/components/layout/ClienteLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BookOpen,
  CheckCircle2,
  FileText,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { useClienteProjeto } from "@/hooks/useClienteProjeto";
import {
  Politica,
  PoliticaAceite,
  CATEGORIA_LABEL,
  usePoliticas,
  useMeuAceite,
  useAssinarPolitica,
} from "@/hooks/usePoliticas";

// ─── Card de política individual ──────────────────────────────────────────────

function PoliticaCard({ politica, userId }: { politica: Politica; userId: string | undefined }) {
  const { data: aceite, isLoading: loadingAceite } = useMeuAceite(politica.id, userId);
  const assinar = useAssinarPolitica();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmLeu, setConfirmLeu] = useState(false);

  const handleAssinar = async () => {
    await assinar.mutateAsync({ politicaId: politica.id });
    setDialogOpen(false);
    setConfirmLeu(false);
  };

  const dataVigencia = politica.data_vigencia_inicio
    ? format(new Date(politica.data_vigencia_inicio), "dd/MM/yyyy", { locale: ptBR })
    : null;

  const dataAceite = (aceite as PoliticaAceite | null)?.aceito_em
    ? format(new Date((aceite as PoliticaAceite).aceito_em!), "dd/MM/yyyy", { locale: ptBR })
    : null;

  return (
    <>
      <Card className={aceite ? "border-green-200 dark:border-green-800" : undefined}>
        <CardContent className="py-4 px-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold">{politica.titulo}</p>
                <Badge variant="outline" className="text-[10px]">
                  {CATEGORIA_LABEL[politica.categoria]}
                </Badge>
                <span className="text-xs text-muted-foreground">v{politica.versao}</span>
              </div>
              {dataVigencia && (
                <p className="text-xs text-muted-foreground">
                  Vigente desde {dataVigencia}
                </p>
              )}
            </div>

            <div className="shrink-0">
              {loadingAceite ? (
                <Skeleton className="h-8 w-28" />
              ) : aceite ? (
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Assinado em {dataAceite}
                </Badge>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)}>
                  <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                  Ler e Assinar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) setConfirmLeu(false); }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {politica.titulo}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
              <Badge variant="outline" className="text-[10px]">
                {CATEGORIA_LABEL[politica.categoria]}
              </Badge>
              <span>Versão {politica.versao}</span>
              {dataVigencia && <span>Vigente desde {dataVigencia}</span>}
            </div>

            <ScrollArea className="h-64 rounded-md border p-4">
              {politica.conteudo ? (
                <pre className="text-sm leading-relaxed whitespace-pre-wrap font-sans text-foreground">
                  {politica.conteudo}
                </pre>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Conteúdo não disponível.
                </p>
              )}
            </ScrollArea>

            <Separator />

            <div className="flex items-start gap-3">
              <Checkbox
                id="confirm-leu"
                checked={confirmLeu}
                onCheckedChange={(v) => setConfirmLeu(v === true)}
              />
              <label htmlFor="confirm-leu" className="text-sm leading-relaxed cursor-pointer">
                Confirmo que li e concordo com esta política corporativa, assumindo o compromisso
                de cumpri-la em todas as minhas atividades.
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); setConfirmLeu(false); }}>
              Cancelar
            </Button>
            <Button
              onClick={handleAssinar}
              disabled={!confirmLeu || assinar.isPending}
            >
              {assinar.isPending
                ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
                : <ShieldCheck className="h-4 w-4 mr-2" />}
              Assinar Digitalmente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Página principal ──────────────────────────────────────────────────────────

export default function ClientePoliticas() {
  const { user } = useAuth();
  const { data: projeto, isLoading: loadingProjeto } = useClienteProjeto();
  const organizacaoId = projeto?.organizacao_id ?? undefined;

  const { data: politicas, isLoading: loadingPoliticas } = usePoliticas(organizacaoId);

  const publicadas = (politicas ?? []).filter((p) => p.status === "publicado");

  const isLoading = loadingProjeto || loadingPoliticas;

  return (
    <ClienteLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Políticas Corporativas</h1>
          <p className="text-muted-foreground mt-1">
            Leia e assine digitalmente as políticas publicadas pela organização
          </p>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : !organizacaoId ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Você não está vinculado a nenhuma organização.
              </p>
            </CardContent>
          </Card>
        ) : publicadas.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="font-medium">Nenhuma política publicada</p>
              <p className="text-sm text-muted-foreground mt-1">
                As políticas corporativas aparecerão aqui quando forem publicadas.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {publicadas.length} política{publicadas.length !== 1 ? "s" : ""} disponíve{publicadas.length !== 1 ? "is" : "l"}
            </p>
            {publicadas.map((politica) => (
              <PoliticaCard key={politica.id} politica={politica} userId={user?.id} />
            ))}
          </div>
        )}
      </div>
    </ClienteLayout>
  );
}
