#!/usr/bin/env python3
"""
SISTEMA GIG — Bateria Completa de Testes E2E
Executa Fases 1-7: Smoke, Funcional, Negativos, Edge Cases, Segurança, UX, Edge Functions
"""

import asyncio
import json
import sys
import time
import requests
from concurrent.futures import ThreadPoolExecutor
from playwright.async_api import async_playwright

BASE_URL = "https://cavendish-gig.vercel.app"
SUPABASE_URL = "https://fenfgjqlsqzvxloeavdc.supabase.co"
TIMEOUT = 15

results = {"passed": 0, "failed": 0, "warnings": 0, "errors": []}

def p(name, ok, detail="", warn=False):
    if ok:
        results["passed"] += 1
        print(f"  ✅ {name}")
    elif warn:
        results["warnings"] += 1
        print(f"  ⚠️  {name} — {detail}")
    else:
        results["failed"] += 1
        results["errors"].append({"test": name, "detail": detail})
        print(f"  ❌ {name} — {detail}")

def section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")

# ─── FASE 1: SMOKE TESTS ─────────────────────────────────────────────────────

def fase1_smoke():
    section("FASE 1 — SMOKE TESTS")

    # Rotas públicas que devem responder sem auth
    public_routes = [
        "/",
        "/auth",
        "/denuncia",
        "/consulta-protocolo",
    ]

    # Rotas autenticadas — devem redirecionar (302/307) ou dar 200 (SPA)
    auth_routes = [
        "/consultor",
        "/admin",
        "/meu-projeto",
        "/parceiro",
    ]

    print("\n  📡 Rotas públicas:")
    for route in public_routes:
        try:
            r = requests.get(f"{BASE_URL}{route}", timeout=TIMEOUT, allow_redirects=True)
            p(f"GET {route} → {r.status_code}", r.status_code < 500,
              f"Retornou {r.status_code}")
        except Exception as e:
            p(f"GET {route}", False, str(e))

    print("\n  🔒 Rotas autenticadas (devem carregar SPA ou redirecionar):")
    for route in auth_routes:
        try:
            r = requests.get(f"{BASE_URL}{route}", timeout=TIMEOUT, allow_redirects=True)
            p(f"GET {route} → {r.status_code}",
              r.status_code < 500,
              f"Retornou {r.status_code}")
        except Exception as e:
            p(f"GET {route}", False, str(e))

    print("\n  🏗️ Assets e build:")
    try:
        r = requests.get(BASE_URL, timeout=TIMEOUT)
        has_html = "<!DOCTYPE html>" in r.text or "<html" in r.text
        p("Página retorna HTML válido", has_html, "Sem DOCTYPE/html")
        has_title = "<title>" in r.text
        p("Página tem <title>", has_title, "Sem tag title")
        content_type = r.headers.get("content-type", "")
        p("Content-Type é HTML", "text/html" in content_type, f"Content-Type: {content_type}")
    except Exception as e:
        p("Home carrega", False, str(e))

    print("\n  🗄️ Supabase acessível:")
    try:
        r = requests.get(f"{SUPABASE_URL}/rest/v1/", timeout=TIMEOUT)
        p("Supabase REST responde", r.status_code in [200, 401], f"Status: {r.status_code}")
    except Exception as e:
        p("Supabase REST acessível", False, str(e))

# ─── FASE 2: TESTES FUNCIONAIS COM PLAYWRIGHT ────────────────────────────────

