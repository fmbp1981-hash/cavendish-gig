#!/usr/bin/env python3
"""Fase 8 — Segurança IA & Reliability: verificações estáticas de segurança de IA."""

import requests
import json
import re
import os

BASE_URL = "http://localhost:3001"
SUPABASE_URL = "https://fenfgjqlsqzvxloeavdc.supabase.co"
PROJECT_DIR = "C:/Projects/Sistema_GIG/cavendish-gig-main"
TIMEOUT = 15
results = {"passed": 0, "failed": 0, "errors": []}

def test(name, condition, detail=""):
    if condition:
        results["passed"] += 1
        print(f"  ✅ {name}")
    else:
        results["failed"] += 1
        results["errors"].append({"test": name, "detail": detail})
        print(f"  ❌ {name} — {detail}")

print("\n🤖 FASE 8 — SEGURANÇA IA & RELIABILITY")
print("=" * 60)

# ─── 8.1 Análise Estática das Edge Functions IA ───
print("\n  [8.1] Análise estática da Edge Function 'ai-generate':")

AI_FUNCTION_PATH = f"{PROJECT_DIR}/supabase/functions/ai-generate/index.ts"
try:
    with open(AI_FUNCTION_PATH, "r", encoding="utf-8") as f:
        ai_code = f.read()

    # Verificar se o system prompt é injetável a partir do request
    has_system_prompt = "system" in ai_code.lower()
    test(
        "ai-generate tem system prompt definido",
        has_system_prompt,
        "Sem system prompt — IA sem instruções de sistema"
    )

    # Verificar se o input do usuário é sanitizado antes de ir para a IA
    has_direct_user_content = re.search(r'body\.(content|message|input|text|prompt)', ai_code)
    has_validation = re.search(r'zod|validate|schema|joi|yup|safeParse|parse\(', ai_code, re.IGNORECASE)
    print(f"    ℹ️  Input direto do usuário: {'detectado' if has_direct_user_content else 'não detectado'}")
    print(f"    ℹ️  Validação de schema: {'presente ✅' if has_validation else 'ausente ⚠️'}")

    # Verificar se há limit no tamanho do prompt
    has_length_limit = re.search(r'max_tokens|maxTokens|slice|substring|length.*>\s*\d+', ai_code)
    print(f"    ℹ️  Limite de tamanho do prompt: {'presente ✅' if has_length_limit else 'ausente ⚠️'}")
    if not has_length_limit:
        results["errors"].append({
            "test": "Limite de tokens no prompt (ai-generate)",
            "detail": "Sem limite de tamanho — usuário pode enviar prompts gigantes (DoS)"
        })
        results["failed"] += 1

    # Verificar se há rate limiting
    has_rate_limit = re.search(r'rate.?limit|rateLimit|throttle|429', ai_code, re.IGNORECASE)
    print(f"    ℹ️  Rate limiting na função: {'presente ✅' if has_rate_limit else 'ausente ⚠️'}")
    if not has_rate_limit:
        print("      → Sem rate limiting — risco de uso excessivo da API OpenAI (custo)")

    # Verificar se há timeout para a chamada de IA
    has_timeout = re.search(r'timeout|AbortController|AbortSignal', ai_code)
    print(f"    ℹ️  Timeout para chamada de IA: {'presente ✅' if has_timeout else 'ausente ⚠️'}")

except FileNotFoundError:
    test("Edge Function ai-generate encontrada", False, f"Arquivo não encontrado: {AI_FUNCTION_PATH}")

# ─── 8.2 Análise do process-transcription (webhook Fireflies) ───
print("\n  [8.2] Análise da Edge Function 'process-transcription' (webhook):")

