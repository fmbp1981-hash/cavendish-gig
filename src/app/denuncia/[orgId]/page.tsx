"use client";

import { useState, useEffect, use } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shield, CheckCircle2, Loader2, AlertCircle, Lock } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const CATEGORIAS: { value: string; label: string }[] = [
  { value: "corrupcao",           label: "Corrupção" },
  { value: "fraude",              label: "Fraude" },
  { value: "assedio",             label: "Assédio" },
  { value: "discriminacao",       label: "Discriminação" },
  { value: "conflito_interesses", label: "Conflito de Interesses" },
  { value: "seguranca_trabalho",  label: "Segurança do Trabalho" },
  { value: "meio_ambiente",       label: "Meio Ambiente" },
  { value: "outros",              label: "Outros" },
];

interface Org {
  id: string;
  nome: string;
}

export default function DenunciaPublicaPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = use(params);
  const [org, setOrg] = useState<Org | null>(null);
  const [orgNotFound, setOrgNotFound] = useState(false);
  const [categoria, setCategoria] = useState("");
  const [descricao, setDescricao] = useState("");
  const [anonima, setAnonima] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrg = async () => {
      const { data } = await supabase
        .from("organizacoes")
        .select("id, nome")
        .eq("id", orgId)
        .maybeSingle();

      if (data) {
        setOrg(data as Org);
      } else {
        setOrgNotFound(true);
      }
    };
    fetchOrg();
  }, [orgId]);

  const handleSubmit = async () => {
    if (!categoria || !descricao.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/denuncias`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({
            action: "registrar",
            organizacao_id: orgId,
            categoria,
            descricao: descricao.trim(),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Erro ao enviar denúncia");
      }

      setTicketId(result.ticket_id ?? result.denuncia?.ticket_id ?? null);
      setSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (orgNotFound) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center space-y-3">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
            <h2 className="text-lg font-semibold">Organização não encontrada</h2>
            <p className="text-sm text-muted-foreground">
              O link de denúncia informado não corresponde a nenhuma organização cadastrada.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Denúncia enviada com sucesso!</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Sua denúncia foi registrada e será analisada pela equipe de compliance.
              </p>
            </div>
            {ticketId && (
              <div className="rounded-lg bg-slate-100 px-4 py-3">
                <p className="text-xs text-muted-foreground mb-1">Número do protocolo</p>
                <p className="font-mono font-bold text-lg tracking-wider">{ticketId}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Guarde este número para acompanhar o andamento da sua denúncia.
                </p>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Você pode consultar o status da denúncia em:{" "}
              <strong>
                {typeof window !== "undefined" ? window.location.origin : ""}/consulta-protocolo
              </strong>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Sistema GIG</p>
            <p className="text-sm font-semibold leading-tight">{org.nome}</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Canal de Denúncias</h1>
          <p className="text-muted-foreground mt-1">
            Este canal é seguro e confidencial. Utilize-o para reportar situações que violem as
            políticas, código de ética ou legislação aplicável a <strong>{org.nome}</strong>.
          </p>
        </div>

        {/* Aviso de anonimato */}
        <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <Lock className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Seus dados são protegidos</p>
            <p className="text-blue-700 mt-0.5">
              Não registramos seu endereço IP, dispositivo ou qualquer informação que possa
              identificá-lo. A denúncia anônima é totalmente segura.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Registrar Denúncia</CardTitle>
            <CardDescription>
              Todos os campos marcados com * são obrigatórios.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label>Categoria *</Label>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria da denúncia" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Descrição *</Label>
              <Textarea
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                placeholder="Descreva em detalhes o que ocorreu: quando, onde, quem estava envolvido e o que foi feito. Quanto mais detalhes, mais efetiva será a investigação."
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">
                {descricao.length} caracteres
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Denúncia Anônima</p>
                <p className="text-xs text-muted-foreground">
                  Quando ativa, nenhum dado identificador é coletado
                </p>
              </div>
              <Switch checked={anonima} onCheckedChange={setAnonima} />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <Button
              className="w-full"
              size="lg"
              onClick={handleSubmit}
              disabled={loading || !categoria || !descricao.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Enviando...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Enviar Denúncia
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Sistema GIG · Governança, Integridade e Gestão Estratégica · Desenvolvido por IntelliX.AI
        </p>
      </main>
    </div>
  );
}
