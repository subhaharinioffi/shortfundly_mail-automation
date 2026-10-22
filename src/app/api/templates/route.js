import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const db = getDb();
    const templates = db.prepare('SELECT * FROM email_templates ORDER BY is_default DESC, id DESC').all();
    return NextResponse.json({ templates });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to fetch templates' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { name, subject, body: content, is_default, category } = body;

    if (!name || !subject || !content) {
      return NextResponse.json({ error: 'Template name, subject, and body are required.' }, { status: 400 });
    }

    const db = getDb();

    if (is_default) {
      db.prepare('UPDATE email_templates SET is_default = 0').run();
    }

    const insert = db.prepare(`
      INSERT INTO email_templates (name, subject, body, is_default, category, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      name.trim(),
      subject.trim(),
      content.trim(),
      is_default ? 1 : 0,
      category?.trim() || 'General',
      session?.user?.name || 'Administrator'
    );

    const created = db.prepare('SELECT * FROM email_templates WHERE id = ?').get(result.lastInsertRowid);

    return NextResponse.json({ success: true, template: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to create template' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    const { id, name, subject, body: content, is_default, category } = body;

    if (!id || !name || !subject || !content) {
      return NextResponse.json({ error: 'Template ID, name, subject, and body are required.' }, { status: 400 });
    }

    const db = getDb();

    if (is_default) {
      db.prepare('UPDATE email_templates SET is_default = 0 WHERE id != ?').run(id);
    }

    db.prepare(`
      UPDATE email_templates
      SET name = ?, subject = ?, body = ?, is_default = ?, category = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name.trim(),
      subject.trim(),
      content.trim(),
      is_default ? 1 : 0,
      category?.trim() || 'General',
      id
    );

    const updated = db.prepare('SELECT * FROM email_templates WHERE id = ?').get(id);

    return NextResponse.json({ success: true, template: updated });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to update template' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Template ID is required.' }, { status: 400 });
    }

    const db = getDb();
    const existing = db.prepare('SELECT is_default FROM email_templates WHERE id = ?').get(id);
    if (existing && existing.is_default === 1) {
      return NextResponse.json({ error: 'Cannot delete the default template. Set another template as default first.' }, { status: 400 });
    }

    db.prepare('DELETE FROM email_templates WHERE id = ?').run(id);

    return NextResponse.json({ success: true, message: 'Template deleted.' });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to delete template' }, { status: 500 });
  }
}
