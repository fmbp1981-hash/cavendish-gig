import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles, X, Minus, Send, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AgenteChatProps {
  mode?: "floating" | "header";
}

export function AgenteChat({ mode = "floating" }: AgenteChatProps) {
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll para a última mensagem
  useEffect(() => {
    if (open && !minimized) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open, minimized]);

  // Foco no input ao abrir
  useEffect(() => {
    if (open && !minimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, minimized]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-generate", {
        body: {
          tipo: "chat",
          input_data: {
            messages: newMessages,
            userName: profile?.nome || "Consultor",
          },
        },
      });

      if (error) throw error;

      const assistantContent =
        data?.result || data?.output || "Desculpe, não consegui processar sua mensagem.";

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: assistantContent },
      ]);
    } catch (err) {
      console.error("[AgenteChat] erro:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Ocorreu um erro ao processar sua mensagem. Tente novamente em instantes.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Botão flutuante — apenas no modo floating */}
      {mode === "floating" && !open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-amber-500 hover:bg-amber-600 text-white shadow-lg flex items-center justify-center transition-all hover:scale-105"
          title="IntelliX AI — Assistente"
        >
          <Sparkles className="w-6 h-6" />
        </button>
      )}

      {/* Botão inline para o header */}
      {mode === "header" && (
        <button
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "h-9 w-9 rounded-lg flex items-center justify-center transition-colors",
            open
              ? "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
          title="IntelliX AI — Assistente"
        >
          <Sparkles className="w-4 h-4" />
        </button>
      )}

      {/* Painel de chat */}
      {open && (
        <div
          className={cn(
            "fixed bottom-6 right-6 z-50 w-[360px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col transition-all",
            minimized ? "h-14" : "h-[520px]"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary rounded-t-2xl">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-semibold text-primary-foreground">
                IntelliX AI
              </span>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && !minimized && (
                <button
                  onClick={() => setMessages([])}
                  className="p-1 rounded hover:bg-white/10 text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                  title="Limpar conversa"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setMinimized((v) => !v)}
                className="p-1 rounded hover:bg-white/10 text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                title={minimized ? "Expandir" : "Minimizar"}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded hover:bg-white/10 text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                title="Fechar"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Corpo */}
          {!minimized && (
            <>
              <ScrollArea className="flex-1 px-4 py-3">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-8">
                    <Sparkles className="w-8 h-8 text-amber-400" />
                    <p className="text-sm font-medium text-foreground">
                      Olá{profile?.nome ? `, ${profile.nome.split(" ")[0]}` : ""}!
                    </p>
                    <p className="text-xs text-muted-foreground max-w-[240px]">
                      Sou o IntelliX AI. Posso te ajudar a consultar informações
                      dos seus clientes, projetos, tarefas e documentos.
                    </p>
                    <div className="flex flex-col gap-1 w-full mt-2">
                      {[
                        "Quais clientes têm documentos pendentes?",
                        "Resuma o status dos meus projetos",
                        "Quais tarefas estão atrasadas?",
                      ].map((sugestao) => (
                        <button
                          key={sugestao}
                          onClick={() => {
                            setInput(sugestao);
                            setTimeout(() => inputRef.current?.focus(), 50);
                          }}
                          className="text-xs text-left px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {sugestao}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {messages.map((msg, i) => (
                      <div
                        key={i}
                        className={cn(
                          "flex",
                          msg.role === "user" ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap",
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground rounded-br-sm"
                              : "bg-muted text-foreground rounded-bl-sm"
                          )}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    {loading && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-2xl rounded-bl-sm px-3 py-2">
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        </div>
                      </div>
                    )}
                    <div ref={bottomRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Input */}
              <div className="flex items-center gap-2 px-3 py-3 border-t border-border">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Pergunte algo..."
                  disabled={loading}
                  className="flex-1 text-sm h-9 rounded-xl"
                />
                <Button
                  size="icon"
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  className="h-9 w-9 rounded-xl bg-amber-500 hover:bg-amber-600 text-white flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
