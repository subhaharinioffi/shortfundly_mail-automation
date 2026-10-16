import puppeteer from 'puppeteer-core';

async function test() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });

  // Click demo Admin button
  const adminBtn = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const b = buttons.find(btn => btn.textContent.trim() === 'Admin');
    if (b) {
      b.click();
      return true;
    }
    return false;
  });

  console.log('Clicked Admin demo button:', adminBtn);
  await new Promise(r => setTimeout(r, 600));

  // Click submit
  const submitSuccess = await page.evaluate(() => {
    const submit = document.querySelector('button[type="submit"]');
    if (submit) {
      submit.click();
      return true;
    }
    return false;
  });

  console.log('Clicked submit button:', submitSuccess);
  await new Promise(r => setTimeout(r, 3000));

  console.log('URL after login:', page.url());
  await browser.close();
}

test().catch(console.error);