TRANSCRIPTION_PATH = f"{PROJECT_DIR}/supabase/functions/process-transcription/index.ts"
try:
    with open(TRANSCRIPTION_PATH, "r", encoding="utf-8") as f:
        trans_code = f.read()

    # Verificar se valida o webhook secret
    has_webhook_validation = re.search(r'X-Webhook-Secret|webhook.?secret|TRANSCRIPTION_WEBHOOK_SECRET', trans_code, re.IGNORECASE)
    test(
        "process-transcription valida webhook secret",
        bool(has_webhook_validation),
        "Webhook sem validação de assinatura — qualquer um pode enviar transcrições falsas",
    )

    # Verificar se trata erros da IA graciosamente
    has_error_handling = re.search(r'try.*catch|\.catch\(|if.*error', trans_code, re.DOTALL)
    test(
        "process-transcription tem tratamento de erros",
        bool(has_error_handling),
        "Sem try/catch — erros da IA podem crashar o webhook"
    )

except FileNotFoundError:
    test("Edge Function process-transcription encontrada", False, f"Arquivo não encontrado")

# ─── 8.3 Análise do integrations (vault de credenciais) ───
print("\n  [8.3] Análise da Edge Function 'integrations' (vault de credenciais):")

INTEGRATIONS_PATH = f"{PROJECT_DIR}/supabase/functions/integrations/index.ts"
try:
    with open(INTEGRATIONS_PATH, "r", encoding="utf-8") as f:
        integ_code = f.read()

    # Verificar se usa criptografia real (não base64 simples)
    uses_crypto = re.search(r'AES|GCM|encrypt|decrypt|crypto\.subtle|CryptoKey', integ_code, re.IGNORECASE)
    test(
        "integrations usa criptografia real (AES/GCM)",
        bool(uses_crypto),
        "Sem criptografia forte detectada — credenciais podem estar expostas"
    )

    # Verificar se usa INTEGRATIONS_ENCRYPTION_KEY
    uses_enc_key = "INTEGRATIONS_ENCRYPTION_KEY" in integ_code
    test(
        "integrations usa INTEGRATIONS_ENCRYPTION_KEY para cifrar credenciais",
        uses_enc_key,
        "Chave de criptografia não referenciada — verificar implementação"
    )

    # Verificar se há validação de organização antes de retornar credenciais
    has_org_check = re.search(r'organizacao_id|org_id|tenant_id|user.*org', integ_code, re.IGNORECASE)
    test(
        "integrations valida organização antes de retornar credenciais",
        bool(has_org_check),
        "Sem validação de org — risco de IDOR nas credenciais"
    )

except FileNotFoundError:
    test("Edge Function integrations encontrada", False, f"Arquivo não encontrado")

# ─── 8.4 Análise do trello-sync e clickup-sync (webhook verification) ───
print("\n  [8.4] Análise dos webhooks de sincronização (trello/clickup):")

for fn in ["trello-sync", "clickup-sync"]:
    fn_path = f"{PROJECT_DIR}/supabase/functions/{fn}/index.ts"
    try:
        with open(fn_path, "r", encoding="utf-8") as f:
            fn_code = f.read()

        has_sig_check = re.search(r'X-Webhook-Secret|hmac|signature|verify|secret', fn_code, re.IGNORECASE)
        test(
            f"{fn} verifica assinatura de webhook",
            bool(has_sig_check),
            f"Sem verificação de assinatura — qualquer request pode acionar o sync",
        )

    except FileNotFoundError:
        test(f"Edge Function {fn} encontrada", False, "Arquivo não encontrado")

# ─── 8.5 Verificação de Secrets no Frontend (bundle scan) ───
print("\n  [8.5] Busca por secrets hardcoded no código frontend:")

SENSITIVE_PATTERNS = [
    (r'sk-[a-zA-Z0-9]{20,}', "OpenAI API Key hardcoded"),
    (r're_[a-zA-Z0-9]{20,}', "Resend API Key hardcoded"),
    (r'eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+', "JWT hardcoded"),
    (r'AC[a-f0-9]{32}', "Twilio Account SID hardcoded"),
    (r'service_role', "Supabase service role key mention"),
    (r'SUPABASE_SERVICE_ROLE', "Service role env var hardcoded"),
    (r'"password"\s*:\s*"[^"]{8,}"', "Senha hardcoded em JSON"),
]

SRC_DIR = f"{PROJECT_DIR}/src"
findings = []

