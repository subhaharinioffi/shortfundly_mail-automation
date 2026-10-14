import nodemailer from 'nodemailer';
import { getDb } from './db.js';

export function getSmtpSettings() {
  const db = getDb();
  const rows = db.prepare('SELECT key, value FROM system_settings').all();
  
  const map = {};
  for (const row of rows) {
    map[row.key] = row.value;
  }

  return {
    smtp_host: map['smtp_host'] || process.env.GOOGLE_SMTP_HOST || 'smtp.gmail.com',
    smtp_port: parseInt(map['smtp_port'] || process.env.GOOGLE_SMTP_PORT || '465', 10),
    smtp_secure: (map['smtp_secure'] ?? 'true') === 'true',
    smtp_user: map['smtp_user'] || process.env.GOOGLE_SMTP_USER || '',
    smtp_pass: map['smtp_pass'] || process.env.GOOGLE_SMTP_PASS || '',
    from_name: map['from_name'] || 'Shortfundly Campus Collaboration',
    from_email: map['from_email'] || map['smtp_user'] || process.env.GOOGLE_SMTP_USER || 'campus@shortfundly.com',
    duplicate_cooldown_days: parseInt(map['duplicate_cooldown_days'] || '30', 10),
  };
}

export function createTransporter(customConfig = {}) {
  const settings = { ...getSmtpSettings(), ...customConfig };

  return nodemailer.createTransport({
    host: settings.smtp_host || 'smtp.gmail.com',
    port: Number(settings.smtp_port) || 465,
    secure: Number(settings.smtp_port) === 465,
    auth: {
      user: settings.smtp_user,
      pass: settings.smtp_pass,
    },
    // Pool connections to avoid spamming Google with new TLS handshakes
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
    rateDelta: 1000,
    rateLimit: 5,
  });
}

export async function verifySmtp(customConfig = {}) {
  try {
    const transporter = createTransporter(customConfig);
    await transporter.verify();
    return { success: true, message: 'Google SMTP connection verified successfully.' };
  } catch (error) {
    return {
      success: false,
      message: error?.message || 'Failed to authenticate with Google SMTP server. Please verify your Gmail address and 16-character App Password.'
    };
  }
}

