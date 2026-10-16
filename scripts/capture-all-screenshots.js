import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const BASE_URL = 'http://localhost:3005';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = path.resolve(process.cwd(), 'public', 'screenshots');
const ARTIFACT_DIR = 'C:\\Users\\Subhaharini\\.gemini\\antigravity\\brain\\9eacbffe-5c3d-4785-909b-f828416ca847';

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function capture() {
  console.log(`Connecting to ${BASE_URL} via Puppeteer...`);
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
    console.log(`[SAVED] ${name}.png`);
  }

  // 1. Landing Page
  console.log('Capturing Landing Page...');
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await saveScreenshot('01_landing_page');

  // 2. Login Portal
  console.log('Capturing Login Portal...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));
  await saveScreenshot('02_login_portal');

  // 3. Authenticate as Admin
  console.log('Logging in via Portal UI with Admin credentials...');
  await page.type('input[type="email"]', 'admin@shortfundly.com');
  await page.type('input[type="password"]', 'Admin@ShortFundly2026');
  await new Promise(r => setTimeout(r, 500));

  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch((e) => console.log('Navigation wait:', e.message))
  ]);

  await new Promise(r => setTimeout(r, 3000));
  console.log('Current URL after login attempt:', page.url());

  // 4. Authenticated Pages
  const pages = [
    { url: `${BASE_URL}/dashboard`, name: '03_operations_dashboard' },
    { url: `${BASE_URL}/colleges`, name: '04_colleges_directory' },
    { url: `${BASE_URL}/campaigns`, name: '05_automated_campaigns' },
    { url: `${BASE_URL}/templates`, name: '06_email_templates' },
    { url: `${BASE_URL}/manual-send`, name: '07_manual_direct_send' },
    { url: `${BASE_URL}/logs`, name: '08_delivery_audit_logs' },
    { url: `${BASE_URL}/settings`, name: '09_settings_deliverability' },
  ];

  for (const p of pages) {
    console.log(`Capturing ${p.name} (${p.url})...`);
    await page.goto(p.url, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    await saveScreenshot(p.name);
  }

  await browser.close();
  console.log('--- ALL AUTHENTIC SCREENSHOTS SUCCESSFULLY CAPTURED ---');
}

capture().catch(err => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
