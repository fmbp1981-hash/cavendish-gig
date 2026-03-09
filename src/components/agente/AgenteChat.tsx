import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Loader2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAIGenerate } from "@/hooks/useAIGenerate";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const WELCOME_MESSAGE: Message = {
  role: "assistant",
  content:
    "Olá! Sou o **IntelliX**, seu assistente de IA do Sistema GIG.\n\nPosso te ajudar com informações sobre organizações, projetos, tarefas pendentes, documentos e muito mais. Como posso ajudar?",
};

export function AgenteChat() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { generate, loading } = useAIGenerate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (open && !minimized) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, minimized, messages]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMessage: Message = { role: "user", content: trimmed };
    const historico = messages.filter((m) => m !== WELCOME_MESSAGE);

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    const result = await generate({
      tipo: "chat",
      input_data: {
        mensagem: trimmed,
        historico,
      },
    });

    const assistantMessage: Message = {
      role: "assistant",
      content: result.success
        ? result.output || "Resposta recebida."
        : `Desculpe, ocorreu um erro: ${result.error}`,
    };

    setMessages((prev) => [...prev, assistantMessage]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    setMessages([WELCOME_MESSAGE]);
    setInput("");
  };

  const renderMessageContent = (content: string) => {
    // Basic markdown: bold, line breaks
    return content
      .split("\n")
      .map((line, i) => {
        const boldified = line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
        return (
          <span key={i}>
            <span dangerouslySetInnerHTML={{ __html: boldified }} />
            {i < content.split("\n").length - 1 && <br />}
          </span>
        );
      });
  };

  return (
    <>
      {/* Floating toggle button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white rounded-full px-4 py-3 shadow-xl transition-all duration-200 hover:scale-105 group"
          aria-label="Abrir IntelliX Chat"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="text-sm font-semibold hidden group-hover:inline">IntelliX</span>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div
          className={cn(
            "fixed bottom-6 right-6 z-50 flex flex-col bg-background border border-border rounded-2xl shadow-2xl transition-all duration-300",
            minimized ? "w-72 h-14" : "w-96 h-[560px]"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-amber-600 rounded-t-2xl text-white shrink-0">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              <span className="font-semibold text-sm">IntelliX — Assistente GIG</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMinimized((m) => !m)}
                className="p-1 rounded hover:bg-amber-700 transition-colors"
                aria-label="Minimizar"
              >
                <Minimize2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded hover:bg-amber-700 transition-colors"
                aria-label="Fechar"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              {/* Messages */}
              <ScrollArea className="flex-1 px-4 py-3">
                <div className="space-y-3">
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "flex gap-2 text-sm",
                        msg.role === "user" ? "flex-row-reverse" : "flex-row"
                      )}
                    >
                      <div
                        className={cn(
                          "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5",
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-amber-100 text-amber-700"
                        )}
                      >
                        {msg.role === "user" ? (
                          <User className="h-3 w-3" />
                        ) : (
                          <Bot className="h-3 w-3" />
                        )}
                      </div>
                      <div
                        className={cn(
                          "max-w-[78%] rounded-xl px-3 py-2 leading-relaxed",
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground rounded-tr-sm"
                            : "bg-muted text-foreground rounded-tl-sm"
                        )}
                      >
                        {renderMessageContent(msg.content)}
                      </div>
                    </div>
                  ))}

                  {loading && (
                    <div className="flex gap-2 text-sm">
                      <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mt-0.5 shrink-0">
                        <Bot className="h-3 w-3" />
                      </div>
                      <div className="bg-muted rounded-xl rounded-tl-sm px-3 py-2 flex items-center gap-1.5">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600" />
                        <span className="text-xs text-muted-foreground">Processando…</span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input area */}
              <div className="border-t border-border px-3 py-3 shrink-0">
                <div className="flex gap-2 items-end">
                  <Textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Pergunte sobre o sistema…"
                    className="resize-none text-sm min-h-[40px] max-h-[100px] flex-1"
                    rows={1}
                    disabled={loading}
                  />
                  <Button
                    size="icon"
                    onClick={handleSend}
                    disabled={!input.trim() || loading}
                    className="bg-amber-600 hover:bg-amber-700 text-white shrink-0 h-10 w-10"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex justify-between items-center mt-1.5">
                  <span className="text-[10px] text-muted-foreground">Enter para enviar · Shift+Enter nova linha</span>
                  <button
                    onClick={handleClear}
                    className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Limpar conversa
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