export function cleanSubjectForDeliverability(subject) {
  if (!subject) return '';
  let cleaned = String(subject).trim();

  // 1. Remove markdown characters (asterisks, backticks, underscores, brackets) from subject
  cleaned = cleaned.replace(/[*_`|]/g, ' ');

  // 2. Prevent SpamAssassin SUBJ_ALL_CAPS penalty: convert ALL CAPS to clean Title Case
  const letters = cleaned.replace(/[^a-zA-Z]/g, '');
  if (letters.length > 0) {
    const uppercaseLetters = letters.replace(/[^A-Z]/g, '');
    const uppercaseRatio = uppercaseLetters.length / letters.length;
    if (uppercaseRatio > 0.5) {
      cleaned = cleaned.toLowerCase().replace(/(^|\s|[|:-]\s*)([a-z])/g, (match, sep, char) => {
        return sep + char.toUpperCase();
      });
      cleaned = cleaned.replace(/shortfundly/gi, 'Shortfundly');
      cleaned = cleaned.replace(/ott/gi, 'OTT');
      cleaned = cleaned.replace(/ai/gi, 'AI');
    }
  }

  // 3. Remove consecutive exclamation or question marks and clean extra whitespace
  cleaned = cleaned.replace(/[!]{2,}/g, '!').replace(/[?]{2,}/g, '?').replace(/\s+/g, ' ').trim();

  return cleaned;
}

export function personalizeText(text, variables = {}) {
  if (!text) return '';
  let result = text;
  const replacements = {
    '\\[College Name\\]': variables.college_name || 'your institution',
    '\\[City\\]': variables.city || 'Odisha',
    '\\[Department\\]': variables.department || 'Academic & Creative Affairs',
    '\\[Recipient Name\\]': variables.contact_person || 'Sir/Madam',
    '\\[Contact Person\\]': variables.contact_person || 'Sir/Madam',
    '\\[Official Website\\]': variables.website_url || 'https://campus.shortfundly.com',
    '\\[Your Name\\]': variables.sender_name || 'Shortfundly Team',
    '\\[Your Role\\]': variables.sender_role || 'Product Manager | Shortfundly'
  };

  for (const [pattern, val] of Object.entries(replacements)) {
    result = result.replace(new RegExp(pattern, 'gi'), val);
  }

  return result;
}

export function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatHtmlEmail(plainText, recipientEmail = '') {
  if (!plainText) return '';
  
  // Step 1: Escape all raw HTML to prevent injection and XSS
  let safeText = escapeHtml(plainText);

  // Step 2: Convert markdown links only if URL starts with safe protocols (http, https, mailto)
  let html = safeText.replace(/\[([^\]]+)\]\(((?:https?:\/\/|mailto:)[^)]+)\)/gi, (match, label, url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #FF324B; text-decoration: underline; font-weight: 600;">${label}</a>`;
  });

  // Step 3: Convert markdown bold *text*
  html = html.replace(/\*([^*]+)\*/g, '<strong>$1</strong>');
  
  const paragraphs = html.split(/\n\s*\n/).map(p => {
    const trimmed = p.trim();
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const items = trimmed.split(/\n/).map(line => `<li style="margin-bottom: 6px;">${line.replace(/^[-*]\s*/, '')}</li>`).join('');
      return `<ul style="margin: 12px 0 16px 20px; padding: 0; line-height: 1.65; color: #1E293B;">${items}</ul>`;
    }
    if (/^\d+\.\s/.test(trimmed)) {
      const items = trimmed.split(/\n/).map(line => `<li style="margin-bottom: 6px;">${line.replace(/^\d+\.\s*/, '')}</li>`).join('');
      return `<ol style="margin: 12px 0 16px 20px; padding: 0; line-height: 1.65; color: #1E293B;">${items}</ol>`;
    }
    return `<p style="margin: 0 0 14px 0; line-height: 1.65; font-size: 15px; color: #1E293B;">${trimmed.replace(/\n/g, '<br/>')}</p>`;
  }).join('');

  // Human-style, clean direct email layout (No bulky marketing frames that trigger spam filters)
  return `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.65; color: #1E293B; max-width: 620px; margin: 0 auto; padding: 12px 4px;">
  ${paragraphs}
  
  <div style="margin-top: 28px; padding-top: 16px; border-top: 1px solid #E2E8F0; font-size: 13px; color: #64748B; line-height: 1.6;">
    <p style="margin: 0 0 4px 0; font-weight: 600; color: #0F172A;">
      Shortfundly Campus Team
    </p>
    <p style="margin: 0 0 4px 0;">
      Shortfundly OTT Marketplace • Creative Partnerships Initiative
    </p>
    <p style="margin: 0 0 4px 0;">
      Official Portal: <a href="https://campus.shortfundly.com" target="_blank" rel="noopener noreferrer" style="color: #FF324B; text-decoration: underline;">campus.shortfundly.com</a> | Inquiries: +91 93612 23155
    </p>
    <p style="margin: 10px 0 0 0; font-size: 11px; color: #94A3B8;">
      You are receiving this official correspondence regarding higher-education student development in Odisha. If you prefer not to receive campus collaboration proposals, please reply with &quot;Unsubscribe&quot;.
    </p>
  </div>
</div>
`;
}

export function checkDuplicate(recipientEmail, cooldownDays) {
  const db = getDb();
  const query = `
    SELECT sent_at, subject
    FROM email_logs
    WHERE LOWER(recipient_email) = LOWER(?)
      AND status = 'sent'
      AND datetime(sent_at) > datetime('now', '-' || ? || ' days')
    ORDER BY sent_at DESC
    LIMIT 1
  `;
  const record = db.prepare(query).get(recipientEmail, cooldownDays);

  if (record) {
    return {
      isDuplicate: true,
      lastSentAt: record.sent_at,
      subject: record.subject
    };
  }

  return { isDuplicate: false };
}