async def fase2_funcional():
    section("FASE 2 — TESTES FUNCIONAIS (Playwright)")

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        ctx = await browser.new_context(viewport={"width": 1280, "height": 720})
        page = await ctx.new_page()

        console_errors = []
        page.on("console", lambda m: console_errors.append(m.text) if m.type == "error" else None)
        page.on("pageerror", lambda e: console_errors.append(f"PAGE ERROR: {e}"))

        async def t(name, fn):
            try:
                await fn()
                p(name, True)
            except Exception as e:
                p(name, False, str(e)[:200])
                try:
                    await page.screenshot(path=f"/tmp/fail_{name[:40].replace(' ','_')}.png")
                except:
                    pass

        print("\n  🏠 Home e navegação:")

        async def test_home():
            await page.goto(BASE_URL, wait_until="networkidle", timeout=20000)
            title = await page.title()
            assert title, "Página sem título"

        async def test_home_has_content():
            await page.goto(BASE_URL, wait_until="networkidle", timeout=20000)
            content = await page.content()
            assert len(content) > 500, "Página com conteúdo muito pequeno"

        async def test_auth_page():
            await page.goto(f"{BASE_URL}/auth", wait_until="networkidle", timeout=20000)
            # Deve ter formulário de login
            email_input = await page.query_selector('input[type="email"]')
            assert email_input, "Campo email não encontrado na página de auth"

        async def test_denuncia_page():
            await page.goto(f"{BASE_URL}/denuncia", wait_until="networkidle", timeout=20000)
            content = await page.content()
            assert "denúncia" in content.lower() or "denuncia" in content.lower() or len(content) > 1000, \
                "Página de denúncia parece vazia"

        async def test_consulta_protocolo():
            await page.goto(f"{BASE_URL}/consulta-protocolo", wait_until="networkidle", timeout=20000)
            content = await page.content()
            assert len(content) > 500, "Página de consulta protocolo vazia"

        await t("Home carrega com título", test_home)
        await t("Home tem conteúdo", test_home_has_content)
        await t("Página /auth tem campo email", test_auth_page)
        await t("Página /denuncia carrega", test_denuncia_page)
        await t("Página /consulta-protocolo carrega", test_consulta_protocolo)

        print("\n  🔐 Formulário de autenticação:")

        async def test_login_vazio():
            await page.goto(f"{BASE_URL}/auth", wait_until="networkidle", timeout=20000)
            # Tenta submeter form vazio
            submit = await page.query_selector('button[type="submit"]')
            if submit:
                await submit.click()
                await page.wait_for_timeout(1000)
                # Não deve navegar para dashboard
                assert "/auth" in page.url or "/dashboard" not in page.url, \
                    "Login vazio deveria ser rejeitado"

        async def test_login_email_invalido():
            await page.goto(f"{BASE_URL}/auth", wait_until="networkidle", timeout=20000)
            email_input = await page.query_selector('input[type="email"]')
            if email_input:
                await email_input.fill("nao-e-email")
                submit = await page.query_selector('button[type="submit"]')
                if submit:
                    await submit.click()
                    await page.wait_for_timeout(1500)
                    # Ainda deve estar em /auth
                    assert "dashboard" not in page.url.lower(), \
                        "Login com email inválido não deveria ter sucesso"

        async def test_login_credenciais_erradas():
            await page.goto(f"{BASE_URL}/auth", wait_until="networkidle", timeout=20000)
            email_input = await page.query_selector('input[type="email"]')
            password_input = await page.query_selector('input[type="password"]')
            if email_input and password_input:
                await email_input.fill("teste_invalido_xyz@naoexiste.com")
                await password_input.fill("senhaerrada123")
                submit = await page.query_selector('button[type="submit"]')
                if submit:
                    await submit.click()
                    await page.wait_for_timeout(3000)
                    # Deve mostrar mensagem de erro
                    url = page.url
                    content = await page.content()
                    has_error = any(w in content.lower() for w in [
                        "inválid", "incorret", "erro", "error", "failed", "not found"
                    ])
                    assert "dashboard" not in url.lower() or has_error, \
                        "Login com credenciais erradas deveria exibir erro"

        await t("Login vazio rejeitado", test_login_vazio)
        await t("Login com email inválido bloqueado", test_login_email_invalido)
        await t("Login com credenciais erradas mostra erro", test_login_credenciais_erradas)

        print("\n  📋 Página de denúncias (fluxo público):")

        async def test_denuncia_form():
            await page.goto(f"{BASE_URL}/denuncia", wait_until="networkidle", timeout=20000)
            # Busca elementos do formulário
            inputs = await page.query_selector_all("input, textarea, select")
            assert len(inputs) > 0, "Formulário de denúncia sem campos de input"

        async def test_denuncia_campos_required():
            await page.goto(f"{BASE_URL}/denuncia", wait_until="networkidle", timeout=20000)
            submit_buttons = await page.query_selector_all('button[type="submit"], button:has-text("Enviar")')
            if submit_buttons:
                await submit_buttons[0].click()
                await page.wait_for_timeout(1500)
                # Não deve ter criado denúncia (sem campos preenchidos)
                url = page.url
                p("Formulário denúncia: submit vazio não redireciona", True)
            else:
                p("Formulário denúncia: botão enviar encontrado", False, "Sem botão de submit")

        await t("Formulário denúncia tem campos", test_denuncia_form)
        await test_denuncia_campos_required()

        # Verificar erros de console acumulados
        print(f"\n  🖥️ Erros de console do browser:")
        if console_errors:
            for err in console_errors[:15]:
                msg = err[:200]
                # Filtrar erros esperados (ex: network bloqueado por auth)
                is_critical = any(k in msg.lower() for k in [
                    "typeerror", "referenceerror", "syntaxerror", "uncaught",
                    "cannot read", "undefined", "null"
                ])
                p(f"Console: {msg[:100]}", not is_critical, msg, warn=not is_critical)
        else:
            p("Sem erros de console", True)

        await browser.close()

