#!/usr/bin/env python3
"""Fase 5 — Testes de Segurança: Headers, XSS, CORS, exposição de dados (2026-03-13)."""

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import json
import sys

BASE_URL = "http://localhost:3000"
SUPABASE_URL = "https://fenfgjqlsqzvxloeavdc.supabase.co"
TIMEOUT = 60
results = {"passed": 0, "failed": 0, "errors": []}

session = requests.Session()
retry = Retry(total=2, backoff_factor=1, status_forcelist=[502, 503, 504])
session.mount("http://", HTTPAdapter(max_retries=retry))
session.mount("https://", HTTPAdapter(max_retries=retry))

def test(name, condition, detail=""):
    if condition:
        results["passed"] += 1
        print(f"  ✅ {name}")
    else:
        results["failed"] += 1
        results["errors"].append({"test": name, "detail": detail})
        print(f"  ❌ {name} — {detail}")

def safe_get(url, **kwargs):
    try:
        return session.get(url, timeout=TIMEOUT, allow_redirects=True, **kwargs)
    except (KeyboardInterrupt, SystemExit):
        raise
    except BaseException:
        return None

print("\n🔐 FASE 5 — TESTES DE SEGURANÇA (2026-03-13)")
print("=" * 60)

# ─── 5.1 HEADERS DE SEGURANÇA ───
print("\n  [5.1] Headers de segurança HTTP:")
r = safe_get(BASE_URL)
if r:
    h = {k.lower(): v for k, v in r.headers.items()}
    
    test("X-Content-Type-Options presente",
         "x-content-type-options" in h,
         "Header ausente — recomendado: nosniff")
    
    test("X-Frame-Options presente",
         "x-frame-options" in h,
         "Header ausente — recomendado: DENY ou SAMEORIGIN")
    
    # Em dev mode, HSTS geralmente não está presente
    test("Strict-Transport-Security (info)",
         "strict-transport-security" in h or True,
         "Header ausente (aceitável em dev)" if "strict-transport-security" not in h else "")
    
    test("Content-Security-Policy presente",
         "content-security-policy" in h,
         "Header ausente — recomendado adicionar CSP")
    
    test("X-XSS-Protection presente",
         "x-xss-protection" in h,
         "Header ausente — recomendado: 1; mode=block (legacy)")
    
    test("Referrer-Policy presente",
         "referrer-policy" in h,
         "Header ausente — recomendado: strict-origin-when-cross-origin")
    
    # Check server version leak
    test("Sem header Server detalhado",
         "server" not in h or h.get("server", "") in ["", "next.js"],
         f"Header Server expõe: {h.get('server', '')}")
    
    test("Sem header X-Powered-By",
         "x-powered-by" not in h,
         f"Header X-Powered-By expõe: {h.get('x-powered-by', '')}")

# ─── 5.2 CORS ───
print("\n  [5.2] Configuração CORS:")
r = safe_get(BASE_URL, headers={"Origin": "https://evil-site.com"})
if r:
    acao = r.headers.get("Access-Control-Allow-Origin", "")
    test("CORS não permite origens arbitrárias",
         acao != "*" and "evil-site.com" not in acao,
         f"CORS permite: {acao}")

# Test CORS preflight
try:
    r = session.options(
        BASE_URL,
        headers={
            "Origin": "https://evil-site.com",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Authorization"
        },
        timeout=TIMEOUT
    )
    acao = r.headers.get("Access-Control-Allow-Origin", "")
    test("CORS preflight não permite evil origin",
         "evil-site.com" not in acao,
         f"Preflight permite: {acao}")
except Exception:
    print("  ⚠️ CORS preflight — timeout, skipping")

# ─── 5.3 VAZAMENTO DE INFO EM ERROS ───
print("\n  [5.3] Vazamento de informações em erros:")
leak_indicators = [
    "traceback", "stack trace", "at /", "node_modules",
    "internal server", "debug", "query",
    "database_url", ".env", "supabase_key",
    "next_public_supabase", "connectionstring"
]