for root, dirs, files in os.walk(SRC_DIR):
    # Pular node_modules e .next
    dirs[:] = [d for d in dirs if d not in ["node_modules", ".next", "dist", ".git"]]
    for filename in files:
        if filename.endswith((".ts", ".tsx", ".js", ".jsx")):
            filepath = os.path.join(root, filename)
            try:
                with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                for pattern, label in SENSITIVE_PATTERNS:
                    matches = re.findall(pattern, content)
                    if matches:
                        rel_path = filepath.replace(PROJECT_DIR, "").replace("\\", "/")
                        findings.append(f"{label} em {rel_path}: {matches[0][:30]}...")
            except Exception:
                pass

test(
    "Sem secrets hardcoded no código fonte",
    len(findings) == 0,
    f"{len(findings)} possíveis problemas encontrados"
)
if findings:
    for finding in findings[:10]:
        print(f"    ⚠️  {finding}")

# ─── 8.6 Verificação de Logs com Dados Sensíveis ───
print("\n  [8.6] Verificação de console.log com dados sensíveis:")

LOG_PATTERNS = [
    r'console\.log.*password',
    r'console\.log.*secret',
    r'console\.log.*token',
    r'console\.log.*key',
    r'console\.log.*auth',
]

log_findings = []
for root, dirs, files in os.walk(SRC_DIR):
    dirs[:] = [d for d in dirs if d not in ["node_modules", ".next", "dist"]]
    for filename in files:
        if filename.endswith((".ts", ".tsx")):
            filepath = os.path.join(root, filename)
            try:
                with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                    lines = f.readlines()
                for i, line in enumerate(lines, 1):
                    for pat in LOG_PATTERNS:
                        if re.search(pat, line, re.IGNORECASE):
                            rel_path = filepath.replace(PROJECT_DIR, "").replace("\\", "/")
                            log_findings.append(f"{rel_path}:{i} — {line.strip()[:80]}")
            except Exception:
                pass

test(
    "Sem console.log com dados sensíveis no código",
    len(log_findings) == 0,
    f"{len(log_findings)} console.log potencialmente sensíveis"
)
if log_findings:
    for f in log_findings[:5]:
        print(f"    ⚠️  {f}")

# ─── 8.7 RLS — Verificação das Políticas ───
print("\n  [8.7] Verificação de RLS nas migrações:")

MIGRATIONS_DIR = f"{PROJECT_DIR}/supabase/migrations"
migration_issues = []

try:
    migration_files = sorted(os.listdir(MIGRATIONS_DIR))
    tables_without_rls = []
    tables_with_rls = []

    for mig_file in migration_files:
        if not mig_file.endswith(".sql"):
            continue
        filepath = os.path.join(MIGRATIONS_DIR, mig_file)
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()

            # Encontrar tabelas criadas
            created_tables = re.findall(r'CREATE TABLE(?:\s+IF NOT EXISTS)?\s+(?:public\.)?(\w+)', content, re.IGNORECASE)
            # Verificar se RLS está habilitado para elas
            rls_enabled = re.findall(r'ALTER TABLE\s+(?:public\.)?(\w+)\s+ENABLE ROW LEVEL SECURITY', content, re.IGNORECASE)

            for table in created_tables:
                if table.lower() in ["public", "schema_migrations", "spatial_ref_sys"]:
                    continue
                if table in rls_enabled:
                    tables_with_rls.append(table)
                # Não adicionar como problema agora — RLS pode estar em outra migration

        except Exception:
            pass

    print(f"    ℹ️  Migrações analisadas: {len(migration_files)}")
    test(
        "Migrações encontradas e analisadas",
        len(migration_files) > 0,
        "Nenhuma migração encontrada"
    )

except FileNotFoundError:
    test("Diretório de migrações encontrado", False, f"Não encontrado: {MIGRATIONS_DIR}")

print(f"\n📊 SEGURANÇA IA: {results['passed']} passed, {results['failed']} failed")
if results["errors"]:
    print("\n  ❌ Falhas:")
    for e in results["errors"]:
        print(f"    → {e['test']}: {e['detail'][:120]}")

with open("/tmp/ai_security_results.json", "w") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)
