import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { sendEmailMessage } from '@/lib/mailer';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    const payload = await req.json();
    const {
      collegeName,
      city = 'Odisha',
      department,
      contactPerson,
      websiteUrl = '',
      recipientEmail,
      subject,
      body: content,
      senderName,
      saveToColleges = false,
      bypassDuplicateCheck = true, // for manual custom sending, default allows sending even if previously emailed, but logs it
    } = payload;

    if (!collegeName || !recipientEmail || !subject || !content) {
      return NextResponse.json({ error: 'College Name, Recipient Email, Subject, and Body are required.' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail.trim())) {
      return NextResponse.json({ error: 'Invalid recipient email format.' }, { status: 400 });
    }

    const db = getDb();
    let collegeId = null;

    // Check if college exists in directory
    const existing = db.prepare('SELECT id FROM colleges WHERE LOWER(email) = LOWER(?)').get(recipientEmail.trim());
    if (existing) {
      collegeId = existing.id;
    } else if (saveToColleges) {
      // Save new college into directory
      const insert = db.prepare(`
        INSERT INTO colleges (state, city, college_name, website_url, department, contact_person, email, source_page_url, status)
        VALUES ('Odisha', ?, ?, ?, ?, ?, ?, ?, 'pending')
      `).run(
        city || 'Odisha',
        collegeName.trim(),
        websiteUrl || '',
        department || null,
        contactPerson || null,
        recipientEmail.trim().toLowerCase(),
        websiteUrl || 'Manual Entry'
      );
      collegeId = insert.lastInsertRowid;
    }

    const finalSenderName = senderName?.trim() || session.user?.name || 'Shortfundly Campus Team';
    const currentUserName = session.user?.name || 'Authorized User';

    const outcome = await sendEmailMessage({
      collegeId,
      collegeName: collegeName.trim(),
      recipientEmail: recipientEmail.trim().toLowerCase(),
      rawSubject: subject.trim(),
      rawBody: content.trim(),
      senderName: finalSenderName,
      sentByUser: currentUserName,
      bypassDuplicateCheck,
      variables: {
        college_name: collegeName.trim(),
        city: city || 'Odisha',
        department: department || 'Academic & Creative Affairs',
        contact_person: contactPerson || 'Sir/Madam',
        website_url: websiteUrl || '',
        sender_name: finalSenderName,
        sender_role: 'Product Manager | Shortfundly'
      }
    });

    if (!outcome.success && outcome.status !== 'skipped_duplicate') {
      return NextResponse.json({
        success: false,
        error: outcome.error || 'Failed to send customized email via Google SMTP.'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      status: outcome.status,
      messageId: outcome.messageId,
      message: outcome.status === 'skipped_duplicate' 
        ? outcome.error 
        : `Customized email successfully dispatched to ${collegeName} (${recipientEmail}).`,
      collegeId,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Manual sending failed' }, { status: 500 });
  }
}