export async function sendEmailMessage(params) {
  const db = getDb();
  const settings = getSmtpSettings();

  // 1. Duplicate check safeguard
  if (!params.bypassDuplicateCheck) {
    const dup = checkDuplicate(params.recipientEmail, settings.duplicate_cooldown_days);
    if (dup.isDuplicate) {
      const skipReason = `Skipped: Duplicate email detected. Already contacted on ${dup.lastSentAt} with subject "${dup.subject}". (Cooldown: ${settings.duplicate_cooldown_days} days)`;
      
      db.prepare(`
        INSERT INTO email_logs (college_id, college_name, recipient_email, subject, body, sender_name, sender_email, status, error_message, sent_by_user)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'skipped_duplicate', ?, ?)
      `).run(
        params.collegeId || null,
        params.collegeName,
        params.recipientEmail,
        params.rawSubject,
        params.rawBody,
        params.senderName,
        settings.from_email,
        skipReason,
        params.sentByUser
      );

      return {
        success: false,
        status: 'skipped_duplicate',
        error: skipReason
      };
    }
  }

  // 2. Personalize Subject and Body
  const vars = params.variables || {
    college_name: params.collegeName,
    sender_name: params.senderName,
  };

  const rawPersonalizedSubject = personalizeText(params.rawSubject, vars);
  const personalizedSubject = cleanSubjectForDeliverability(rawPersonalizedSubject);
  const personalizedBody = personalizeText(params.rawBody, vars);
  const htmlContent = formatHtmlEmail(personalizedBody, params.recipientEmail);

  // 3. Sender Alignment for SPF & DKIM Google Compliance
  // For Google SMTP, Envelope From strictly matches the authenticated Google account
  const authenticatedEmail = settings.smtp_user || settings.from_email;
  const fromAddress = authenticatedEmail;
  const replyToAddress = settings.from_email || authenticatedEmail;
  const senderDisplayName = params.senderName || settings.from_name || 'Shortfundly Campus Team';

  // Plain text body with 100% content parity
  const plainTextWithFooter = `${personalizedBody}

---
Shortfundly Campus Team
Shortfundly OTT Marketplace • Creative Partnerships Initiative
Official Portal: https://campus.shortfundly.com | Inquiries: +91 93612 23155
To unsubscribe, reply with 'Unsubscribe'.`;

  // 4. Dispatch via Google SMTP with clean native headers
  // CRITICAL: We do NOT inject 'Precedence: bulk' or fake 'List-Unsubscribe' headers.
  // Those headers from a @gmail.com account flag the message as automated spam!
  // By letting Google generate its native DKIM-signed Message-ID, the message looks
  // 100% authentic and lands straight in the Primary Inbox.
  try {
    if (!settings.smtp_user || !settings.smtp_pass) {
      throw new Error('Google SMTP credentials not configured. Please enter your Gmail address and Google App Password in the Settings page.');
    }

    const transporter = createTransporter();
    // Dispatch pure plain-text email (zero HTML overhead for optimal inbox placement)
    const info = await transporter.sendMail({
      from: `"${senderDisplayName}" <${fromAddress}>`,
      replyTo: `"${senderDisplayName}" <${replyToAddress}>`,
      to: params.recipientEmail,
      subject: personalizedSubject,
      text: plainTextWithFooter,
    });

    // 5. Log Success
    db.prepare(`
      INSERT INTO email_logs (college_id, college_name, recipient_email, subject, body, sender_name, sender_email, status, message_id, sent_by_user)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'sent', ?, ?)
    `).run(
      params.collegeId || null,
      params.collegeName,
      params.recipientEmail,
      personalizedSubject,
      personalizedBody,
      params.senderName,
      fromAddress,
      info.messageId,
      params.sentByUser
    );

    if (params.collegeId) {
      db.prepare(`
        UPDATE colleges
        SET status = 'sent', last_contacted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(params.collegeId);
    }

    return {
      success: true,
      status: 'sent',
      messageId: info.messageId,
    };
  } catch (error) {
    const errorMsg = error?.message || 'SMTP transmission failure';

    db.prepare(`
      INSERT INTO email_logs (college_id, college_name, recipient_email, subject, body, sender_name, sender_email, status, error_message, sent_by_user)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'failed', ?, ?)
    `).run(
      params.collegeId || null,
      params.collegeName,
      params.recipientEmail,
      personalizedSubject,
      personalizedBody,
      params.senderName,
      fromAddress,
      errorMsg,
      params.sentByUser
    );

    if (params.collegeId) {
      db.prepare(`
        UPDATE colleges
        SET status = 'failed', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(params.collegeId);
    }

    return {
      success: false,
      status: 'failed',
      error: errorMsg,
    };
  }
}
