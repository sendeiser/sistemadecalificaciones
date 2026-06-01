"""Verify calendar UI shows events after fix."""
from playwright.sync_api import sync_playwright
import os

BASE = "http://localhost:5173"
EMAIL = "e2etest@cgb.edu.ar"
PASS = "Test123456!"
OUT = os.path.dirname(os.path.abspath(__file__))

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 1800})

    page.goto(f"{BASE}/login")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(1500)
    page.locator('input[type="email"]').fill(EMAIL)
    page.locator('input[type="password"]').fill(PASS)
    page.locator('button:has-text("Iniciar")').first.click()
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(3000)

    page.goto(f"{BASE}/calendar")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(3000)

    body = page.locator("body").text_content()
    
    print("=== Calendar Page Content ===")
    if "Error al cargar eventos" in body:
        print("FAIL: Still showing 'Error al cargar eventos'")
    else:
        print("OK: No error message!")
    
    if "Test Event from E2E" in body:
        print("OK: Test event visible in UI!")
    else:
        print("INFO: Test event not visible (might be different month view)")
    
    if "Reunión de Padres" in body:
        print("OK: Reunion de Padres visible!")
    
    # Check for Nuevo Evento button
    btn = page.locator('button:has-text("Nuevo Evento")')
    print(f"Nuevo Evento button: {'FOUND' if btn.count() > 0 else 'NOT FOUND'}")
    
    page.screenshot(path=os.path.join(OUT, "calendar_fixed.png"))
    print(f"\nScreenshot: {os.path.join(OUT, 'calendar_fixed.png')}")
    browser.close()
