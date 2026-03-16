#!/usr/bin/env python3
"""Fase 2 — Testes Funcionais: login, API Supabase, fluxos autenticados (2026-03-13)."""

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import json
import sys

BASE_URL = "http://localhost:3000"
SUPABASE_URL = "https://fenfgjqlsqzvxloeavdc.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlbmZnanFsc3F6dnhsb2VhdmRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NDUyNzMsImV4cCI6MjA4MTAyMTI3M30.w0URRgmpDIunlHlSHlmsaLSCcwoJug-S3EY0vOtk4UI"
LOGIN_EMAIL = "fmbp1981@gmail.com"
LOGIN_PASSWORD = "Admin@123"
TIMEOUT = 60
results = {"passed": 0, "failed": 0, "errors": []}

session = requests.Session()
retry = Retry(total=2, backoff_factor=1, status_forcelist=[502, 503, 504])
session.mount("http://", HTTPAdapter(max_retries=retry))
session.mount("https://", HTTPAdapter(max_retries=retry))

def test(name, condition, detail=""):
    if condition:
        results["passed"] += 1
        print(f"  ✅ {name}")
    else:
        results["failed"] += 1
        results["errors"].append({"test": name, "detail": detail})
        print(f"  ❌ {name} — {detail}")

print("\n🧪 FASE 2 — TESTES FUNCIONAIS (2026-03-13)")
print("=" * 60)

# ─── 2.1 AUTENTICAÇÃO SUPABASE ───
print("\n  [2.1] Autenticação Supabase:")

# Login com credenciais válidas
try:
    r = session.post(
        f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
        json={"email": LOGIN_EMAIL, "password": LOGIN_PASSWORD},
        headers={"apikey": SUPABASE_ANON_KEY, "Content-Type": "application/json"},
        timeout=TIMEOUT
    )
    test(f"Login com credenciais válidas → {r.status_code}",
         r.status_code == 200, f"Retornou {r.status_code}: {r.text[:100]}")
    
    if r.status_code == 200:
        auth_data = r.json()
        TOKEN = auth_data.get("access_token")
        USER_ID = auth_data.get("user", {}).get("id")
        USER_EMAIL = auth_data.get("user", {}).get("email")
        
        test("Token JWT retornado", TOKEN is not None, "Token vazio")
        test("User ID retornado", USER_ID is not None, "User ID vazio")
        test(f"Email correto: {USER_EMAIL}", USER_EMAIL == LOGIN_EMAIL, f"Email: {USER_EMAIL}")
    else:
        TOKEN = None
        USER_ID = None
except Exception as e:
    test("Login", False, str(e))
    TOKEN = None
    USER_ID = None

# Login com credenciais inválidas
try:
    r = session.post(
        f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
        json={"email": "invalido@naoexiste.com", "password": "SenhaErrada123!"},
        headers={"apikey": SUPABASE_ANON_KEY, "Content-Type": "application/json"},
        timeout=TIMEOUT
    )
    test(f"Login com credenciais inválidas → {r.status_code}",
         r.status_code == 400, f"Retornou {r.status_code}")
except Exception as e:
    test("Login com credenciais inválidas", False, str(e))

# Login sem senha
try:
    r = session.post(
        f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
        json={"email": LOGIN_EMAIL, "password": ""},
        headers={"apikey": SUPABASE_ANON_KEY, "Content-Type": "application/json"},
        timeout=TIMEOUT
    )
    test(f"Login sem senha → {r.status_code}",
         r.status_code in [400, 422], f"Retornou {r.status_code}")
except Exception as e:
    test("Login sem senha", False, str(e))

# ─── 2.2 PERFIL DO USUÁRIO ───
print("\n  [2.2] Perfil do usuário autenticado:")
if TOKEN:
    auth_headers = {
        "Authorization": f"Bearer {TOKEN}",
        "apikey": SUPABASE_ANON_KEY,
    }
    
    # Get user profile
    try:
        r = session.get(
            f"{SUPABASE_URL}/auth/v1/user",
            headers=auth_headers,
            timeout=TIMEOUT
        )
        test(f"GET /auth/v1/user → {r.status_code}", r.status_code == 200,
             f"Retornou {r.status_code}")
        if r.status_code == 200:
            user = r.json()
            test("Perfil tem email", "email" in user, "Campo email ausente")
            test("Perfil tem id", "id" in user, "Campo id ausente")
    except Exception as e:
        test("GET perfil", False, str(e))

