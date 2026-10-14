import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { sendEmailMessage } from '@/lib/mailer';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = (page - 1) * limit;

    const db = getDb();
    const conditions = [];
    const params = [];

    if (search.trim()) {
      conditions.push('(college_name LIKE ? OR recipient_email LIKE ? OR subject LIKE ? OR sent_by_user LIKE ?)');
      const pattern = `%${search.trim()}%`;
      params.push(pattern, pattern, pattern, pattern);
    }

    if (status.trim() && status !== 'all') {
      conditions.push('status = ?');
      params.push(status.trim());
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const totalStmt = db.prepare(`SELECT count(*) as count FROM email_logs ${whereClause}`);
    const total = (totalStmt.get(...params)).count;

    const listStmt = db.prepare(`
      SELECT * FROM email_logs
      ${whereClause}
      ORDER BY id DESC
      LIMIT ? OFFSET ?
    `);
    const logs = listStmt.all(...params, limit, offset);

    // Aggregate stats
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN status = 'skipped_duplicate' THEN 1 ELSE 0 END) as skipped_duplicate
      FROM email_logs
    `).get();

    return NextResponse.json({
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      stats,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to fetch logs' }, { status: 500 });
  }
}

// Retry failed email
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { logId } = body;

    if (!logId) {
      return NextResponse.json({ error: 'Log ID is required to retry.' }, { status: 400 });
    }

    const db = getDb();
    const log = db.prepare('SELECT * FROM email_logs WHERE id = ?').get(logId);

    if (!log) {
      return NextResponse.json({ error: 'Email log not found.' }, { status: 404 });
    }

    const outcome = await sendEmailMessage({
      collegeId: log.college_id,
      collegeName: log.college_name,
      recipientEmail: log.recipient_email,
      rawSubject: log.subject,
      rawBody: log.body,
      senderName: log.sender_name,
      sentByUser: `${session.user?.name || 'User'} (Retry)`,
      bypassDuplicateCheck: true,
    });

    return NextResponse.json({
      success: outcome.success,
      status: outcome.status,
      messageId: outcome.messageId,
      error: outcome.error,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Retry failed' }, { status: 500 });
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

    const db = getDb();
    if (action === 'clear_all') {
      db.prepare('DELETE FROM email_logs').run();
      return NextResponse.json({ success: true, message: 'All logs cleared.' });
    }

    const id = searchParams.get('id');
    if (id) {
      db.prepare('DELETE FROM email_logs WHERE id = ?').run(id);
      return NextResponse.json({ success: true, message: 'Log deleted.' });
    }

    return NextResponse.json({ error: 'Invalid action or ID' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to delete logs' }, { status: 500 });
  }
}
