import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, History, RotateCcw } from "lucide-react";
import { useBuscarGooglePlaces, useHistoricoBusca } from "@/hooks/useProspeccaoBusca";
import { useRepresentantes } from "@/hooks/useRepresentantes";
import { NichoPicker } from "./nicho-picker";
import { LocalizacaoPicker } from "./localizacao-picker";
import { BuscaHistorico } from "./busca-historico";
import { FinderPageHeader } from "./finder-page-header";
import { PROSPECCAO_CATEGORIAS } from "@/types/prospeccao";
import { getCategoriaLabel } from "@/lib/prospeccao/categorias";
import type { ProspeccaoBusca, ProspeccaoCategoria } from "@/types/prospeccao";

interface BuscaViewProps {
  isAdmin: boolean;
  currentUserId: string;
  leadsHref: string;
}

const CAMPOS_INICIAIS = {
  termos: [] as string[],
  nomeEstabelecimento: "",
  cidade: "",
  estado: "",
  bairros: [] as string[],
  categoria: "" as ProspeccaoCategoria | "",
  quantidade: 50,
  responsavelId: "",
};

export function BuscaView({ isAdmin, currentUserId, leadsHref }: BuscaViewProps) {
  const [form, setForm] = useState(CAMPOS_INICIAIS);
  const [gerarResumoIA, setGerarResumoIA] = useState(true);
  const [reprocessandoId, setReprocessandoId] = useState<string | null>(null);

  const buscar = useBuscarGooglePlaces();
  const { data: representantes } = useRepresentantes();
  const responsavelHistorico = isAdmin ? undefined : currentUserId;
  const { data: historico, isLoading: carregandoHistorico } = useHistoricoBusca(responsavelHistorico);
  const ultimaPesquisa = historico?.[0];

  const buscaDireta = !!form.nomeEstabelecimento.trim();
  const podeSubmeter = !!form.categoria && (buscaDireta || (form.termos.length > 0 && !!form.cidade.trim()));

  const handleSubmit = async () => {
    if (!podeSubmeter || !form.categoria) return;
    await buscar.mutateAsync({
      termos: form.termos,
      nomeEstabelecimento: form.nomeEstabelecimento.trim() || undefined,
      cidade: form.cidade.trim() || undefined,
      estado: form.estado.trim() || undefined,
      bairros: form.bairros,
      categoria: form.categoria,
      quantidade: form.quantidade,
      responsavelId: isAdmin && form.responsavelId ? form.responsavelId : undefined,
      gerarResumoIA,
    });
  };

  const preencherDaBusca = (busca: ProspeccaoBusca) => {
    const p = busca.parametros;
    setForm({
      termos: p.termos ?? [],
      nomeEstabelecimento: p.nomeEstabelecimento ?? "",
      cidade: p.cidade ?? "",
      estado: p.estado ?? "",
      bairros: p.bairros ?? [],
      categoria: p.categoria,
      quantidade: p.quantidade ?? 50,
      responsavelId: isAdmin ? busca.responsavel_id : "",
    });
  };

  const handleReprocessar = async (busca: ProspeccaoBusca) => {
    const p = busca.parametros;
    setReprocessandoId(busca.id);
    try {
      await buscar.mutateAsync({
        termos: p.termos ?? [],
        nomeEstabelecimento: p.nomeEstabelecimento,
        cidade: p.cidade,
        estado: p.estado,
        bairros: p.bairros,
        categoria: p.categoria,
        quantidade: p.quantidade ?? 50,
        responsavelId: isAdmin ? busca.responsavel_id : undefined,
        gerarResumoIA,
      });
    } finally {
      setReprocessandoId(null);
    }
  };

  return (
    <div className="space-y-6">
      <FinderPageHeader icon={Search} title="Nova Prospecção" subtitle="Configure sua busca de leads no Google Places" />

      {ultimaPesquisa && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <Badge variant="outline">Última pesquisa {new Date(ultimaPesquisa.created_at).toLocaleDateString("pt-BR")}</Badge>
              <Button variant="ghost" size="sm" onClick={() => preencherDaBusca(ultimaPesquisa)}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Usar novamente
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Nicho:</p>
                <p className="font-medium">{ultimaPesquisa.termo || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Local:</p>
                <p className="font-medium">{ultimaPesquisa.localizacao || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Quantidade:</p>
                <p className="font-medium">{ultimaPesquisa.parametros.quantidade ?? "—"} leads</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6 space-y-6">
          <NichoPicker termos={form.termos} onChangeTermos={(termos) => setForm({ ...form, termos })} />

          <LocalizacaoPicker
            estado={form.estado}
            cidade={form.cidade}
            bairros={form.bairros}
            nomeEstabelecimento={form.nomeEstabelecimento}
            onChangeEstado={(estado) => setForm({ ...form, estado })}
            onChangeCidade={(cidade) => setForm({ ...form, cidade })}
            onChangeBairros={(bairros) => setForm({ ...form, bairros })}
            onChangeNomeEstabelecimento={(nomeEstabelecimento) => setForm({ ...form, nomeEstabelecimento })}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Categoria de Prospecção (Cavendish) *</Label>
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
              <p className="text-xs text-muted-foreground mt-1">Gatilho de compliance/governança — define o funil e o agente de IA do lead.</p>
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

          <div>
            <Label>Quantidade de Leads</Label>
            <Input
              type="number"
              min={1}
              max={500}
              value={form.quantidade}
              onChange={(e) => setForm({ ...form, quantidade: Number(e.target.value) || 50 })}
              className="max-w-40"
            />
            <p className="text-xs text-muted-foreground mt-1">Máximo: 500 leads por busca.</p>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox id="gerar-resumo-ia" checked={gerarResumoIA} onCheckedChange={(v) => setGerarResumoIA(v === true)} />
            <Label htmlFor="gerar-resumo-ia" className="font-normal cursor-pointer">
              Gerar resumo com IA (lê o site da empresa quando disponível — pode deixar a busca um pouco mais lenta)
            </Label>
          </div>

          <Button size="lg" className="w-full" onClick={handleSubmit} disabled={buscar.isPending || !podeSubmeter}>
            {buscar.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
            Iniciar Prospecção
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            Histórico de Buscas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BuscaHistorico
            historico={historico}
            isLoading={carregandoHistorico}
            leadsHref={leadsHref}
            onReprocessar={handleReprocessar}
            reprocessandoId={reprocessandoId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
