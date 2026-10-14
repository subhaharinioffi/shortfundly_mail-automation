import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { getSmtpSettings, verifySmtp } from '@/lib/mailer';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = getSmtpSettings();
    // Mask password for security
    const maskedSettings = {
      ...settings,
      smtp_pass: settings.smtp_pass ? '••••••••••••••••' : '',
      has_password: Boolean(settings.smtp_pass),
    };

    return NextResponse.json({ settings: maskedSettings });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    // Test connection action
    if (action === 'test_connection') {
      const { smtp_host, smtp_port, smtp_secure, smtp_user, smtp_pass } = body;
      const current = getSmtpSettings();

      const testConfig = {
        smtp_host: smtp_host || current.smtp_host,
        smtp_port: parseInt(smtp_port || current.smtp_port, 10),
        smtp_secure: smtp_secure !== undefined ? Boolean(smtp_secure) : current.smtp_secure,
        smtp_user: smtp_user !== undefined ? smtp_user : current.smtp_user,
        smtp_pass: smtp_pass && smtp_pass !== '••••••••••••••••' ? smtp_pass : current.smtp_pass,
      };

      const verification = await verifySmtp(testConfig);
      return NextResponse.json(verification);
    }

    // Save settings action
    const db = getDb();
    const updateStmt = db.prepare(`
      INSERT INTO system_settings (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
    `);

    const fields = ['smtp_host', 'smtp_port', 'smtp_secure', 'smtp_user', 'from_name', 'from_email', 'duplicate_cooldown_days'];

    for (const f of fields) {
      if (body[f] !== undefined) {
        updateStmt.run(f, String(body[f]));
      }
    }

    // Update password only if provided and not masked
    if (body.smtp_pass && body.smtp_pass !== '••••••••••••••••') {
      updateStmt.run('smtp_pass', body.smtp_pass.trim());
    }

    return NextResponse.json({ success: true, message: 'Settings saved successfully.' });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to save settings' }, { status: 500 });
  }
}
