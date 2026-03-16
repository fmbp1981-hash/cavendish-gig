#!/usr/bin/env python3
"""Fase 1 — Smoke Tests: verificação básica de saúde do Sistema GIG (2026-03-13)."""

import requests
import sys
import time
import json

BASE_URL = "http://localhost:3000"
TIMEOUT = 120
results = {"passed": 0, "failed": 0, "errors": []}

def test(name, condition, detail=""):
    if condition:
        results["passed"] += 1
        print(f"  ✅ {name}")
    else:
        results["failed"] += 1
        results["errors"].append({"test": name, "detail": detail})
        print(f"  ❌ {name} — {detail}")

# ─── ROTAS PÚBLICAS ───
PUBLIC_ROUTES = [
    "/",
    "/auth",
    "/denuncia",
    "/consulta-protocolo",
]

# ─── ROTAS SPA (catch-all → 200 com HTML, auth client-side) ───
SPA_ROUTES = [
    # Admin
    "/admin",
    "/admin/usuarios",
    "/admin/organizacoes",
    "/admin/catalogo",
    "/admin/templates",
    "/admin/relatorios/historico",
    "/admin/configuracoes",
    "/admin/integracoes",
    "/admin/branding",
    "/admin/logs",
    "/admin/documentos",
    "/admin/audit-trail",
    # Consultor
    "/consultor",
    "/consultor/clientes",
    "/consultor/documentos",
    "/consultor/denuncias",
    "/consultor/tarefas",
    "/consultor/codigo-etica",
    "/consultor/atas",
    "/consultor/agenda",
    "/consultor/agendamento",
    "/consultor/adesao-etica",
    "/consultor/relatorios",
    "/consultor/compliance",
    "/consultor/compliance-calendar",
    "/consultor/esg",
    "/consultor/board",
    "/consultor/configuracoes",
    # Parceiro
    "/parceiro",
    "/parceiro/compliance",
    "/parceiro/adesao-etica",
    "/parceiro/compliance-calendar",
    "/parceiro/esg",
    "/parceiro/codigo-etica",
    "/parceiro/configuracoes",
    # Cliente
    "/meu-projeto",
    "/meu-projeto/diagnostico",
    "/meu-projeto/documentos-necessarios",
    "/meu-projeto/treinamentos",
    "/meu-projeto/codigo-etica",
    "/meu-projeto/documentos",
    "/meu-projeto/politicas",
    "/meu-projeto/conflitos",
    "/meu-projeto/configuracoes",
    # Geral autenticadas
    "/onboarding",
    "/help",
    "/dashboard",
]

NOT_FOUND_ROUTES = [
    "/rota-que-nao-existe-12345",
    "/admin/pagina-fantasma",
    "/consultor/xyz-inexistente",
]

print("\n🔥 FASE 1 — SMOKE TESTS (2026-03-13)")
print("=" * 60)

# ─── 1.1 ROTAS PÚBLICAS ───
print("\n  [1.1] Rotas públicas (espera 200 ou 30x):")
for route in PUBLIC_ROUTES:
    url = f"{BASE_URL}{route}"
    try:
        r = requests.get(url, timeout=TIMEOUT, allow_redirects=True)
        test(
            f"GET {route} → {r.status_code}",
            r.status_code < 500,
            f"Retornou {r.status_code}"
        )
        if r.headers.get("content-type", "").startswith("text/html"):
            test(
                f"  {route} retorna HTML válido",
                len(r.text) > 100,
                "Resposta HTML vazia ou muito pequena"
            )
    except requests.exceptions.RequestException as e:
        test(f"GET {route}", False, str(e))

# ─── 1.2 ROTAS SPA ───
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

# ─── 1.3 ROTAS 404 ───
print("\n  [1.3] Rota inexistente não causa 500:")
for route in NOT_FOUND_ROUTES:
    url = f"{BASE_URL}{route}"
    try:
        r = requests.get(url, timeout=TIMEOUT, allow_redirects=True)
        test(
            f"GET {route} não é 500 → {r.status_code}",
            r.status_code != 500,
            f"Retornou 500 (crash) para rota inexistente"
        )
    except requests.exceptions.RequestException as e:
        test(f"GET {route}", False, str(e))

# ─── 1.4 ASSETS ESTÁTICOS ───
print("\n  [1.4] Assets estáticos (Next.js):")
try:
    r = requests.get(f"{BASE_URL}/robots.txt", timeout=TIMEOUT)
    test(f"robots.txt acessível → {r.status_code}", r.status_code == 200, f"Status {r.status_code}")
except Exception as e:
    test("robots.txt acessível", False, str(e))

try:
    r = requests.get(f"{BASE_URL}/_next/static/", timeout=TIMEOUT)
    test("/_next/static/ responde (sem crash)", r.status_code < 500, f"Status {r.status_code}")
except Exception as e:
    test("Assets _next acessíveis", False, str(e))

# ─── 1.5 SUPABASE EDGE FUNCTIONS ───
print("\n  [1.5] Supabase Edge Functions:")
SUPABASE_URL = "https://fenfgjqlsqzvxloeavdc.supabase.co"

# Funções públicas
for fn in ["denuncias"]:
    try:
        r = requests.get(f"{SUPABASE_URL}/functions/v1/{fn}", timeout=TIMEOUT)
        test(
            f"Edge Function '{fn}' (pública) → {r.status_code}",
            r.status_code in [200, 400, 405],
            f"Retornou {r.status_code}"
        )
    except Exception as e:
        test(f"Edge Function '{fn}' acessível", False, str(e))

# Funções protegidas (sem JWT → espera 401/403)
for fn in ["ai-generate", "send-email", "google-drive", "google-calendar", "integrations", "clickup-sync", "trello-sync"]:
    try:
        r = requests.post(
            f"{SUPABASE_URL}/functions/v1/{fn}",
            headers={"Content-Type": "application/json"},
            json={},
            timeout=TIMEOUT
        )
        test(
            f"Edge Function '{fn}' (sem JWT) → {r.status_code}",
            r.status_code in [401, 403, 500],
            f"Retornou {r.status_code} (esperado 401/403)"
        )
    except Exception as e:
        test(f"Edge Function '{fn}' responde", False, str(e))

# ─── 1.6 TEMPO DE RESPOSTA BÁSICO ───
print("\n  [1.6] Tempo de resposta básico:")
critical_routes = ["/", "/auth", "/consultor", "/admin"]
for route in critical_routes:
    url = f"{BASE_URL}{route}"
    try:
        start = time.time()
        r = requests.get(url, timeout=TIMEOUT, allow_redirects=True)
        elapsed = time.time() - start
        test(
            f"GET {route} em {elapsed:.2f}s",
            elapsed < 15.0,
            f"Muito lento: {elapsed:.2f}s"
        )
    except Exception as e:
        test(f"GET {route} tempo", False, str(e))

# ─── RESUMO ───
print(f"\n{'='*60}")
print(f"📊 SMOKE TEST: {results['passed']} passed, {results['failed']} failed")
total = results['passed'] + results['failed']
if total > 0:
    print(f"  Taxa de sucesso: {results['passed']/total*100:.1f}%")

if results["errors"]:
    print(f"\n  ❌ Falhas ({len(results['errors'])}):")
    for e in results["errors"]:
        print(f"    → {e['test']}: {e['detail']}")

# Exportar resultado
with open("tests/smoke_results.json", "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

sys.exit(1 if results["failed"] > 0 else 0)
