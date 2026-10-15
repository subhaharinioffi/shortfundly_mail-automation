import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '..', 'database.sqlite');
const jsonPath = path.resolve(__dirname, 'hierarchical_colleges.json');

console.log('Ingesting hierarchical dataset into:', dbPath);

const db = new Database(dbPath);

// Ensure columns exist
const tableCols = db.prepare("PRAGMA table_info(colleges)").all().map(c => c.name);
if (!tableCols.includes('designation')) {
  console.log('Adding column: designation');
  db.exec("ALTER TABLE colleges ADD COLUMN designation TEXT DEFAULT 'Principal'");
}
if (!tableCols.includes('contact_priority')) {
  console.log('Adding column: contact_priority');
  db.exec("ALTER TABLE colleges ADD COLUMN contact_priority TEXT DEFAULT 'High'");
}
if (!tableCols.includes('phone')) {
  console.log('Adding column: phone');
  db.exec("ALTER TABLE colleges ADD COLUMN phone TEXT");
}

db.exec("CREATE INDEX IF NOT EXISTS idx_colleges_priority ON colleges(contact_priority);");

const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
console.log(`Loaded ${data.length} records from hierarchical_colleges.json`);

// Delete existing colleges to do a clean load with zero duplicates
db.prepare("DELETE FROM colleges").run();

const insertStmt = db.prepare(`
  INSERT INTO colleges (
    state, city, college_name, website_url, department, contact_person,
    designation, contact_priority, phone, email, source_page_url, notes, status
  ) VALUES (
    ?, ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?, ?, 'uncontacted'
  )
`);

let inserted = 0;
const tx = db.transaction((rows) => {
  for (const r of rows) {
    insertStmt.run(
      'Odisha',
      r.city || 'Odisha',
      r.college_name,
      r.website_url || '',
      r.type || '',
      r.contact_person || r.designation || 'Head of Institution',
      r.designation || 'Principal',
      r.priority || 'High',
      r.phone || '',
      r.email.toLowerCase().trim(),
      r.source_page_url || '',
      r.notes || ''
    );
    inserted++;
  }
});

tx(data);
console.log(`Successfully inserted ${inserted} colleges into database.sqlite`);

// Optimize SQLite for portable packaging
try {
  db.pragma('wal_checkpoint(TRUNCATE)');
  db.pragma('journal_mode = DELETE');
  db.exec('VACUUM');
  console.log('Database vacuumed and cleaned for production deployment.');
} catch (e) {
  console.warn('Vacuum warning:', e.message);
}

const finalCount = db.prepare("SELECT count(*) as count FROM colleges").get();
const prioCounts = db.prepare(`
  SELECT contact_priority, count(*) as c 
  FROM colleges 
  GROUP BY contact_priority
`).all();

console.log('Final colleges count:', finalCount.count);
console.log('Priority distribution in DB:', prioCounts);

db.close();
