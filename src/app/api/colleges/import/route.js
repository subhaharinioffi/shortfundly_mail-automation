import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDb } from '@/lib/db';
import Papa from 'papaparse';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contentType = req.headers.get('content-type') || '';
    let rows = [];

    if (contentType.includes('application/json')) {
      const body = await req.json();
      rows = Array.isArray(body) ? body : body.rows || [];
    } else {
      const text = await req.text();
      const parsed = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
      });
      rows = parsed.data;
    }

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'No data found in uploaded dataset.' }, { status: 400 });
    }

    const db = getDb();
    const existingEmails = new Set(
      db.prepare('SELECT LOWER(email) as email FROM colleges').all().map(r => r.email)
    );

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let insertedCount = 0;
    let skippedDuplicatesCount = 0;
    let invalidCount = 0;
    const skippedList = [];
    const seenInBatch = new Set();

    const insertStmt = db.prepare(`
      INSERT INTO colleges (state, city, college_name, website_url, department, contact_person, email, source_page_url, notes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'uncontacted')
    `);

    const transaction = db.transaction((items) => {
      for (const row of items) {
        // Flexible key resolution
        const college_name = (row['College Name'] || row['college_name'] || row['College'] || row['Name'] || row['COLLEGE NAME'] || '').trim();
        const city = (row['City'] || row['city'] || row['CITY'] || 'Bhubaneswar').trim();
        const state = (row['State'] || row['state'] || row['STATE'] || 'Odisha').trim();
        const website_url = (row['Official website URL'] || row['Official Website URL'] || row['website_url'] || row['Website'] || row['Website URL'] || '').trim();
        const email = (row['Official email address'] || row['Official Email Address'] || row['email'] || row['Email'] || row['EMAIL'] || '').trim().toLowerCase();
        const department = (row['Department or contact person'] || row['Department'] || row['department'] || '').trim() || null;
        const contact_person = (row['Contact Person'] || row['contact_person'] || row['Contact person'] || '').trim() || null;
        const source_page_url = (row['Source page URL'] || row['Source Page URL'] || row['source_page_url'] || row['Source'] || '').trim();
        const notes = (row['Notes'] || row['notes'] || '').trim() || null;

        if (!college_name || !email) {
          invalidCount++;
          continue;
        }

        if (!emailRegex.test(email)) {
          invalidCount++;
          continue;
        }

        // Check if already in DB or duplicate in batch
        if (existingEmails.has(email) || seenInBatch.has(email)) {
          skippedDuplicatesCount++;
          if (skippedList.length < 15) {
            skippedList.push({ college: college_name, email, reason: 'Duplicate email address' });
          }
          continue;
        }

        seenInBatch.add(email);
        existingEmails.add(email);

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
      }
    });

    transaction(rows);

    return NextResponse.json({
      success: true,
      message: `Processed ${rows.length} rows successfully.`,
      stats: {
        totalRows: rows.length,
        inserted: insertedCount,
        skippedDuplicates: skippedDuplicatesCount,
        invalidRows: invalidCount,
      },
      skippedSamples: skippedList,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Dataset import failed' }, { status: 500 });
  }
}
