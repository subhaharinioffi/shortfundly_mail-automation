import prisma from '../src/lib/prisma';
import fs from 'fs';
import path from 'path';

function cleanUrl(url: any): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (trimmed === '' || trimmed === '-' || trimmed.toLowerCase() === 'none') return null;
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

function cleanEmail(rawEmail: any): string | null {
  if (!rawEmail || typeof rawEmail !== 'string') return null;
  let email = rawEmail
    .replace(/\[\s*at\s*\]|\(\s*at\s*\)|\[\s*@\s*\]/gi, '@')
    .replace(/\[\s*dot\s*\]|\(\s*dot\s*\)|\[\s*\.\s*\]/gi, '.')
    .replace(/\s+/g, '')
    .trim()
    .toLowerCase();
  email = email.replace(/[.,;:]+$/, '');
  if (email && email.includes('@') && email.length > 5) {
    return email;
  }
  return null;
}

function normalizeRole(roleStr: any): string {
  if (!roleStr || typeof roleStr !== 'string') return 'Staff';
  const r = roleStr.toLowerCase();
  if (r.includes('principal') || r.includes('headmaster')) return 'Principal';
  if (r.includes('dean')) return 'Dean';
  if (r.includes('hod') || r.includes('head of department')) return 'Head of Department (HOD)';
  if (r.includes('placement') || r.includes('tpo')) return 'Placement Officer';
  if (r.includes('registrar')) return 'Registrar';
  if (r.includes('admission')) return 'Admission In-Charge';
  return 'Staff';
}

