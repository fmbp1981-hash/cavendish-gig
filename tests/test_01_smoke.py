#!/usr/bin/env python3
"""Fase 1 — Smoke Tests: verificação básica de saúde do Sistema GIG."""

import requests
import sys
import time

BASE_URL = "http://localhost:3001"
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

# Rotas públicas (Next.js SSR ou SPA catch-all)
PUBLIC_ROUTES = [
    "/",
    "/auth",
    "/denuncia",
    "/consulta-protocolo",
]

# Rotas SPA protegidas (catch-all → 200 com HTML da SPA, auth feita no client)
SPA_ROUTES = [
    "/admin",
    "/admin/usuarios",
    "/admin/consultores",
    "/admin/organizacoes",
    "/admin/catalogo",
    "/admin/templates",
    "/admin/relatorios/historico",
    "/admin/configuracoes",
    "/admin/integracoes",
    "/admin/branding",
    "/admin/logs",
    "/consultor",
    "/consultor/clientes",
    "/consultor/documentos",
    "/consultor/denuncias",
    "/consultor/tarefas",
    "/consultor/codigo-etica",
    "/consultor/atas",
    "/consultor/agendamento",
    "/consultor/adesao-etica",
    "/consultor/relatorios",
    "/consultor/configuracoes",
    "/meu-projeto",
    "/meu-projeto/diagnostico",
    "/meu-projeto/documentos-necessarios",
    "/meu-projeto/treinamentos",
    "/meu-projeto/codigo-etica",
    "/meu-projeto/documentos",
    "/meu-projeto/configuracoes",
    "/onboarding",
    "/help",
    "/dashboard",
]

# Rota 404
NOT_FOUND_ROUTES = [
    "/rota-que-nao-existe-12345",
    "/admin/pagina-fantasma",
]

print("\n🔥 FASE 1 — SMOKE TESTS")
print("=" * 60)

print("\n  [1.1] Rotas públicas (espera 200 ou 307):")
for route in PUBLIC_ROUTES:
    url = f"{BASE_URL}{route}"
    try:
        r = requests.get(url, timeout=TIMEOUT, allow_redirects=True)
        test(
            f"GET {route} → {r.status_code}",
            r.status_code < 500,
            f"Retornou {r.status_code}"
        )
        # Verificar que há conteúdo HTML
        if r.headers.get("content-type", "").startswith("text/html"):
            test(
                f"  {route} retorna HTML",
                len(r.text) > 100,
                "Resposta HTML vazia ou muito pequena"
            )
    except requests.exceptions.RequestException as e:
        test(f"GET {route}", False, str(e))

print("\n  [1.2] Rotas SPA autenticadas (espera 200 com HTML da SPA):")
for route in SPA_ROUTES:
    url = f"{BASE_URL}{route}"
    try:
        r = requests.get(url, timeout=TIMEOUT, allow_redirects=True)
        test(
            f"GET {route} → {r.status_code}",
            r.status_code < 500,
            f"Retornou {r.status_code}"
        )
    except requests.exceptions.RequestException as e:
        test(f"GET {route}", False, str(e))

print("\n  [1.3] Rota 404 para caminho inexistente:")
for route in NOT_FOUND_ROUTES:
    url = f"{BASE_URL}{route}"
    try:
        r = requests.get(url, timeout=TIMEOUT, allow_redirects=True)
        # Next.js SPA serve 200 (catch-all) ou 404
        test(
            f"GET {route} não é 500",
            r.status_code != 500,
            f"Retornou 500 (crash) para rota inexistente"
        )
    except requests.exceptions.RequestException as e:
        test(f"GET {route}", False, str(e))

print("\n  [1.4] Assets estáticos (Next.js):")
try:
    r = requests.get(f"{BASE_URL}/_next/static/", timeout=TIMEOUT)
    test("/_next/ responde (sem crash)", r.status_code < 500, f"Status {r.status_code}")
except Exception as e:
    test("Assets estáticos acessíveis", False, str(e))

print("\n  [1.5] Supabase Edge Functions públicas:")
SUPABASE_URL = "https://fenfgjqlsqzvxloeavdc.supabase.co"
try:
    r = requests.get(f"{SUPABASE_URL}/functions/v1/denuncias", timeout=TIMEOUT)
    test(
        f"Edge Function 'denuncias' (pública) acessível → {r.status_code}",
        r.status_code in [200, 400, 405],  # 400/405 é ok — sem payload
        f"Retornou {r.status_code}"
    )
except Exception as e:
    test("Edge Function 'denuncias' (pública) acessível", False, str(e))

# Edge Functions com JWT (sem token → espera 401)
for fn in ["ai-generate", "send-email", "google-drive", "integrations"]:
    try:
        r = requests.post(
            f"{SUPABASE_URL}/functions/v1/{fn}",
            headers={"Content-Type": "application/json"},
            json={},
            timeout=TIMEOUT
        )
        test(
            f"Edge Function '{fn}' (sem JWT) → {r.status_code}",
            r.status_code in [401, 403],
            f"Retornou {r.status_code} (esperado 401/403 sem token)"
        )
    except Exception as e:
        test(f"Edge Function '{fn}' acessível", False, str(e))

print(f"\n📊 SMOKE TEST: {results['passed']} passed, {results['failed']} failed")
print(f"  Taxa de sucesso: {results['passed']/(results['passed']+results['failed'])*100:.1f}%")

if results["errors"]:
    print("\n  ❌ Falhas:")
    for e in results["errors"]:
        print(f"    → {e['test']}: {e['detail']}")

# Exportar resultado para outros scripts
import json
with open("/tmp/smoke_results.json", "w") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)
