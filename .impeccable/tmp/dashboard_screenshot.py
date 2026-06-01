from playwright.sync_api import sync_playwright
import os

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})

    page.goto("http://localhost:5173/login")
    page.wait_for_load_state("networkidle")

    page.fill("input[type=email]", "e2etest@cgb.edu.ar")
    page.fill("input[type=password]", "Test123456!")
    page.click("button[type=submit]")

    page.wait_for_url("**/dashboard", timeout=15000)
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2000)

    os.makedirs(".impeccable/tmp", exist_ok=True)
    page.screenshot(path=".impeccable/tmp/dashboard_screenshot.png", full_page=True)
    print("Screenshot saved to .impeccable/tmp/dashboard_screenshot.png")
    browser.close()
