import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { ODISHA_COLLEGES_SEED } from './odisha-seed-data.js';

function getDatabasePath() {
  const isServerless = Boolean(
    process.env.VERCEL || 
    process.env.AWS_LAMBDA_FUNCTION_NAME || 
    process.env.LAMBDA_TASK_ROOT ||
    process.env.VERCEL_ENV
  );

  if (isServerless) {
    const tmpDbPath = path.join('/tmp', 'database.sqlite');
    const sourceDbPath = path.resolve(process.cwd(), 'database.sqlite');

    // On Vercel/AWS Lambda, root directory is strictly read-only.
    // Copy bundled seed database to writable /tmp if not already present.
    if (!fs.existsSync(tmpDbPath)) {
      if (fs.existsSync(sourceDbPath)) {
        try {
          fs.copyFileSync(sourceDbPath, tmpDbPath);
          fs.chmodSync(tmpDbPath, 0o666);
        } catch (copyErr) {
          console.warn('Could not copy bundled database.sqlite to /tmp, will initialize fresh:', copyErr.message);
        }
      }
    } else {
      try {
        fs.chmodSync(tmpDbPath, 0o666);
      } catch (_) {}
    }
    return tmpDbPath;
  }

  return path.resolve(process.cwd(), 'database.sqlite');
}

