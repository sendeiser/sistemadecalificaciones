import asyncio
from playwright.async_api import async_playwright

async def explore():
    async with async_playwright() as p:
        browser = await p.firefox.launch(headless=True)
        page = await browser.new_page(viewport={'width': 1280, 'height': 1800})
        
        await page.goto('http://localhost:5173/login', wait_until='networkidle')
        await page.wait_for_timeout(2000)
        
        print('=== PAGE TITLE ===')
        print(await page.title())
        print(f'URL: {page.url}')
        
        # Get HTML content summary
        text = await page.inner_text('body')
        print('=== VISIBLE TEXT ===')
        print(text[:2000])
        
        await page.screenshot(path='outputs/dashboard_test/login_page.png')
        
        # Try filling login form
        email_input = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i], input[placeholder*="correo" i]')
        pass_input = page.locator('input[type="password"]')
        
        print(f'\nEmail inputs found: {await email_input.count()}')
        print(f'Password inputs found: {await pass_input.count()}')
        
        if await email_input.count() > 0:
            # Print all input fields
            all_inputs = page.locator('input')
            count = await all_inputs.count()
            for i in range(count):
                el = all_inputs.nth(i)
                type_attr = await el.get_attribute('type') or ''
                name_attr = await el.get_attribute('name') or ''
                placeholder = await el.get_attribute('placeholder') or ''
                print(f'  Input[{i}]: type="{type_attr}" name="{name_attr}" placeholder="{placeholder}"')
        
        # Check for buttons
        buttons = page.locator('button')
        bcount = await buttons.count()
        print(f'\nButtons found: {bcount}')
        for i in range(bcount):
            text = await buttons.nth(i).inner_text()
            print(f'  Button[{i}]: "{text.strip()}"')
        
        await browser.close()

asyncio.run(explore())
