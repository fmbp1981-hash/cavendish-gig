#!/usr/bin/env python3
"""Fase 7 — Stress e Performance: carga progressiva, tempos de resposta."""

import requests
import time
import statistics
import json
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE_URL = "http://localhost:3001"
SUPABASE_URL = "https://fenfgjqlsqzvxloeavdc.supabase.co"
TIMEOUT = 30
results = {"passed": 0, "failed": 0, "errors": []}

def test(name, condition, detail=""):
    if condition:
        results["passed"] += 1
        print(f"  ✅ {name}")
    else:
        results["failed"] += 1
        results["errors"].append({"test": name, "detail": detail})
        print(f"  ❌ {name} — {detail}")

def make_request(url, method="GET", payload=None, headers=None):
    start = time.time()
    try:
        h = headers or {}
        if method == "GET":
            r = requests.get(url, timeout=TIMEOUT, allow_redirects=True, headers=h)
        else:
            r = requests.post(url, json=payload, timeout=TIMEOUT, headers=h)
        return {"status": r.status_code, "time": time.time() - start, "size": len(r.content)}
    except Exception as e:
        return {"status": 0, "time": TIMEOUT, "size": 0, "error": str(e)[:80]}

print("\n🔥 FASE 7 — STRESS E PERFORMANCE")
print("=" * 60)

# ─── 7.1 Tempos de Resposta Baseline ───
print("\n  [7.1] Tempos de resposta baseline (10 amostras):")

ROUTES_TO_TEST = [
    ("/", "Home"),
    ("/auth", "Auth"),
    ("/denuncia", "Denúncia"),
    ("/consulta-protocolo", "Consulta Protocolo"),
]

THRESHOLDS = {"mean": 5.0, "p95": 8.0}  # Segundos — dev server é mais lento

perf_data = {}
for route, label in ROUTES_TO_TEST:
    url = f"{BASE_URL}{route}"
    times = []
    for _ in range(8):
        r = make_request(url)
        times.append(r["time"])

    mean = statistics.mean(times)
    median = statistics.median(times)
    p95 = sorted(times)[int(len(times) * 0.95)] if len(times) > 1 else times[0]
    min_t = min(times)
    max_t = max(times)

    perf_data[route] = {"mean": mean, "median": median, "p95": p95, "min": min_t, "max": max_t}

    is_ok = mean < THRESHOLDS["mean"] and p95 < THRESHOLDS["p95"]
    test(
        f"{label} ({route}) — média {mean:.2f}s | p95 {p95:.2f}s | max {max_t:.2f}s",
        is_ok,
        f"Lento! Média: {mean:.2f}s (limite: {THRESHOLDS['mean']}s), P95: {p95:.2f}s"
    )

# ─── 7.2 Stress Progressivo nas Rotas Públicas ───
print("\n  [7.2] Stress progressivo — Home (/):")
print(f"  {'Conc':<6} {'OK':<6} {'Erros':<7} {'Média':<10} {'P95':<10} {'Max':<10} {'Status'}")
print(f"  {'-'*55}")

stress_levels = [1, 5, 10, 20, 30]
stress_data = {}

for n in stress_levels:
    url = f"{BASE_URL}/"
    with ThreadPoolExecutor(max_workers=n) as executor:
        futures = [executor.submit(make_request, url) for _ in range(n)]
        resps = [f.result() for f in as_completed(futures)]

    errors = sum(1 for r in resps if r["status"] >= 500 or r["status"] == 0)
    ok = n - errors
    times_s = [r["time"] for r in resps]
    mean_t = statistics.mean(times_s)
    p95_t = sorted(times_s)[int(len(times_s) * 0.95)] if len(times_s) > 1 else times_s[0]
    max_t = max(times_s)
    status_emoji = "✅" if errors == 0 else "⚠️" if errors < n * 0.1 else "❌"

    print(f"  {n:<6} {ok:<6} {errors:<7} {mean_t:<10.2f} {p95_t:<10.2f} {max_t:<10.2f} {status_emoji}")
    stress_data[n] = {"ok": ok, "errors": errors, "mean": mean_t, "p95": p95_t}

    test(
        f"Stress {n} req simultâneas — < 5% erro",
        errors < max(1, n * 0.05),
        f"{errors}/{n} falharam"
    )

    if errors > n * 0.3:
        print(f"  🛑 Parando stress test — limite atingido em {n} concurrent")
        break

