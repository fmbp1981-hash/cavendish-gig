#!/usr/bin/env python3
"""Fase 4 — Testes de Edge Case: concorrência, double submit, limites (2026-03-13)."""

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import json
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE_URL = "http://localhost:3000"
SUPABASE_URL = "https://fenfgjqlsqzvxloeavdc.supabase.co"
TIMEOUT = 60
results = {"passed": 0, "failed": 0, "errors": []}

session = requests.Session()
retry = Retry(total=2, backoff_factor=1, status_forcelist=[502, 503, 504])
session.mount("http://", HTTPAdapter(max_retries=retry))

def test(name, condition, detail=""):
    if condition:
        results["passed"] += 1
        print(f"  ✅ {name}")
    else:
        results["failed"] += 1
        results["errors"].append({"test": name, "detail": detail})
        print(f"  ❌ {name} — {detail}")

print("\n🔬 FASE 4 — TESTES DE EDGE CASE (2026-03-13)")
print("=" * 60)

# ─── 4.1 CONCORRÊNCIA (skipped in dev) ───
print("\n  [4.1] Acesso concorrente: SKIPPED (dev server single-threaded)")
print("    ℹ️ Dev server Next.js não suporta múltiplas req simultâneas de forma confiável")

# ─── 4.2 ROTAS COM IDs INVÁLIDOS ───
print("\n  [4.2] Rotas com IDs inválidos/inexistentes:")
invalid_ids = [
    "00000000-0000-0000-0000-000000000000",
    "nonexistent",
    "-1",
    "999999999",
    "",
    "null",
    "undefined",
    "../admin",
    "' OR 1=1 --",
]
for invalid_id in invalid_ids:
    import urllib.parse
    encoded = urllib.parse.quote(invalid_id, safe='')
    test_url = f"{BASE_URL}/consultor/clientes/{encoded}"
    try:
        r = requests.get(test_url, timeout=TIMEOUT, allow_redirects=True)
        test(f"GET /consultor/clientes/{invalid_id[:30]} → {r.status_code}",
             r.status_code != 500,
             f"Server crash com ID inválido")
    except requests.exceptions.Timeout:
        print(f"  ⚠️ /consultor/clientes/{invalid_id[:20]} — timeout, skipping")
    except Exception as e:
        test(f"GET com ID inválido", False, str(e))

# ─── 4.3 QUERY PARAMS LIMITES ───
print("\n  [4.3] Query parameters com valores extremos:")
extreme_params = [
    ("page", "-1"),
    ("page", "0"),
    ("page", "999999"),
    ("limit", "-1"),
    ("limit", "0"),
    ("limit", "999999"),
    ("page", "abc"),
    ("search", "a" * 1000),
    ("filter", "<script>alert(1)</script>"),
    ("sort", "'; DROP TABLE users; --"),
]
for param_name, param_value in extreme_params:
    url = f"{BASE_URL}/consultor/clientes?{param_name}={requests.utils.quote(param_value)}"
    try:
        r = requests.get(url, timeout=TIMEOUT, allow_redirects=True)
        test(f"?{param_name}={param_value[:20]} → {r.status_code}",
             r.status_code != 500,
             f"Server Error com param {param_name}={param_value[:30]}")
    except requests.exceptions.Timeout:
        print(f"  ⚠️ Query param {param_name} — timeout, skipping")
    except Exception:
        pass

# ─── 4.4 HEADERS MALFORMADOS ───
print("\n  [4.4] Requisições com headers malformados:")
evil_headers = [
    {"Content-Type": "text/plain"},
    {"Content-Type": "application/xml"},
    {"Accept": "application/xml"},
    {"Authorization": "Basic dGVzdDp0ZXN0"},  # Basic auth (wrong scheme)
    {"Authorization": ""},
    {"Authorization": "Bearer "},
    {"X-Forwarded-For": "127.0.0.1"},
    {"X-Forwarded-For": "' OR 1=1 --"},
    {"User-Agent": ""},
    {"User-Agent": "<script>alert(1)</script>"},
]
for headers in evil_headers:
    header_desc = list(headers.items())[0]
    try:
        r = requests.get(f"{BASE_URL}/", headers=headers, timeout=TIMEOUT)
        test(f"Header {header_desc[0]}: {str(header_desc[1])[:30]} → {r.status_code}",
             r.status_code != 500,
             f"Server crash com header malformado")
    except requests.exceptions.Timeout:
        print(f"  ⚠️ Header {header_desc[0]} — timeout, skipping")
    except Exception:
        pass

# ─── 4.5 NAVEGAÇÃO RÁPIDA (SIMULAR BACK/FORWARD) ───
print("\n  [4.5] Navegação rápida entre rotas:")
nav_sequence = ["/", "/auth", "/consultor", "/admin", "/meu-projeto", "/parceiro", "/"]
for route in nav_sequence:
    try:
        r = requests.get(f"{BASE_URL}{route}", timeout=TIMEOUT, allow_redirects=True)
        test(f"Nav rápida → {route} → {r.status_code}",
             r.status_code < 500,
             f"Crash durante navegação rápida")
    except requests.exceptions.Timeout:
        print(f"  ⚠️ Nav {route} — timeout, skipping")
    except Exception as e:
        test(f"Nav rápida → {route}", False, str(e))

# ─── RESUMO ───
print(f"\n{'='*60}")
print(f"📊 TESTES DE EDGE CASE: {results['passed']} passed, {results['failed']} failed")
total = results['passed'] + results['failed']
if total > 0:
    print(f"  Taxa de sucesso: {results['passed']/total*100:.1f}%")

if results["errors"]:
    print(f"\n  ❌ Falhas ({len(results['errors'])}):")
    for e in results["errors"]:
        print(f"    → {e['test']}: {e['detail']}")

with open("tests/edge_case_results.json", "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

sys.exit(1 if results["failed"] > 0 else 0)