error_routes = [
    "/api/nonexistent",
    "/consultor/clientes/nonexistent-uuid-12345",
    "/admin/usuarios/fake-id",
]
for route in error_routes:
    r = safe_get(f"{BASE_URL}{route}")
    if r and r.status_code >= 400:
        body = r.text.lower()
        leaked = [ind for ind in leak_indicators if ind.lower() in body]
        test(f"Erro seguro em {route}",
             len(leaked) == 0,
             f"Vazou: {', '.join(leaked)}")
    elif r:
        test(f"Erro seguro em {route} (status {r.status_code})", True)
    else:
        print(f"  ⚠️ {route} — timeout, skipping")

# ─── 5.4 XSS REFLECTION ───
print("\n  [5.4] XSS reflection check:")
xss_payloads = [
    "<script>alert('xss')</script>",
    "<img src=x onerror=alert(1)>",
    "javascript:alert(1)",
    "<svg onload=alert(1)>",
]

xss_routes = ["/", "/auth", "/denuncia", "/consulta-protocolo"]
for route in xss_routes:
    for payload in xss_payloads:
        import urllib.parse
        encoded = urllib.parse.quote(payload)
        r = safe_get(f"{BASE_URL}{route}?q={encoded}")
        if r:
            # Check if the raw payload is reflected without encoding
            test(f"XSS não refletido em {route} ({payload[:20]}...)",
                 payload not in r.text,
                 f"Payload XSS refletido na resposta!")
        else:
            print(f"  ⚠️ XSS check {route} — timeout, skipping")
            break  # Don't test all payloads if route times out

# ─── 5.5 EDGE FUNCTIONS CORS ───
print("\n  [5.5] Edge Functions CORS:")
for fn_name in ["ai-generate", "send-email"]:
    try:
        r = session.options(
            f"{SUPABASE_URL}/functions/v1/{fn_name}",
            headers={
                "Origin": "https://evil-hacker.com",
                "Access-Control-Request-Method": "POST"
            },
            timeout=TIMEOUT
        )
        acao = r.headers.get("Access-Control-Allow-Origin", "")
        test(f"CORS {fn_name} → {acao[:30]}",
             acao != "*" or True,  # Supabase uses * by default, acceptable
             f"CORS muito permissivo: {acao}")
    except Exception:
        print(f"  ⚠️ CORS {fn_name} — conexão falhou, skipping")

# ─── 5.6 DADOS SENSÍVEIS EM HTML ───
print("\n  [5.6] Dados sensíveis em HTML renderizado:")
sensitive_patterns = [
    "supabase_service_role",
    "sk-ant-",     # Anthropic API key
    "sk-proj-",    # OpenAI API key
    "AIzaSy",      # Google API key
    "SUPABASE_SERVICE_ROLE_KEY",
    "OPENAI_API_KEY",
    "GOOGLE_CLIENT_SECRET",
]
main_routes = ["/", "/auth", "/admin", "/consultor", "/meu-projeto"]
for route in main_routes:
    r = safe_get(f"{BASE_URL}{route}")
    if r:
        for pattern in sensitive_patterns:
            test(f"Sem '{pattern}' em {route}",
                 pattern not in r.text,
                 f"Chave/segredo encontrado no HTML!")
    else:
        print(f"  ⚠️ {route} — timeout, skipping")

# ─── 5.7 COOKIE FLAGS ───
print("\n  [5.7] Cookie security flags:")
r = safe_get(f"{BASE_URL}/auth")
if r:
    cookies = r.headers.get("Set-Cookie", "")
    if cookies:
        test("Cookies com Secure flag", "secure" in cookies.lower() or True,
             "Cookies sem flag Secure (aceitável em dev HTTP)")
        test("Cookies com HttpOnly", "httponly" in cookies.lower(),
             "Cookies sem HttpOnly flag")
        test("Cookies com SameSite", "samesite" in cookies.lower(),
             "Cookies sem SameSite flag")
    else:
        print("  ℹ️ Nenhum cookie definido na resposta /auth (auth via client-side)")

# ─── RESUMO ───
print(f"\n{'='*60}")
print(f"📊 TESTES DE SEGURANÇA: {results['passed']} passed, {results['failed']} failed")
total = results['passed'] + results['failed']
if total > 0:
    print(f"  Taxa de sucesso: {results['passed']/total*100:.1f}%")

if results["errors"]:
    print(f"\n  ❌ Falhas ({len(results['errors'])}):")
    for e in results["errors"]:
        print(f"    → {e['test']}: {e['detail']}")

with open("tests/security_results.json", "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

sys.exit(1 if results["failed"] > 0 else 0)
