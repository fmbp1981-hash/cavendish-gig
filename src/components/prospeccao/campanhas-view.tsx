import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Send } from "lucide-react";
import { useProspeccaoCampanhas, useCreateCampanha, useDispararCampanha } from "@/hooks/useProspeccaoCampanhas";
import { PROSPECCAO_CATEGORIAS } from "@/types/prospeccao";
import { getCategoriaLabel } from "@/lib/prospeccao/categorias";
import type { ProspeccaoCampanhaStatus, ProspeccaoCategoria, ProspeccaoStatus } from "@/types/prospeccao";

interface CampanhasViewProps {
  isAdmin: boolean;
  currentUserId: string;
}

const STATUS_LABEL: Record<ProspeccaoCampanhaStatus, string> = {
  rascunho: "Rascunho",
  agendada: "Agendada",
  executando: "Executando",
  pausada: "Pausada",
  concluida: "Concluída",
  falhou: "Falhou",
};

const STATUS_LEAD_OPTIONS: { value: ProspeccaoStatus; label: string }[] = [
  { value: "novo", label: "Novo" },
  { value: "contatado", label: "Contatado" },
  { value: "qualificando", label: "Qualificando" },
  { value: "qualificado", label: "Qualificado" },
  { value: "sem_resposta", label: "Sem Resposta" },
];

const CAMPOS_INICIAIS = {
  nome: "",
  mensagem: "",
  categoria: "" as ProspeccaoCategoria | "",
  statusFiltro: "" as ProspeccaoStatus | "",
};

export function CampanhasView({ isAdmin, currentUserId }: CampanhasViewProps) {
  const [criarAberto, setCriarAberto] = useState(false);
  const [form, setForm] = useState(CAMPOS_INICIAIS);

  const responsavelHistorico = isAdmin ? undefined : currentUserId;
  const { data: campanhas, isLoading } = useProspeccaoCampanhas(responsavelHistorico);
  const criarCampanha = useCreateCampanha();
  const dispararCampanha = useDispararCampanha();

  const handleCriar = async () => {
    if (!form.nome.trim() || !form.mensagem.trim()) return;
    await criarCampanha.mutateAsync({
      responsavelId: currentUserId,
      nome: form.nome.trim(),
      mensagem: form.mensagem.trim(),
      categoria: form.categoria || undefined,
      statusFiltro: form.statusFiltro || undefined,
    });
    setForm(CAMPOS_INICIAIS);
    setCriarAberto(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">Campanhas — Finder</h1>
          <p className="text-muted-foreground">Disparo de mensagens em massa via WhatsApp</p>
        </div>
        <Button onClick={() => setCriarAberto(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Campanha
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Campanhas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Leads</TableHead>
                  <TableHead>Enviados</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {campanhas?.map((campanha) => (
                  <TableRow key={campanha.id}>
                    <TableCell className="font-medium">{campanha.nome}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {campanha.categoria ? getCategoriaLabel(campanha.categoria) : "Todas"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{STATUS_LABEL[campanha.status]}</Badge>
                    </TableCell>
                    <TableCell>{campanha.total_leads}</TableCell>
                    <TableCell>{campanha.total_enviados}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={campanha.status !== "rascunho" || dispararCampanha.isPending || campanha.total_leads === 0}
                        onClick={() => dispararCampanha.mutate(campanha.id)}
                      >
                        {dispararCampanha.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                        Disparar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(!campanhas || campanhas.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Nenhuma campanha criada ainda.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={criarAberto} onOpenChange={setCriarAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Campanha</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Nome da campanha *</Label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Categoria (opcional)</Label>
                <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v as ProspeccaoCategoria })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROSPECCAO_CATEGORIAS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {getCategoriaLabel(c)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status do lead (opcional)</Label>
                <Select value={form.statusFiltro} onValueChange={(v) => setForm({ ...form, statusFiltro: v as ProspeccaoStatus })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_LEAD_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Mensagem *</Label>
              <Textarea
                value={form.mensagem}
                onChange={(e) => setForm({ ...form, mensagem: e.target.value })}
                placeholder="Olá {nome}, tudo bem?"
                rows={4}
              />
              <p className="text-xs text-muted-foreground mt-1">Use {"{nome}"} para inserir o nome da empresa automaticamente.</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCriarAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCriar} disabled={criarCampanha.isPending || !form.nome.trim() || !form.mensagem.trim()}>
              {criarCampanha.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Criar Campanha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