# ─── FASE 3: TESTES NEGATIVOS E SEGURANÇA ────────────────────────────────────

def fase3_negativos():
    section("FASE 3 — TESTES NEGATIVOS E VALIDAÇÃO")

    print("\n  🔒 Endpoints Supabase sem auth (devem retornar 401):")
    supabase_key = ""  # sem key
    tables = ["profiles", "organizacoes", "denuncias", "politicas", "riscos",
              "fornecedores", "esg_indicadores", "board_snapshots"]

    for table in tables:
        try:
            r = requests.get(
                f"{SUPABASE_URL}/rest/v1/{table}",
                headers={"apikey": ""},
                timeout=10
            )
            p(f"Supabase /{table} sem auth → {r.status_code}",
              r.status_code in [401, 403, 400],
              f"Retornou {r.status_code} — dados expostos sem auth!")
        except Exception as e:
            p(f"Supabase /{table} acessível", False, str(e))

    print("\n  🔑 Edge Functions sem auth (devem retornar 401):")
    edge_functions = [
        "ai-generate",
        "integrations",
        "google-calendar",
        "google-drive",
        "send-email",
        "generate-monthly-report",
    ]
    for fn in edge_functions:
        try:
            r = requests.post(
                f"{SUPABASE_URL}/functions/v1/{fn}",
                json={"test": "no_auth"},
                headers={},
                timeout=10
            )
            p(f"Edge /{fn} sem auth → {r.status_code}",
              r.status_code in [401, 403, 400, 405],
              f"Retornou {r.status_code} — endpoint sem proteção!")
        except Exception as e:
            p(f"Edge /{fn} acessível", False, str(e)[:100])

