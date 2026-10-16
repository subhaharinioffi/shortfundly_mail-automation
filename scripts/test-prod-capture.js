import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const PROD_URL = 'https://shortfundly-mail-automation.vercel.app';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testProd() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--hide-scrollbars']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('Navigating to login page...');
  await page.goto(`${PROD_URL}/login`, { waitUntil: 'networkidle2' });
  console.log('Current URL:', page.url());

  const inputs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input')).map(i => ({ type: i.type, name: i.name, placeholder: i.placeholder, id: i.id }));
  });
  console.log('Inputs found:', inputs);

  // Type admin credentials
  await page.type('input[type="email"]', 'admin@shortfundly.com');
  await page.type('input[type="password"]', 'Admin@ShortFundly2026');
  
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(e => console.log('Navigation wait:', e.message))
  ]);

  await new Promise(r => setTimeout(r, 3000));
  console.log('URL after login:', page.url());
  const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 300));
  console.log('Body preview:', bodyText);

  await browser.close();
}

testProd().catch(console.error);
