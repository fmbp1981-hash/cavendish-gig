import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useCreateAgentConfig, useUpdateAgentConfig } from "@/hooks/useProspeccaoAgentConfig";
import { getCategoriaLabel } from "@/lib/prospeccao/categorias";
import type { ProspeccaoAgentConfig, ProspeccaoAiProvider, ProspeccaoCategoria } from "@/types/prospeccao";

const AI_PROVIDERS: { value: ProspeccaoAiProvider; label: string }[] = [
  { value: "gemini", label: "Gemini" },
  { value: "openai", label: "OpenAI" },
  { value: "claude", label: "Claude" },
];

interface AgentConfigFormProps {
  categoria: ProspeccaoCategoria;
  /** Config ativa/mais recente desta categoria, ou null se ainda não existe nenhuma. */
  config: ProspeccaoAgentConfig | null;
}

const CAMPOS_PADRAO = {
  nome: "",
  system_prompt: "",
  ai_provider: "gemini" as ProspeccaoAiProvider,
  temperatura: "0.7",
  max_iteracoes: "5",
  ativo: true,
};

export function AgentConfigForm({ categoria, config }: AgentConfigFormProps) {
  const criar = useCreateAgentConfig();
  const atualizar = useUpdateAgentConfig();
  const [form, setForm] = useState(CAMPOS_PADRAO);

  useEffect(() => {
    if (config) {
      setForm({
        nome: config.nome,
        system_prompt: config.system_prompt,
        ai_provider: config.ai_provider,
        temperatura: String(config.temperatura),
        max_iteracoes: String(config.max_iteracoes),
        ativo: config.ativo,
      });
    } else {
      setForm({ ...CAMPOS_PADRAO, nome: `Agente — ${getCategoriaLabel(categoria)}` });
    }
  }, [config, categoria]);

  const salvando = criar.isPending || atualizar.isPending;

  const handleSalvar = async () => {
    const payload = {
      nome: form.nome,
      system_prompt: form.system_prompt,
      ai_provider: form.ai_provider,
      temperatura: Number(form.temperatura) || 0,
      max_iteracoes: Number(form.max_iteracoes) || 1,
      ativo: form.ativo,
    };
    if (config) {
      await atualizar.mutateAsync({ id: config.id, ...payload });
    } else {
      await criar.mutateAsync({ categoria, ...payload });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Nome</Label>
        <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
      </div>

      <div>
        <Label>Prompt de sistema</Label>
        <Textarea
          value={form.system_prompt}
          onChange={(e) => setForm({ ...form, system_prompt: e.target.value })}
          rows={10}
          placeholder="Instruções que definem como o agente conversa com leads desta categoria..."
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Provider de IA</Label>
          <Select value={form.ai_provider} onValueChange={(v) => setForm({ ...form, ai_provider: v as ProspeccaoAiProvider })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AI_PROVIDERS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            Function-calling só implementado para Gemini — outros providers respondem em texto simples e transferem para humano.
          </p>
        </div>
        <div>
          <Label>Temperatura</Label>
          <Input
            type="number"
            min={0}
            max={2}
            step={0.1}
            value={form.temperatura}
            onChange={(e) => setForm({ ...form, temperatura: e.target.value })}
          />
        </div>
        <div>
          <Label>Máx. iterações</Label>
          <Input
            type="number"
            min={1}
            value={form.max_iteracoes}
            onChange={(e) => setForm({ ...form, max_iteracoes: e.target.value })}
          />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border p-3">
        <div>
          <Label>Usar base de conhecimento (RAG)</Label>
          <p className="text-xs text-muted-foreground">Requer Fase 10 — `pgvector` ainda não habilitado no projeto.</p>
        </div>
        <Switch checked={false} disabled />
      </div>

      <div className="flex items-center justify-between rounded-lg border p-3">
        <div>
          <Label>Ativo</Label>
          <p className="text-xs text-muted-foreground">Só uma configuração pode estar ativa por categoria.</p>
        </div>
        <Switch checked={form.ativo} onCheckedChange={(v) => setForm({ ...form, ativo: v })} />
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSalvar} disabled={salvando || !form.nome.trim() || !form.system_prompt.trim()}>
          {salvando && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {config ? "Salvar" : "Criar configuração"}
        </Button>
      </div>
    </div>
  );
}
