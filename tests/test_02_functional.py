#!/usr/bin/env python3
"""Fase 2 — Testes Funcionais E2E com Playwright: fluxos críticos do Sistema GIG."""

import asyncio
import json
from playwright.async_api import async_playwright

BASE_URL = "http://localhost:3001"
SUPABASE_URL = "https://fenfgjqlsqzvxloeavdc.supabase.co"
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

async def run_test(page, name, fn):
    try:
        await fn(page)
        results["passed"] += 1
        print(f"  ✅ {name}")
    except Exception as e:
        results["failed"] += 1
        detail = str(e)[:200]
        results["errors"].append({"test": name, "detail": detail})
        safe = name.replace(" ", "_").replace("/", "_")[:40]
        try:
            path = f"/tmp/fail_{safe}.png"
            await page.screenshot(path=path)
            screenshots.append(path)
        except:
            pass
        print(f"  ❌ {name} — {detail}")

async def run_functional_tests():
    print("\n🧪 FASE 2 — TESTES FUNCIONAIS")
    print("=" * 60)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 720})
        page = await context.new_page()
        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)

        # ─── 2.1 LANDING PAGE ───
        print("\n  [2.1] Landing Page (/):")

        async def test_home_loads(p):
            await p.goto(BASE_URL, wait_until="networkidle", timeout=20000)
            title = await p.title()
            assert title and len(title) > 0, f"Sem título na página. Título: '{title}'"
            body_text = await p.text_content("body")
            assert body_text and len(body_text) > 50, "Conteúdo da home muito pequeno"

        await run_test(page, "Home / carrega com conteúdo", test_home_loads)

        async def test_home_no_crash(p):
            await p.goto(BASE_URL, wait_until="networkidle")
            error_text = await p.text_content("body")
            keywords = ["Application error", "Unhandled Runtime Error", "ChunkLoadError", "TypeError"]
            for kw in keywords:
                assert kw not in (error_text or ""), f"Erro crítico na home: {kw}"

        await run_test(page, "Home sem erros de runtime", test_home_no_crash)

        # ─── 2.2 PÁGINA DE AUTH ───
        print("\n  [2.2] Página de Autenticação (/auth):")

        async def test_auth_page_loads(p):
            await p.goto(f"{BASE_URL}/auth", wait_until="networkidle", timeout=20000)
            email_input = await p.query_selector('input[type="email"], input[name="email"]')
            assert email_input is not None, "Campo de email não encontrado na página de auth"

        await run_test(page, "/auth renderiza campo de email", test_auth_page_loads)

        async def test_auth_has_password(p):
            await p.goto(f"{BASE_URL}/auth", wait_until="networkidle")
            pw_input = await p.query_selector('input[type="password"]')
            assert pw_input is not None, "Campo de senha não encontrado"

        await run_test(page, "/auth renderiza campo de senha", test_auth_has_password)

        async def test_auth_has_submit(p):
            await p.goto(f"{BASE_URL}/auth", wait_until="networkidle")
            btn = await p.query_selector('button[type="submit"]')
            assert btn is not None, "Botão de submit não encontrado"
            btn_text = await btn.text_content()
            assert btn_text and len(btn_text.strip()) > 0, "Botão de submit sem texto"

        await run_test(page, "/auth tem botão de submit", test_auth_has_submit)

        async def test_login_invalid_credentials(p):
            await p.goto(f"{BASE_URL}/auth", wait_until="networkidle")
            await p.fill('input[type="email"]', "naoexiste@exemplo.com")
            await p.fill('input[type="password"]', "SenhaErrada123!")
            await p.click('button[type="submit"]')
            await p.wait_for_timeout(3000)
            # Deve mostrar mensagem de erro, não redirecionar para dashboard
            current_url = page.url
            assert "/admin" not in current_url and "/consultor" not in current_url and "/meu-projeto" not in current_url, \
                f"Login com credenciais inválidas redirecionou para área protegida: {current_url}"

        await run_test(page, "Login com credenciais inválidas não acessa área protegida", test_login_invalid_credentials)

        async def test_error_message_shown(p):
            await p.goto(f"{BASE_URL}/auth", wait_until="networkidle")
            await p.fill('input[type="email"]', "invalido@teste.com")
            await p.fill('input[type="password"]', "SenhaErrada!")
            await p.click('button[type="submit"]')
            await p.wait_for_timeout(3000)
            body = await p.text_content("body")
            error_indicators = ["erro", "inválid", "incorrect", "invalid", "wrong", "falhou", "failed"]
            has_error = any(ind.lower() in (body or "").lower() for ind in error_indicators)
            assert has_error, "Nenhuma mensagem de erro exibida após login inválido"

        await run_test(page, "Login inválido exibe mensagem de erro", test_error_message_shown)

        # ─── 2.3 FORGOT PASSWORD ───
        print("\n  [2.3] Recuperação de Senha:")

        async def test_forgot_password_link(p):
            await p.goto(f"{BASE_URL}/auth", wait_until="networkidle")
            forgot = await p.query_selector('a[href*="forgot"], button:has-text("Esqueceu"), a:has-text("Esqueceu"), *[class*="forgot"]')
            assert forgot is not None, "Link/botão 'Esqueceu a senha' não encontrado"

        await run_test(page, "Link 'Esqueceu a senha' existe", test_forgot_password_link)

        # ─── 2.4 CADASTRO ───
        print("\n  [2.4] Formulário de Cadastro:")

        async def test_signup_mode_exists(p):
            await p.goto(f"{BASE_URL}/auth", wait_until="networkidle")
            # Procurar link/botão para trocar para modo cadastro
            signup_trigger = await p.query_selector('*:has-text("Criar conta"), *:has-text("Cadastrar"), *:has-text("Registrar"), *:has-text("Sign up")')
            assert signup_trigger is not None, "Opção de criar conta não encontrada"

        await run_test(page, "Modo de cadastro acessível", test_signup_mode_exists)

        # ─── 2.5 CANAL DE DENÚNCIAS ───
        print("\n  [2.5] Canal de Denúncias (/denuncia):")

        async def test_denuncia_loads(p):
            await p.goto(f"{BASE_URL}/denuncia", wait_until="networkidle", timeout=20000)
            body = await p.text_content("body")
            assert body and len(body) > 100, "Página de denúncia vazia"
            assert "denuncia" in body.lower() or "denúncia" in body.lower() or "relato" in body.lower(), \
                "Página de denúncia sem conteúdo relevante"

        await run_test(page, "/denuncia carrega corretamente", test_denuncia_loads)

        async def test_denuncia_has_form(p):
            await p.goto(f"{BASE_URL}/denuncia", wait_until="networkidle")
            form_elements = await p.query_selector_all('input, textarea, select')
            assert len(form_elements) >= 1, "Formulário de denúncia sem campos de input"

        await run_test(page, "/denuncia tem campos de formulário", test_denuncia_has_form)

        async def test_denuncia_anonima(p):
            await p.goto(f"{BASE_URL}/denuncia", wait_until="networkidle")
            body = await p.text_content("body")
            assert "anônima" in body.lower() or "anonima" in body.lower() or "anônimo" in body.lower() or "protocolo" in body.lower(), \
                "Página não menciona anonimato ou protocolo"

        await run_test(page, "/denuncia menciona anonimato/protocolo", test_denuncia_anonima)

        # ─── 2.6 CONSULTA DE PROTOCOLO ───
        print("\n  [2.6] Consulta de Protocolo (/consulta-protocolo):")

        async def test_protocolo_loads(p):
            await p.goto(f"{BASE_URL}/consulta-protocolo", wait_until="networkidle", timeout=20000)
            body = await p.text_content("body")
            assert body and len(body) > 100, "Página de consulta vazia"
            assert "protocolo" in body.lower(), "Página não menciona 'protocolo'"

        await run_test(page, "/consulta-protocolo carrega", test_protocolo_loads)

        async def test_protocolo_has_input(p):
            await p.goto(f"{BASE_URL}/consulta-protocolo", wait_until="networkidle")
            inp = await p.query_selector('input[type="text"], input[placeholder*="protocol"], input[placeholder*="Protocol"]')
            assert inp is not None, "Campo de número de protocolo não encontrado"

        await run_test(page, "/consulta-protocolo tem campo de busca", test_protocolo_has_input)

        # ─── 2.7 SPA (ROTAS AUTENTICADAS) ───
        print("\n  [2.7] SPA - Rotas Autenticadas (sem login → redirect):")

        protected_spa = ["/admin", "/consultor", "/meu-projeto"]
        for route in protected_spa:
            async def make_test(r):
                async def t(p):
                    await p.goto(f"{BASE_URL}{r}", wait_until="networkidle", timeout=20000)
                    await p.wait_for_timeout(2000)
                    # Deve redirecionar para /auth OU mostrar a SPA com loading
                    current = p.url
                    body = await p.text_content("body")
                    # Aceita: redirect para auth, OR página SPA carregada
                    is_redirected_to_auth = "/auth" in current
                    is_spa_loading = body and len(body) > 50
                    assert is_redirected_to_auth or is_spa_loading, \
                        f"Rota {r} sem auth retornou página vazia/crash. URL: {current}"
                return t
            fn = await make_test(route)
            await run_test(page, f"{route} (sem auth) não crasha", fn)

        # ─── 2.8 ERROS DE CONSOLE ───
        print("\n  [2.8] Erros de console no navegador:")
        if console_errors:
            print(f"    ⚠️ {len(console_errors)} erros detectados no console:")
            for err in console_errors[:10]:
                print(f"      → {err[:150]}")
            await test("Sem erros JS no console", False, f"{len(console_errors)} erros detectados")
        else:
            await test("Sem erros JS no console durante os testes", True)

        await browser.close()

    print(f"\n📊 FUNCIONAIS: {results['passed']} passed, {results['failed']} failed")
    if results["errors"]:
        print("\n  ❌ Falhas:")
        for e in results["errors"]:
            print(f"    → {e['test']}: {e['detail'][:120]}")

    with open("/tmp/functional_results.json", "w") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

asyncio.run(run_functional_tests())