function ensureSchema(db) {
  // 1. Users Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('Admin', 'HR', 'Tech Lead')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Colleges Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS colleges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      state TEXT NOT NULL DEFAULT 'Odisha',
      city TEXT NOT NULL,
      college_name TEXT NOT NULL,
      website_url TEXT NOT NULL,
      department TEXT,
      contact_person TEXT,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      source_page_url TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'uncontacted' CHECK(status IN ('uncontacted', 'sent', 'failed', 'pending')),
      last_contacted_at DATETIME,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_colleges_email ON colleges(email);
    CREATE INDEX IF NOT EXISTS idx_colleges_city ON colleges(city);
    CREATE INDEX IF NOT EXISTS idx_colleges_status ON colleges(status);
  `);

  // 3. Email Templates Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS email_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      is_default INTEGER NOT NULL DEFAULT 0,
      category TEXT NOT NULL DEFAULT 'Campus Collaboration',
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 4. Email Logs Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS email_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      college_id INTEGER,
      college_name TEXT NOT NULL,
      recipient_email TEXT NOT NULL,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      sender_email TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('sent', 'failed', 'pending', 'skipped_duplicate')),
      error_message TEXT,
      message_id TEXT,
      sent_by_user TEXT NOT NULL,
      sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(college_id) REFERENCES colleges(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS idx_logs_recipient ON email_logs(recipient_email);
    CREATE INDEX IF NOT EXISTS idx_logs_status ON email_logs(status);
  `);

  // 5. System Settings Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed default 3 team users if empty
  const userCount = db.prepare('SELECT count(*) as count FROM users').get();
  if (!userCount || userCount.count === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `);

    const usersToSeed = [
      { name: 'Shortfundly Admin', email: 'admin@shortfundly.com', pass: 'Admin@ShortFundly2026', role: 'Admin' },
      { name: 'Shortfundly HR', email: 'hr@shortfundly.com', pass: 'HR@ShortFundly2026', role: 'HR' },
      { name: 'Shortfundly Tech Lead', email: 'techlead@shortfundly.com', pass: 'TechLead@ShortFundly2026', role: 'Tech Lead' }
    ];

    for (const u of usersToSeed) {
      const hash = bcrypt.hashSync(u.pass, 10);
      insertUser.run(u.name, u.email, hash, u.role);
    }
  }

  // Seed default outreach proposal template if empty
  const templateCount = db.prepare('SELECT count(*) as count FROM email_templates').get();
  if (!templateCount || templateCount.count === 0) {
    const defaultSubject = `PROPOSAL FOR SHORTFUNDLY CAMPUS COLLABORATION - Empowering Student Creators at [College Name]`;
    const defaultBody = `PROPOSAL FOR SHORTFUNDLY CAMPUS COLLABORATION
Empowering Student Creators at [College Name]

Dear Sir/Madam,

Greetings from Shortfundly!

We propose a collaboration with [College Name] through Shortfundly Campus to help students develop creative skills, showcase their work, and explore opportunities in filmmaking and digital content.

About Shortfundly Campus
Shortfundly Campus connects student creators with collaboration, film submission, promotion, and event opportunities. Its Campus Pass brings together six products: Connect, Festival, Hub, Marketing, Ticket, and Tools. Students can build creator profiles, find collaborators, and prepare their projects for wider exposure.

Proposed Areas of Collaboration
- Student onboarding: Introduce interested students to the platform and help them activate their access.
- Learning sessions: Plan workshops on filmmaking, OTT distribution, film marketing, and AI.
- Campus activities: Organize screenings and competitions to showcase student talent.
- Creator development: Encourage portfolio building, collaboration, and festival participation.
- Student leadership: Explore a Campus Ambassador initiative to support participation and community building.

The activities, frequency, support, and deliverables will be finalized jointly with the institution.

Objectives for the Institution
Through this partnership, we aim to:
- Create a structured pathway for students to develop and present creative projects.
- Strengthen participation in film clubs and interdisciplinary activities.
- Help students build practical experience and demonstrable portfolios.
- Showcase the institution's emerging creative talent.

Proposed Implementation
1. Conduct a product demonstration for faculty and student coordinators.
2. Confirm participating departments, student numbers, and priorities.
3. Finalize the scope, commercial terms, and activity schedule.
4. Conduct an orientation and begin student onboarding.
5. Review participation and project progress with the designated faculty coordinator.

Commercial Terms
The Campus Pass is currently listed at ₹1,500 + GST per year. Institutional pricing and any additional activity charges will be confirmed through a separate quotation based on the agreed scope.

Next Steps
We would welcome a meeting with your team to understand your requirements and present Shortfundly Campus. Kindly share a convenient time and nominate a faculty coordinator to take the discussion forward.

Contact: +91 93612 23155
Explore Campus: https://campus.shortfundly.com/
Schedule a Meeting: https://calendly.com/shortfundly-meeting/30min

Warm regards,
[Your Name]
Product Manager | Shortfundly`;

    db.prepare(`
      INSERT INTO email_templates (name, subject, body, is_default, category, created_by)
      VALUES (?, ?, ?, 1, ?, ?)
    `).run('Shortfundly Campus Proposal - Odisha Colleges', defaultSubject, defaultBody, 'Campus Outreach', 'System Admin');
  }

  // Seed colleges if table is empty
  const collegeCount = db.prepare('SELECT count(*) as count FROM colleges').get();
  if ((!collegeCount || collegeCount.count === 0) && Array.isArray(ODISHA_COLLEGES_SEED) && ODISHA_COLLEGES_SEED.length > 0) {
    const insertCollege = db.prepare(`
      INSERT OR IGNORE INTO colleges (state, city, college_name, website_url, department, contact_person, email, source_page_url, notes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'uncontacted')
    `);

    const seedTx = db.transaction((items) => {
      for (const c of items) {
        insertCollege.run(c.state, c.city, c.college_name, c.website_url, c.department, c.contact_person, c.email, c.source_page_url, c.notes);
      }
    });
    seedTx(ODISHA_COLLEGES_SEED);
  }

  // Seed system settings if empty
  const settingsCount = db.prepare('SELECT count(*) as count FROM system_settings').get();
  if (!settingsCount || settingsCount.count === 0) {
    const insertSetting = db.prepare('INSERT OR IGNORE INTO system_settings (key, value) VALUES (?, ?)');
    const defaults = [
      { key: 'smtp_host', value: 'smtp.gmail.com' },
      { key: 'smtp_port', value: '465' },
      { key: 'smtp_secure', value: 'true' },
      { key: 'smtp_user', value: process.env.GOOGLE_SMTP_USER || 'campus@shortfundly.com' },
      { key: 'smtp_pass', value: process.env.GOOGLE_SMTP_PASS || '' },
      { key: 'from_name', value: 'Shortfundly Campus Collaboration' },
      { key: 'from_email', value: process.env.GOOGLE_SMTP_USER || 'campus@shortfundly.com' },
      { key: 'duplicate_cooldown_days', value: '30' }
    ];

    for (const d of defaults) {
      insertSetting.run(d.key, d.value);
    }
  }
}

export function getDb() {
  if (!global.__dbInstance) {
    const isServerless = Boolean(
      process.env.VERCEL || 
      process.env.AWS_LAMBDA_FUNCTION_NAME || 
      process.env.LAMBDA_TASK_ROOT ||
      process.env.VERCEL_ENV
    );

    const targetPath = getDatabasePath();
    let db;

    try {
      db = new Database(targetPath);
    } catch (err) {
      try {
        const fallbackPath = path.join(process.env.TEMP || '/tmp', 'database_fallback.sqlite');
        db = new Database(fallbackPath);
      } catch (finalErr) {
        // As a last-resort memory database if filesystem is completely locked
        db = new Database(':memory:');
      }
    }

    if (isServerless) {
      try {
        db.pragma('journal_mode = DELETE');
      } catch (_) {}
      try {
        db.pragma('synchronous = NORMAL');
      } catch (_) {}
      try {
        db.pragma('busy_timeout = 5000');
      } catch (_) {}
    } else {
      try {
        db.pragma('journal_mode = WAL');
      } catch (_) {}
    }
    db.pragma('foreign_keys = ON');

    // Self-healing schema and seed initialization
    ensureSchema(db);

    global.__dbInstance = db;
  }
  return global.__dbInstance;
}

export default getDb;
