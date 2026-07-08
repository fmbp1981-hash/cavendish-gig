import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useCreateProspeccaoLead } from "@/hooks/useProspeccaoLeads";
import { useRepresentantes } from "@/hooks/useRepresentantes";
import { PROSPECCAO_CATEGORIAS } from "@/types/prospeccao";
import { getCategoriaLabel } from "@/lib/prospeccao/categorias";
import type { ProspeccaoCategoria } from "@/types/prospeccao";

interface LeadFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Usuário atual — usado como responsável quando `allowAssignResponsavel` é falso. */
  currentUserId: string;
  /** Admin pode atribuir o lead a qualquer representante; representante sempre cria para si. */
  allowAssignResponsavel?: boolean;
}

const CAMPOS_INICIAIS = {
  nome: "",
  categoria: "" as ProspeccaoCategoria | "",
  telefone: "",
  email: "",
  cidade: "",
  estado: "",
  cnpj: "",
  responsavelId: "",
};

export function LeadFormDialog({ open, onOpenChange, currentUserId, allowAssignResponsavel }: LeadFormDialogProps) {
  const [form, setForm] = useState(CAMPOS_INICIAIS);
  const criarLead = useCreateProspeccaoLead();
  const { data: representantes } = useRepresentantes();

  const handleSubmit = async () => {
    if (!form.nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    if (!form.categoria) {
      toast.error("Categoria é obrigatória");
      return;
    }
    if (!form.telefone.trim() && !form.email.trim()) {
      toast.error("Informe telefone ou email");
      return;
    }

    await criarLead.mutateAsync({
      responsavel_id: allowAssignResponsavel && form.responsavelId ? form.responsavelId : currentUserId,
      nome: form.nome.trim(),
      categoria: form.categoria,
      telefone: form.telefone.trim() || undefined,
      email: form.email.trim() || undefined,
      cidade: form.cidade.trim() || undefined,
      estado: form.estado.trim() || undefined,
      cnpj: form.cnpj.trim() || undefined,
      origem: "manual",
    });
    setForm(CAMPOS_INICIAIS);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Lead</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Nome da empresa *</Label>
            <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Razão social ou nome fantasia" />
          </div>

          <div>
            <Label>Categoria *</Label>
            <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v as ProspeccaoCategoria })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o gatilho de compliance" />
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Telefone</Label>
              <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="(11) 99999-9999" />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="contato@empresa.com" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Cidade</Label>
              <Input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} />
            </div>
            <div>
              <Label>Estado</Label>
              <Input value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })} placeholder="UF" maxLength={2} />
            </div>
          </div>

          <div>
            <Label>CNPJ</Label>
            <Input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} />
          </div>

          {allowAssignResponsavel && (
            <div>
              <Label>Responsável</Label>
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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={criarLead.isPending}>
            {criarLead.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Criar Lead
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
