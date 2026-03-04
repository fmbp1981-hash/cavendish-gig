#!/usr/bin/env python3
"""Fase 5 — Testes de Segurança: headers, XSS, CORS, info leak, exposição de dados."""

import requests
import json

BASE_URL = "http://localhost:3001"
SUPABASE_URL = "https://fenfgjqlsqzvxloeavdc.supabase.co"
TIMEOUT = 15
results = {"passed": 0, "failed": 0, "errors": []}

def test(name, condition, detail="", suggestion=""):
    if condition:
        results["passed"] += 1
        print(f"  ✅ {name}")
    else:
        results["failed"] += 1
        results["errors"].append({"test": name, "detail": detail, "suggestion": suggestion})
        print(f"  ❌ {name} — {detail}")
        if suggestion:
            print(f"     💡 Sugestão: {suggestion}")

print("\n🔐 FASE 5 — TESTES DE SEGURANÇA")
print("=" * 60)

# ─── 5.1 Headers de Segurança HTTP ───
print("\n  [5.1] Headers de segurança HTTP:")

try:
    r = requests.get(BASE_URL, timeout=TIMEOUT)
    headers = {k.lower(): v for k, v in r.headers.items()}

    test(
        "X-Content-Type-Options: nosniff",
        headers.get("x-content-type-options", "").lower() == "nosniff",
        f"Valor: '{headers.get('x-content-type-options', 'AUSENTE')}'",
        "Adicionar X-Content-Type-Options: nosniff no vercel.json"
    )
    test(
        "X-Frame-Options: DENY",
        headers.get("x-frame-options", "").upper() in ["DENY", "SAMEORIGIN"],
        f"Valor: '{headers.get('x-frame-options', 'AUSENTE')}'",
        "Adicionar X-Frame-Options: DENY no vercel.json"
    )
    test(
        "X-XSS-Protection",
        "x-xss-protection" in headers,
        "Header ausente",
        "Adicionar X-XSS-Protection: 1; mode=block"
    )
    test(
        "Referrer-Policy",
        "referrer-policy" in headers,
        "Header ausente",
        "Adicionar Referrer-Policy: strict-origin-when-cross-origin"
    )
    test(
        "Permissions-Policy",
        "permissions-policy" in headers,
        "Header ausente",
        "Adicionar Permissions-Policy: camera=(), microphone=(), geolocation=()"
    )
    # HSTS apenas em produção HTTPS; em localhost não aplicável
    has_hsts = "strict-transport-security" in headers
    print(f"    ℹ️  Strict-Transport-Security: {'presente' if has_hsts else 'ausente (OK em localhost, obrigatório em produção HTTPS)'}")

    # Content-Security-Policy (desejável)
    has_csp = "content-security-policy" in headers
    print(f"    ℹ️  Content-Security-Policy: {'presente ✅' if has_csp else 'ausente ⚠️ (recomendado para produção)'}")

except Exception as e:
    test("Verificação de headers HTTP", False, str(e))

# ─── 5.2 Configuração CORS ───
print("\n  [5.2] Configuração CORS:")

try:
    # Teste com origem maliciosa
    r = requests.get(BASE_URL, headers={"Origin": "https://evil-site.com"}, timeout=TIMEOUT)
    acao = r.headers.get("Access-Control-Allow-Origin", "não definido")
    test(
        "CORS não permite origens arbitrárias",
        acao != "*" and "evil-site.com" not in acao,
        f"Access-Control-Allow-Origin: {acao}",
        "Configurar CORS para apenas origens confiáveis"
    )
    print(f"    ℹ️  ACAO header: {acao}")
except Exception as e:
    test("CORS", False, str(e))

# Supabase CORS
try:
    r = requests.options(
        f"{SUPABASE_URL}/functions/v1/denuncias",
        headers={"Origin": "https://evil.com", "Access-Control-Request-Method": "POST"},
        timeout=TIMEOUT
    )
    acao = r.headers.get("Access-Control-Allow-Origin", "não definido")
    # Supabase gerencia isso — mas verificar
    print(f"    ℹ️  Supabase Edge Function CORS: {acao}")
except Exception as e:
    print(f"    ℹ️  CORS Supabase: {str(e)[:80]}")

# ─── 5.3 XSS Refletido nas Rotas ───
print("\n  [5.3] XSS refletido em parâmetros de URL:")

XSS_PAYLOADS = [
    "<script>alert('xss')</script>",
    "<img src=x onerror=alert(1)>",
    "javascript:alert(document.cookie)",
    '"><script>alert(1)</script>',
    "';alert(String.fromCharCode(88,83,83))//",
]

