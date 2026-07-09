import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, X, Search } from "lucide-react";
import { useMunicipiosIBGE } from "@/hooks/useMunicipiosIBGE";
import { ESTADOS_BR } from "@/lib/prospeccao/estados-br";
import { CIDADES_POPULARES } from "@/lib/prospeccao/cidades-populares";

interface LocalizacaoPickerProps {
  estado: string;
  cidade: string;
  bairros: string[];
  nomeEstabelecimento: string;
  onChangeEstado: (v: string) => void;
  onChangeCidade: (v: string) => void;
  onChangeBairros: (v: string[]) => void;
  onChangeNomeEstabelecimento: (v: string) => void;
}

export function LocalizacaoPicker({
  estado,
  cidade,
  bairros,
  nomeEstabelecimento,
  onChangeEstado,
  onChangeCidade,
  onChangeBairros,
  onChangeNomeEstabelecimento,
}: LocalizacaoPickerProps) {
  const [mostrarCidadesPopulares, setMostrarCidadesPopulares] = useState(false);
  const [bairroDigitado, setBairroDigitado] = useState("");
  const { data: municipios, isLoading: carregandoMunicipios } = useMunicipiosIBGE(estado);

  const adicionarBairro = () => {
    const valor = bairroDigitado.trim();
    if (!valor || bairros.includes(valor)) return;
    onChangeBairros([...bairros, valor]);
    setBairroDigitado("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Localização</Label>
        <Button variant="outline" size="sm" onClick={() => setMostrarCidadesPopulares((v) => !v)}>
          <MapPin className="h-4 w-4 mr-2" />
          {mostrarCidadesPopulares ? "Ocultar" : "Cidades Populares"}
        </Button>
      </div>

      {mostrarCidadesPopulares && (
        <div className="flex flex-wrap gap-2 rounded-lg border p-3">
          {CIDADES_POPULARES.map((c) => (
            <Button
              key={`${c.cidade}-${c.estado}`}
              type="button"
              variant={cidade === c.cidade && estado === c.estado ? "default" : "outline"}
              size="sm"
              onClick={() => {
                onChangeEstado(c.estado);
                onChangeCidade(c.cidade);
              }}
            >
              {c.cidade} - {c.estado}
            </Button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>País</Label>
          <Select value="BR" disabled>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BR">Brasil</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Estado</Label>
          <Select
            value={estado || undefined}
            onValueChange={(v) => {
              onChangeEstado(v);
              onChangeCidade(""); // cidade depende do estado — reseta ao trocar
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o estado" />
            </SelectTrigger>
            <SelectContent>
              {ESTADOS_BR.map((uf) => (
                <SelectItem key={uf.sigla} value={uf.sigla}>
                  {uf.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Cidade</Label>
        <Select value={cidade || undefined} onValueChange={onChangeCidade} disabled={!estado || carregandoMunicipios}>
          <SelectTrigger>
            <SelectValue placeholder={!estado ? "Selecione o estado primeiro" : carregandoMunicipios ? "Carregando..." : "Selecione a cidade"} />
          </SelectTrigger>
          <SelectContent>
            {municipios?.map((m) => (
              <SelectItem key={m.id} value={m.nome}>
                {m.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Bairros/Regiões (opcional)</Label>
        <div className="flex gap-2">
          <Input
            value={bairroDigitado}
            onChange={(e) => setBairroDigitado(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                adicionarBairro();
              }
            }}
            placeholder="Digite e pressione Enter"
          />
          <Button type="button" variant="outline" onClick={adicionarBairro} disabled={!bairroDigitado.trim()}>
            Adicionar
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Adicione um ou mais bairros para filtrar a busca.</p>
        {bairros.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {bairros.map((b) => (
              <Badge key={b} variant="secondary" className="gap-1 pr-1">
                {b}
                <button
                  type="button"
                  onClick={() => onChangeBairros(bairros.filter((x) => x !== b))}
                  className="rounded-full hover:bg-muted-foreground/20 p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-lg border p-3 space-y-2">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Label className="mb-0">Busca por Nome do Estabelecimento</Label>
          <Badge variant="outline">Recomendado</Badge>
        </div>
        <Input
          value={nomeEstabelecimento}
          onChange={(e) => onChangeNomeEstabelecimento(e.target.value)}
          placeholder="Ex: Restaurante do João, Padaria Central..."
        />
        <p className="text-xs text-muted-foreground">
          <strong>Busca direta:</strong> Digite o nome exato do estabelecimento. O nicho e localização são opcionais — serão
          extraídos automaticamente do Google.
        </p>
      </div>
    </div>
  );
}
