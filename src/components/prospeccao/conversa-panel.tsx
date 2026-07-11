import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, Bot, UserCheck } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useConversasDoLead, useEnviarMensagem, useAcionarAgente } from "@/hooks/useProspeccaoConversas";
import { useUpdateProspeccaoLead } from "@/hooks/useProspeccaoLeads";
import type { ProspeccaoLead } from "@/types/prospeccao";

interface ConversaPanelProps {
  lead: ProspeccaoLead;
}

export function ConversaPanel({ lead }: ConversaPanelProps) {
  const [mensagem, setMensagem] = useState("");
  const { data: conversas, isLoading } = useConversasDoLead(lead.id);
  const enviarMensagem = useEnviarMensagem();
  const acionarAgente = useAcionarAgente();
  const atualizarLead = useUpdateProspeccaoLead();

  const handleEnviar = async () => {
    if (!mensagem.trim() || !lead.telefone) return;
    await enviarMensagem.mutateAsync({ leadId: lead.id, telefone: lead.telefone, mensagem: mensagem.trim() });
    setMensagem("");
  };

  const handleAlternarModoHumano = () => {
    atualizarLead.mutate({ id: lead.id, modo_humano: !lead.modo_humano });
  };

  return (
    <div className="space-y-3 border-t pt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Conversa</h3>
        <div className="flex items-center gap-2">
          <Badge variant={lead.modo_humano ? "default" : "secondary"} className="text-xs">
            {lead.modo_humano ? <UserCheck className="h-3 w-3 mr-1" /> : <Bot className="h-3 w-3 mr-1" />}
            {lead.modo_humano ? "Atendimento humano" : "Agente de IA"}
          </Badge>
          <Button variant="ghost" size="sm" onClick={handleAlternarModoHumano}>
            {lead.modo_humano ? "Devolver para IA" : "Assumir conversa"}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="max-h-64 overflow-y-auto space-y-2 rounded-md border p-3 bg-muted/20">
          {(conversas ?? []).map((conversa) => (
            <div
              key={conversa.id}
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                conversa.role === "user"
                  ? "bg-background border mr-auto"
                  : conversa.role === "assistant"
                  ? "bg-primary text-primary-foreground ml-auto"
                  : "bg-muted text-muted-foreground text-xs mx-auto text-center"
              }`}
            >
              <p className="whitespace-pre-wrap">{conversa.conteudo}</p>
              <p className="text-[10px] opacity-70 mt-1">
                {format(new Date(conversa.created_at), "dd/MM HH:mm", { locale: ptBR })}
              </p>
            </div>
          ))}
          {(!conversas || conversas.length === 0) && (
            <p className="text-xs text-muted-foreground text-center py-4">Nenhuma mensagem ainda.</p>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          placeholder={lead.telefone ? "Digite uma mensagem..." : "Lead sem telefone cadastrado"}
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          disabled={!lead.telefone}
          onKeyDown={(e) => e.key === "Enter" && handleEnviar()}
        />
        <Button onClick={handleEnviar} disabled={!mensagem.trim() || !lead.telefone || enviarMensagem.isPending} size="icon">
          {enviarMensagem.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => acionarAgente.mutate(lead.id)}
        disabled={acionarAgente.isPending || lead.modo_humano}
      >
        {acionarAgente.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Bot className="h-4 w-4 mr-2" />}
        Acionar agente de IA agora
      </Button>
    </div>
  );
}
