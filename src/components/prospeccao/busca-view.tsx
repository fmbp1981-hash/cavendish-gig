import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Search } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useBuscarGooglePlaces, useHistoricoBusca } from "@/hooks/useProspeccaoBusca";
import { useRepresentantes } from "@/hooks/useRepresentantes";
import { PROSPECCAO_CATEGORIAS } from "@/types/prospeccao";
import { getCategoriaLabel } from "@/lib/prospeccao/categorias";
import type { ProspeccaoCategoria } from "@/types/prospeccao";

interface BuscaViewProps {
  isAdmin: boolean;
  currentUserId: string;
}

const CAMPOS_INICIAIS = {
  termo: "",
  cidade: "",
  estado: "",
  bairro: "",
  categoria: "" as ProspeccaoCategoria | "",
  quantidade: 20,
  responsavelId: "",
};

export function BuscaView({ isAdmin, currentUserId }: BuscaViewProps) {
  const [form, setForm] = useState(CAMPOS_INICIAIS);
  const [gerarResumoIA, setGerarResumoIA] = useState(true);

  const buscar = useBuscarGooglePlaces();
  const { data: representantes } = useRepresentantes();
  const responsavelHistorico = isAdmin ? undefined : currentUserId;
  const { data: historico, isLoading: carregandoHistorico } = useHistoricoBusca(responsavelHistorico);

  const handleSubmit = async () => {
    if (!form.termo.trim() || !form.cidade.trim() || !form.categoria) return;

    await buscar.mutateAsync({
      termo: form.termo.trim(),
      cidade: form.cidade.trim(),
      estado: form.estado.trim() || undefined,
      bairro: form.bairro.trim() || undefined,
      categoria: form.categoria,
      quantidade: form.quantidade,
      responsavelId: isAdmin && form.responsavelId ? form.responsavelId : undefined,
      gerarResumoIA,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Busca — Finder</h1>
        <p className="text-muted-foreground">Encontre leads B2B via Google Places por termo e localização</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nova busca</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Termo de busca *</Label>
              <Input
                value={form.termo}
                onChange={(e) => setForm({ ...form, termo: e.target.value })}
                placeholder="Ex.: escritório de advocacia"
              />
            </div>
            <div>
              <Label>Categoria (gatilho de compliance) *</Label>
              <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v as ProspeccaoCategoria })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {PROSPECCAO_CATEGORIAS.map((categoria) => (
                    <SelectItem key={categoria} value={categoria}>
                      {getCategoriaLabel(categoria)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Cidade *</Label>
              <Input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} />
            </div>
            <div>
              <Label>Estado (UF)</Label>
              <Input value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })} maxLength={2} />
            </div>
            <div>
              <Label>Bairro</Label>
              <Input value={form.bairro} onChange={(e) => setForm({ ...form, bairro: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 items-end">
            <div>
              <Label>Quantidade de resultados</Label>
              <Input
                type="number"
                min={1}
                max={20}
                value={form.quantidade}
                onChange={(e) => setForm({ ...form, quantidade: Number(e.target.value) || 20 })}
              />
            </div>
            {isAdmin && (
              <div>
                <Label>Atribuir a</Label>
                <Select value={form.responsavelId} onValueChange={(v) => setForm({ ...form, responsavelId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Eu mesmo (admin)" />
                  </SelectTrigger>
                  <SelectContent>
                    {representantes?.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.nome || r.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox id="gerar-resumo-ia" checked={gerarResumoIA} onCheckedChange={(v) => setGerarResumoIA(v === true)} />
            <Label htmlFor="gerar-resumo-ia" className="font-normal cursor-pointer">
              Gerar resumo com IA (lê o site da empresa quando disponível — pode deixar a busca um pouco mais lenta)
            </Label>
          </div>

          <Button onClick={handleSubmit} disabled={buscar.isPending || !form.termo.trim() || !form.cidade.trim() || !form.categoria}>
            {buscar.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
            Buscar
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico de buscas</CardTitle>
        </CardHeader>
        <CardContent>
          {carregandoHistorico ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Termo</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Resultados</TableHead>
                  <TableHead>Importados</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historico?.map((busca) => (
                  <TableRow key={busca.id}>
                    <TableCell className="font-medium">{busca.termo}</TableCell>
                    <TableCell className="text-muted-foreground">{busca.localizacao}</TableCell>
                    <TableCell className="text-muted-foreground">{getCategoriaLabel(busca.categoria)}</TableCell>
                    <TableCell>{busca.total_resultados}</TableCell>
                    <TableCell>{busca.total_importados}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(busca.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                  </TableRow>
                ))}
                {(!historico || historico.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Nenhuma busca realizada ainda.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
