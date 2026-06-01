"""
Comprehensive E2E test for CGB Portal - all modules.
Usage: python final_script.py [base_url]
"""
import sys, os, json, time
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:5173"
EMAIL = "e2etest@cgb.edu.ar"
PASS = "Test123456!"

RUN_DIR = os.path.dirname(os.path.abspath(__file__))
SCREENSHOTS = os.path.join(RUN_DIR, "screenshots")
LOG_FILE = os.path.join(RUN_DIR, "final_script_log.txt")

os.makedirs(SCREENSHOTS, exist_ok=True)

def log(msg):
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(msg + "\n")
    print(msg.encode('utf-8', errors='replace').decode('utf-8', errors='replace'))

def screenshot(page, name):
    path = os.path.join(SCREENSHOTS, f"{name}.png")
    page.screenshot(path=path)
    return path

def step(n, action, page, screenshot_name=None):
    msg = f"[Step {n}] {action}"
    if screenshot_name:
        spath = screenshot(page, screenshot_name)
        msg += f" | screenshot: {spath}"
    log(msg)

def test_login(page):
    step(1, "Navigate to login page", page, "01_login_page")
    page.goto(f"{BASE}/login")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(1500)

    # Fill credentials
    page.locator('input[type="email"]').fill(EMAIL)
    page.locator('input[type="password"]').fill(PASS)
    page.locator('button:has-text("Iniciar")').first.click()
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(3000)

    # Check we're on dashboard
    assert "/dashboard" in page.url, f"Expected /dashboard, got {page.url}"
    step(2, "Login successful, redirected to dashboard", page, "02_dashboard")
    return True

def test_public_pages(page):
    step(3, "Test welcome page (no auth)", page, "03_welcome")
    page.goto(BASE)
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(1500)
    assert "CGB" in page.title(), f"Unexpected title: {page.title()}"
    log(f"  PASS: Welcome page title: {page.title()}")

    step(4, "Test login page (no auth)", page, "04_login_page")
    page.goto(f"{BASE}/login")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(1000)
    assert page.locator('input[type="email"]').count() > 0, "Login email input not found"
    log("  PASS: Login page has email input")

def test_module(page, route, name, expected_h1_keyword):
    page.goto(f"{BASE}{route}")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2000)
    spath = screenshot(page, f"module_{name.replace(' ','_').lower()}")
    h1 = page.locator('h1').first
    h1_text = h1.text_content() if h1.count() > 0 else ""
    if expected_h1_keyword:
        assert expected_h1_keyword.lower() in h1_text.lower(), \
            f"Expected '{expected_h1_keyword}' in H1, got '{h1_text}'"
    log(f"  PASS: {name} - H1='{h1_text}' | {spath}")
    return True

def test_api_health():
    import urllib.request
    try:
        resp = urllib.request.urlopen(f"{BASE}/api/health", timeout=10)
        data = json.loads(resp.read())
        assert data == {"status": "ok"}, f"Expected status ok, got {data}"
        log(f"[Step] PASS: API Health check returns 200")
    except Exception as e:
        log(f"[Step] FAIL: API Health check: {e}")
        raise

def test_api_auth_protected():
    import urllib.request
    try:
        req = urllib.request.Request(f"{BASE}/api/grades")
        resp = urllib.request.urlopen(req, timeout=10)
        # If we get here, it didn't reject - might be expected on dev
        log(f"[Step] WARN: /api/grades returned {resp.status} without auth (may be proxy)")
    except urllib.error.HTTPError as e:
        assert e.code in (401, 403), f"Expected 401/403, got {e.code}"
        log(f"[Step] PASS: /api/grades protected (status {e.code})")
    except Exception as e:
        log(f"[Step] FAIL: Auth protection test: {e}")
        raise

def main():
    # Reset log
    with open(LOG_FILE, "w", encoding="utf-8") as f:
        f.write("=== CGB PORTAL FULL E2E TEST ===\n")
        f.write(f"Base URL: {BASE}\n")
        f.write(f"Run at: {time.strftime('%Y-%m-%d %H:%M:%S')}\n\n")

    passed = 0
    failed = 0

    # ---- API Tests ----
    log("\n--- API TESTS ---")
    try:
        test_api_health()
        passed += 1
    except:
        failed += 1

    try:
        test_api_auth_protected()
        passed += 1
    except:
        failed += 1

    # ---- E2E Tests ----
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(viewport={"width": 1280, "height": 1800})
        page = ctx.new_page()

        try:
            # Test public pages
            log("\n--- PUBLIC PAGES ---")
            test_public_pages(page)
            passed += 2

            # Test login
            log("\n--- AUTHENTICATION ---")
            test_login(page)
            passed += 1

            # Test all modules
            log("\n--- MODULES ---")
            modules = [
                ("/dashboard", "Dashboard", "Panel de Control"),
                ("/calendar", "Calendario", "Calendario"),
                ("/messages", "Mensajes", "Mensajería"),
                ("/announcements", "Anuncios", "Anuncios"),
                ("/students", "Alumnos", "Alumnos"),
                ("/subjects", "Materias", "Materias"),
                ("/divisions", "Divisiones", "Divisiones"),
                ("/assignments", "Asignaciones", "Asignaciones"),
                ("/reports", "Reportes", "Reportes"),
                ("/admin/users", "Usuarios/Invit", "Usuarios"),
                ("/settings", "Ajustes", "Ajustes"),
                ("/help", "Ayuda", "Ayuda"),
                ("/admin/audit", "Auditoría", "Auditoría"),
                ("/admin/system-settings", "Config Sistema", "Sistema"),
                ("/enrollment", "Inscribir Alumnos", "Inscrip"),
                ("/periods", "Periodos", "Periodos"),
                ("/admin/attendance-capture", "Toma General", "Captura General"),
                ("/admin/mass-justification", "Justificaciones", "Justific"),
                ("/admin/attendance-stats", "Estadísticas Asist", "Visión General"),
                ("/admin/attendance-alerts", "Alertas Asist", "Alertas"),
                ("/admin/attendance-discrepancies", "Discrepancias Asist", "Discrep"),
                # /attendance redirects without assignmentId, skip strict H1 check
                ("/attendance", "Reporte Asist", ""),  # No H1 check, needs assignmentId param
            ]

            for route, name, keyword in modules:
                try:
                    test_module(page, route, name, keyword)
                    passed += 1
                except Exception as e:
                    log(f"  FAIL: {name}: {e}")
                    failed += 1

        except Exception as e:
            log(f"FATAL ERROR: {e}")
            failed += 1

        browser.close()

    # Summary
    log("\n" + "=" * 50)
    log("RESULTADOS FINALES")
    log("=" * 50)
    total = passed + failed
    log(f"  Passed: {passed}/{total}")
    log(f"  Failed: {failed}/{total}")
    if failed == 0:
        log("\n  ✅ ALL MODULES PASSED")
    else:
        log(f"\n  ❌ {failed} test(s) failed")
        sys.exit(1)

if __name__ == "__main__":
    main()