for payload in XSS_PAYLOADS:
    for route in ["/auth", "/"]:
        try:
            r = requests.get(f"{BASE_URL}{route}", params={"q": payload, "redirect": payload}, timeout=TIMEOUT)
            body = r.text
            # Verificar se payload é refletido sem escape
            raw_reflected = payload in body
            if raw_reflected:
                # Confirmar que não está escaped
                escaped = payload.replace("<", "&lt;").replace(">", "&gt;")
                actually_escaped = escaped in body and payload not in body
                test(
                    f"XSS não refletido raw em {route} [{payload[:25]}]",
                    not raw_reflected or actually_escaped,
                    f"Payload XSS refletido sem escape na resposta!"
                )
            else:
                test(f"XSS não refletido em {route} [{payload[:25]}]", True)
        except Exception as e:
            test(f"XSS test {route}", False, str(e))

# ─── 5.4 Exposição de Informações em Erros ───
print("\n  [5.4] Vazamento de informação em respostas de erro:")

LEAK_INDICATORS = [
    "stack trace", "traceback", "at Object.", "at Module.",
    "node_modules", "internal/", "NEXT_PUBLIC_", "DATABASE_URL",
    "fenfgjqlsqzvxloeavdc", ".env", "secret", "private_key",
    "supabase_service_role", "sk-", "password=", "token="
]

error_routes = [
    "/api/nao-existe",
    "/admin/pagina-que-nao-existe-xyz",
    "/auth?error=internal",
]

for route in error_routes:
    try:
        r = requests.get(f"{BASE_URL}{route}", timeout=TIMEOUT)
        body = r.text.lower()
        leaked = [ind for ind in LEAK_INDICATORS if ind.lower() in body]
        test(
            f"Sem info leak em {route} → {r.status_code}",
            len(leaked) == 0,
            f"Dados sensíveis na resposta: {leaked[:3]}",
            "Remover detalhes técnicos de mensagens de erro expostas ao cliente"
        )
    except Exception as e:
        test(f"Info leak em {route}", False, str(e))

# ─── 5.5 Supabase — Exposição do Service Role Key ───
print("\n  [5.5] Exposição de chaves sensíveis no frontend:")

try:
    # Buscar no HTML da home por chaves que não deveriam ser públicas
    r = requests.get(BASE_URL, timeout=TIMEOUT)
    body = r.text
    sensitive = {
        "Service Role Key": "service_role" in body.lower(),
        "SUPABASE_SERVICE_ROLE_KEY": "supabase_service_role_key" in body.lower(),
        "OpenAI Key (sk-)": any(f"sk-{c}" in body for c in "abcdefghijklmnopqrstuvwxyz"),
        "Resend Key (re_)": "re_" in body and len([i for i in range(len(body)) if body[i:i+3] == "re_"]) > 5,
    }
    for label, found in sensitive.items():
        test(
            f"'{label}' não exposto no HTML da home",
            not found,
            f"Possível chave '{label}' encontrada no HTML público!",
            "Verificar se a chave está sendo incluída no bundle do frontend"
        )
except Exception as e:
    test("Exposição de chaves sensíveis", False, str(e))

# ─── 5.6 Open Redirect ───
print("\n  [5.6] Open Redirect:")

REDIRECT_PAYLOADS = [
    "https://evil.com",
    "//evil.com",
    "https://evil.com%2F@localhost",
    "javascript:alert(1)",
]

for payload in REDIRECT_PAYLOADS:
    try:
        r = requests.get(
            f"{BASE_URL}/auth",
            params={"redirect": payload, "next": payload, "returnUrl": payload},
            timeout=TIMEOUT,
            allow_redirects=False
        )
        if r.status_code in [301, 302, 307, 308]:
            location = r.headers.get("Location", "")
            test(
                f"Sem open redirect para {payload[:40]}",
                "evil.com" not in location and "javascript:" not in location,
                f"Redirect para: {location}",
                "Validar URLs de redirect — permitir apenas caminhos relativos"
            )
        else:
            test(f"Sem open redirect para {payload[:40]}", True)
    except Exception as e:
        test(f"Open redirect {payload[:30]}", False, str(e))

# ─── 5.7 Clickjacking ───
print("\n  [5.7] Proteção contra Clickjacking:")

try:
    r = requests.get(BASE_URL, timeout=TIMEOUT)
    xfo = r.headers.get("X-Frame-Options", "").upper()
    csp = r.headers.get("Content-Security-Policy", "")
    has_frame_protection = xfo in ["DENY", "SAMEORIGIN"] or "frame-ancestors" in csp
    test(
        "Proteção contra Clickjacking (X-Frame-Options ou CSP frame-ancestors)",
        has_frame_protection,
        f"X-Frame-Options: '{xfo}' | CSP frame-ancestors: {'presente' if 'frame-ancestors' in csp else 'ausente'}",
        "Adicionar X-Frame-Options: DENY ou CSP frame-ancestors 'none'"
    )
except Exception as e:
    test("Clickjacking", False, str(e))

print(f"\n📊 SEGURANÇA: {results['passed']} passed, {results['failed']} failed")
if results["errors"]:
    print("\n  ❌ Falhas:")
    for e in results["errors"]:
        print(f"    → {e['test']}: {e['detail'][:120]}")
        if e.get("suggestion"):
            print(f"       💡 {e['suggestion'][:100]}")

with open("/tmp/security_results.json", "w") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)
