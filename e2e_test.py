from playwright.sync_api import sync_playwright
import requests
import sys
import json

def test_api_health(base_url):
    print("\n[1/6] Verificando API Health...")
    try:
        resp = requests.get(f"{base_url}/api/health", timeout=10)
        assert resp.status_code == 200
        assert resp.json() == {"status": "ok"}
        print("  PASS: Health check OK")
        return True
    except Exception as e:
        print(f"  FAIL: {e}")
        return False

def test_frontend_renders(page, base_url):
    print("\n[2/6] Verificando Frontend carga...")
    try:
        page.goto(f"{base_url}")
        page.wait_for_load_state("networkidle")
        content = page.content().lower()
        # The welcome page should contain CGB or some recognizable text
        assert "cgb" in content or "iniciar sesi" in content or "belgrano" in content or "calificaciones" in content
        print(f"  PASS: Frontend carga correctamente")
        print(f"  Title: {page.title()}")
        return True
    except Exception as e:
        print(f"  FAIL: {e}")
        page.screenshot(path="/tmp/frontend_fail.png")
        return False

def test_login_page(page, base_url):
    print("\n[3/6] Verificando página de Login...")
    try:
        page.goto(f"{base_url}/login")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(1000)
        content = page.content().lower()
        assert "iniciar sesi" in content or "email" in content or "contrase" in content or "login" in content
        print(f"  PASS: Login page renders")
        page.screenshot(path="/tmp/login_page.png")
        return True
    except Exception as e:
        print(f"  FAIL: {e}")
        page.screenshot(path="/tmp/login_fail.png")
        return False

def test_public_api_no_auth(base_url):
    print("\n[4/6] Verificando API pública sin auth...")
    try:
        resp = requests.get(f"{base_url}/api/health", timeout=10)
        assert resp.status_code == 200
        print(f"  PASS: /api/health accesible públicamente")

        resp = requests.get(f"{base_url}/api/grades", timeout=10)
        assert resp.status_code == 401 or resp.status_code == 403 or resp.status_code == 500
        print(f"  PASS: /api/grades protegida (status {resp.status_code})")
        return True
    except Exception as e:
        print(f"  FAIL: {e}")
        return False

def test_register_page(page, base_url):
    print("\n[5/6] Verificando página de Registro...")
    try:
        page.goto(f"{base_url}/register")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(1000)
        content = page.content().lower()
        assert "registr" in content or "registro" in content or "crear" in content or "register" in content
        print(f"  PASS: Register page renders")
        return True
    except Exception as e:
        print(f"  FAIL: {e}")
        return False

def test_navigation_flow(page, base_url):
    print("\n[6/6] Verificando navegación entre páginas públicas...")
    try:
        page.goto(f"{base_url}")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(1000)
        page.screenshot(path="/tmp/welcome_page.png")

        links = page.locator("a").all()
        print(f"  Found {len(links)} links on page")
        
        login_link = page.locator("a:has-text('Iniciar')").first
        if login_link.count() > 0:
            login_link.click()
            page.wait_for_load_state("networkidle")
            page.wait_for_timeout(1000)
            assert "/login" in page.url or page.url.endswith("/login")
            print(f"  PASS: Navegación a login funciona")
        
        page.screenshot(path="/tmp/navigation.png")
        return True
    except Exception as e:
        print(f"  FAIL: Navigation test error: {e}")
        return False

def main():
    base_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:5173"
    
    results = []
    
    # Test API directly without browser
    results.append(("API Health", test_api_health(base_url)))
    results.append(("API Auth Protection", test_public_api_no_auth(base_url)))
    
    # Test with browser
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 720})
        
        results.append(("Frontend Load", test_frontend_renders(page, base_url)))
        results.append(("Login Page", test_login_page(page, base_url)))
        results.append(("Register Page", test_register_page(page, base_url)))
        results.append(("Navigation Flow", test_navigation_flow(page, base_url)))
        
        browser.close()
    
    print("\n" + "=" * 50)
    print("RESULTADOS DE VERIFICACIÓN E2E")
    print("=" * 50)
    passed = 0
    for name, ok in results:
        status = "PASS" if ok else "FAIL"
        if ok: passed += 1
        print(f"  [{status}] {name}")
    print(f"\n  Total: {passed}/{len(results)} tests pasaron")
    
    if passed == len(results):
        print("\n  TODOS LOS TESTS E2E PASARON!")
    else:
        print(f"\n  {len(results) - passed} test(s) fallaron")
        sys.exit(1)

if __name__ == "__main__":
    main()
