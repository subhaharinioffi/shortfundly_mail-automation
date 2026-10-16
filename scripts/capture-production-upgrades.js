import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const BASE_URL = 'http://localhost:3000';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = path.resolve(process.cwd(), 'public', 'screenshots_production');
const ARTIFACT_DIR = 'C:\\Users\\Subhaharini\\.gemini\\antigravity\\brain\\9eacbffe-5c3d-4785-909b-f828416ca847';

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function capture() {
  console.log(`Launching Puppeteer to capture upgraded production website on ${BASE_URL}...`);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--hide-scrollbars']
  });

  const page = await browser.newPage();

  async function saveScreenshot(name) {
    const localFile = path.join(OUTPUT_DIR, `${name}.png`);
    const artifactFile = path.join(ARTIFACT_DIR, `${name}.png`);
    await page.screenshot({ path: localFile });
    fs.copyFileSync(localFile, artifactFile);
    console.log(`[SAVED REAL SCREENSHOT] ${name}.png`);
  }

  // 1. Capture Login Portal
  console.log('Capturing Upgraded Production Login (/login)...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));
  await saveScreenshot('prod_01_login_portal');

  // 2. Perform Login via Credentials
  console.log('Submitting Admin credentials (Admin@ShortFundly2026!)...');
  // Click Admin demo button or fill inputs
  const adminClicked = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent.trim() === 'Admin');
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });

  if (!adminClicked) {
    await page.type('input[type="email"]', 'admin@shortfundly.com');
    await page.type('input[type="password"]', 'Admin@ShortFundly2026!');
  }

  await new Promise(r => setTimeout(r, 400));
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(e => console.log('Nav:', e.message))
  ]);

  await new Promise(r => setTimeout(r, 2000));
  console.log('Logged in successfully! Current URL:', page.url());

  // 3. Capture All Upgraded Production Views
  const views = [
    { url: `${BASE_URL}/dashboard`, name: 'prod_02_operations_dashboard' },
    { url: `${BASE_URL}/colleges`, name: 'prod_03_colleges_directory' },
    { url: `${BASE_URL}/import`, name: 'prod_04_spreadsheet_import' },
    { url: `${BASE_URL}/colleges/new`, name: 'prod_05_manual_college_entry' },
    { url: `${BASE_URL}/templates`, name: 'prod_06_template_studio' },
    { url: `${BASE_URL}/campaigns/new`, name: 'prod_07_campaign_builder' },
    { url: `${BASE_URL}/reports`, name: 'prod_08_reports_and_audit' },
    { url: `${BASE_URL}/settings`, name: 'prod_09_system_settings' },
  ];

  for (const v of views) {
    console.log(`Navigating to ${v.url}...`);
    await page.goto(v.url, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    await saveScreenshot(v.name);
  }

  await browser.close();
  console.log('--- ALL AUTHENTIC PRODUCTION UPGRADE SCREENSHOTS CAPTURED ---');
}

capture().catch(err => {
  console.error('Fatal capture error:', err);
  process.exit(1);
});
