import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Building2, FileText, CheckCircle2, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { useCreateClientDriveFolder, useUploadToDrive } from "@/hooks/useGoogleDrive";
import { useAIGenerate } from "@/hooks/useAIGenerate";
import { generatePDFFromHTML } from "@/utils/pdfExport";

type TipoProjeto = "gig_completo" | "gig_modular" | "consultoria_pontual";

interface OnboardingData {
  nomeOrganizacao: string;
  cnpj: string;
  tipoProjeto: TipoProjeto;
}

const tiposProjetoInfo: Record<TipoProjeto, { titulo: string; descricao: string }> = {
  gig_completo: {
    titulo: "GIG Completo",
    descricao: "Programa completo de Governança, Integridade e Gestão com todas as fases."
  },
  gig_modular: {
    titulo: "GIG Modular",
    descricao: "Módulos específicos de governança escolhidos conforme necessidade."
  },
  consultoria_pontual: {
    titulo: "Consultoria Pontual",
    descricao: "Consultoria focada em demandas específicas de compliance e governança."
  }
};

export default function Onboarding() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    nomeOrganizacao: "",
    cnpj: "",
    tipoProjeto: "gig_completo"
  });

  const createDriveFolder = useCreateClientDriveFolder();
  const uploadToDrive = useUploadToDrive();
  const { generate: generateAI } = useAIGenerate();

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .slice(0, 18);
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Você precisa estar logado para continuar.");
      return;
    }

    setLoading(true);
    try {
      const { data: result, error } = await (supabase as any).rpc("create_client_onboarding", {
        p_nome_organizacao: data.nomeOrganizacao,
        p_cnpj: data.cnpj.replace(/\D/g, ""),
        p_tipo_projeto: data.tipoProjeto,
        p_user_id: user.id
      });

      if (error) throw error;

      const onboardingResult = result as unknown as { organizacao_id?: string | null } | null;

      // Create Google Drive folder structure if enabled
      if (onboardingResult?.organizacao_id) {
        try {
          await createDriveFolder.mutateAsync({
            clientName: data.nomeOrganizacao,
            organizacaoId: onboardingResult.organizacao_id,
          });
          toast.success("Pasta do cliente criada no Google Drive!");

          // Generate contract using AI
          try {
            toast.info("Gerando contrato oficial CCE...");

            // Map project type to GIG plan names
            const planoMap: Record<TipoProjeto, { nome: string; valor: string; valorDiag: string }> = {
              gig_completo: { nome: "GIG Premium", valor: "a partir de R$ 15.000", valorDiag: "R$ 12.900,00" },
              gig_modular: { nome: "GIG Executivo", valor: "a partir de R$ 8.500", valorDiag: "R$ 8.900,00" },
              consultoria_pontual: { nome: "GIG Essencial", valor: "a partir de R$ 4.500", valorDiag: "R$ 4.900,00" },
            };

            const planoInfo = planoMap[data.tipoProjeto];

            const contractResult = await generateAI({
              tipo: "gerar_contrato",
              input_data: {
                nome_cliente: data.nomeOrganizacao,
                cnpj: data.cnpj,
                tipo_projeto: tiposProjetoInfo[data.tipoProjeto].titulo,
                plano: planoInfo.nome,
                valor_mensal: planoInfo.valor,
                valor_diagnostico: planoInfo.valorDiag,
                prazo: data.tipoProjeto === "consultoria_pontual" ? "3 meses" : "12 meses",
                porte: data.tipoProjeto === "gig_completo" ? "Grande empresa" : data.tipoProjeto === "gig_modular" ? "Média empresa" : "Pequena empresa",
              },
              organizacao_id: onboardingResult.organizacao_id,
            });

            if (contractResult.success && contractResult.output) {
              // Convert markdown to HTML for PDF
              const htmlContent = `
                <html>
                  <head>
                    <style>
                      body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
                      h1 { color: #0B66C3; border-bottom: 2px solid #E3A200; padding-bottom: 10px; }
                      h2 { color: #2F3E46; margin-top: 30px; }
                      p { margin: 10px 0; }
                    </style>
                  </head>
                  <body>
                    ${contractResult.output.replace(/\n/g, '<br>')}
                  </body>
                </html>
              `;

              // Generate PDF
              const pdfBlob = await generatePDFFromHTML(htmlContent, { filename: `Proposta_${data.nomeOrganizacao}.pdf` });

              // Upload to Drive
              if (pdfBlob) {
                const pdfFile = new File([pdfBlob], `Proposta_${data.nomeOrganizacao}.pdf`, { type: 'application/pdf' });
                await uploadToDrive.mutateAsync({
                  organizacaoId: onboardingResult.organizacao_id,
                  file: pdfFile,
                  targetFolder: "02 - Contratos",
                });
                toast.success("Proposta comercial gerada e salva no Drive!");
              }
            }
          } catch (contractError) {
            console.error("Erro ao gerar contrato:", contractError);
            // Don't block onboarding if contract generation fails
          }
        } catch (driveError) {
          console.error("Erro ao criar pasta no Drive:", driveError);
          // Don't block onboarding if Drive fails
        }
      }

      toast.success("Organização criada com sucesso! Bem-vindo ao Cavendish GIG.");
      window.location.assign("/meu-projeto");
    } catch (error: unknown) {
      console.error("Erro no onboarding:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao criar organização");
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return data.nomeOrganizacao.length >= 3;
    if (step === 2) return data.tipoProjeto;
    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${s < step
                    ? "bg-primary text-primary-foreground"
                    : s === step
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                      : "bg-muted text-muted-foreground"
                    }`}
                >
                  {s < step ? <CheckCircle2 className="h-5 w-5" /> : s}
                </div>
              ))}
            </div>
          </div>
          <CardTitle className="text-2xl">
            {step === 1 && "Dados da Organização"}
            {step === 2 && "Tipo de Projeto"}
            {step === 3 && "Confirmação"}
          </CardTitle>
          <CardDescription>
            {step === 1 && "Informe os dados básicos da sua empresa"}
            {step === 2 && "Escolha o tipo de projeto que melhor atende suas necessidades"}
            {step === 3 && "Revise as informações antes de confirmar"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da Organização *</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="nome"
                    placeholder="Nome da sua empresa"
                    value={data.nomeOrganizacao}
                    onChange={(e) => setData({ ...data, nomeOrganizacao: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ (opcional)</Label>
                <Input
                  id="cnpj"
                  placeholder="00.000.000/0000-00"
                  value={data.cnpj}
                  onChange={(e) => setData({ ...data, cnpj: formatCNPJ(e.target.value) })}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <RadioGroup
              value={data.tipoProjeto}
              onValueChange={(value) => setData({ ...data, tipoProjeto: value as TipoProjeto })}
              className="space-y-3"
            >
              {(Object.entries(tiposProjetoInfo) as [TipoProjeto, { titulo: string; descricao: string }][]).map(([tipo, info]) => (
                <div key={tipo} className="flex items-start space-x-3">
                  <RadioGroupItem value={tipo} id={tipo} className="mt-1" />
                  <Label htmlFor={tipo} className="flex-1 cursor-pointer">
                    <div className="font-medium">{info.titulo}</div>
                    <div className="text-sm text-muted-foreground">{info.descricao}</div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-primary" />
                  <div>
                    <div className="text-sm text-muted-foreground">Organização</div>
                    <div className="font-medium">{data.nomeOrganizacao}</div>
                  </div>
                </div>
                {data.cnpj && (
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <div>
                      <div className="text-sm text-muted-foreground">CNPJ</div>
                      <div className="font-medium">{data.cnpj}</div>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <div>
                    <div className="text-sm text-muted-foreground">Tipo de Projeto</div>
                    <div className="font-medium">{tiposProjetoInfo[data.tipoProjeto].titulo}</div>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Ao confirmar, sua organização será criada e você terá acesso ao painel do cliente
                com todos os documentos necessários para o seu projeto.
              </p>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              disabled={step === 1}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>

            {step < 3 ? (
              <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
                Próximo
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Confirmar
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
