import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { sendEmailMessage } from '@/lib/mailer';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Helper to delay between sends to respect SMTP rate limits
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    const currentUserName = session?.user?.name || 'Authorized User';

    const body = await req.json();
    const {
      recipients: passedRecipients,
      collegeIds,
      targetRole,
      templateId,
      customSubject,
      customBody,
      senderName,
      bypassDuplicateCheck = false,
      delayMs = 1200,
    } = body;

    const db = getDb();

    // 1. Resolve Template Content
    let subject = customSubject?.trim();
    let content = customBody?.trim();

    if ((!subject || !content) && templateId) {
      const template = db
        .prepare('SELECT subject, body FROM email_templates WHERE id = ?')
        .get(templateId);
      if (template) {
        subject = subject || template.subject;
        content = content || template.body;
      }
    }

    if (!subject || !content) {
      // Fallback default Shortfundly Campus template
      const defaultTmpl = db
        .prepare('SELECT subject, body FROM email_templates ORDER BY is_default DESC LIMIT 1')
        .get();
      if (defaultTmpl) {
        subject = subject || defaultTmpl.subject;
        content = content || defaultTmpl.body;
      } else {
        return NextResponse.json(
          { error: 'Subject and email body are required.' },
          { status: 400 }
        );
      }
    }

    // 2. Resolve Target Recipients List
    let finalRecipients = [];

    if (Array.isArray(passedRecipients) && passedRecipients.length > 0) {
      finalRecipients = passedRecipients;
    } else if (Array.isArray(collegeIds) && collegeIds.length > 0) {
      // Check if IDs are strings (UUIDs for Prisma PostgreSQL) or integers
      const isStringIds = typeof collegeIds[0] === 'string' && isNaN(Number(collegeIds[0]));

      if (isStringIds) {
        // Fetch from PostgreSQL via Prisma
        const pgColleges = await prisma.college.findMany({
          where: { id: { in: collegeIds } },
          include: {
            contacts: {
              where: { isActive: true },
              orderBy: { role: 'asc' },
            },
          },
        });

        finalRecipients = pgColleges.map((c) => {
          let chosenEmail = c.officialEmail || '';
          let chosenRole = 'Official';
          let personName = '';

          if (targetRole && targetRole !== 'all' && c.contacts?.length > 0) {
            const matched = c.contacts.find((ct) =>
              ct.role.toLowerCase().includes(targetRole.toLowerCase())
            );
            if (matched) {
              chosenEmail = matched.email;
              chosenRole = matched.role;
              personName = matched.personName || '';
            }
          }

          if (!chosenEmail && c.contacts?.length > 0) {
            chosenEmail = c.contacts[0].email;
            chosenRole = c.contacts[0].role;
            personName = c.contacts[0].personName || '';
          }

          return {
            collegeId: c.id,
            collegeName: c.collegeName,
            recipientEmail: chosenEmail,
            role: chosenRole,
            personName,
            state: c.state,
            district: c.district,
            websiteUrl: c.officialWebsite || '',
          };
        });
      } else {
        // Legacy SQLite colleges fallback
        const placeholders = collegeIds.map(() => '?').join(',');
        const sqColleges = db
          .prepare(`SELECT * FROM colleges WHERE id IN (${placeholders})`)
          .all(...collegeIds);

        finalRecipients = sqColleges.map((c) => ({
          collegeId: c.id,
          collegeName: c.college_name,
          recipientEmail: c.email,
          role: c.department || 'Official',
          personName: c.contact_person || '',
          state: c.state || 'Odisha',
          district: c.city || '',
          websiteUrl: c.website_url || '',
        }));
      }
    } else {
      return NextResponse.json(
        { error: 'Please select at least one recipient college.' },
        { status: 400 }
      );
    }

    // Filter to entries with valid emails
    const validRecipients = finalRecipients.filter(
      (r) => r.recipientEmail && r.recipientEmail.includes('@')
    );

    if (validRecipients.length === 0) {
      return NextResponse.json(
        { error: 'None of the selected colleges have valid email addresses.' },
        { status: 400 }
      );
    }

    // 3. Process Sending Queue
    const results = [];
    let sentCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    const finalSenderName =
      senderName?.trim() || session?.user?.name || 'Shortfundly Campus Team';

    for (let i = 0; i < validRecipients.length; i++) {
      const rec = validRecipients[i];

      // Pass collegeId as null if it's a UUID string to prevent SQLite foreign key error on email_logs
      const safeCollegeId =
        typeof rec.collegeId === 'number' && !isNaN(rec.collegeId) ? rec.collegeId : null;

      const outcome = await sendEmailMessage({
        collegeId: safeCollegeId,
        collegeName: rec.collegeName,
        recipientEmail: rec.recipientEmail.trim().toLowerCase(),
        rawSubject: subject,
        rawBody: content,
        senderName: finalSenderName,
        sentByUser: currentUserName,
        bypassDuplicateCheck: Boolean(bypassDuplicateCheck),
        variables: {
          college_name: rec.collegeName,
          state: rec.state || 'India',
          district: rec.district || rec.city || '',
          city: rec.district || rec.city || 'India',
          department: rec.role || rec.department || 'Academic Affairs',
          role: rec.role || 'College Official',
          contact_person: rec.personName || rec.role || 'Sir/Madam',
          website_url: rec.websiteUrl || '',
          sender_name: finalSenderName,
          sender_role: 'Product Manager | Shortfundly',
        },
      });

      if (outcome.status === 'sent') sentCount++;
      else if (outcome.status === 'skipped_duplicate') skippedCount++;
      else failedCount++;

      results.push({
        collegeId: rec.collegeId,
        collegeName: rec.collegeName,
        email: rec.recipientEmail,
        status: outcome.status,
        error: outcome.error || null,
        messageId: outcome.messageId || null,
      });

      // Respect SMTP throttle delay between emails
      if (i < validRecipients.length - 1 && delayMs > 0) {
        await sleep(Math.min(delayMs, 5000));
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        total: validRecipients.length,
        sent: sentCount,
        failed: failedCount,
        skippedDuplicates: skippedCount,
      },
      results,
    });
  } catch (error) {
    console.error('Campaign send error:', error);
    return NextResponse.json(
      { error: error.message || 'Bulk sending failed' },
      { status: 500 }
    );
  }
}
