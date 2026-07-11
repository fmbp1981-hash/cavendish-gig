import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, CheckCircle2 } from "lucide-react";
import {
  useReuniaoFechamentoStatus,
  useMarcarReuniaoRealizada,
  useConverterLeadOrganizacao,
  useConverterLeadParceiro,
} from "@/hooks/useConverterLead";
import type { ProspeccaoLead } from "@/types/prospeccao";

interface ConverterLeadDialogProps {
  lead: ProspeccaoLead;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Diálogo de conversão do lead (Fase 7). Ramifica por categoria: `parceiro_indicador` não exige
 * reunião (só pré-registra o contato como parceiro); as demais categorias exigem o Gate — reunião
 * de fechamento com status `realizada` — antes de liberar a criação da organização. */
export function ConverterLeadDialog({ lead, open, onOpenChange }: ConverterLeadDialogProps) {
  const isParceiro = lead.categoria === "parceiro_indicador";

  const { data: reuniao, isLoading: carregandoReuniao } = useReuniaoFechamentoStatus(lead.reuniao_fechamento_id);
  const marcarRealizada = useMarcarReuniaoRealizada();
  const converterOrganizacao = useConverterLeadOrganizacao();
  const converterParceiro = useConverterLeadParceiro();

  const [form, setForm] = useState({ nomeOrganizacao: "", cnpj: "", contatoNome: "", contatoEmail: "" });

  useEffect(() => {
    if (open) {
      setForm({
        nomeOrganizacao: lead.nome,
        cnpj: lead.cnpj ?? "",
        contatoNome: lead.nome,
        contatoEmail: lead.email ?? "",
      });
    }
  }, [open, lead]);

  const reuniaoRealizada = reuniao?.status === "realizada";
  const gateLiberado = isParceiro || reuniaoRealizada;

  const handleConverter = async () => {
    if (isParceiro) {
      await converterParceiro.mutateAsync({
        leadId: lead.id,
        contatoNome: form.contatoNome || undefined,
        contatoEmail: form.contatoEmail || undefined,
      });
    } else {
      await converterOrganizacao.mutateAsync({
        leadId: lead.id,
        nomeOrganizacao: form.nomeOrganizacao || undefined,
        cnpj: form.cnpj || undefined,
        contatoNome: form.contatoNome || undefined,
        contatoEmail: form.contatoEmail || undefined,
      });
    }
    onOpenChange(false);
  };

  const convertendo = converterOrganizacao.isPending || converterParceiro.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isParceiro ? "Converter lead em parceiro" : "Converter lead em organização"}</DialogTitle>
          <DialogDescription>
            {isParceiro
              ? "Cria um acesso de parceiro para o contato. A pessoa precisa se cadastrar no sistema com o mesmo email para ativar o acesso."
              : "Cria a organização e um acesso de cliente para o contato. A pessoa precisa se cadastrar no sistema com o mesmo email para ativar o acesso."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!isParceiro && (
            <>
              {!lead.reuniao_fechamento_id ? (
                <p className="text-sm text-muted-foreground">
                  Este lead ainda não tem uma reunião de fechamento agendada. Agende antes de converter.
                </p>
              ) : carregandoReuniao ? (
                <p className="text-sm text-muted-foreground">Verificando status da reunião…</p>
              ) : reuniaoRealizada ? (
                <div className="flex items-center gap-2 text-sm text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Reunião de fechamento confirmada como realizada
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    A reunião de fechamento ainda não foi marcada como realizada. Confirme antes de converter.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => marcarRealizada.mutate(lead.id)}
                    disabled={marcarRealizada.isPending}
                  >
                    {marcarRealizada.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Confirmar que a reunião foi realizada
                  </Button>
                </div>
              )}

              <div>
                <Label>Nome da organização</Label>
                <Input value={form.nomeOrganizacao} onChange={(e) => setForm({ ...form, nomeOrganizacao: e.target.value })} />
              </div>
              <div>
                <Label>CNPJ</Label>
                <Input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} />
              </div>
            </>
          )}

          <div>
            <Label>Nome do contato</Label>
            <Input value={form.contatoNome} onChange={(e) => setForm({ ...form, contatoNome: e.target.value })} />
          </div>
          <div>
            <Label>Email do contato</Label>
            <Input
              type="email"
              value={form.contatoEmail}
              onChange={(e) => setForm({ ...form, contatoEmail: e.target.value })}
              placeholder="usado para criar o acesso"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConverter} disabled={!gateLiberado || !form.contatoEmail || convertendo}>
            {convertendo && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Converter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
