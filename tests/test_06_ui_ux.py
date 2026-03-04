#!/usr/bin/env python3
"""Fase 6 — Testes de UI/UX: responsividade, acessibilidade, estados de loading."""

import asyncio
import json
from playwright.async_api import async_playwright

BASE_URL = "http://localhost:3001"
results = {"passed": 0, "failed": 0, "errors": []}
screenshots = []

async def test(name, condition, detail=""):
    if condition:
        results["passed"] += 1
        print(f"  ✅ {name}")
    else:
        results["failed"] += 1
        results["errors"].append({"test": name, "detail": detail})
        print(f"  ❌ {name} — {detail}")

VIEWPORTS = [
    {"name": "Mobile 375px (iPhone SE)", "width": 375, "height": 667},
    {"name": "Mobile 390px (iPhone 14)", "width": 390, "height": 844},
    {"name": "Tablet 768px (iPad)", "width": 768, "height": 1024},
    {"name": "Desktop 1280px", "width": 1280, "height": 720},
    {"name": "Desktop 1920px", "width": 1920, "height": 1080},
]

PUBLIC_ROUTES = [
    "/",
    "/auth",
    "/denuncia",
    "/consulta-protocolo",
]

async def run_ui_tests():
    print("\n🎨 FASE 6 — TESTES DE UI/UX")
    print("=" * 60)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)

        # ─── 6.1 Responsividade ───
        print("\n  [6.1] Responsividade — overflow horizontal por viewport:")

        for vp in VIEWPORTS:
            context = await browser.new_context(
                viewport={"width": vp["width"], "height": vp["height"]}
            )
            page = await context.new_page()

            for route in PUBLIC_ROUTES:
                try:
                    await page.goto(f"{BASE_URL}{route}", wait_until="networkidle", timeout=20000)
                    await page.wait_for_timeout(500)

                    has_overflow = await page.evaluate("""
                        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2
                    """)
                    safe = f"{route.replace('/', '_')}_{vp['width']}"
                    path = f"/tmp/responsive{safe}.png"
                    await page.screenshot(path=path, full_page=False)
                    screenshots.append(path)

                    await test(
                        f"{route} @ {vp['name']} — sem overflow horizontal",
                        not has_overflow,
                        f"Overflow em {vp['width']}px — conteúdo escapando da tela"
                    )
                except Exception as e:
                    await test(f"{route} @ {vp['name']}", False, str(e)[:100])

            await context.close()

        # ─── 6.2 Acessibilidade Básica ───
        print("\n  [6.2] Acessibilidade básica (WCAG):")

        context = await browser.new_context(viewport={"width": 1280, "height": 720})
        page = await context.new_page()

        for route in PUBLIC_ROUTES:
            await page.goto(f"{BASE_URL}{route}", wait_until="networkidle", timeout=20000)

            # Atributo lang no <html>
            has_lang = await page.evaluate("() => !!document.documentElement.lang")
            await test(f"{route} — atributo lang no <html>", has_lang,
                      "Falta atributo lang — Screen readers não saberão o idioma")

            # Imagens sem alt
            imgs_no_alt = await page.evaluate("""
                () => Array.from(document.querySelectorAll('img'))
                    .filter(img => img.alt === undefined || img.alt === null || img.alt.trim() === '')
                    .length
            """)
            await test(f"{route} — imagens têm alt text",
                      imgs_no_alt == 0,
                      f"{imgs_no_alt} imagem(ns) sem atributo alt")

            # Botões sem texto ou aria-label
            btns_no_label = await page.evaluate("""
                () => Array.from(document.querySelectorAll('button'))
                    .filter(btn => {
                        const text = btn.textContent?.trim();
                        const aria = btn.getAttribute('aria-label');
                        const title = btn.getAttribute('title');
                        return !text && !aria && !title;
                    }).length
            """)
            await test(f"{route} — botões têm rótulo acessível",
                      btns_no_label == 0,
                      f"{btns_no_label} botão(ões) sem texto ou aria-label")

            # Links sem href ou texto
            links_no_href = await page.evaluate("""
                () => Array.from(document.querySelectorAll('a'))
                    .filter(a => !a.href || a.href === '' || a.href === '#')
                    .length
            """)
            if links_no_href > 0:
                print(f"    ⚠️ {route}: {links_no_href} link(s) sem href válido")

            # Inputs sem labels
            inputs_no_label = await page.evaluate("""
                () => {
                    const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([type="submit"])'));
                    return inputs.filter(inp => {
                        const id = inp.id;
                        const aria = inp.getAttribute('aria-label') || inp.getAttribute('aria-labelledby');
                        const placeholder = inp.getAttribute('placeholder');
                        const label = id ? document.querySelector('label[for="' + id + '"]') : null;
                        return !aria && !label && !placeholder;
                    }).length;
                }
            """)
            if inputs_no_label > 0:
                print(f"    ⚠️ {route}: {inputs_no_label} input(s) sem label ou aria-label")

            # Meta viewport
            has_viewport = await page.evaluate("""
                () => !!document.querySelector('meta[name="viewport"]')
            """)
            await test(f"{route} — meta viewport presente",
                      has_viewport,
                      "Falta meta viewport — layout mobile quebrado")

        await context.close()

        # ─── 6.3 Navegação por Teclado ───
        print("\n  [6.3] Navegação por teclado:")

        context = await browser.new_context(viewport={"width": 1280, "height": 720})
        page = await context.new_page()

        await page.goto(f"{BASE_URL}/auth", wait_until="networkidle", timeout=20000)

        # Tab para navegar pelos campos
        try:
            await page.keyboard.press("Tab")
            await page.wait_for_timeout(200)
            focused = await page.evaluate("() => document.activeElement?.tagName")
            await test(
                "Tab navega pelos elementos em /auth",
                focused and focused != "BODY",
                f"Tab não focou em nenhum elemento (foco em: {focused})"
            )
        except Exception as e:
            await test("Tab navega pelos elementos em /auth", False, str(e)[:80])

        # Escape fecha modais (se houver)
        await page.keyboard.press("Escape")
        await page.wait_for_timeout(200)

        await context.close()

        # ─── 6.4 Estados de Erro e Loading ───
        print("\n  [6.4] Estados de feedback (loading, erro):")

        context = await browser.new_context(viewport={"width": 1280, "height": 720})
        page = await browser.new_page()

        for route in PUBLIC_ROUTES:
            await page.goto(f"{BASE_URL}{route}", wait_until="domcontentloaded", timeout=20000)

            # Verificar se há indicadores de loading (skeleton, spinner, etc.)
            loading_sels = [
                '[class*="loading"]', '[class*="spinner"]', '[class*="skeleton"]',
                '[class*="pulse"]', '[class*="shimmer"]', '[role="progressbar"]',
                '[class*="animate-spin"]'
            ]
            has_loading = False
            for sel in loading_sels:
                el = await page.query_selector(sel)
                if el:
                    has_loading = True
                    break
            print(f"    {route}: {'✅ tem indicador de loading' if has_loading else '⚠️ sem loading visível (pode ser rápido o suficiente)'}")

        await context.close()

        # ─── 6.5 Texto e Legibilidade ───
        print("\n  [6.5] Legibilidade e conteúdo:")

        context = await browser.new_context(viewport={"width": 1280, "height": 720})
        page = await browser.new_page()

        await page.goto(BASE_URL, wait_until="networkidle", timeout=20000)

        # Verificar se há conteúdo de texto real (não só componentes em branco)
        visible_text_length = await page.evaluate("""
            () => document.body.innerText.replace(/\\s+/g, ' ').trim().length
        """)
        await test(
            "Home tem conteúdo de texto visível",
            visible_text_length > 200,
            f"Apenas {visible_text_length} caracteres visíveis (esperado > 200)"
        )

        # Verificar se título da página é significativo
        title = await page.title()
        await test(
            "Página tem título significativo",
            len(title.strip()) > 3 and title.lower() not in ["next.js app", "untitled", ""],
            f"Título: '{title}'"
        )

        # Verificar se há favicon
        favicon_check = await page.evaluate("""
            () => {
                const links = Array.from(document.querySelectorAll('link[rel*="icon"]'));
                return links.length > 0;
            }
        """)
        print(f"    ℹ️  Favicon: {'presente ✅' if favicon_check else 'ausente ⚠️'}")

        # Verificar se há meta description
        meta_desc = await page.evaluate("""
            () => {
                const m = document.querySelector('meta[name="description"]');
                return m ? m.content : null;
            }
        """)
        print(f"    ℹ️  Meta description: {meta_desc[:60] + '...' if meta_desc and len(meta_desc) > 60 else meta_desc or 'ausente ⚠️'}")

        await context.close()

        # ─── 6.6 Formulário /auth — UX ───
        print("\n  [6.6] UX do Formulário de Autenticação:")

        context = await browser.new_context(viewport={"width": 1280, "height": 720})
        page = await browser.new_page()

        await page.goto(f"{BASE_URL}/auth", wait_until="networkidle", timeout=20000)

        # Verificar placeholder nos campos
        email_placeholder = await page.evaluate("""
            () => {
                const input = document.querySelector('input[type="email"]');
                return input ? input.placeholder : null;
            }
        """)
        await test(
            "Campo de email tem placeholder",
            email_placeholder and len(email_placeholder) > 0,
            f"Placeholder: '{email_placeholder}'"
        )

        # Verificar se há feedback de carregamento no submit
        await page.fill('input[type="email"]', "teste@exemplo.com")
        await page.fill('input[type="password"]', "SenhaTest123!")

        btn = await page.query_selector('button[type="submit"]')
        if btn:
            btn_text_before = await btn.text_content()
            await btn.click()
            await page.wait_for_timeout(500)
            btn_text_after = await btn.text_content()
            is_disabled = await btn.is_disabled()
            print(f"    ℹ️  Botão submit após click: {'desabilitado ✅' if is_disabled else 'ainda habilitado ⚠️'}")
            print(f"    ℹ️  Texto antes: '{btn_text_before}' | depois: '{btn_text_after}'")

        await context.close()
        await browser.close()

    print(f"\n📊 UI/UX: {results['passed']} passed, {results['failed']} failed")
    print(f"  Screenshots em: /tmp/responsive_*.png")
    if results["errors"]:
        print("\n  ❌ Falhas:")
        for e in results["errors"]:
            print(f"    → {e['test']}: {e['detail'][:120]}")

    with open("/tmp/ui_results.json", "w") as f:
        json.dump({"results": results, "screenshots": screenshots}, f, ensure_ascii=False, indent=2)

asyncio.run(run_ui_tests())