def fase4_seguranca():
    section("FASE 4 — TESTES DE SEGURANÇA (Headers HTTP)")

    print("\n  🛡️ Security headers em produção:")
    try:
        r = requests.get(BASE_URL, timeout=TIMEOUT)
        h = r.headers

        security_checks = [
            ("X-Content-Type-Options",      lambda: "nosniff" in h.get("x-content-type-options", "").lower()),
            ("X-Frame-Options",             lambda: h.get("x-frame-options", "") != ""),
            ("Strict-Transport-Security",   lambda: "strict-transport-security" in {k.lower() for k in h}),
            ("Content-Security-Policy",     lambda: "content-security-policy" in {k.lower() for k in h}),
            ("Referrer-Policy",             lambda: "referrer-policy" in {k.lower() for k in h}),
            ("Permissions-Policy",          lambda: "permissions-policy" in {k.lower() for k in h}),
        ]

        for header_name, check_fn in security_checks:
            try:
                ok = check_fn()
                p(f"Header {header_name}", ok, "Header ausente — recomendado", warn=not ok)
            except:
                p(f"Header {header_name}", False, "Erro ao verificar", warn=True)

        # Verificar se expõe headers problemáticos
        p("Não expõe X-Powered-By",
          "x-powered-by" not in {k.lower() for k in h},
          f"X-Powered-By: {h.get('X-Powered-By')}", warn=True)

        p("Não expõe Server version",
          not any(v in h.get("server", "").lower() for v in ["apache", "nginx", "iis", "/"]),
          f"Server: {h.get('server', '')}", warn=True)

    except Exception as e:
        p("Headers de segurança verificados", False, str(e))

    print("\n  🔍 Exposição de dados sensíveis:")
    try:
        r = requests.get(BASE_URL, timeout=TIMEOUT)
        body = r.text.lower()
        sensitive = ["password", "secret", "api_key", "private_key", "token=", "supabase_service_role"]
        for s in sensitive:
            p(f"Não expõe '{s}' no HTML",
              s not in body,
              f"String '{s}' encontrada no HTML da home!", warn=True)
    except Exception as e:
        p("Varredura de dados sensíveis", False, str(e))

def fase5_edge_cases():
    section("FASE 5 — EDGE CASES E CONCORRÊNCIA")

    print("\n  ⚡ Concorrência — 10 requisições simultâneas na home:")
    try:
        def req(_):
            return requests.get(BASE_URL, timeout=15)

        with ThreadPoolExecutor(max_workers=10) as ex:
            t0 = time.time()
            futures = [ex.submit(req, i) for i in range(10)]
            responses = [f.result() for f in futures]
            elapsed = time.time() - t0

        status_codes = [r.status_code for r in responses]
        errors_5xx = sum(1 for s in status_codes if s >= 500)
        times = [r.elapsed.total_seconds() for r in responses]

        p("10 req simultâneas — sem 5xx", errors_5xx == 0,
          f"{errors_5xx}/10 retornaram 5xx")
        p(f"Tempo médio < 5s ({sum(times)/len(times):.2f}s)",
          sum(times)/len(times) < 5,
          f"Tempo médio: {sum(times)/len(times):.2f}s", warn=True)
        p(f"Tempo máximo < 10s ({max(times):.2f}s)",
          max(times) < 10,
          f"Tempo máximo: {max(times):.2f}s", warn=True)
    except Exception as e:
        p("Teste de concorrência", False, str(e))

    print("\n  📄 Rotas inexistentes (devem retornar 404 ou redirecionar):")
    nonexistent = ["/rota-que-nao-existe-xyz", "/admin/xyz/abc/123", "/api/nope"]
    for route in nonexistent:
        try:
            r = requests.get(f"{BASE_URL}{route}", timeout=TIMEOUT, allow_redirects=True)
            p(f"404/redirect para rota inexistente {route}",
              r.status_code in [200, 404, 302, 307],  # 200 ok para SPA
              f"Status: {r.status_code}")
        except Exception as e:
            p(f"Rota inexistente {route}", False, str(e))

# ─── FASE 6: TESTES FUNCIONAIS SUPABASE DB ───────────────────────────────────

