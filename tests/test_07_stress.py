#!/usr/bin/env python3
"""Fase 7 — Testes de Stress e Performance: tempos de resposta, carga (2026-03-13)."""

import requests
import json
import sys
import time
import statistics

BASE_URL = "http://localhost:3000"
TIMEOUT = 60
results = {"passed": 0, "failed": 0, "errors": []}

def test(name, condition, detail=""):
    if condition:
        results["passed"] += 1
        print(f"  ✅ {name}")
    else:
        results["failed"] += 1
        results["errors"].append({"test": name, "detail": detail})
        print(f"  ❌ {name} — {detail}")

def measure_response_time(url, n=5):
    """Mede tempo de resposta médio de um endpoint (5 requisições)."""
    times = []
    for _ in range(n):
        try:
            start = time.time()
            r = requests.get(url, timeout=TIMEOUT, allow_redirects=True)
            elapsed = time.time() - start
            if r.status_code < 500:
                times.append(elapsed)
        except Exception:
            times.append(TIMEOUT)
    if not times:
        return {"mean": TIMEOUT, "median": TIMEOUT, "p95": TIMEOUT, "max": TIMEOUT, "min": TIMEOUT}
    return {
        "mean": statistics.mean(times),
        "median": statistics.median(times),
        "p95": sorted(times)[int(len(times) * 0.95)] if len(times) > 1 else times[0],
        "max": max(times),
        "min": min(times),
    }

print("\n🔥 FASE 7 — TESTES DE STRESS E PERFORMANCE (2026-03-13)")
print("=" * 60)

# ─── 7.1 TEMPOS DE RESPOSTA ───
print("\n  [7.1] Tempos de resposta (média de 5 req, threshold 10s para dev):")
perf_routes = [
    ("/", "Home"),
    ("/auth", "Auth page"),
    ("/admin", "Admin dashboard"),
    ("/consultor", "Consultor dashboard"),
    ("/consultor/clientes", "Lista clientes"),
    ("/consultor/codigo-etica", "Código de Ética"),
    ("/consultor/atas", "Atas"),
    ("/parceiro", "Parceiro dashboard"),
    ("/meu-projeto", "Meu Projeto"),
    ("/meu-projeto/documentos-necessarios", "Docs necessários"),
]

performance_data = []
for route, desc in perf_routes:
    url = f"{BASE_URL}{route}"
    stats = measure_response_time(url)
    passed = stats["mean"] < 10.0  # Threshold generoso para dev server
    test(f"{desc} ({route}) — média {stats['mean']:.2f}s (p95: {stats['p95']:.2f}s)",
         passed,
         f"Lento! Média: {stats['mean']:.2f}s, P95: {stats['p95']:.2f}s")
    performance_data.append({
        "route": route,
        "desc": desc,
        "mean": round(stats["mean"], 2),
        "median": round(stats["median"], 2),
        "p95": round(stats["p95"], 2),
        "max": round(stats["max"], 2),
        "min": round(stats["min"], 2),
    })

# ─── 7.2 TAMANHO DAS RESPOSTAS ───
print("\n  [7.2] Tamanho das respostas HTML:")
for route, desc in perf_routes:
    try:
        r = requests.get(f"{BASE_URL}{route}", timeout=TIMEOUT, allow_redirects=True)
        size_kb = len(r.content) / 1024
        test(f"{desc} ({route}) → {size_kb:.1f}KB",
             size_kb < 5000,  # Alert if >5MB
             f"Resposta muito grande: {size_kb:.1f}KB")
    except Exception:
        print(f"  ⚠️ {route} — timeout, skipping")

# ─── 7.3 TEMPO SEQUENCIAL (MÚLTIPLAS PÁGINAS) ───
print("\n  [7.3] Navegação sequencial (simular usuário):")
nav_routes = ["/", "/auth", "/consultor", "/consultor/clientes",
              "/consultor/codigo-etica", "/consultor/atas", "/admin"]
total_time = 0
for route in nav_routes:
    try:
        start = time.time()
        r = requests.get(f"{BASE_URL}{route}", timeout=TIMEOUT, allow_redirects=True)
        elapsed = time.time() - start
        total_time += elapsed
        status = "✅" if elapsed < 10 else "⚠️"
        print(f"    {status} {route} → {elapsed:.2f}s")
    except Exception:
        total_time += TIMEOUT
        print(f"    ⚠️ {route} → timeout")

test(f"Navegação total de {len(nav_routes)} páginas em {total_time:.1f}s",
     total_time < len(nav_routes) * 10,
     f"Navegação muito lenta: {total_time:.1f}s total")

# ─── RESUMO ───
print(f"\n{'='*60}")
print(f"📊 TESTES DE STRESS: {results['passed']} passed, {results['failed']} failed")
total = results['passed'] + results['failed']
if total > 0:
    print(f"  Taxa de sucesso: {results['passed']/total*100:.1f}%")

if results["errors"]:
    print(f"\n  ❌ Falhas ({len(results['errors'])}):")
    for e in results["errors"]:
        print(f"    → {e['test']}: {e['detail']}")

# Performance table
print("\n  📊 Tabela de Performance:")
print(f"  {'Rota':<40} {'Média':>8} {'P95':>8} {'Max':>8}")
print(f"  {'-'*64}")
for p in performance_data:
    print(f"  {p['route']:<40} {p['mean']:>7.2f}s {p['p95']:>7.2f}s {p['max']:>7.2f}s")

with open("tests/stress_results.json", "w", encoding="utf-8") as f:
    json.dump({"results": results, "performance": performance_data}, f, ensure_ascii=False, indent=2)

sys.exit(1 if results["failed"] > 0 else 0)
