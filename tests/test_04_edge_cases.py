#!/usr/bin/env python3
"""Fase 4 — Edge Cases: limites, concorrência, estados extremos."""

import requests
import json
import time
import statistics
import asyncio
from concurrent.futures import ThreadPoolExecutor, as_completed
from playwright.async_api import async_playwright

BASE_URL = "http://localhost:3001"
SUPABASE_URL = "https://fenfgjqlsqzvxloeavdc.supabase.co"
TIMEOUT = 20
results = {"passed": 0, "failed": 0, "errors": []}

def test(name, condition, detail=""):
    if condition:
        results["passed"] += 1
        print(f"  ✅ {name}")
    else:
        results["failed"] += 1
        results["errors"].append({"test": name, "detail": detail})
        print(f"  ❌ {name} — {detail}")

print("\n🔬 FASE 4 — EDGE CASES")
print("=" * 60)

# ─── 4.1 Concorrência nas Rotas Públicas ───
print("\n  [4.1] Concorrência — múltiplas requisições simultâneas:")

def make_request(url):
    start = time.time()
    try:
        r = requests.get(url, timeout=TIMEOUT, allow_redirects=True)
        return {"status": r.status_code, "time": time.time() - start}
    except Exception as e:
        return {"status": 0, "time": TIMEOUT, "error": str(e)}

for route, n in [("/", 20), ("/auth", 10), ("/denuncia", 10)]:
    url = f"{BASE_URL}{route}"
    with ThreadPoolExecutor(max_workers=n) as executor:
        futures = [executor.submit(make_request, url) for _ in range(n)]
        resps = [f.result() for f in as_completed(futures)]

    errors_500 = sum(1 for r in resps if r["status"] >= 500 or r["status"] == 0)
    times = [r["time"] for r in resps]
    avg = statistics.mean(times)
    p95 = sorted(times)[int(len(times) * 0.95)] if len(times) > 1 else times[0]
    test(
        f"Concorrência {n}x em {route} | avg={avg:.2f}s p95={p95:.2f}s",
        errors_500 == 0,
        f"{errors_500}/{n} retornaram erro"
    )

# ─── 4.2 Navegação Rápida Entre Rotas ───
print("\n  [4.2] Navegação rápida entre rotas (memory leaks / race conditions):")

async def test_rapid_navigation():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))

        routes = ["/", "/auth", "/denuncia", "/consulta-protocolo"]
        for _ in range(3):  # 3 voltas
            for route in routes:
                try:
                    await page.goto(f"{BASE_URL}{route}", wait_until="domcontentloaded", timeout=15000)
                    await page.wait_for_timeout(300)
                except Exception as e:
                    errors.append(f"{route}: {str(e)[:80]}")

        test(
            "Navegação rápida entre rotas sem erros JS",
            len(errors) == 0,
            f"{len(errors)} erros durante navegação rápida: {errors[:2]}"
        )

        await browser.close()

asyncio.run(test_rapid_navigation())

# ─── 4.3 Strings Extremas em Campos ───
print("\n  [4.3] Strings extremas em campos de formulário (Playwright):")

EXTREME_STRINGS = [
    ("vazio", ""),
    ("só espaços", "   "),
    ("muito longa", "a" * 1000),
    ("unicode extremo", "𝕿𝖊𝖘𝖙𝖊 𝖀𝖓𝖎𝖈𝖔𝖉𝖊"),
    ("RTL", "\u202e" + "Texto invertido"),
    ("zero-width", "\u200b\u200c\u200d"),
    ("null byte", "texto\x00nulo"),
    ("newlines", "linha1\nlinha2\rlinha3"),
    ("tabs", "col1\tcol2\tcol3"),
    ("HTML entities", "&lt;script&gt;alert(1)&lt;/script&gt;"),
    ("SQL UNION", "' UNION SELECT 1,2,3 --"),
    ("emoji", "🎉🔥💀👾🤖"),
    ("número grande", "9" * 100),
    ("float", "3.14159265358979323846264338327950288"),
    ("negativo", "-999999999"),
]