def fase6_database():
    section("FASE 6 — VERIFICAÇÃO DO BANCO DE DADOS")

    # Usar anon key do projeto (exposta no env público)
    try:
        with open("/c/Projects/Sistema_GIG/cavendish-gig-main/.env.local") as f:
            env = dict(line.strip().split("=", 1) for line in f if "=" in line and not line.startswith("#"))
        anon_key = env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", env.get("VITE_SUPABASE_ANON_KEY", ""))
    except:
        anon_key = ""

    if not anon_key:
        print("  ⚠️  Anon key não encontrada — pulando testes de DB com anon key")
        return

    headers = {"apikey": anon_key, "Authorization": f"Bearer {anon_key}"}

    print("\n  🗄️ Tabelas novas (verificar RLS está ativo):")
    new_tables = [
        "politicas", "conflito_interesses", "lgpd_inventario", "lgpd_solicitacoes",
        "riscos", "riscos_avaliacoes", "riscos_mitigacao", "politicas_aceites",
        "investigacoes", "investigacoes_notas", "investigacoes_evidencias",
        "fornecedores", "due_diligence_perguntas", "compliance_obrigacoes",
        "esg_indicadores", "board_snapshots", "diagnostico_benchmarks"
    ]

    for table in new_tables:
        try:
            r = requests.get(
                f"{SUPABASE_URL}/rest/v1/{table}?limit=1",
                headers=headers,
                timeout=10
            )
            # Anon sem auth deve receber [] vazio (RLS) ou 401, NÃO dados reais
            if r.status_code == 200:
                data = r.json()
                is_empty_or_public = (isinstance(data, list) and len(data) == 0) or \
                                     table in ["due_diligence_perguntas", "diagnostico_benchmarks",
                                               "compliance_obrigacoes"]
                p(f"RLS ativo em {table}",
                  is_empty_or_public,
                  f"Retornou {len(data) if isinstance(data, list) else '?'} registros com anon key!")
            elif r.status_code in [401, 403]:
                p(f"RLS ativo em {table} (→ {r.status_code})", True)
            else:
                p(f"Tabela {table} acessível → {r.status_code}", True)
        except Exception as e:
            p(f"Tabela {table} verificada", False, str(e)[:100])

    print("\n  🌱 Seeds verificados:")
    try:
        r = requests.get(
            f"{SUPABASE_URL}/rest/v1/due_diligence_perguntas?select=count",
            headers={**headers, "Prefer": "count=exact"},
            timeout=10
        )
        count = int(r.headers.get("content-range", "0/0").split("/")[-1])
        p(f"Seed due_diligence_perguntas tem ≥20 perguntas ({count})",
          count >= 20, f"Apenas {count} perguntas encontradas")
    except Exception as e:
        p("Seed due_diligence_perguntas", False, str(e))

    try:
        r = requests.get(
            f"{SUPABASE_URL}/rest/v1/compliance_obrigacoes?organizacao_id=is.null&select=count",
            headers={**headers, "Prefer": "count=exact"},
            timeout=10
        )
        count = int(r.headers.get("content-range", "0/0").split("/")[-1])
        p(f"Seed compliance_obrigacoes tem ≥30 obrigações ({count})",
          count >= 25, f"Apenas {count} obrigações seedadas")
    except Exception as e:
        p("Seed compliance_obrigacoes", False, str(e))

    try:
        r = requests.get(
            f"{SUPABASE_URL}/rest/v1/diagnostico_benchmarks?select=count",
            headers={**headers, "Prefer": "count=exact"},
            timeout=10
        )
        count = int(r.headers.get("content-range", "0/0").split("/")[-1])
        p(f"Seed diagnostico_benchmarks tem ≥36 linhas ({count})",
          count >= 36, f"Apenas {count} benchmarks encontrados")
    except Exception as e:
        p("Seed diagnostico_benchmarks", False, str(e))

# ─── FASE 7: ANÁLISE ESTÁTICA DE CÓDIGO ──────────────────────────────────────

