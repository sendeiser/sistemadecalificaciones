from playwright.sync_api import sync_playwright

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
    page.wait_for_timeout(3000)

    text = page.inner_text("body")
    print("=== PAGE TEXT ===")
    print(text[:5000])

    print()
    print("=== ELEMENTS ===")
    buttons = page.locator("button").all()
    print("Buttons:", len(buttons))
    links = page.locator("a").all()
    print("Links:", len(links))
    headings = page.locator("h1, h2, h3").all()
    print("Headings:", len(headings))

    print()
    print("=== HEADINGS ===")
    for h in headings:
        if h.is_visible():
            tag = h.evaluate("el => el.tagName")
            txt = h.inner_text()[:80]
            print(f"  {tag}: {txt}")

    print()
    print("=== VISIBLE BUTTON TEXT ===")
    for b in buttons:
        if b.is_visible():
            t = b.inner_text()[:60]
            if t.strip():
                print(f"  {t}")

    browser.close()
