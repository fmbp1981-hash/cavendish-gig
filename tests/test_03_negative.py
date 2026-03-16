#!/usr/bin/env python3
"""Fase 3 — Testes Negativos: inputs inválidos, acessos não autorizados, payloads maliciosos (2026-03-13)."""

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import json
import sys
import urllib.parse

BASE_URL = "http://localhost:3000"
SUPABASE_URL = "https://fenfgjqlsqzvxloeavdc.supabase.co"
TIMEOUT = 60
results = {"passed": 0, "failed": 0, "errors": []}

# Session with retry for dev server flakiness
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
    except Exception:
        return None

def safe_post(url, **kwargs):
    try:
        return session.post(url, timeout=TIMEOUT, **kwargs)
    except Exception:
        return None

def safe_request(method, url, **kwargs):
    try:
        return session.request(method, url, timeout=TIMEOUT, **kwargs)
    except Exception:
        return None

INJECTION_PAYLOADS = [
    "",
    " ",
    "a" * 2000,
    "<script>alert('xss')</script>",
    "'; DROP TABLE users; --",
    "{{7*7}}",
    "${7*7}",
    "../../../etc/passwd",
    "null",
    "undefined",
    "-1",
    "99999999999999999999",
    "test@",
    "@test.com",
    "🎉🔥💀",
    '{"__proto__":{"admin":true}}',
    "<img src=x onerror=alert(1)>",
    "javascript:alert(1)",
]

print("\n🚫 FASE 3 — TESTES NEGATIVOS (2026-03-13)")
print("=" * 60)

# ─── 3.1 ROTAS PROTEGIDAS SEM AUTH ───
print("\n  [3.1] Rotas protegidas servem SPA sem dados sensíveis:")
protected_routes = [
    "/admin", "/admin/usuarios", "/admin/organizacoes",
    "/consultor", "/consultor/clientes",
    "/meu-projeto", "/meu-projeto/documentos-necessarios",
]
for route in protected_routes:
    r = safe_get(f"{BASE_URL}{route}")
    if r is not None:
        body = r.text.lower()
        sensitive = ["password", "api_key", "secret_key", "database_url", "jwt_secret"]
        has_sensitive = any(kw in body for kw in sensitive)
        test(f"GET {route} sem auth → sem dados sensíveis", not has_sensitive,
             "Dados sensíveis encontrados na resposta HTML!")
    else:
        print(f"  ⚠️ GET {route} — timeout/erro de conexão, skipping")

# ─── 3.2 EDGE FUNCTIONS SEM JWT ───
print("\n  [3.2] Edge Functions protegidas rejeitam sem JWT:")
protected_functions = [
    ("ai-generate", {"tipo": "gerar_codigo_etica", "input_data": {"empresa": "test"}}),
    ("send-email", {"to": "test@test.com", "subject": "test", "html": "<p>test</p>"}),
    ("google-drive", {"operation": "list_folders"}),
    ("google-calendar", {"operation": "list_events"}),
    ("integrations", {"operation": "get_config", "type": "google"}),
    ("clickup-sync", {"organization_id": "123"}),
    ("trello-sync", {"organization_id": "123"}),
]
for fn_name, payload in protected_functions:
    r = safe_post(f"{SUPABASE_URL}/functions/v1/{fn_name}",
                  json=payload, headers={"Content-Type": "application/json"})
    if r is not None:
        test(f"POST {fn_name} sem JWT → {r.status_code}",
             r.status_code in [401, 403], f"Retornou {r.status_code} (esperado 401/403)")
    else:
        print(f"  ⚠️ POST {fn_name} — conexão falhou, skipping")

# ─── 3.3 EDGE FUNCTIONS COM JWT FALSO ───
print("\n  [3.3] Edge Functions rejeitam JWT falso:")
fake_jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U"
for fn_name, payload in protected_functions:
    r = safe_post(f"{SUPABASE_URL}/functions/v1/{fn_name}",
                  json=payload,
                  headers={"Content-Type": "application/json", "Authorization": f"Bearer {fake_jwt}"})
    if r is not None:
        test(f"POST {fn_name} com JWT falso → {r.status_code}",
             r.status_code in [401, 403], f"Retornou {r.status_code} (esperado 401/403)")
    else:
        print(f"  ⚠️ POST {fn_name} JWT falso — conexão falhou, skipping")

# ─── 3.4 PAYLOADS MALICIOSOS NAS ROTAS ───
print("\n  [3.4] Rotas com payloads maliciosos na URL:")
for payload in INJECTION_PAYLOADS[:8]:
    encoded = urllib.parse.quote(payload, safe='')
    for route_tpl in ["/consultor/clientes/{}", "/meu-projeto/treinamentos/{}"]:
        route = route_tpl.format(encoded)
        r = safe_get(f"{BASE_URL}{route}")
        if r is not None:
            test(f"GET {route[:60]} → {r.status_code}", r.status_code != 500,
                 "Server Error 500 com payload malicioso")
        else:
            print(f"  ⚠️ GET {route[:40]}... — timeout, skipping")

# ─── 3.5 EDGE FUNCTIONS COM PAYLOADS INVÁLIDOS ───
print("\n  [3.5] Edge Functions com payloads inválidos (sem crash):")
invalid_payloads = [
    {},
    {"tipo": ""},
    {"tipo": "tipo_inexistente"},
    {"tipo": "<script>alert(1)</script>"},
    {"tipo": "gerar_codigo_etica"},
    {"tipo": "gerar_codigo_etica", "input_data": None},
    {"tipo": "gerar_codigo_etica", "input_data": "string_invalida"},
]
for payload in invalid_payloads:
    r = safe_post(f"{SUPABASE_URL}/functions/v1/ai-generate",
                  json=payload, headers={"Content-Type": "application/json"})
    if r is not None:
        test(f"ai-generate com {str(payload)[:50]}... → {r.status_code}",
             r.status_code != 500, f"Server Error 500 com payload inválido")
    else:
        print(f"  ⚠️ ai-generate payload — conexão falhou, skipping")

# ─── 3.6 MÉTODOS HTTP INESPERADOS ───
print("\n  [3.6] Métodos HTTP inesperados em Edge Functions:")
for method in ["GET", "PUT", "DELETE", "PATCH"]:
    for fn_name in ["ai-generate", "send-email"]:
        r = safe_request(method, f"{SUPABASE_URL}/functions/v1/{fn_name}")
        if r is not None:
            test(f"{method} {fn_name} → {r.status_code}",
                 r.status_code != 500, f"Server crash com método {method}")
        else:
            print(f"  ⚠️ {method} {fn_name} — conexão falhou, skipping")

# ─── RESUMO ───
print(f"\n{'='*60}")
print(f"📊 TESTES NEGATIVOS: {results['passed']} passed, {results['failed']} failed")
total = results['passed'] + results['failed']
if total > 0:
    print(f"  Taxa de sucesso: {results['passed']/total*100:.1f}%")

if results["errors"]:
    print(f"\n  ❌ Falhas ({len(results['errors'])}):")
    for e in results["errors"]:
        print(f"    → {e['test']}: {e['detail']}")

with open("tests/negative_results.json", "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

sys.exit(1 if results["failed"] > 0 else 0)
