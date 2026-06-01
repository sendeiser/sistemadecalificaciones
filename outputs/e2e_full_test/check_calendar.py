"""Check calendar API - direct API test + UI verification."""
from playwright.sync_api import sync_playwright
import os, json, urllib.request

BASE = "http://localhost:5173"
EMAIL = "e2etest@cgb.edu.ar"
PASS = "Test123456!"
OUT = os.path.dirname(os.path.abspath(__file__))

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 1800})

    # Login
    page.goto(f"{BASE}/login")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(1500)
    page.locator('input[type="email"]').fill(EMAIL)
    page.locator('input[type="password"]').fill(PASS)
    page.locator('button:has-text("Iniciar")').first.click()
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(3000)
    print(f"Logged in: {'/dashboard' in page.url}")

    # Extract session token from localStorage
    token = page.evaluate("""() => {
        try {
            const raw = localStorage.getItem('supabase.auth.token');
            if (raw) {
                const parsed = JSON.parse(raw);
                return parsed.currentSession?.access_token || null;
            }
            return null;
        } catch(e) { return null; }
    }""")
    print(f"Token extracted: {bool(token)}")

    if token:
        # Call calendar API directly
        req = urllib.request.Request(
            f"{BASE}/api/calendar",
            headers={"Authorization": f"Bearer {token}"}
        )
        try:
            resp = urllib.request.urlopen(req, timeout=10)
            data = json.loads(resp.read())
            print(f"\n=== Calendar API: {resp.status} ===")
            if isinstance(data, list):
                print(f"Events count: {len(data)}")
                if len(data) > 0:
                    print(f"First 3 events:")
                    for ev in data[:3]:
                        print(json.dumps(ev, indent=2, ensure_ascii=False))
                else:
                    print("NO EVENTS - array is empty")
            else:
                print(f"Response type: {type(data).__name__}")
                print(json.dumps(data, indent=2, ensure_ascii=False)[:500])
        except urllib.error.HTTPError as e:
            print(f"\n=== Calendar API Error: {e.code} ===")
            print(e.read().decode()[:500])
        except Exception as e:
            print(f"\n=== Calendar API exception: {e} ===")

    # Check UI for error messages
    page.goto(f"{BASE}/calendar")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(3000)

    body_text = page.locator("body").text_content()
    if "Error" in body_text:
        idx = body_text.index("Error")
        print(f"\n=== UI Error context ===")
        print(body_text[max(0,idx-50):idx+200])
    
    page.screenshot(path=os.path.join(OUT, "calendar_error_check.png"))
    print(f"\nScreenshot: {os.path.join(OUT, 'calendar_error_check.png')}")
    browser.close()
