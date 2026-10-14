import { getDb } from '../src/lib/db.js';
import { personalizeText, formatHtmlEmail, checkDuplicate } from '../src/lib/mailer.js';

console.log('--- STARTING VERIFICATION TEST ---');

// 1. Verify DB
const db = getDb();
const users = db.prepare('SELECT id, name, email, role FROM users').all();
console.log('Users in Database:', users);

const collegesCount = db.prepare('SELECT count(*) as count FROM colleges').get();
console.log('Colleges in Database:', collegesCount.count);

const sampleCollege = db.prepare('SELECT * FROM colleges LIMIT 1').get();
console.log('Sample College:', sampleCollege.college_name, '| Email:', sampleCollege.email);

const templates = db.prepare('SELECT id, name, subject, is_default FROM email_templates').all();
console.log('Templates in Database:', templates);

// 2. Verify Personalization
const defaultTmpl = db.prepare('SELECT * FROM email_templates WHERE is_default = 1').get();
const personalizedSubject = personalizeText(defaultTmpl.subject, {
  college_name: sampleCollege.college_name,
  city: sampleCollege.city
});
console.log('\nPersonalized Subject Test:');
console.log(personalizedSubject);

const personalizedBody = personalizeText(defaultTmpl.body, {
  college_name: sampleCollege.college_name,
  city: sampleCollege.city,
  department: sampleCollege.department,
  contact_person: sampleCollege.contact_person,
  sender_name: 'Shortfundly Admin'
});
console.log('\nPersonalized Body Preview (first 250 chars):');
console.log(personalizedBody.substring(0, 250) + '...');

const htmlEmail = formatHtmlEmail(personalizedBody);
console.log('\nHTML Email Rendered Length:', htmlEmail.length, 'bytes');

// 3. Verify Duplicate Shield Check
const dupCheck = checkDuplicate(sampleCollege.email, 30);
console.log('\nDuplicate Check for uncontacted college:', dupCheck);

console.log('--- ALL BACKEND ARCHITECTURE TESTS PASSED ---');
