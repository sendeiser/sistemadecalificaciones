"""Explore: discover selectors for each module."""
from playwright.sync_api import sync_playwright
import json, sys, os

BASE = "http://localhost:5173"
EMAIL = "e2etest@cgb.edu.ar"
PASS = "Test123456!"
OUT = os.path.dirname(os.path.abspath(__file__))

def log(page, step, msg=""):
    fname = f"{OUT}/explore_{step}.png"
    page.screenshot(path=fname)
    print(f"[{step}] {msg} | screenshot: {fname}")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={"width": 1280, "height": 1800})
    page = ctx.new_page()

    # 1. Welcome page (no auth)
    page.goto(BASE)
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(1500)
    log(page, "01_welcome", f"Title: {page.title()}")
    print(f"  URL: {page.url}")
    print(f"  Links: {[a.get_attribute('href') for a in page.locator('a').all()]}")

    # 2. Login
    page.goto(f"{BASE}/login")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(1500)
    log(page, "02_login_page")
    print(f"  Inputs: {len(page.locator('input').all())}")
    for inp in page.locator('input').all():
        print(f"    <input name={inp.get_attribute('name')} type={inp.get_attribute('type')} placeholder={inp.get_attribute('placeholder')}>")
    print(f"  Buttons: {[b.text_content() for b in page.locator('button').all()]}")

    # 3. Login action
    page.fill('input[type="email"], input[name="email"], input[placeholder*="email" i]', EMAIL)
    page.fill('input[type="password"], input[name="password"], input[placeholder*="contrase" i]', PASS)
    page.locator('button[type="submit"], button:has-text("Ingresar"), button:has-text("Iniciar")').first.click()
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(3000)
    log(page, "03_post_login", f"URL: {page.url}")

    # 4. Dashboard
    print(f"\n  Dashboard URL: {page.url}")
    nav_links = page.locator('a, nav a, [role="menuitem"]').all()
    print(f"  Nav links found: {len(nav_links)}")
    for link in nav_links:
        href = link.get_attribute('href')
        text = link.text_content()
        if href and text:
            print(f"    {text.strip()[:40]} -> {href}")

    # 5. Sidebar / Navigation
    sidebar = page.locator('nav, aside, [class*="sidebar"]').first
    if sidebar.count():
        items = sidebar.locator('a, button').all()
        print(f"\n  Sidebar items: {len(items)}")
        for item in items:
            t = item.text_content(); print(f"    {t[:50].strip() if t else 'N/A'}")

    # 6. Visit key pages
    pages_to_check = [
        "/dashboard", "/grades", "/attendance", "/students", "/subjects",
        "/divisions", "/assignments", "/messages", "/announcements", "/calendar",
        "/reports", "/admin/users", "/settings", "/messages"
    ]
    for route in pages_to_check:
        page.goto(f"{BASE}{route}")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(1500)
        step = f"04_{route.replace('/','_').strip('_')}"
        log(page, step, f"URL: {page.url}")
        h1 = page.locator('h1, h2').first
        h1_text = h1.text_content() if h1.count() > 0 else 'N/A'
        btns = [b.text_content()[:30] for b in page.locator('button').all()[:5] if b.text_content()]
        print(f"\n  [{route}] H1: {h1_text} | Buttons: {btns}")

    browser.close()
