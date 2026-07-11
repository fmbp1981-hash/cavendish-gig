import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, X, Target, Package, Loader2 } from "lucide-react";
import { useAIGenerate } from "@/hooks/useAIGenerate";
import { GRUPOS_NICHO } from "@/lib/prospeccao/nichos";

interface NichoPickerProps {
  termos: string[];
  onChangeTermos: (termos: string[]) => void;
}

/** Nicho de negócio = ramo de atividade da empresa (usado como termo de busca no Google Places).
 * Não confundir com a Categoria de prospecção da Cavendish (gatilho de compliance/governança) —
 * essa continua sendo pedida separadamente no formulário, é uma regra de negócio independente. */
export function NichoPicker({ termos, onChangeTermos }: NichoPickerProps) {
  const [mostrarSelecaoRapida, setMostrarSelecaoRapida] = useState(false);
  const [categoriaAtiva, setCategoriaAtiva] = useState(GRUPOS_NICHO[0].categoria);
  const [termoLivre, setTermoLivre] = useState("");
  const [descricaoProduto, setDescricaoProduto] = useState("");
  const [sugestoes, setSugestoes] = useState<string[]>([]);
  const { generate, loading: gerandoSugestoes } = useAIGenerate();

  const adicionarTermo = (termo: string) => {
    const valor = termo.trim();
    if (!valor || termos.includes(valor)) return;
    onChangeTermos([...termos, valor]);
  };

  const removerTermo = (termo: string) => {
    onChangeTermos(termos.filter((t) => t !== termo));
  };

  const grupoAtivo = GRUPOS_NICHO.find((g) => g.categoria === categoriaAtiva) ?? GRUPOS_NICHO[0];

  const handleSugerirNichos = async () => {
    if (!descricaoProduto.trim()) return;
    const resultado = await generate({
      tipo: "chat",
      input_data: {
        messages: [{
          role: "user",
          content: `Um representante comercial vende o seguinte produto/serviço: "${descricaoProduto.trim()}". Liste de 5 a 8 nichos/ramos de negócio (em português, nomes curtos como "Academias" ou "Escritórios de Advocacia") que seriam bons clientes para isso. Responda SOMENTE com os nomes separados por vírgula, sem numeração, sem explicação.`,
        }],
      },
    });
    if (resultado.success && resultado.output) {
      const lista = resultado.output.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 8);
      setSugestoes(lista);
    }
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="nicho">
        <TabsList className="w-full">
          <TabsTrigger value="nicho" className="flex-1">
            <Target className="h-4 w-4 mr-2" />
            Nicho / Categoria
          </TabsTrigger>
          <TabsTrigger value="produto" className="flex-1">
            <Package className="h-4 w-4 mr-2" />
            Produto / Serviço
          </TabsTrigger>
        </TabsList>

        <TabsContent value="nicho" className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Nicho de Negócios</Label>
            <Button variant="outline" size="sm" onClick={() => setMostrarSelecaoRapida((v) => !v)}>
              <Sparkles className="h-4 w-4 mr-2" />
              {mostrarSelecaoRapida ? "Ocultar" : "Seleção Rápida"}
            </Button>
          </div>

          {mostrarSelecaoRapida && (
            <div className="rounded-lg border p-3 space-y-3">
              <div className="flex flex-wrap gap-1">
                {GRUPOS_NICHO.map((grupo) => (
                  <Button
                    key={grupo.categoria}
                    type="button"
                    variant={grupo.categoria === categoriaAtiva ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setCategoriaAtiva(grupo.categoria)}
                  >
                    {grupo.categoria}
                  </Button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {grupoAtivo.nichos.map((nicho) => (
                  <Button
                    key={nicho}
                    type="button"
                    variant={termos.includes(nicho) ? "default" : "outline"}
                    size="sm"
                    onClick={() => (termos.includes(nicho) ? removerTermo(nicho) : adicionarTermo(nicho))}
                  >
                    {nicho}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <Input
            value={termoLivre}
            onChange={(e) => setTermoLivre(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                adicionarTermo(termoLivre);
                setTermoLivre("");
              }
            }}
            placeholder="Ex: Restaurantes, Clínicas, Academias... (pressione Enter para adicionar)"
          />
        </TabsContent>

        <TabsContent value="produto" className="space-y-3">
          <Label>Descreva o produto ou serviço</Label>
          <Textarea
            value={descricaoProduto}
            onChange={(e) => setDescricaoProduto(e.target.value)}
            rows={3}
            placeholder="Ex: Software de gestão financeira para pequenas empresas"
          />
          <Button type="button" variant="outline" size="sm" onClick={handleSugerirNichos} disabled={gerandoSugestoes || !descricaoProduto.trim()}>
            {gerandoSugestoes ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Sugerir Nichos com IA
          </Button>

          {sugestoes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {sugestoes.map((nicho) => (
                <Button
                  key={nicho}
                  type="button"
                  variant={termos.includes(nicho) ? "default" : "outline"}
                  size="sm"
                  onClick={() => (termos.includes(nicho) ? removerTermo(nicho) : adicionarTermo(nicho))}
                >
                  {nicho}
                </Button>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {termos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {termos.map((termo) => (
            <Badge key={termo} variant="secondary" className="gap-1 pr-1">
              {termo}
              <button type="button" onClick={() => removerTermo(termo)} className="rounded-full hover:bg-muted-foreground/20 p-0.5">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
