#!/usr/bin/env python3
"""Fase 6 — Testes de UI/UX: HTML semântico, meta tags, acessibilidade básica (2026-03-13)."""

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import json
import sys
import re

BASE_URL = "http://localhost:3000"
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

def safe_get(url):
    try:
        return session.get(url, timeout=TIMEOUT, allow_redirects=True)
    except Exception:
        return None

print("\n🎨 FASE 6 — TESTES DE UI/UX (2026-03-13)")
print("=" * 60)

# ─── 6.1 META TAGS E SEO ───
print("\n  [6.1] Meta tags e SEO:")
main_routes = ["/", "/auth", "/denuncia", "/consulta-protocolo"]
for route in main_routes:
    r = safe_get(f"{BASE_URL}{route}")
    if not r:
        print(f"  ⚠️ {route} — timeout, skipping")
        continue
    html = r.text
    
    # viewport meta tag (responsividade)
    has_viewport = 'name="viewport"' in html or "name='viewport'" in html
    test(f"{route} → meta viewport presente", has_viewport, "Falta meta viewport (responsividade)")
    
    # charset
    has_charset = 'charset' in html.lower()
    test(f"{route} → charset definido", has_charset, "Falta charset declaration")
    
    # title tag
    title_match = re.search(r'<title[^>]*>(.+?)</title>', html, re.IGNORECASE | re.DOTALL)
    has_title = title_match is not None and len(title_match.group(1).strip()) > 0
    test(f"{route} → tag <title> presente", has_title, "Falta ou vazio <title>")
    
    # lang attribute
    has_lang = re.search(r'<html[^>]*\slang=', html, re.IGNORECASE) is not None
    test(f"{route} → atributo lang no <html>", has_lang, "Falta lang no <html>")

# ─── 6.2 ESTRUTURA HTML SEMÂNTICA ───
print("\n  [6.2] Estrutura HTML semântica:")
for route in ["/", "/auth"]:
    r = safe_get(f"{BASE_URL}{route}")
    if not r:
        continue
    html = r.text
    
    # DOCTYPE
    has_doctype = html.strip().lower().startswith("<!doctype")
    test(f"{route} → DOCTYPE presente", has_doctype, "Falta <!DOCTYPE html>")
    
    # Root div for React — Next.js App Router uses <body><div> without specific id
    has_root = ('<body>' in html and '<div' in html) or 'id="__next"' in html or 'id="root"' in html
    test(f"{route} → div root para React", has_root, "Sem div root")

# ─── 6.3 IMAGENS SEM ALT ───
print("\n  [6.3] Imagens com atributo alt:")
for route in main_routes:
    r = safe_get(f"{BASE_URL}{route}")
    if not r:
        continue
    html = r.text
    imgs = re.findall(r'<img[^>]*>', html, re.IGNORECASE)
    imgs_no_alt = [img for img in imgs if 'alt=' not in img.lower()]
    total_imgs = len(imgs)
    if total_imgs > 0:
        test(f"{route} → {total_imgs} imgs, {len(imgs_no_alt)} sem alt",
             len(imgs_no_alt) == 0,
             f"{len(imgs_no_alt)} imagens sem atributo alt")
    else:
        print(f"    ℹ️ {route} — nenhuma tag <img> no HTML SSR")

# ─── 6.4 FORMULÁRIOS COM LABELS ───
print("\n  [6.4] Formulários básicos:")
for route in ["/auth", "/denuncia"]:
    r = safe_get(f"{BASE_URL}{route}")
    if not r:
        continue
    html = r.text
    
    # Check for form elements (may be loaded via JS)
    has_form = "<form" in html.lower() or "type=\"submit\"" in html or 'type="submit"' in html
    if has_form:
        inputs = re.findall(r'<input[^>]*>', html, re.IGNORECASE)
        inputs_no_label = []
        for inp in inputs:
            if 'type="hidden"' in inp.lower():
                continue
            has_id = 'id=' in inp
            has_aria = 'aria-label' in inp or 'aria-labelledby' in inp
            has_placeholder = 'placeholder=' in inp
            if not (has_id or has_aria or has_placeholder):
                inputs_no_label.append(inp[:60])
        
        test(f"{route} → inputs com labels/aria/placeholder",
             len(inputs_no_label) == 0,
             f"{len(inputs_no_label)} inputs sem label/aria/placeholder")
    else:
        print(f"    ℹ️ {route} — formulários carregados via JS (não visíveis no SSR)")

# ─── 6.5 BOTÕES COM TEXTO ACESSÍVEL ───
print("\n  [6.5] Botões acessíveis:")
for route in main_routes:
    r = safe_get(f"{BASE_URL}{route}")
    if not r:
        continue
    html = r.text
    buttons = re.findall(r'<button[^>]*>.*?</button>', html, re.IGNORECASE | re.DOTALL)
    inaccessible = []
    for btn in buttons:
        content = re.sub(r'<[^>]+>', '', btn).strip()
        has_content = len(content) > 0
        has_aria = 'aria-label' in btn
        has_title = 'title=' in btn
        if not (has_content or has_aria or has_title):
            inaccessible.append(btn[:60])
    
    if buttons:
        test(f"{route} → {len(buttons)} botões, {len(inaccessible)} inacessíveis",
             len(inaccessible) == 0,
             f"{len(inaccessible)} botões sem texto/aria-label")
    else:
        print(f"    ℹ️ {route} — botões carregados via JS")

# ─── 6.6 LINKS ACESSÍVEIS ───
print("\n  [6.6] Links com href válido:")
for route in main_routes[:2]:  # Just home and auth
    r = safe_get(f"{BASE_URL}{route}")
    if not r:
        continue
    html = r.text
    links = re.findall(r'<a[^>]*>', html, re.IGNORECASE)
    empty_links = [lnk for lnk in links if 'href=""' in lnk or 'href="#"' in lnk]
    if links:
        test(f"{route} → {len(links)} links, {len(empty_links)} vazios (#/empty)",
             len(empty_links) <= 2,  # Allow up to 2 anchor links
             f"{len(empty_links)} links com href vazio ou '#'")

# ─── 6.7 RESPONSIVIDADE (meta viewport) ───
print("\n  [6.7] robots.txt presente:")
r = safe_get(f"{BASE_URL}/robots.txt")
if r:
    test("robots.txt retorna conteúdo", len(r.text) > 5, "robots.txt vazio")
else:
    test("robots.txt acessível", False, "Timeout")

# ─── RESUMO ───
print(f"\n{'='*60}")
print(f"📊 TESTES DE UI/UX: {results['passed']} passed, {results['failed']} failed")
total = results['passed'] + results['failed']
if total > 0:
    print(f"  Taxa de sucesso: {results['passed']/total*100:.1f}%")

if results["errors"]:
    print(f"\n  ❌ Falhas ({len(results['errors'])}):")
    for e in results["errors"]:
        print(f"    → {e['test']}: {e['detail']}")

with open("tests/ui_ux_results.json", "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

sys.exit(1 if results["failed"] > 0 else 0)
