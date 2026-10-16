import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.goto('http://localhost:3002/login', { waitUntil: 'networkidle' });
    console.log('Login page title:', await page.title());
    await page.fill('input[type="email"]', 'admin@shortfundly.com');
    await page.fill('input[type="password"]', 'Admin@ShortFundly2026');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('Successfully logged in! Landed at:', page.url());
  } catch (err) {
    console.error('Login test failed:', err);
  } finally {
    await browser.close();
  }
})();
