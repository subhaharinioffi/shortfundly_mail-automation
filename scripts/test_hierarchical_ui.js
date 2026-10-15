import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/Subhaharini/.gemini/antigravity/brain/b226ac9b-066d-4100-8efe-1c1793dcbaee';

async function main() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // 1. Login
  console.log('Logging in...');
  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="email"]', 'admin@shortfundly.com');
  await page.fill('input[type="password"]', 'Admin@ShortFundly2026');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  console.log('Logged in successfully!');

  // 2. Colleges Directory
  console.log('Navigating to Colleges Directory...');
  await page.goto('http://localhost:3000/colleges');
  await page.waitForSelector('table.data-table tbody tr');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'live_hierarchical_colleges.png'), fullPage: false });
  console.log('Captured live_hierarchical_colleges.png');

  // 3. Filter by High Priority
  console.log('Filtering by High Priority...');
  // Select option with value 'High' in priority dropdown
  await page.selectOption('select:has-text("All Priorities")', 'High');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'live_high_priority_filter.png'), fullPage: false });
  console.log('Captured live_high_priority_filter.png');

  // 4. Campaigns Page
  console.log('Navigating to Campaigns page...');
  await page.goto('http://localhost:3000/campaigns');
  await page.waitForSelector('input[placeholder*="Search college"]');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'live_hierarchical_campaigns.png'), fullPage: false });
  console.log('Captured live_hierarchical_campaigns.png');

  await browser.close();
  console.log('Verification completed successfully!');
}

main().catch(err => {
  console.error('Playwright verification error:', err);
  process.exit(1);
});
