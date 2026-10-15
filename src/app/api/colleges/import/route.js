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
        // Flexible key resolution for Excel and CSV column variations
        const college_name = (
          row['Name'] || 
          row['College Name'] || 
          row['college_name'] || 
          row['College'] || 
          row['COLLEGE NAME'] || 
          row['COLLEGE'] || 
          row['Institute'] || 
          row['INSTITUTE'] || 
          row['Institution'] || 
          row['INSTITUTION'] || 
          ''
        ).trim();

        const rawEmail = String(
          row['Official Email'] || 
          row['Official email address'] || 
          row['email'] || 
          row['Email'] || 
          row['EMAIL'] || 
          row['Official Email Address'] || 
          row['Mail'] || 
          row['MAIL'] || 
          row['Email ID'] || 
          row['EMAIL ID'] || 
          ''
        ).trim();

        // Extract valid email addresses (handles single emails or semicolon/comma-separated lists)
        const emailMatches = rawEmail.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
        const email = emailMatches[0] ? emailMatches[0].toLowerCase().trim() : '';

        const city = (
          row['City / District'] || 
          row['City'] || 
          row['city'] || 
          row['CITY'] || 
          row['District'] || 
          row['DISTRICT'] || 
          row['Location'] || 
          row['LOCATION'] || 
          'Bhubaneswar'
        ).trim();

        const state = (row['State'] || row['state'] || row['STATE'] || 'Odisha').trim();

        const website_url = (
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

        const department = (
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

        const contact_person = (
          row['Contact Office / Person'] || 
          row['Contact Person'] || 
          row['contact_person'] || 
          row['Contact person'] || 
          row['CONTACT PERSON'] || 
          row['Contact'] || 
          row['CONTACT'] || 
          ''
        ).trim() || null;

        const source_page_url = (
          row['Email Source'] || 
          row['Source page URL'] || 
          row['Source Page URL'] || 
          row['source_page_url'] || 
          row['Source'] || 
          row['SOURCE'] || 
          row['Source URL'] || 
          row['SOURCE URL'] || 
          website_url || 
          ''
        ).trim();

        let notes = (row['Notes'] || row['notes'] || row['NOTES'] || row['Remarks'] || row['REMARKS'] || '').trim() || null;
        if (emailMatches.length > 1) {
          const alternate = emailMatches.slice(1).join(', ');
          notes = notes ? `${notes} | Alternate Emails: ${alternate}` : `Alternate Emails: ${alternate}`;
        }

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
