import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { sendEmailMessage } from '@/lib/mailer';

// Helper to delay between sends to respect Google SMTP rate limits
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      collegeIds,
      templateId,
      customSubject,
      customBody,
      senderName,
      bypassDuplicateCheck = false,
      delayMs = 800,
    } = body;

    const db = getDb();

    // 1. Resolve Template Content
    let subject = customSubject;
    let content = customBody;

    if ((!subject || !content) && templateId) {
      const template = db.prepare('SELECT subject, body FROM email_templates WHERE id = ?').get(templateId);
      if (!template) {
        return NextResponse.json({ error: 'Selected template not found.' }, { status: 404 });
      }
      subject = subject || template.subject;
      content = content || template.body;
    }

    if (!subject || !content) {
      return NextResponse.json({ error: 'Subject and email body are required.' }, { status: 400 });
    }

    // 2. Fetch Colleges
    let colleges = [];
    if (Array.isArray(collegeIds) && collegeIds.length > 0) {
      const placeholders = collegeIds.map(() => '?').join(',');
      colleges = db.prepare(`SELECT * FROM colleges WHERE id IN (${placeholders})`).all(...collegeIds);
    } else if (collegeIds === 'all') {
      colleges = db.prepare('SELECT * FROM colleges').all();
    } else {
      return NextResponse.json({ error: 'Please select at least one recipient college.' }, { status: 400 });
    }

    if (colleges.length === 0) {
      return NextResponse.json({ error: 'No colleges found for the given selection.' }, { status: 404 });
    }

    // 3. Process Sending Queue
    const results = [];
    let sentCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    const currentUserName = session.user?.name || 'Automated Outreach System';
    const finalSenderName = senderName?.trim() || session.user?.name || 'Shortfundly Campus Team';

    for (let i = 0; i < colleges.length; i++) {
      const college = colleges[i];

      const outcome = await sendEmailMessage({
        collegeId: college.id,
        collegeName: college.college_name,
        recipientEmail: college.email,
        rawSubject: subject,
        rawBody: content,
        senderName: finalSenderName,
        sentByUser: currentUserName,
        bypassDuplicateCheck: Boolean(bypassDuplicateCheck),
        variables: {
          college_name: college.college_name,
          city: college.city,
          department: college.department || 'Academic & Creative Affairs',
          contact_person: college.contact_person || 'Sir/Madam',
          website_url: college.website_url,
          sender_name: finalSenderName,
          sender_role: 'Product Manager | Shortfundly'
        }
      });

      if (outcome.status === 'sent') sentCount++;
      else if (outcome.status === 'skipped_duplicate') skippedCount++;
      else failedCount++;

      results.push({
        collegeId: college.id,
        collegeName: college.college_name,
        email: college.email,
        status: outcome.status,
        error: outcome.error || null,
        messageId: outcome.messageId || null,
      });

      // Brief delay between sends if multiple
      if (i < colleges.length - 1 && delayMs > 0) {
        await sleep(Math.min(delayMs, 3000));
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        total: colleges.length,
        sent: sentCount,
        failed: failedCount,
        skippedDuplicates: skippedCount,
      },
      results,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Bulk sending failed' }, { status: 500 });
  }
}