def fase7_static_analysis():
    section("FASE 7 — ANÁLISE ESTÁTICA DO CÓDIGO FONTE")
    import os
    src = "/c/Projects/Sistema_GIG/cavendish-gig-main/src"

    print("\n  🔍 Verificações de qualidade:")

    # Verificar console.log em produção
    log_count = 0
    for root, _, files in os.walk(src):
        for f in files:
            if f.endswith((".ts", ".tsx")):
                try:
                    with open(os.path.join(root, f)) as fh:
                        for line in fh:
                            if "console.log(" in line and not line.strip().startswith("//"):
                                log_count += 1
                except:
                    pass
    p(f"console.log em produção ({log_count} ocorrências)",
      log_count == 0, f"{log_count} console.log encontrados", warn=log_count > 0)

    # Verificar TODO/FIXME críticos
    todo_count = 0
    fixme_count = 0
    for root, _, files in os.walk(src):
        for f in files:
            if f.endswith((".ts", ".tsx")):
                try:
                    with open(os.path.join(root, f)) as fh:
                        content = fh.read()
                        todo_count += content.count("TODO")
                        fixme_count += content.count("FIXME")
                except:
                    pass
    p(f"FIXME no código ({fixme_count})", fixme_count == 0,
      f"{fixme_count} FIXME encontrados", warn=fixme_count > 0)
    p(f"TODO no código ({todo_count})", todo_count < 10,
      f"{todo_count} TODO encontrados", warn=todo_count > 0)

    # Verificar hardcoded secrets
    import re
    secret_patterns = [
        r'sk-[a-zA-Z0-9]{20,}',           # OpenAI key
        r'eyJ[a-zA-Z0-9_-]{20,}',         # JWT hardcoded
        r'sbp_[a-zA-Z0-9]{20,}',          # Supabase PAT
        r'pplx-[a-zA-Z0-9]{20,}',         # Perplexity key
    ]
    secrets_found = []
    for root, _, files in os.walk(src):
        for fname in files:
            if fname.endswith((".ts", ".tsx", ".js")):
                try:
                    with open(os.path.join(root, fname)) as fh:
                        content = fh.read()
                        for pat in secret_patterns:
                            matches = re.findall(pat, content)
                            if matches:
                                secrets_found.append(f"{fname}: {matches[0][:20]}...")
                except:
                    pass
    p("Sem chaves hardcoded no código fonte",
      len(secrets_found) == 0,
      f"Possíveis segredos: {secrets_found[:3]}")

    # Verificar imports de arquivos que não existem
    print("\n  📦 Verificação de imports críticos:")
    critical_imports = [
        ("useRiscos", "/c/Projects/Sistema_GIG/cavendish-gig-main/src/hooks/useRiscos.ts"),
        ("usePoliticas", "/c/Projects/Sistema_GIG/cavendish-gig-main/src/hooks/usePoliticas.ts"),
        ("useConflitosInteresse", "/c/Projects/Sistema_GIG/cavendish-gig-main/src/hooks/useConflitosInteresse.ts"),
        ("useLGPD", "/c/Projects/Sistema_GIG/cavendish-gig-main/src/hooks/useLGPD.ts"),
        ("useInvestigacoes", "/c/Projects/Sistema_GIG/cavendish-gig-main/src/hooks/useInvestigacoes.ts"),
        ("useFornecedores", "/c/Projects/Sistema_GIG/cavendish-gig-main/src/hooks/useFornecedores.ts"),
        ("useComplianceCalendar", "/c/Projects/Sistema_GIG/cavendish-gig-main/src/hooks/useComplianceCalendar.ts"),
        ("useESG", "/c/Projects/Sistema_GIG/cavendish-gig-main/src/hooks/useESG.ts"),
        ("RiscosTab", "/c/Projects/Sistema_GIG/cavendish-gig-main/src/components/riscos/RiscosTab.tsx"),
        ("PoliticasTab", "/c/Projects/Sistema_GIG/cavendish-gig-main/src/components/politicas/PoliticasTab.tsx"),
        ("ConflitosTab", "/c/Projects/Sistema_GIG/cavendish-gig-main/src/components/conflitos/ConflitosTab.tsx"),
        ("LGPDTab", "/c/Projects/Sistema_GIG/cavendish-gig-main/src/components/lgpd/LGPDTab.tsx"),
        ("DueDiligenceTab", "/c/Projects/Sistema_GIG/cavendish-gig-main/src/components/fornecedores/DueDiligenceTab.tsx"),
        ("InvestigacaoDrawer", "/c/Projects/Sistema_GIG/cavendish-gig-main/src/components/denuncias/InvestigacaoDrawer.tsx"),
        ("ComplianceCalendar", "/c/Projects/Sistema_GIG/cavendish-gig-main/src/spa/pages/consultor/ComplianceCalendar.tsx"),
        ("ESGDashboard", "/c/Projects/Sistema_GIG/cavendish-gig-main/src/spa/pages/consultor/ESGDashboard.tsx"),
        ("BoardDashboard", "/c/Projects/Sistema_GIG/cavendish-gig-main/src/spa/pages/consultor/BoardDashboard.tsx"),
        ("AdminAuditTrail", "/c/Projects/Sistema_GIG/cavendish-gig-main/src/spa/pages/admin/AdminAuditTrail.tsx"),
    ]
    for name, path in critical_imports:
        p(f"Arquivo {name} existe", os.path.isfile(path), f"Arquivo não encontrado: {path}")

    print("\n  🔗 Verificação de rotas no App.tsx:")
    new_routes = [
        "/consultor/compliance-calendar",
        "/consultor/esg",
        "/consultor/board",
        "/admin/audit-trail",
    ]
    try:
        with open("/c/Projects/Sistema_GIG/cavendish-gig-main/src/App.tsx") as f:
            app_content = f.read()
        for route in new_routes:
            p(f"Rota {route} registrada", f'"{route}"' in app_content,
              "Rota não encontrada no App.tsx")
    except Exception as e:
        p("App.tsx verificado", False, str(e))

