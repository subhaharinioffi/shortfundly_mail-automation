import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const BASE_URL = 'http://localhost:3001';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = path.resolve(process.cwd(), 'public', 'screenshots');
const ARTIFACT_DIR = 'C:\\Users\\Subhaharini\\.gemini\\antigravity\\brain\\9eacbffe-5c3d-4785-909b-f828416ca847';

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function run() {
  console.log('--- Launching Chrome for Authentic Production Screenshots ---');
  const tempUserDir = path.join(os.tmpdir(), `chrome_snap_${Date.now()}`);

  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9222',
    `--user-data-dir=${tempUserDir}`,
    '--window-size=1440,900',
    '--hide-scrollbars',
    'about:blank'
  ]);

  chromeProc.on('error', (err) => {
    console.error('Failed to launch Chrome:', err);
    process.exit(1);
  });

  // Wait for Chrome remote debugging to come online
  let targets = null;
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9222/json/list');
      targets = await res.json();
      if (targets && targets.length > 0) break;
    } catch (_) {
      await new Promise(r => setTimeout(r, 300));
    }
  }

  if (!targets || targets.length === 0) {
    console.error('Could not connect to Chrome DevTools port 9222');
    chromeProc.kill();
    process.exit(1);
  }

  const wsUrl = targets[0].webSocketDebuggerUrl;
  console.log('Connected to Chrome DevTools WebSocket:', wsUrl);

  const ws = new WebSocket(wsUrl);
  await new Promise((resolve) => ws.addEventListener('open', resolve, { once: true }));

  let callId = 1;
  function callCDP(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = callId++;
      const handler = (evt) => {
        try {
          const data = JSON.parse(evt.data);
          if (data.id === msgId) {
            ws.removeEventListener('message', handler);
            if (data.error) reject(data.error);
            else resolve(data.result);
          }
        } catch (e) {
          reject(e);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  await callCDP('Page.enable');
  await callCDP('Runtime.enable');
  await callCDP('Network.enable');

  async function takeScreenshot(name) {
    const { data } = await callCDP('Page.captureScreenshot', { format: 'png' });
    const buf = Buffer.from(data, 'base64');
    const localPath = path.join(OUTPUT_DIR, `${name}.png`);
    const artifactPath = path.join(ARTIFACT_DIR, `${name}.png`);
    fs.writeFileSync(localPath, buf);
    fs.writeFileSync(artifactPath, buf);
    console.log(`[SAVED] ${name}.png (${buf.length} bytes)`);
  }

  // 1. Capture Landing Page
  console.log('Capturing Landing Page (/)...');
  await callCDP('Page.navigate', { url: `${BASE_URL}/` });
  await new Promise(r => setTimeout(r, 2500));
  await takeScreenshot('01_landing_page');

  // 2. Capture Login Page
  console.log('Capturing Login Page (/login)...');
  await callCDP('Page.navigate', { url: `${BASE_URL}/login` });
  await new Promise(r => setTimeout(r, 1500));
  await takeScreenshot('02_login_portal');

  // 3. Log In as Admin
  console.log('Submitting credentials for Admin session...');
  await callCDP('Runtime.evaluate', {
    expression: `
      (() => {
        const emailInput = document.querySelector('input[type="email"]');
        const passInput = document.querySelector('input[type="password"]');
        const submitBtn = document.querySelector('button[type="submit"]');
        if (emailInput && passInput && submitBtn) {
          emailInput.value = 'admin@shortfundly.com';
          emailInput.dispatchEvent(new Event('input', { bubbles: true }));
          passInput.value = 'Admin@ShortFundly2026';
          passInput.dispatchEvent(new Event('input', { bubbles: true }));
          submitBtn.click();
          return true;
        }
        return false;
      })()
    `
  });

  // Wait for login redirection and session storage
  await new Promise(r => setTimeout(r, 3000));

  // 4. Capture Operations Dashboard
  console.log('Capturing Dashboard (/dashboard)...');
  await callCDP('Page.navigate', { url: `${BASE_URL}/dashboard` });
  await new Promise(r => setTimeout(r, 2000));
  await takeScreenshot('03_operations_dashboard');

  // 5. Capture Odisha Colleges Directory
  console.log('Capturing Colleges Directory (/colleges)...');
  await callCDP('Page.navigate', { url: `${BASE_URL}/colleges` });
  await new Promise(r => setTimeout(r, 2000));
  await takeScreenshot('04_colleges_directory');

  // 6. Capture Automated Campaigns Page
  console.log('Capturing Campaigns Page (/campaigns)...');
  await callCDP('Page.navigate', { url: `${BASE_URL}/campaigns` });
  await new Promise(r => setTimeout(r, 2000));
  await takeScreenshot('05_automated_campaigns');

  // 7. Capture Email Templates Page
  console.log('Capturing Templates Page (/templates)...');
  await callCDP('Page.navigate', { url: `${BASE_URL}/templates` });
  await new Promise(r => setTimeout(r, 2000));
  await takeScreenshot('06_email_templates');

  // 8. Capture Direct / Manual Send Page
  console.log('Capturing Manual Send Page (/manual-send)...');
  await callCDP('Page.navigate', { url: `${BASE_URL}/manual-send` });
  await new Promise(r => setTimeout(r, 2000));
  await takeScreenshot('07_manual_direct_send');

  // 9. Capture Delivery Logs Audit Page
  console.log('Capturing Logs Page (/logs)...');
  await callCDP('Page.navigate', { url: `${BASE_URL}/logs` });
  await new Promise(r => setTimeout(r, 2000));
  await takeScreenshot('08_delivery_audit_logs');

  // 10. Capture Settings & Deliverability Engine Page
  console.log('Capturing Settings Page (/settings)...');
  await callCDP('Page.navigate', { url: `${BASE_URL}/settings` });
  await new Promise(r => setTimeout(r, 2000));
  await takeScreenshot('09_settings_deliverability');

  console.log('All authentic screenshots captured successfully!');
  ws.close();
  chromeProc.kill();
  process.exit(0);
}

run().catch((err) => {
  console.error('Fatal screenshot runner error:', err);
  process.exit(1);
});
