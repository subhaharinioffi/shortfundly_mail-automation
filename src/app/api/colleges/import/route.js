import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDb } from '@/lib/db';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const contentType = req.headers.get('content-type') || '';
    let rows = [];
    let mode = searchParams.get('mode') || 'upsert'; // 'upsert' or 'replace'

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file');
      const formMode = formData.get('mode');
      if (formMode) mode = String(formMode);

      if (file) {
        const fileName = (file.name || '').toLowerCase();
        const buffer = Buffer.from(await file.arrayBuffer());

        if (fileName.endsWith('.csv')) {
          const text = buffer.toString('utf-8');
          const parsed = Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
          });
          rows = parsed.data || [];
        } else {
          // Parse .xlsx, .xls, or binary spreadsheet
          const workbook = XLSX.read(buffer, { type: 'buffer' });
          const sheetName = workbook.SheetNames[0];
          if (sheetName) {
            const sheet = workbook.Sheets[sheetName];
            const raw2D = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            
            // Smart Header Detection: automatically skip title banners / subtitle rows
            let headerIndex = 0;
            for (let i = 0; i < Math.min(raw2D.length, 15); i++) {
              const r = raw2D[i] || [];
              const nonEmpty = r.filter(c => String(c || '').trim().length > 0);
              if (nonEmpty.length >= 3) {
                const line = r.join(' ').toLowerCase();
                if (
                  line.includes('email') || 
                  line.includes('mail') || 
                  (line.includes('name') && line.includes('college')) || 
                  line.includes('website') || 
                  line.includes('district') ||
                  line.includes('university')
                ) {
                  headerIndex = i;
                  break;
                }
              }
            }

            const headerRow = (raw2D[headerIndex] || []).map(h => String(h || '').trim());
            rows = [];
            for (let i = headerIndex + 1; i < raw2D.length; i++) {
              const rowArr = raw2D[i] || [];
              if (!rowArr.some(c => String(c || '').trim().length > 0)) continue;
              const obj = {};
              headerRow.forEach((colName, idx) => {
                if (colName) {
                  obj[colName] = rowArr[idx] !== undefined && rowArr[idx] !== null ? String(rowArr[idx]).trim() : '';
                }
              });
              rows.push(obj);
            }
          }
        }
      }
    } else if (contentType.includes('application/json')) {
      const body = await req.json();
      if (body && typeof body === 'object' && !Array.isArray(body)) {
        if (body.mode) mode = body.mode;
        rows = body.rows || [];
      } else {
        rows = Array.isArray(body) ? body : [];
      }
    } else {
      const text = await req.text();
      const parsed = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
      });
      rows = parsed.data || [];
    }

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'No data rows found in uploaded dataset.' }, { status: 400 });
    }

    const db = getDb();

    // If replace mode, wipe existing records first
    if (mode === 'replace') {
      db.prepare('DELETE FROM colleges').run();
    }

    const existingEmails = new Set(
      db.prepare('SELECT LOWER(email) as email FROM colleges').all().map(r => r.email)
    );

    let insertedCount = 0;
    let updatedCount = 0;
    let duplicatesInFileCount = 0;
    let invalidCount = 0;
    const seenInBatch = new Set();

    const insertStmt = db.prepare(`
      INSERT INTO colleges (state, city, college_name, website_url, department, contact_person, email, source_page_url, notes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'uncontacted')
    `);

    const updateStmt = db.prepare(`
      UPDATE colleges SET
        state = ?,
        city = ?,
        college_name = ?,
        website_url = ?,
        department = ?,
        contact_person = ?,
        source_page_url = ?,
        notes = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE LOWER(email) = LOWER(?)
    `);

    const transaction = db.transaction((items) => {
      for (const row of items) {
        const college_name = (
            row['College Name (Standardized)'] || 
            row['College Name'] || 
            row['college_name'] || 
            row['College'] || 
            row['COLLEGE NAME'] || 
            row['COLLEGE'] || 
            row['Name'] || 
            row['NAME'] || 
            row['Institute'] || 
            row['INSTITUTE'] || 
            row['Institution'] || 
            row['INSTITUTION'] || 
            ''
          ).trim();

          const rawEmails = [
            row['All Unique Emails (Combined)'],
            row['Principal Official Email'],
            row['Principal / Dean / Leadership Emails'],
            row['Dean / Leadership Emails'],
            row['General / Office Emails'],
            row['General / Office Enquiry Emails'],
            row['HOD Emails (Head of Dept)'],
            row['Department Faculty & Staff Emails'],
            row['Official Email Address'],
            row['Official email address'],
            row['Official Email'],
            row['email'],
            row['Email'],
            row['EMAIL'],
            row['Email ID'],
            row['EMAIL ID'],
            row['Mail'],
            row['MAIL']
          ].filter(Boolean).map(String).join(';');

          const emailMatches = rawEmails.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
          const uniqueEmails = [...new Set(emailMatches.map(e => e.toLowerCase().trim()))];
          const email = uniqueEmails[0] || '';

          let city = (
            row['District'] || 
            row['District / City'] || 
            row['City / District'] || 
            row['Block / City'] || 
            row['City'] || 
            row['city'] || 
            row['CITY'] || 
            row['Location'] || 
            row['LOCATION'] || 
            'Bhubaneswar'
          ).trim();

          if (city.toLowerCase() === 'null' || city.toLowerCase() === 'n/a' || !city) {
            city = 'Bhubaneswar';
          }

          const state = (row['State'] || row['state'] || row['STATE'] || 'Odisha').trim();

          let website_url = (
            row['Official Website'] || 
            row['Official website URL'] || 
            row['Official Website URL'] || 
            row['website_url'] || 
            row['Website'] || 
            row['Website URL'] || 
            row['WEBSITE'] || 
            row['URL'] || 
            row['Web'] || 
            row['WEB'] || 
            ''
          ).trim();

          if (['-', '--', 'n/a', 'na', 'none', 'null', 'nil', '#n/a'].includes(website_url.toLowerCase())) {
            website_url = '';
          } else if (website_url && !website_url.startsWith('http://') && !website_url.startsWith('https://')) {
            if (website_url.includes('.') && !website_url.includes(' ')) {
              website_url = `https://${website_url}`;
            }
          }

          let contact_person = (
            row['Principal / Head Name (Govt Verified)'] || 
            row['Principal / Head Name'] || 
            row['Principal Name'] || 
            row['Principal / Head'] || 
            row['Admission In-Charge (Name & Mobile)'] || 
            row['Contact Office / Person'] || 
            row['Contact Person'] || 
            row['contact_person'] || 
            row['Contact person'] || 
            row['CONTACT PERSON'] || 
            row['Contact'] || 
            row['CONTACT'] || 
            ''
          ).trim() || null;

          let department = (
            row['Category / Stream'] || 
            row['College Type / Category'] || 
            row['Affiliated University / Board'] || 
            row['Affiliated University'] || 
            row['Parent / Affiliating University'] || 
            row['Type'] || 
            row['Department or contact person'] || 
            row['Department'] || 
            row['department'] || 
            row['DEPARTMENT'] || 
            row['Dept'] || 
            row['DEPT'] || 
            ''
          ).trim() || null;

          let source_page_url = (
            row['Data Verification Sources'] || 
            row['IndCareer Profile Link'] || 
            row['Email Source'] || 
            row['Source page URL'] || 
            row['Source Page URL'] || 
            row['source_page_url'] || 
            row['Source'] || 
            row['SOURCE'] || 
            row['Source URL'] || 
            row['SOURCE URL'] || 
            website_url || 
            'Official Directory'
          ).trim();

          const noteParts = [];
          const rawNotes = (row['Notes'] || row['notes'] || row['NOTES'] || row['Remarks'] || row['REMARKS'] || '').trim();
          if (rawNotes) noteParts.push(rawNotes);

          const phone = (
            row['Principal Direct Mobile'] || 
            row['Principal Mobile Number'] || 
            row['Helpline & Office Phones'] || 
            ''
          ).trim();
          if (phone) noteParts.push(`Phone: ${phone}`);

          const sams = (row['SAMS Govt Code'] || '').trim();
          if (sams) noteParts.push(`SAMS: ${sams}`);

          const aishe = (row['AISHE Code'] || '').trim();
          if (aishe) noteParts.push(`AISHE: ${aishe}`);

          const bput = (row['BPUT Code'] || row['BPUT Technical Code'] || '').trim();
          if (bput) noteParts.push(`BPUT: ${bput}`);

          const address = (row['Campus Address & PIN'] || '').trim();
          if (address) noteParts.push(`Address: ${address}`);

          if (uniqueEmails.length > 1) {
            const alternates = uniqueEmails.slice(1).join(', ');
            noteParts.push(`Alternate Emails: ${alternates}`);
          }

          const notes = noteParts.length > 0 ? noteParts.join(' | ') : null;

          if (!college_name || !email) {
            invalidCount++;
            continue;
          }

        // Prevent duplicate rows within the uploaded file itself
        if (seenInBatch.has(email)) {
          duplicatesInFileCount++;
          continue;
        }
        seenInBatch.add(email);

        // If email already exists in DB, update/sync its details with latest file data
        if (existingEmails.has(email)) {
          updateStmt.run(
            state,
            city,
            college_name,
            website_url,
            department,
            contact_person,
            source_page_url,
            notes,
            email
          );
          updatedCount++;
        } else {
          // If new email, insert brand new college record
          insertStmt.run(
            state,
            city,
            college_name,
            website_url,
            department,
            contact_person,
            email,
            source_page_url,
            notes
          );
          insertedCount++;
          existingEmails.add(email);
        }
      }
    });

    transaction(rows);

    const totalProcessed = insertedCount + updatedCount;

    return NextResponse.json({
      success: true,
      message: `Processed ${rows.length} rows successfully: ${totalProcessed} colleges saved to database (${insertedCount} new added, ${updatedCount} updated from file).`,
      stats: {
        totalRows: rows.length,
        totalProcessed,
        inserted: insertedCount,
        updated: updatedCount,
        skippedDuplicates: duplicatesInFileCount,
        invalidRows: invalidCount,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Dataset import failed' }, { status: 500 });
  }
}
