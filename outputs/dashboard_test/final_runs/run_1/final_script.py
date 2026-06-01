"""
Dashboard E2E Test for CGB School Management System
Tests login and dashboard views for: admin, docente, alumno
"""
import os, sys, json
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:5173"
SCREENSHOT_DIR = os.path.join(os.path.dirname(__file__), "screenshots")
LOG_FILE = os.path.join(os.path.dirname(__file__), "final_script_log.txt")
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

USERS = [
    {"role": "admin",   "email": "admin@cgb.edu.ar",      "password": "admin123"},
    {"role": "docente", "email": "docente1@cgb.edu.ar",    "password": "admin123"},
    {"role": "alumno",  "email": "alumno1@cgb.edu.ar",     "password": "Escuela123"},
]

def log(msg):
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(msg + "\n")
    print(msg)

def screenshot(page, name):
    path = os.path.join(SCREENSHOT_DIR, name)
    page.screenshot(path=path, full_page=True)
    log(f"  Screenshot saved: {name}")

def run():
    # Reset log
    with open(LOG_FILE, "w", encoding="utf-8") as f:
        f.write("Dashboard E2E Test Run\n====================\n")

    with sync_playwright() as p:
        browser = p.firefox.launch(headless=True)

        # Helper to test a single role
        def test_role(role_name, email, password, cp_start):
            nonlocal browser
            context = browser.new_context(viewport={"width": 1280, "height": 1800})
            page = context.new_page()
            page.goto(f"{BASE_URL}/login", wait_until="domcontentloaded")
            page.wait_for_timeout(2000)
            page.wait_for_selector('input[type="email"]', timeout=15000)
            page.fill('input[type="email"]', email)
            page.fill('input[type="password"]', password)
            page.click('button:has-text("INICIAR")')
            page.wait_for_timeout(3000)
            assert "/dashboard" in page.url, f"{role_name} not at dashboard: {page.url}"
            log(f"  CP{cp_start}: {role_name} login OK -> redirected to /dashboard")
            page.wait_for_timeout(2000)
            screenshot(page, f"02_{role_name}_dashboard.png")
            context.close()
            return page

        # ====== 1. LOGIN PAGE LOAD ======
        log("\n[CP1] Login page loads correctly")
        ctx = browser.new_context(viewport={"width": 1280, "height": 1800})
        page = ctx.new_page()
        page.goto(f"{BASE_URL}/login", wait_until="domcontentloaded")
        page.wait_for_timeout(2000)
        page.wait_for_selector('input[type="email"]', timeout=15000)
        screenshot(page, "01_login_page.png")

        title = page.title()
        assert "Gesti" in title or "CGB" in title or "PORTAL" in title, f"Title mismatch: {title}"
        assert page.locator('input[type="email"]').is_visible(), "Email input not found"
        assert page.locator('input[type="password"]').is_visible(), "Password input not found"
        assert page.locator('button:has-text("INICIAR")').is_visible(), "Login button not found"
        log(f"  PASS: Login page OK. Title='{title}'")
        log(f"  step 1 action: CP1 verified - Login page loaded with email, password, and submit button")
        ctx.close()

        # ====== 2. ADMIN DASHBOARD ======
        log("\n[CP2-4] Admin dashboard")
        ctx = browser.new_context(viewport={"width": 1280, "height": 1800})
        page = ctx.new_page()
        page.goto(f"{BASE_URL}/login", wait_until="domcontentloaded")
        page.wait_for_timeout(2000)
        page.wait_for_selector('input[type="email"]', timeout=15000)
        page.fill('input[type="email"]', USERS[0]["email"])
        page.fill('input[type="password"]', USERS[0]["password"])
        page.click('button:has-text("INICIAR")')
        page.wait_for_timeout(3000)
        assert "/dashboard" in page.url, f"Admin not at dashboard: {page.url}"
        log(f"  CP2: Admin login OK")
        page.wait_for_timeout(2000)
        screenshot(page, "02_admin_dashboard.png")

        body = page.inner_text("body")
        assert "PANEL DE CONTROL" in body, "Admin: PANEL DE CONTROL not found"
        assert "ESTUDIANTES" in body, "Admin: ESTUDIANTES stat missing"
        assert "DIVISIONES" in body, "Admin: DIVISIONES stat missing"
        log("  CP3: Admin sees PANEL DE CONTROL + stats (ESTUDIANTES, DIVISIONES)")

        assert "OPERACI" in body, "Admin: OPERACIÓN DIARIA tab missing"
        assert "CONFIGURACI" in body, "Admin: CONFIGURACIÓN tab missing"
        assert "REPORTES" in body, "Admin: REPORTES tab missing"
        log("  CP4: Admin tabs visible")
        ctx.close()

        # ====== 3. DOCENTE DASHBOARD ======
        log("\n[CP5-7] Docente dashboard")
        ctx = browser.new_context(viewport={"width": 1280, "height": 1800})
        page = ctx.new_page()
        page.goto(f"{BASE_URL}/login", wait_until="domcontentloaded")
        page.wait_for_timeout(2000)
        page.wait_for_selector('input[type="email"]', timeout=15000)
        page.fill('input[type="email"]', USERS[1]["email"])
        page.fill('input[type="password"]', USERS[1]["password"])
        page.click('button:has-text("INICIAR")')
        page.wait_for_timeout(3000)
        assert "/dashboard" in page.url, f"Docente not at dashboard: {page.url}"
        log(f"  CP5: Docente login OK")
        page.wait_for_timeout(2000)
        screenshot(page, "03_docente_dashboard.png")

        body = page.inner_text("body")
        assert "PANEL DE CONTROL" in body, "Docente: PANEL DE CONTROL not found"
        assert "ASISTENCIA" in body, "Docente: ASISTENCIA quick action missing"
        assert "CARGAR NOTAS" in body or "CARGA" in body, "Docente: CARGAR NOTAS missing"
        log("  CP6: Docente quick action cards visible")

        assert "MIS CURSOS" in body or "CURSOS" in body, "Docente: MIS CURSOS missing"
        assert "MIS MATERIAS" in body, "Docente: MIS MATERIAS stat missing"
        log("  CP7: Docente sees MIS CURSOS and MIS MATERIAS")
        ctx.close()

        # ====== 4. ALUMNO DASHBOARD ======
        log("\n[CP8-10] Alumno dashboard")
        ctx = browser.new_context(viewport={"width": 1280, "height": 1800})
        page = ctx.new_page()
        page.goto(f"{BASE_URL}/login", wait_until="domcontentloaded")
        page.wait_for_timeout(2000)
        page.wait_for_selector('input[type="email"]', timeout=15000)
        page.fill('input[type="email"]', USERS[2]["email"])
        page.fill('input[type="password"]', USERS[2]["password"])
        page.click('button:has-text("INICIAR")')
        page.wait_for_timeout(3000)
        assert "/dashboard" in page.url, f"Alumno not at dashboard: {page.url}"
        log(f"  CP8: Alumno login OK")
        page.wait_for_timeout(2000)
        screenshot(page, "04_alumno_dashboard.png")

        body = page.inner_text("body")
        assert "PANEL DE CONTROL" in body, "Alumno: PANEL DE CONTROL not found"
        assert "BOLET" in body or "Bolet" in body, "Alumno: MI BOLETÍN card missing"
        log("  CP9: Alumno sees MI BOLETÍN")

        assert "MENSAJES" in body, "Alumno: MENSAJES card missing"
        assert "CALENDARIO" in body, "Alumno: CALENDARIO card missing"
        assert "ANUNCIOS" in body, "Alumno: ANUNCIOS card missing"
        log("  CP10: Alumno cards (MENSAJES, CALENDARIO, ANUNCIOS) visible")

        assert "AUDITOR" not in body, "Alumno should not see AUDITORÍA"
        ctx.close()

        # ====== SUMMARY ======
        log("\n" + "=" * 50)
        log("DASHBOARD E2E TEST COMPLETE")
        log("Roles tested: admin, docente, alumno")
        log("All critical points verified")
        log("Screenshots saved to: " + SCREENSHOT_DIR)
        log("=" * 50)
        log("Final result: ALL TESTS PASSED")

        browser.close()

if __name__ == "__main__":
    run()