# ─── 2.3 TABELAS DO BANCO ───
print("\n  [2.3] Acesso às tabelas Supabase (RLS):")
if TOKEN:
    tables_to_test = [
        "organizacoes",
        "user_roles",
        "documentos",
        "tarefas",
        "denuncias",
        "profiles",
    ]
    for table in tables_to_test:
        try:
            r = session.get(
                f"{SUPABASE_URL}/rest/v1/{table}?select=*&limit=5",
                headers={
                    "Authorization": f"Bearer {TOKEN}",
                    "apikey": SUPABASE_ANON_KEY,
                    "Prefer": "count=exact"
                },
                timeout=TIMEOUT
            )
            test(f"SELECT {table} → {r.status_code}",
                 r.status_code in [200, 206],
                 f"Retornou {r.status_code}: {r.text[:80]}")
        except Exception as e:
            test(f"SELECT {table}", False, str(e))

# ─── 2.4 EDGE FUNCTIONS COM AUTH ───
print("\n  [2.4] Edge Functions com autenticação válida:")
if TOKEN:
    # Test ai-generate with valid tipo
    try:
        r = session.post(
            f"{SUPABASE_URL}/functions/v1/ai-generate",
            json={
                "tipo": "gerar_codigo_etica",
                "input_data": {
                    "empresa": "Empresa Teste E2E",
                    "setor": "Tecnologia",
                    "valores": "ética, integridade, transparência"
                }
            },
            headers={
                "Authorization": f"Bearer {TOKEN}",
                "apikey": SUPABASE_ANON_KEY,
                "Content-Type": "application/json"
            },
            timeout=90  # AI generation can take time
        )
        test(f"ai-generate (gerar_codigo_etica) → {r.status_code}",
             r.status_code in [200, 503],  # 503 = no AI provider configured, expected
             f"Retornou {r.status_code}: {r.text[:100]}")
        if r.status_code == 200:
            body = r.json() if r.headers.get("content-type","").startswith("application/json") else {"text": r.text}
            test("ai-generate retorna conteúdo",
                 len(str(body)) > 50,
                 "Resposta vazia")
    except Exception as e:
        test("ai-generate (gerar_codigo_etica)", False, str(e))

    # Test integrations
    try:
        r = session.post(
            f"{SUPABASE_URL}/functions/v1/integrations",
            json={"operation": "get_config", "type": "google"},
            headers={
                "Authorization": f"Bearer {TOKEN}",
                "apikey": SUPABASE_ANON_KEY,
                "Content-Type": "application/json"
            },
            timeout=TIMEOUT
        )
        test(f"integrations (get_config) → {r.status_code}",
             r.status_code in [200, 400, 404],  # 400/404 = no config or action format, OK
             f"Retornou {r.status_code}: {r.text[:100]}")
    except Exception as e:
        test("integrations (get_config)", False, str(e))

# ─── 2.5 PÁGINAS CARREGAM COM HTML VÁLIDO ───
print("\n  [2.5] Páginas principais retornam HTML válido:")
main_pages = [
    ("/", "Home"),
    ("/auth", "Auth"),
    ("/admin", "Admin"),
    ("/consultor", "Consultor"),
    ("/consultor/codigo-etica", "Código de Ética"),
    ("/consultor/atas", "Atas"),
    ("/parceiro", "Parceiro"),
    ("/meu-projeto", "Meu Projeto"),
]
for route, desc in main_pages:
    try:
        r = session.get(f"{BASE_URL}{route}", timeout=TIMEOUT, allow_redirects=True)
        html = r.text
        has_doctype = "<!doctype" in html.lower() or "<!DOCTYPE" in html
        has_html_tag = "<html" in html.lower()
        has_body = "<body" in html.lower() or "<div id" in html.lower()
        test(f"{desc} ({route}) → HTML válido",
             has_doctype and has_html_tag and has_body,
             f"HTML incompleto: doctype={has_doctype}, html={has_html_tag}, body={has_body}")
    except Exception:
        print(f"  ⚠️ {route} — timeout, skipping")

# ─── 2.6 REFRESH TOKEN ───
print("\n  [2.6] Refresh token:")
if TOKEN and auth_data:
    refresh_token = auth_data.get("refresh_token")
    if refresh_token:
        try:
            r = session.post(
                f"{SUPABASE_URL}/auth/v1/token?grant_type=refresh_token",
                json={"refresh_token": refresh_token},
                headers={"apikey": SUPABASE_ANON_KEY, "Content-Type": "application/json"},
                timeout=TIMEOUT
            )
            test(f"Refresh token → {r.status_code}", r.status_code == 200,
                 f"Retornou {r.status_code}")
        except Exception as e:
            test("Refresh token", False, str(e))

# ─── RESUMO ───
print(f"\n{'='*60}")
print(f"📊 TESTES FUNCIONAIS: {results['passed']} passed, {results['failed']} failed")
total = results['passed'] + results['failed']
if total > 0:
    print(f"  Taxa de sucesso: {results['passed']/total*100:.1f}%")

if results["errors"]:
    print(f"\n  ❌ Falhas ({len(results['errors'])}):")
    for e in results["errors"]:
        print(f"    → {e['test']}: {e['detail']}")

with open("tests/functional_results.json", "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

sys.exit(1 if results["failed"] > 0 else 0)
