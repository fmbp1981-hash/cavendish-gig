import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Trash2 } from "lucide-react";
import { useUpdateProspeccaoLead, useDeleteProspeccaoLead } from "@/hooks/useProspeccaoLeads";
import { CategoryBadge } from "./category-badge";
import { ConversaPanel } from "./conversa-panel";
import { AgendarFechamentoButton } from "./agendar-fechamento-button";
import type { ProspeccaoLead, ProspeccaoStatus } from "@/types/prospeccao";

const STATUS_OPTIONS: { value: ProspeccaoStatus; label: string }[] = [
  { value: "novo", label: "Novo" },
  { value: "contatado", label: "Contatado" },
  { value: "qualificando", label: "Qualificando" },
  { value: "qualificado", label: "Qualificado" },
  { value: "proposta_enviada", label: "Proposta Enviada" },
  { value: "negociando", label: "Negociando" },
  { value: "convertido", label: "Convertido" },
  { value: "perdido", label: "Perdido" },
  { value: "sem_resposta", label: "Sem Resposta" },
];

interface LeadDetailDrawerProps {
  lead: ProspeccaoLead | null;
  onClose: () => void;
  podeExcluir?: boolean;
}

export function LeadDetailDrawer({ lead, onClose, podeExcluir }: LeadDetailDrawerProps) {
  const atualizarLead = useUpdateProspeccaoLead();
  const excluirLead = useDeleteProspeccaoLead();
  const [form, setForm] = useState({ telefone: "", email: "", cidade: "", estado: "", observacoes: "", status: "novo" as ProspeccaoStatus });

  useEffect(() => {
    if (lead) {
      setForm({
        telefone: lead.telefone ?? "",
        email: lead.email ?? "",
        cidade: lead.cidade ?? "",
        estado: lead.estado ?? "",
        observacoes: lead.observacoes ?? "",
        status: lead.status,
      });
    }
  }, [lead]);

  if (!lead) return null;

  const handleSalvar = async () => {
    await atualizarLead.mutateAsync({
      id: lead.id,
      telefone: form.telefone || null,
      email: form.email || null,
      cidade: form.cidade || null,
      estado: form.estado || null,
      observacoes: form.observacoes || null,
      status: form.status,
    });
  };

  const handleExcluir = async () => {
    await excluirLead.mutateAsync(lead.id);
    onClose();
  };

  return (
    <Sheet open={!!lead} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">{lead.nome}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          <div className="flex items-center gap-2">
            <CategoryBadge categoria={lead.categoria} />
            {typeof lead.ai_score === "number" && (
              <span className="text-sm text-muted-foreground">Score IA: {lead.ai_score}</span>
            )}
          </div>

          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as ProspeccaoStatus })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Telefone</Label>
              <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Cidade</Label>
              <Input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} />
            </div>
            <div>
              <Label>Estado</Label>
              <Input value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })} maxLength={2} />
            </div>
          </div>

          {lead.cnpj && (
            <div>
              <Label>CNPJ</Label>
              <p className="text-sm text-muted-foreground">{lead.cnpj}</p>
            </div>
          )}

          <div>
            <Label>Observações</Label>
            <Textarea
              value={form.observacoes}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
              rows={4}
            />
          </div>

          {lead.ai_resumo && (
            <div>
              <Label>Resumo da IA</Label>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{lead.ai_resumo}</p>
            </div>
          )}

          <ConversaPanel lead={lead} />

          <AgendarFechamentoButton lead={lead} />

          <div className="flex items-center justify-between pt-2">
            {podeExcluir ? (
              <Button variant="ghost" className="text-destructive" onClick={handleExcluir} disabled={excluirLead.isPending}>
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            ) : (
              <span />
            )}
            <Button onClick={handleSalvar} disabled={atualizarLead.isPending}>
              {atualizarLead.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Salvar
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