async def test_extreme_inputs():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        crashes = []

        await page.goto(f"{BASE_URL}/auth", wait_until="networkidle", timeout=20000)

        for label, value in EXTREME_STRINGS:
            try:
                await page.fill('input[type="email"]', value)
                await page.fill('input[type="password"]', "Senha123!")
                await page.click('button[type="submit"]')
                await page.wait_for_timeout(1000)
                # Verificar se não crashou (sem Application error)
                body = await page.text_content("body")
                if "Application error" in (body or "") or "ChunkLoadError" in (body or ""):
                    crashes.append(label)
                await page.goto(f"{BASE_URL}/auth", wait_until="networkidle")
            except Exception as e:
                if "timeout" not in str(e).lower():
                    crashes.append(f"{label}: {str(e)[:50]}")
                await page.goto(f"{BASE_URL}/auth", wait_until="networkidle")

        test(
            f"Inputs extremos no formulário não crasha app ({len(EXTREME_STRINGS)} testados)",
            len(crashes) == 0,
            f"Crashes com: {crashes}"
        )

        await browser.close()

asyncio.run(test_extreme_inputs())

# ─── 4.4 Double Submit Simulado ───
print("\n  [4.4] Double submit simulado (Edge Function pública):")

def double_submit_denuncia():
    payload = {
        "descricao": "Teste de double submit",
        "tipo": "outro",
        "anonima": True
    }
    url = f"{SUPABASE_URL}/functions/v1/denuncias"
    with ThreadPoolExecutor(max_workers=2) as executor:
        futures = [
            executor.submit(requests.post, url, json=payload,
                          headers={"Content-Type": "application/json"}, timeout=TIMEOUT)
            for _ in range(2)
        ]
        resps = [f.result() for f in futures]

    statuses = [r.status_code for r in resps]
    print(f"    Double submit → statuses: {statuses}")
    # Não deve crashar (500)
    test(
        "Double submit na edge function 'denuncias' não retorna 500",
        all(s != 500 for s in statuses),
        f"Status 500 em double submit: {statuses}"
    )

double_submit_denuncia()

# ─── 4.5 URLs com Path Traversal e Encodings ───
print("\n  [4.5] Path traversal e encodings especiais na URL:")

special_urls = [
    "/..%2F..%2Fetc%2Fpasswd",
    "/%2e%2e/%2e%2e/etc/passwd",
    "/auth/../admin",
    "/denuncia%00.php",
    "/auth?callback=javascript:alert(1)",
    "/auth?next=//evil.com",
    "/%3Cscript%3Ealert(1)%3C/script%3E",
]

for url_path in special_urls:
    try:
        r = requests.get(f"{BASE_URL}{url_path}", timeout=TIMEOUT, allow_redirects=False)
        test(
            f"URL especial {url_path[:40]} → {r.status_code}",
            r.status_code != 500,
            f"Crash no servidor com URL especial: {r.status_code}"
        )
    except Exception as e:
        test(f"URL especial {url_path[:30]}", False, str(e))

# ─── 4.6 Métodos HTTP Não Permitidos ───
print("\n  [4.6] Métodos HTTP não permitidos em rotas:")

HTTP_METHODS = ["DELETE", "PATCH", "PUT", "TRACE", "OPTIONS"]
for method in HTTP_METHODS:
    try:
        r = requests.request(method, f"{BASE_URL}/auth", timeout=TIMEOUT)
        test(
            f"HTTP {method} /auth → {r.status_code}",
            r.status_code != 500,
            f"Crash com método {method}: {r.status_code}"
        )
    except Exception as e:
        test(f"HTTP {method} /auth", False, str(e))

# ─── 4.7 Headers Malformados ───
print("\n  [4.7] Headers HTTP malformados:")

weird_headers = [
    {"X-Forwarded-For": "127.0.0.1" + ", " * 100 + "127.0.0.1"},
    {"Content-Type": "application/json; " + "a=b; " * 100},
    {"Accept": "*/*; " + "q=0.1, " * 50},
    {"User-Agent": "Bot" + "A" * 1000},
]

for headers in weird_headers:
    try:
        r = requests.get(f"{BASE_URL}/", headers=headers, timeout=TIMEOUT)
        test(
            f"Header estranho [{list(headers.keys())[0]}] → {r.status_code}",
            r.status_code < 500,
            f"Crash com header malformado: {r.status_code}"
        )
    except Exception as e:
        test(f"Header estranho [{list(headers.keys())[0]}]", False, str(e))

print(f"\n📊 EDGE CASES: {results['passed']} passed, {results['failed']} failed")
if results["errors"]:
    print("\n  ❌ Falhas:")
    for e in results["errors"]:
        print(f"    → {e['test']}: {e['detail'][:120]}")

with open("/tmp/edge_results.json", "w") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)
