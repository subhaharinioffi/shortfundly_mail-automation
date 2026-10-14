import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDb } from '@/lib/db';

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
    const total = totalResult.count;

    const listStmt = db.prepare(`
      SELECT * FROM colleges
      ${whereClause}
      ORDER BY id DESC
      LIMIT ? OFFSET ?
    `);
    const colleges = listStmt.all(...params, limit, offset);

    const cities = db.prepare('SELECT DISTINCT city FROM colleges ORDER BY city ASC').all().map(c => c.city);

    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN status = 'uncontacted' THEN 1 ELSE 0 END) as uncontacted,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM colleges
    `).get();

    return NextResponse.json({
      colleges,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      cities,
      stats,
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
    return NextResponse.json({ error: error.message || 'Failed to create college' }, { status: 500 });
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

    if (!id) {
      return NextResponse.json({ error: 'College ID is required.' }, { status: 400 });
    }

    const db = getDb();

    if (email) {
      const duplicate = db.prepare('SELECT id FROM colleges WHERE LOWER(email) = LOWER(?) AND id != ?').get(email.trim(), id);
      if (duplicate) {
        return NextResponse.json({ error: `The email "${email}" is already used by another college.` }, { status: 409 });
      }
    }

    db.prepare(`
      UPDATE colleges
      SET 
        state = COALESCE(?, state),
        city = COALESCE(?, city),
        college_name = COALESCE(?, college_name),
        website_url = COALESCE(?, website_url),
        department = COALESCE(?, department),
        contact_person = COALESCE(?, contact_person),
        email = COALESCE(?, email),
        source_page_url = COALESCE(?, source_page_url),
        notes = COALESCE(?, notes),
        status = COALESCE(?, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      state ?? null,
      city ?? null,
      college_name ?? null,
      website_url ?? null,
      department ?? null,
      contact_person ?? null,
      email ? email.trim().toLowerCase() : null,
      source_page_url ?? null,
      notes ?? null,
      status ?? null,
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
    const action = searchParams.get('action');
    const id = searchParams.get('id');

    const db = getDb();

    if (action === 'clear_all') {
      db.prepare('DELETE FROM colleges').run();
      return NextResponse.json({ success: true, message: 'All college records cleared. Master directory is ready for your official dataset upload.' });
    }

    if (!id) {
      return NextResponse.json({ error: 'ID or action is required' }, { status: 400 });
    }

    db.prepare('DELETE FROM colleges WHERE id = ?').run(id);

    return NextResponse.json({ success: true, message: 'College removed successfully.' });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to delete college' }, { status: 500 });
  }
}
