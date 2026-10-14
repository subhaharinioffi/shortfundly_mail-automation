const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, '..', 'database.sqlite');
console.log('Initializing SQLite database at:', dbPath);

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

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

// Seed Users
const userCount = db.prepare('SELECT count(*) as count FROM users').get();
if (userCount.count === 0) {
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
    console.log(`Seeded User: ${u.email} (${u.role})`);
  }
}

// Seed Default Template
const templateCount = db.prepare('SELECT count(*) as count FROM email_templates').get();
if (templateCount.count === 0) {
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
  console.log('Seeded Default Email Template');
}

// Seed Colleges
const collegeCount = db.prepare('SELECT count(*) as count FROM colleges').get();
if (collegeCount.count === 0) {
  const colleges = [
    {
      state: "Odisha",
      city: "Bhubaneswar",
      college_name: "Indian Institute of Technology Bhubaneswar (IIT BBS)",
      website_url: "https://www.iitbbs.ac.in",
      department: "Dean Student Affairs & Cultural Council",
      contact_person: "Dr. Mihir Kumar Dash",
      email: "deansa@iitbbs.ac.in",
      source_page_url: "https://www.iitbbs.ac.in/dean-student-affairs.php",
      notes: "Premier National Institute - Active student film & media society"
    },
    {
      state: "Odisha",
      city: "Rourkela",
      college_name: "National Institute of Technology Rourkela (NIT Rourkela)",
      website_url: "https://www.nitrkl.ac.in",
      department: "Student Activity Centre (SAC) - Film and Music Club",
      contact_person: "Prof. Snehashish Chakraverty",
      email: "president.sac@nitrkl.ac.in",
      source_page_url: "https://www.nitrkl.ac.in/sac-contact",
      notes: "Home to Cinematics Club & NITR Film Festival"
    },
    {
      state: "Odisha",
      city: "Bhubaneswar",
      college_name: "Utkal University",
      website_url: "https://utkaluniversity.ac.in",
      department: "Department of Journalism & Mass Communication",
      contact_person: "Dr. Upendra Kumar Nayak",
      email: "registrar@utkaluniversity.ac.in",
      source_page_url: "https://utkaluniversity.ac.in/departments/journalism-and-mass-communication/",
      notes: "Oldest university in Odisha with active media production lab"
    },
    {
      state: "Odisha",
      city: "Cuttack",
      college_name: "Ravenshaw University",
      website_url: "https://ravenshawuniversity.ac.in",
      department: "Department of Journalism & Mass Communication",
      contact_person: "Dr. Asit Kumar Mohanty",
      email: "contact@ravenshawuniversity.ac.in",
      source_page_url: "https://ravenshawuniversity.ac.in/departments/jmc",
      notes: "Historic heritage university with vibrant cultural society"
    },
    {
      state: "Odisha",
      city: "Burla, Sambalpur",
      college_name: "Veer Surendra Sai University of Technology (VSSUT)",
      website_url: "https://www.vssut.ac.in",
      department: "Dean Student Welfare - Audio Visual Club",
      contact_person: "Prof. P. K. Kar",
      email: "dean_students@vssut.ac.in",
      source_page_url: "https://www.vssut.ac.in/student-affairs.php",
      notes: "Leading engineering university with student production house Pixels"
    },
    {
      state: "Odisha",
      city: "Bhubaneswar",
      college_name: "Kalinga Institute of Industrial Technology (KIIT Deemed University)",
      website_url: "https://kiit.ac.in",
      department: "School of Film and Media Sciences",
      contact_person: "Dr. Himansu Sekhar Khatua",
      email: "filmschool@kiit.ac.in",
      source_page_url: "https://ksfm.kiit.ac.in/contact-us/",
      notes: "Dedicated film and media sciences school with industry equipment"
    },
    {
      state: "Odisha",
      city: "Bhubaneswar",
      college_name: "Siksha 'O' Anusandhan Deemed to be University (SOA)",
      website_url: "https://www.soa.ac.in",
      department: "Student Affairs & Creative Arts Wing",
      contact_person: "Prof. Jyoti Ranjan Das",
      email: "dean.studentaffairs@soa.ac.in",
      source_page_url: "https://www.soa.ac.in/student-council",
      notes: "Large private deemed university with dynamic cultural teams"
    },
    {
      state: "Odisha",
      city: "Burla, Sambalpur",
      college_name: "Sambalpur University",
      website_url: "https://www.suniv.ac.in",
      department: "PG Department of Communication & Journalism",
      contact_person: "Prof. Sanjaya Kumar Sahoo",
      email: "registrar@suniv.ac.in",
      source_page_url: "https://www.suniv.ac.in/department.php?did=12",
      notes: "Western Odisha educational hub with broadcast journalism studio"
    },
    {
      state: "Odisha",
      city: "Berhampur, Ganjam",
      college_name: "Berhampur University",
      website_url: "https://buodisha.edu.in",
      department: "Department of Electronic Science & Media",
      contact_person: "Dr. Pratap Kumar Swain",
      email: "registrar@buodisha.edu.in",
      source_page_url: "https://buodisha.edu.in/administration/",
      notes: "Southern Odisha premier university"
    },
    {
      state: "Odisha",
      city: "Balasore",
      college_name: "Fakir Mohan University",
      website_url: "https://fmuniversity.nic.in",
      department: "Department of Journalism and Mass Communication",
      contact_person: "Dr. Arabinda Kumar Nayak",
      email: "info@fmuniversity.nic.in",
      source_page_url: "https://fmuniversity.nic.in/departments/jmc",
      notes: "Northern Odisha university with active creative arts department"
    },
    {
      state: "Odisha",
      city: "Bhubaneswar",
      college_name: "Rama Devi Women's University",
      website_url: "https://rdwuniversity.nic.in",
      department: "Department of Journalism & Mass Communication",
      contact_person: "Dr. Reeta Pati",
      email: "contact@rdwuniversity.nic.in",
      source_page_url: "https://rdwuniversity.nic.in/departments.php",
      notes: "Odisha's first women's university, passionate student media initiatives"
    },
    {
      state: "Odisha",
      city: "Baripada, Mayurbhanj",
      college_name: "Maharaja Sriram Chandra Bhanja Deo University",
      website_url: "https://nou.nic.in",
      department: "Office of the Registrar & Student Welfare",
      contact_person: "Prof. Kishore Kumar Das",
      email: "registrar@nou.nic.in",
      source_page_url: "https://nou.nic.in/administration.html",
      notes: "Formerly North Orissa University - Baripada"
    },
    {
      state: "Odisha",
      city: "Bhubaneswar",
      college_name: "Silicon University (Formerly Silicon Institute of Technology)",
      website_url: "https://silicon.ac.in",
      department: "Department of Creative Arts & Media Technology",
      contact_person: "Prof. Jaideep Talukdar",
      email: "info@silicon.ac.in",
      source_page_url: "https://silicon.ac.in/contact-us/",
      notes: "Top-tier private engineering & technology university"
    },
    {
      state: "Odisha",
      city: "Bhubaneswar",
      college_name: "C. V. Raman Global University",
      website_url: "https://cgu-odisha.ac.in",
      department: "Dean Student Affairs & Campus Life",
      contact_person: "Dr. B. C. Panda",
      email: "studentaffairs@cgu-odisha.ac.in",
      source_page_url: "https://cgu-odisha.ac.in/student-affairs/",
      notes: "WorldSkills affiliated university with active photography & short film clubs"
    },
    {
      state: "Odisha",
      city: "Bhubaneswar",
      college_name: "Odisha University of Technology and Research (OUTR Bhubaneswar)",
      website_url: "https://www.outr.ac.in",
      department: "Department of Student Welfare - Film & Photography Society",
      contact_person: "Prof. Bibhuti Bhusan Pati",
      email: "registrar@outr.ac.in",
      source_page_url: "https://www.outr.ac.in/contact",
      notes: "Formerly CET Bhubaneswar - prestigious engineering institution"
    },
    {
      state: "Odisha",
      city: "Rourkela",
      college_name: "Biju Patnaik University of Technology (BPUT)",
      website_url: "https://www.bput.ac.in",
      department: "Director of Student Affairs & Youth Festivals",
      contact_person: "Dr. Manas Ranjan Senapati",
      email: "bput@bput.ac.in",
      source_page_url: "https://www.bput.ac.in/contact-us.html",
      notes: "State Technical University affiliating 130+ technical colleges in Odisha"
    },
    {
      state: "Odisha",
      city: "Sambalpur",
      college_name: "Gangadhar Meher University",
      website_url: "https://gmuniversity.ac.in",
      department: "Office of the Dean, Student Welfare",
      contact_person: "Dr. Uma Charan Pati",
      email: "registrar@gmuniversity.ac.in",
      source_page_url: "https://gmuniversity.ac.in/contact.php",
      notes: "Major autonomous collegiate university in Sambalpur"
    },
    {
      state: "Odisha",
      city: "Cuttack",
      college_name: "Sri Sri University",
      website_url: "https://srisriuniversity.edu.in",
      department: "Department of Media Studies & Performing Arts",
      contact_person: "Prof. (Dr.) B. R. Sharma",
      email: "info@srisriuniversity.edu.in",
      source_page_url: "https://srisriuniversity.edu.in/faculty-of-media-studies/",
      notes: "Dynamic arts, design and media programs with digital filmmaking labs"
    },
    {
      state: "Odisha",
      city: "Paralakhemundi, Gajapati",
      college_name: "Centurion University of Technology and Management (CUTM)",
      website_url: "https://cutm.ac.in",
      department: "School of Media and Communications",
      contact_person: "Dr. Ambika Sankar Mishra",
      email: "media.school@cutm.ac.in",
      source_page_url: "https://cutm.ac.in/school-of-media-and-communications/",
      notes: "State private university with dedicated sound and editing suites"
    },
    {
      state: "Odisha",
      city: "Balangir",
      college_name: "Rajendra University",
      website_url: "https://rajendrauniversity.ac.in",
      department: "Cultural Committee & Academic Council",
      contact_person: "Dr. Sudhanshu Sekhar Mishra",
      email: "info@rajendrauniversity.ac.in",
      source_page_url: "https://rajendrauniversity.ac.in/contact/",
      notes: "Autonomous unitary university in western Odisha"
    },
    {
      state: "Odisha",
      city: "Bhubaneswar",
      college_name: "Biju Pattanaik Film and Television Institute of Odisha (BPFTIO)",
      website_url: "https://bpftio.org",
      department: "Department of Film Direction, Editing & Cinematography",
      contact_person: "Principal BPFTIO",
      email: "principalbpftio@gmail.com",
      source_page_url: "https://bpftio.org/contact/",
      notes: "Government film institute directly focused on film technology & production"
    },
    {
      state: "Odisha",
      city: "Bhubaneswar",
      college_name: "Institute of Technical Education and Research (ITER)",
      website_url: "https://www.soa.ac.in/iter",
      department: "Student Activities Council - Digital Media Group",
      contact_person: "Prof. P. K. Sahoo",
      email: "iter@soa.ac.in",
      source_page_url: "https://www.soa.ac.in/iter-contact",
      notes: "Faculty of Engineering & Technology, SOA Deemed to be University"
    },
    {
      state: "Odisha",
      city: "Cuttack",
      college_name: "Stewart Science College",
      website_url: "https://stewartsciencecollege.org",
      department: "Office of the Principal & Youth Cultural Wing",
      contact_person: "Dr. Debasis Panda",
      email: "principalstewartscience@gmail.com",
      source_page_url: "https://stewartsciencecollege.org/contact-us/",
      notes: "Reputed historic science college in Cuttack"
    },
    {
      state: "Odisha",
      city: "Bhubaneswar",
      college_name: "BJB Autonomous College",
      website_url: "https://bjbcollege.in",
      department: "Department of Arts & Cultural Association",
      contact_person: "Dr. Niranjan Mohapatra",
      email: "principal@bjbcollege.in",
      source_page_url: "https://bjbcollege.in/contact/",
      notes: "Premier autonomous undergraduate college in Bhubaneswar"
    },
    {
      state: "Odisha",
      city: "Cuttack",
      college_name: "Sailabala Women's Autonomous College",
      website_url: "https://sailabalawomenscollege.ac.in",
      department: "Youth Club & Department of Higher Education",
      contact_person: "Dr. Sandhyarani Pradhan",
      email: "sbwcollege@gmail.com",
      source_page_url: "https://sailabalawomenscollege.ac.in/contact/",
      notes: "One of the oldest women's colleges in eastern India"
    }
  ];

  const insertCollege = db.prepare(`
    INSERT INTO colleges (state, city, college_name, website_url, department, contact_person, email, source_page_url, notes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'uncontacted')
  `);

  for (const c of colleges) {
    insertCollege.run(c.state, c.city, c.college_name, c.website_url, c.department, c.contact_person, c.email, c.source_page_url, c.notes);
  }
  console.log(`Seeded ${colleges.length} official Odisha colleges.`);
}

// Seed System Settings
const settingsCount = db.prepare('SELECT count(*) as count FROM system_settings').get();
if (settingsCount.count === 0) {
  const insertSetting = db.prepare('INSERT INTO system_settings (key, value) VALUES (?, ?)');
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
  console.log('Seeded Google SMTP default settings');
}

console.log('Database initialization completed successfully.');