# ─── 7.3 Stress na Edge Function Pública (denuncias) ───
print("\n  [7.3] Stress na Edge Function pública 'denuncias':")
print(f"  {'Conc':<6} {'OK':<6} {'Erros':<7} {'Média':<10} {'P95':<10} {'Status'}")
print(f"  {'-'*45}")

for n in [1, 5, 10]:
    url = f"{SUPABASE_URL}/functions/v1/denuncias"
    payload = {"descricao": "Teste de carga", "tipo": "outro", "anonima": True}
    with ThreadPoolExecutor(max_workers=n) as executor:
        futures = [
            executor.submit(make_request, url, "POST", payload,
                          {"Content-Type": "application/json"})
            for _ in range(n)
        ]
        resps = [f.result() for f in as_completed(futures)]

    errors = sum(1 for r in resps if r["status"] >= 500 or r["status"] == 0)
    ok = n - errors
    times_s = [r["time"] for r in resps]
    mean_t = statistics.mean(times_s)
    p95_t = sorted(times_s)[int(len(times_s) * 0.95)] if len(times_s) > 1 else times_s[0]
    status_emoji = "✅" if errors == 0 else "⚠️" if errors < n * 0.2 else "❌"

    print(f"  {n:<6} {ok:<6} {errors:<7} {mean_t:<10.2f} {p95_t:<10.2f} {status_emoji}")

    test(
        f"Stress denuncias {n} req — < 20% erro",
        errors < max(1, n * 0.20),
        f"{errors}/{n} falharam"
    )

# ─── 7.4 Payload Size Limits ───
print("\n  [7.4] Limites de tamanho de payload:")

SIZES = [
    ("1KB", "x" * 1024),
    ("10KB", "x" * 10240),
    ("100KB", "x" * 102400),
    ("1MB", "x" * 1048576),
]

for label, data in SIZES:
    try:
        r = requests.post(
            f"{SUPABASE_URL}/functions/v1/denuncias",
            json={"descricao": data, "tipo": "outro", "anonima": True},
            headers={"Content-Type": "application/json"},
            timeout=TIMEOUT
        )
        if r.status_code == 413:
            print(f"    ℹ️  Limite de payload encontrado em {label}: 413 Request Entity Too Large")
            test(f"Payload {label} → 413 (limite correto)", True)
            break
        else:
            test(
                f"Payload {label} → {r.status_code} (sem crash)",
                r.status_code != 500,
                f"Crash do servidor com payload de {label}"
            )
    except requests.exceptions.RequestException as e:
        print(f"    ℹ️  Payload {label}: {str(e)[:80]}")
        break

# ─── 7.5 Tamanho do Bundle HTML ───
print("\n  [7.5] Análise de tamanho das respostas HTML:")

for route, label in ROUTES_TO_TEST:
    try:
        r = requests.get(f"{BASE_URL}{route}", timeout=TIMEOUT)
        size_kb = len(r.content) / 1024
        print(f"    {label}: {size_kb:.1f} KB {'✅' if size_kb < 500 else '⚠️ grande'}")
        test(
            f"{label} HTML < 500 KB",
            size_kb < 500,
            f"Resposta muito grande: {size_kb:.1f} KB"
        )
    except Exception as e:
        test(f"Tamanho {label}", False, str(e))

print(f"\n📊 STRESS/PERFORMANCE: {results['passed']} passed, {results['failed']} failed")
if results["errors"]:
    print("\n  ❌ Falhas:")
    for e in results["errors"]:
        print(f"    → {e['test']}: {e['detail'][:120]}")

with open("/tmp/stress_results.json", "w") as f:
    json.dump({"results": results, "perf_data": perf_data, "stress_data": {str(k): v for k, v in stress_data.items()}}, f, ensure_ascii=False, indent=2)
