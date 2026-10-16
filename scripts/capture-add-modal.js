import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const PROD_URL = 'https://shortfundly-mail-automation.vercel.app';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = path.resolve(process.cwd(), 'public', 'screenshots_vercel');
const ARTIFACT_DIR = 'C:\\Users\\Subhaharini\\.gemini\\antigravity\\brain\\c707cdc1-8973-4a37-9795-d92dfc5e305b';

async function captureAddModal() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 2 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--hide-scrollbars']
  });

  const page = await browser.newPage();
  await page.goto(`${PROD_URL}/login`, { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', 'admin@shortfundly.com');
  await page.type('input[type="password"]', 'Admin@ShortFundly2026');
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: 'networkidle2' })
  ]);

  await page.goto(`${PROD_URL}/colleges`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.innerText.includes('Add Single College'));
    if (btn) btn.click();
  });

  await new Promise(r => setTimeout(r, 1200));
  const localFile = path.join(OUTPUT_DIR, '06_add_college_modal.png');
  const artifactFile = path.join(ARTIFACT_DIR, '06_add_college_modal.png');
  await page.screenshot({ path: localFile });
  fs.copyFileSync(localFile, artifactFile);
  console.log('[CAPTURED] 06_add_college_modal.png');

  await browser.close();
}

captureAddModal().catch(console.error);
