import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Shield, ArrowLeft, CheckCircle2, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { enviarDenunciaAnonima } from "@/hooks/useDenuncias";

const Denuncia = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [ticketId, setTicketId] = useState("");
  const [ticketSecret, setTicketSecret] = useState("");

  const [formData, setFormData] = useState({
    category: "",
    description: "",
    date: "",
    involved: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await enviarDenunciaAnonima({
      categoria: formData.category,
      descricao: formData.description,
      data_ocorrido: formData.date || undefined,
      envolvidos: formData.involved || undefined,
    });

    if (result.success && result.ticket_id && result.ticket_secret) {
      setTicketId(result.ticket_id);
      setTicketSecret(result.ticket_secret);
      setIsSubmitted(true);
      toast.success("Denúncia registrada de forma anônima");
    } else {
      toast.error(result.error || "Erro ao enviar denúncia");
    }

    setIsLoading(false);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center animate-in fade-in duration-500">
          <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-3">
            Denúncia registrada
          </h1>
          <p className="text-muted-foreground mb-8">
            Sua denúncia foi enviada de forma totalmente anônima. Não é possível
            identificar quem enviou esta comunicação.
          </p>

          <div className="bg-card border border-border rounded-xl p-6 mb-8">
            <p className="text-sm text-muted-foreground mb-2">
              Código de acompanhamento
            </p>
            <p className="text-2xl font-mono font-bold text-foreground">
              {ticketId}
            </p>
            <p className="text-sm text-muted-foreground mb-2 mt-6">
              Código secreto de consulta
            </p>
            <p className="text-xl font-mono font-bold text-foreground break-all">
              {ticketSecret}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Guarde os dois códigos. Eles são necessários para consultar o status sem expor sua identidade.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsSubmitted(false);
                setFormData({ category: "", description: "", date: "", involved: "" });
                setTicketId("");
                setTicketSecret("");
              }}
            >
              Fazer nova denúncia
            </Button>
            <Link to="/">
              <Button variant="ghost" className="w-full">
                Voltar ao site
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
        </div>

        <div className="max-w-2xl mx-auto" data-tour="canal-denuncias">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 mb-4">
              <Shield className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-3">
              Canal de Denúncias
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Reporte irregularidades, condutas antiéticas ou violações de forma
              completamente anônima e segura.
            </p>
          </div>

          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-8 flex items-start gap-3">
            <Lock className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground text-sm mb-1">
                Garantia de anonimato
              </p>
              <p className="text-sm text-muted-foreground">
                Este formulário não coleta endereço IP, cookies ou qualquer
                informação que possa identificá-lo. Suas informações são
                transmitidas de forma criptografada.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6 lg:p-8 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="category">Categoria da denúncia *</Label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Selecione uma categoria</option>
                  <option value="corrupcao">Corrupção</option>
                  <option value="fraude">Fraude</option>
                  <option value="assedio">Assédio</option>
                  <option value="discriminacao">Discriminação</option>
                  <option value="conflito_interesses">Conflito de interesses</option>
                  <option value="seguranca_trabalho">Segurança do trabalho</option>
                  <option value="meio_ambiente">Meio ambiente</option>
                  <option value="outros">Outros</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição detalhada *</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Descreva a situação com o máximo de detalhes possível. Inclua datas, locais e circunstâncias relevantes."
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Data aproximada do ocorrido</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="involved">
                  Pessoas ou áreas envolvidas (opcional)
                </Label>
                <Input
                  id="involved"
                  name="involved"
                  type="text"
                  placeholder="Nomes, cargos ou departamentos"
                  value={formData.involved}
                  onChange={handleInputChange}
                  className="h-11"
                />
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando denúncia...
                </>
              ) : (
                "Enviar denúncia anônima"
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Ao enviar, você concorda que as informações fornecidas são
              verdadeiras ao melhor do seu conhecimento.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Denuncia;
