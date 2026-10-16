import puppeteer from 'puppeteer-core';
import fs from 'fs';

async function snap() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox', '--hide-scrollbars']
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });

  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Admin');
    if (btn) btn.click();
  });

  await new Promise(r => setTimeout(r, 400));
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: 'networkidle2' })
  ]);

  console.log('Navigated to dashboard. Waiting for PostgreSQL metrics...');
  await new Promise(r => setTimeout(r, 5000));

  await page.screenshot({ path: 'public/screenshots_production/prod_02_operations_dashboard.png' });
  fs.copyFileSync(
    'public/screenshots_production/prod_02_operations_dashboard.png',
    'C:\\Users\\Subhaharini\\.gemini\\antigravity\\brain\\9eacbffe-5c3d-4785-909b-f828416ca847\\prod_02_operations_dashboard.png'
  );

  console.log('Successfully captured loaded dashboard screenshot!');
  await browser.close();
}

snap().catch(console.error);
