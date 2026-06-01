import asyncio
from playwright.async_api import async_playwright

async def explore_login(role_name, email, password):
    print(f'\n========== TESTING: {role_name.upper()} ==========')
    async with async_playwright() as p:
        browser = await p.firefox.launch(headless=True)
        page = await browser.new_page(viewport={'width': 1280, 'height': 1800})
        
        # Go to login
        await page.goto('http://localhost:5173/login', wait_until='networkidle')
        await page.wait_for_timeout(2000)
        print(f'Login page loaded: {page.url}')
        
        # Fill credentials
        await page.fill('input[type="email"]', email)
        await page.fill('input[type="password"]', password)
        print(f'Filled credentials for {email}')
        
        # Click submit
        await page.click('button:has-text("INICIAR PROTOCOLO")')
        await page.wait_for_timeout(3000)
        print(f'After login URL: {page.url}')
        
        # Wait a bit more for dashboard to load
        await page.wait_for_timeout(3000)
        
        # Screenshot dashboard
        await page.screenshot(path=f'outputs/dashboard_test/dashboard_{role_name}.png', full_page=True)
        
        # Get visible text
        text = await page.inner_text('body')
        print(f'\n=== DASHBOARD TEXT ({role_name}) ===')
        print(text[:3000])
        
        await browser.close()

async def main():
    await explore_login('admin', 'admin@cgb.edu.ar', 'admin123')
    await explore_login('docente', 'docente1@cgb.edu.ar', 'admin123')
    await explore_login('alumno', 'alumno1@cgb.edu.ar', 'Escuela123')

asyncio.run(main())