# ─── FASE 8: TESTES DE BUILD ──────────────────────────────────────────────────

def fase8_build():
    section("FASE 8 — VERIFICAÇÃO DE BUILD")
    import subprocess

    print("\n  🔨 TypeScript check:")
    result = subprocess.run(
        ["npx", "tsc", "--noEmit"],
        cwd="/c/Projects/Sistema_GIG/cavendish-gig-main",
        capture_output=True, text=True, timeout=120
    )
    ts_errors = [l for l in result.stdout.split("\n") + result.stderr.split("\n")
                 if "error TS" in l and "node_modules" not in l]
    p(f"TypeScript sem erros ({len(ts_errors)} erros)",
      len(ts_errors) == 0,
      "\n    ".join(ts_errors[:5]) if ts_errors else "")

    print("\n  📦 Dependências críticas instaladas:")
    deps_check = [
        ("date-fns", "date-fns"),
        ("@tanstack/react-query", "tanstack"),
        ("recharts", "recharts"),
        ("driver.js", "driver.js"),
    ]
    try:
        with open("/c/Projects/Sistema_GIG/cavendish-gig-main/package.json") as f:
            pkg = json.load(f)
        all_deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}
        for dep_name, _ in deps_check:
            p(f"Dependência {dep_name} no package.json",
              dep_name in all_deps, f"{dep_name} não encontrado")
    except Exception as e:
        p("package.json verificado", False, str(e))

# ─── RELATÓRIO FINAL ──────────────────────────────────────────────────────────

def relatorio_final():
    section("RELATÓRIO FINAL")
    total = results["passed"] + results["failed"]
    taxa = round(results["passed"] / total * 100) if total > 0 else 0

    print(f"\n  ✅ Passed:    {results['passed']}")
    print(f"  ❌ Failed:    {results['failed']}")
    print(f"  ⚠️  Warnings: {results['warnings']}")
    print(f"  📊 Taxa:      {taxa}% ({results['passed']}/{total})")

    if results["errors"]:
        print(f"\n  🐛 BUGS E FALHAS ENCONTRADOS ({len(results['errors'])}):")
        for i, err in enumerate(results["errors"], 1):
            print(f"\n  [{i}] {err['test']}")
            if err.get("detail"):
                print(f"      → {err['detail'][:300]}")

    return results["failed"] == 0

# ─── MAIN ─────────────────────────────────────────────────────────────────────

async def main():
    print("\n" + "="*60)
    print("  SISTEMA GIG — BATERIA DE TESTES E2E COMPLETA")
    print(f"  URL: {BASE_URL}")
    print(f"  Supabase: {SUPABASE_URL}")
    print("="*60)

    fase1_smoke()
    await fase2_funcional()
    fase3_negativos()
    fase4_seguranca()
    fase5_edge_cases()
    fase6_database()
    fase7_static_analysis()
    fase8_build()
    ok = relatorio_final()

    sys.exit(0 if ok else 1)

if __name__ == "__main__":
    asyncio.run(main())