export async function seedAllColleges() {
  console.log('--- Bulk Ingestion from Master Directories into PostgreSQL ---');

  // National Premier Institutions across major Indian States
  const nationalInstitutions = [
    {
      country: 'India',
      state: 'Maharashtra',
      district: 'Mumbai',
      collegeName: 'Indian Institute of Technology Bombay',
      portalSource: 'NIRF',
      officialWebsite: 'https://www.iitb.ac.in',
      officialEmail: 'director@iitb.ac.in',
      contactNumber: '+91-22-2572-2545',
    },
    {
      country: 'India',
      state: 'Delhi',
      district: 'New Delhi',
      collegeName: 'Indian Institute of Technology Delhi',
      portalSource: 'NIRF',
      officialWebsite: 'https://home.iitd.ac.in',
      officialEmail: 'director@admin.iitd.ac.in',
      contactNumber: '+91-11-2659-1000',
    },
    {
      country: 'India',
      state: 'Karnataka',
      district: 'Bangalore Urban',
      collegeName: 'Indian Institute of Science Bangalore',
      portalSource: 'UGC',
      officialWebsite: 'https://iisc.ac.in',
      officialEmail: 'registrar@iisc.ac.in',
      contactNumber: '+91-80-2293-2001',
    },
    {
      country: 'India',
      state: 'Tamil Nadu',
      district: 'Chennai',
      collegeName: 'Indian Institute of Technology Madras',
      portalSource: 'NIRF',
      officialWebsite: 'https://www.iitm.ac.in',
      officialEmail: 'director@iitm.ac.in',
      contactNumber: '+91-44-2257-8000',
    },
    {
      country: 'India',
      state: 'West Bengal',
      district: 'Paschim Medinipur',
      collegeName: 'Indian Institute of Technology Kharagpur',
      portalSource: 'AICTE',
      officialWebsite: 'https://www.iitkgp.ac.in',
      officialEmail: 'director@iitkgp.ac.in',
      contactNumber: '+91-3222-255221',
    },
    {
      country: 'India',
      state: 'Uttar Pradesh',
      district: 'Kanpur',
      collegeName: 'Indian Institute of Technology Kanpur',
      portalSource: 'AICTE',
      officialWebsite: 'https://www.iitk.ac.in',
      officialEmail: 'director@iitk.ac.in',
      contactNumber: '+91-512-259-0151',
    },
    {
      country: 'India',
      state: 'Telangana',
      district: 'Sangareddy',
      collegeName: 'Indian Institute of Technology Hyderabad',
      portalSource: 'NIRF',
      officialWebsite: 'https://www.iith.ac.in',
      officialEmail: 'director@iith.ac.in',
      contactNumber: '+91-40-2301-6033',
    },
  ];

  await prisma.college.createMany({
    data: nationalInstitutions,
    skipDuplicates: true,
  });

  // Read Master Excel directory
  const excelPath = path.resolve(process.cwd(), 'Odisha_Colleges_Master_Unique_Directory.xlsx');
  if (!fs.existsSync(excelPath)) {
    console.log('Master Excel directory not found at:', excelPath);
    return;
  }

  const xlsxModule = await import('xlsx');
  const xlsx = (xlsxModule as any).default || xlsxModule;
  const wb = xlsx.readFile(excelPath);

  // 1. Read Master Colleges
  const sheet = wb.Sheets['Master Unique Colleges (All)'];
  const rows: any[] = xlsx.utils.sheet_to_json(sheet);
  console.log(`Loaded ${rows.length} records from Excel sheet.`);

  // Prepare bulk college records
  const collegesToCreate: any[] = [];
  const seenUnique = new Set<string>();

  for (const r of rows) {
    const rawName = r['College Name (Standardized)'] || r['College Name'];
    if (!rawName) continue;
    const collegeName = String(rawName).trim();
    const district = String(r['District'] || 'General District').trim();
    const state = 'Odisha';
    const key = `${collegeName}|${state}|${district}`.toLowerCase();
    if (seenUnique.has(key)) continue;
    seenUnique.add(key);

    const website = cleanUrl(r['Official Website']);
    const generalEmail = cleanEmail(r['General / Office Emails']);
    const principalEmail = cleanEmail(r['Principal Official Email']);
    const officialEmail = generalEmail || principalEmail || null;
    const phone = r['Helpline & Office Phones'] || r['Principal Direct Mobile'] || null;

    collegesToCreate.push({
      country: 'India',
      state,
      district,
      collegeName,
      portalSource: 'AISHE',
      officialWebsite: website,
      officialEmail,
      contactNumber: phone ? String(phone).trim() : null,
    });
  }

  console.log(`Inserting ${collegesToCreate.length} unique colleges in batches...`);
  // Insert in batches of 400
  for (let i = 0; i < collegesToCreate.length; i += 400) {
    const chunk = collegesToCreate.slice(i, i + 400);
    await prisma.college.createMany({
      data: chunk,
      skipDuplicates: true,
    });
    console.log(`Inserted college batch: ${Math.min(i + 400, collegesToCreate.length)} / ${collegesToCreate.length}`);
  }

  // 2. Fetch all college IDs to link Staff Contacts
  const allColleges = await prisma.college.findMany({
    select: { id: true, collegeName: true },
  });
  const collegeNameToId = new Map<string, string>();
  for (const c of allColleges) {
    collegeNameToId.set(c.collegeName.toLowerCase().trim(), c.id);
  }

  // 3. Prepare Staff Contacts
  const staffSheet = wb.Sheets['Staff & Faculty Contacts'];
  const staffRows: any[] = staffSheet ? xlsx.utils.sheet_to_json(staffSheet) : [];
  console.log(`Loaded ${staffRows.length} staff contacts from Excel.`);

  const contactsToCreate: any[] = [];
  const seenContactKey = new Set<string>();

  for (const sr of staffRows) {
    const colName = (sr['College Name'] || '').trim().toLowerCase();
    const rawEmail = cleanEmail(sr['Email Address (Verified Real)'] || sr['Email']);
    const collegeId = collegeNameToId.get(colName);

    if (collegeId && rawEmail) {
      const role = normalizeRole(sr['Role / Category']);
      const cKey = `${collegeId}|${role}|${rawEmail}`.toLowerCase();
      if (!seenContactKey.has(cKey)) {
        seenContactKey.add(cKey);
        const personName = (sr['Staff / Official Name'] || '').trim();
        contactsToCreate.push({
          collegeId,
          role,
          email: rawEmail,
          personName: personName && personName !== 'Administrative Office' ? personName : null,
          sourceUrl: cleanUrl(sr['Website']),
          isActive: true,
        });
      }
    }
  }

  console.log(`Inserting ${contactsToCreate.length} unique staff contacts in batches...`);
  for (let i = 0; i < contactsToCreate.length; i += 400) {
    const chunk = contactsToCreate.slice(i, i + 400);
    await prisma.staffContact.createMany({
      data: chunk,
      skipDuplicates: true,
    });
    console.log(`Inserted staff batch: ${Math.min(i + 400, contactsToCreate.length)} / ${contactsToCreate.length}`);
  }

  const finalCollegeCount = await prisma.college.count();
  const finalContactCount = await prisma.staffContact.count();
  console.log(`=== Complete! Total Colleges in DB: ${finalCollegeCount}, Total Staff Contacts: ${finalContactCount} ===`);
}

seedAllColleges()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
