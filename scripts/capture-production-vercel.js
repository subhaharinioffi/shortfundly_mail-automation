import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const PROD_URL = 'https://shortfundly-mail-automation.vercel.app';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = path.resolve(process.cwd(), 'public', 'screenshots_vercel');
const ARTIFACT_DIR = 'C:\\Users\\Subhaharini\\.gemini\\antigravity\\brain\\c707cdc1-8973-4a37-9795-d92dfc5e305b';

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function captureProduction() {
  console.log(`Starting live capture of production site: ${PROD_URL}`);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 2 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--hide-scrollbars']
  });

  const page = await browser.newPage();

  async function snap(name) {
    const localPath = path.join(OUTPUT_DIR, `${name}.png`);
    const artifactPath = path.join(ARTIFACT_DIR, `${name}.png`);
    await page.screenshot({ path: localPath, fullPage: false });
    fs.copyFileSync(localPath, artifactPath);
    console.log(`[CAPTURED] ${name}.png`);
  }

  // 1. Landing Page
  console.log('1. Visiting Landing Page...');
  await page.goto(`${PROD_URL}/`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await snap('01_landing_page');

  // 2. Login Portal
  console.log('2. Visiting Login Page...');
  await page.goto(`${PROD_URL}/login`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));
  await snap('02_login_portal');

  // 3. Login as Admin
  console.log('3. Logging in as Admin (admin@shortfundly.com)...');
  await page.type('input[type="email"]', 'admin@shortfundly.com');
  await page.type('input[type="password"]', 'Admin@ShortFundly2026');
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }).catch(e => console.log('Nav timeout:', e.message))
  ]);
  await new Promise(r => setTimeout(r, 2500));
  console.log('Current URL after login:', page.url());

  // 4. Operations Dashboard
  console.log('4. Operations Dashboard...');
  await page.goto(`${PROD_URL}/dashboard`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await snap('03_operations_dashboard');

  // 5. College Directory
  console.log('5. College Directory...');
  await page.goto(`${PROD_URL}/colleges`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await snap('04_colleges_directory');

  // 6. Test opening Import modal if present
  try {
    const importBtn = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const found = btns.find(b => b.innerText.includes('Import') || b.innerText.includes('Upload'));
      if (found) { found.click(); return true; }
      return false;
    });
    if (importBtn) {
      await new Promise(r => setTimeout(r, 1000));
      await snap('05_colleges_import_modal');
      // close modal if possible
      await page.keyboard.press('Escape');
      await new Promise(r => setTimeout(r, 500));
    }
  } catch (err) {
    console.log('Import modal check:', err.message);
  }

  // 7. Test opening Add College modal if present
  try {
    const addBtn = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const found = btns.find(b => b.innerText.includes('Add College') || b.innerText.includes('New College'));
      if (found) { found.click(); return true; }
      return false;
    });
    if (addBtn) {
      await new Promise(r => setTimeout(r, 1000));
      await snap('06_add_college_modal');
      await page.keyboard.press('Escape');
      await new Promise(r => setTimeout(r, 500));
    }
  } catch (err) {
    console.log('Add college modal check:', err.message);
  }

  // 8. Email Templates
  console.log('8. Email Templates...');
  await page.goto(`${PROD_URL}/templates`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await snap('07_email_templates');

  // 9. Automated Campaigns
  console.log('9. Automated Campaigns...');
  await page.goto(`${PROD_URL}/campaigns`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await snap('08_automated_campaigns');

  // 10. Direct Send / Manual Dispatch
  console.log('10. Direct Send...');
  await page.goto(`${PROD_URL}/manual-send`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await snap('09_manual_direct_send');

  // 11. Outreach Logs
  console.log('11. Outreach Logs...');
  await page.goto(`${PROD_URL}/logs`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await snap('10_delivery_audit_logs');

  // 12. Settings
  console.log('12. Settings...');
  await page.goto(`${PROD_URL}/settings`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await snap('11_settings_deliverability');

  await browser.close();
  console.log('=== ALL PRODUCTION SCREENSHOTS FROM VERCEL SUCCESSFULLY CAPTURED ===');
}

captureProduction().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
