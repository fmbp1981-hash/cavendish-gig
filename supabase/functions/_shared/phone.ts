/** Remove tudo que não é dígito e garante o DDI 55 (Brasil) para números plausíveis de
 * celular/fixo. Usado por qualquer Edge Function do módulo Finder que precise comparar/normalizar
 * telefones (busca, WhatsApp). */
export function normalizePhone(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 10) return null;
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}
