import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { ODISHA_COLLEGES_SEED } from '@/lib/odisha-seed-data';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const city = searchParams.get('city') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = (page - 1) * limit;

    const db = getDb();

    // Check if table is empty and needs self-healing auto-seed
    const checkEmpty = db.prepare('SELECT count(*) as count FROM colleges').get();
    if ((!checkEmpty || checkEmpty.count === 0) && Array.isArray(ODISHA_COLLEGES_SEED) && ODISHA_COLLEGES_SEED.length > 0) {
      const insertCollege = db.prepare(`
        INSERT OR IGNORE INTO colleges (state, city, college_name, website_url, department, contact_person, email, source_page_url, notes, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'uncontacted')
      `);
      const seedTx = db.transaction((items) => {
        for (const item of items) {
          insertCollege.run(item.state, item.city, item.college_name, item.website_url, item.department, item.contact_person, item.email, item.source_page_url, item.notes);
        }
      });
      seedTx(ODISHA_COLLEGES_SEED);
    }

    const conditions = [];
    const params = [];

    if (search.trim()) {
      conditions.push('(college_name LIKE ? OR email LIKE ? OR department LIKE ? OR contact_person LIKE ?)');
      const pattern = `%${search.trim()}%`;
      params.push(pattern, pattern, pattern, pattern);
    }

    if (city.trim() && city !== 'all') {
      conditions.push('city = ?');
      params.push(city.trim());
    }

    if (status.trim() && status !== 'all') {
      conditions.push('status = ?');
      params.push(status.trim());
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const totalStmt = db.prepare(`SELECT count(*) as count FROM colleges ${whereClause}`);
    const totalResult = totalStmt.get(...params);
    const total = totalResult ? totalResult.count : 0;

    const listStmt = db.prepare(`
      SELECT * FROM colleges
      ${whereClause}
      ORDER BY id DESC
      LIMIT ? OFFSET ?
    `);
    const colleges = listStmt.all(...params, limit, offset);

    const cities = db.prepare('SELECT DISTINCT city FROM colleges WHERE city IS NOT NULL AND city != "" ORDER BY city ASC').all().map(c => c.city);

    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN status = 'uncontacted' THEN 1 ELSE 0 END) as uncontacted,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM colleges
    `).get() || { total: 0, sent: 0, uncontacted: 0, failed: 0 };

    return NextResponse.json({
      colleges,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      cities,
      stats: {
        total: stats.total || 0,
        sent: stats.sent || 0,
        uncontacted: stats.uncontacted || 0,
        failed: stats.failed || 0,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const contentType = req.headers.get('content-type') || '';

    // Handle Bulk Dataset Import (Multipart file or pasted text)
    if (action === 'import' || contentType.includes('multipart/form-data')) {
      let rows = [];
      let mode = searchParams.get('mode') || 'upsert';

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
            const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
            rows = parsed.data || [];
          } else {
            const workbook = XLSX.read(buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            if (sheetName) {
              const sheet = workbook.Sheets[sheetName];
              const raw2D = XLSX.utils.sheet_to_json(sheet, { header: 1 });
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
        const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
        rows = parsed.data || [];
      }

      if (!rows || rows.length === 0) {
        return NextResponse.json({ error: 'No data rows found in uploaded dataset.' }, { status: 400 });
      }

      const db = getDb();
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

          if (seenInBatch.has(email)) {
            duplicatesInFileCount++;
            continue;
          }
          seenInBatch.add(email);

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
    }

    // Handle Single College Creation
    const body = await req.json();
    const { state, city, college_name, website_url, department, contact_person, email, source_page_url, notes } = body;

    if (!college_name || !city || !email) {
      return NextResponse.json({ error: 'College Name, City, and Official Email are required fields.' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ error: 'Invalid email address format.' }, { status: 400 });
    }

    const db = getDb();

    const existing = db.prepare('SELECT id, college_name FROM colleges WHERE LOWER(email) = LOWER(?)').get(email.trim());
    if (existing) {
      return NextResponse.json({
        error: `Duplicate email detected: "${email.trim()}" is already assigned to "${existing.college_name}".`
      }, { status: 409 });
    }

    const insert = db.prepare(`
      INSERT INTO colleges (state, city, college_name, website_url, department, contact_person, email, source_page_url, notes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'uncontacted')
    `);

    const result = insert.run(
      state?.trim() || 'Odisha',
      city.trim(),
      college_name.trim(),
      website_url?.trim() || '',
      department?.trim() || null,
      contact_person?.trim() || null,
      email.trim().toLowerCase(),
      source_page_url?.trim() || '',
      notes?.trim() || null
    );

    const newCollege = db.prepare('SELECT * FROM colleges WHERE id = ?').get(result.lastInsertRowid);

    return NextResponse.json({ success: true, college: newCollege }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to process college request' }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, state, city, college_name, website_url, department, contact_person, email, source_page_url, notes, status } = body;

    if (!id || !college_name || !city || !email) {
      return NextResponse.json({ error: 'ID, College Name, City, and Official Email are required.' }, { status: 400 });
    }

    const db = getDb();

    const duplicate = db.prepare('SELECT id FROM colleges WHERE LOWER(email) = LOWER(?) AND id != ?').get(email.trim(), id);
    if (duplicate) {
      return NextResponse.json({ error: 'Another college already uses this email address.' }, { status: 409 });
    }

    const update = db.prepare(`
      UPDATE colleges
      SET state = ?, city = ?, college_name = ?, website_url = ?, department = ?, contact_person = ?, email = ?, source_page_url = ?, notes = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    update.run(
      state || 'Odisha',
      city.trim(),
      college_name.trim(),
      website_url || '',
      department || null,
      contact_person || null,
      email.trim().toLowerCase(),
      source_page_url || '',
      notes || null,
      status || 'uncontacted',
      id
    );

    const updated = db.prepare('SELECT * FROM colleges WHERE id = ?').get(id);

    return NextResponse.json({ success: true, college: updated });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to update college' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const action = searchParams.get('action');

    const db = getDb();

    if (action === 'clear_all') {
      db.prepare('DELETE FROM colleges').run();
      return NextResponse.json({ 
        success: true, 
        message: 'All college records cleared. Master directory is ready for your official dataset upload.' 
      });
    }

    if (!id) {
      return NextResponse.json({ error: 'College ID is required for deletion.' }, { status: 400 });
    }

    db.prepare('DELETE FROM colleges WHERE id = ?').run(id);

    return NextResponse.json({ success: true, message: 'College record deleted.' });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to delete college' }, { status: 500 });
  }
}
