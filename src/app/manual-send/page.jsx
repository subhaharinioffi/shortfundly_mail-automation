'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  PenTool, 
  Send, 
  Building, 
  Mail, 
  MapPin, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  Save,
  Globe,
  User,
  X
} from 'lucide-react';
import { FilmstripIcon, PlayCinemaIcon } from '@/components/Icons';

function ManualSendContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  // College & Recipient Details
  const [collegeName, setCollegeName] = useState('');
  const [city, setCity] = useState('Bhubaneswar');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [designation, setDesignation] = useState('');
  const [phone, setPhone] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');

  // Email Content
  const [senderName, setSenderName] = useState('Shortfundly Campus Team');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [saveToColleges, setSaveToColleges] = useState(true);
  const [bypassDuplicateCheck, setBypassDuplicateCheck] = useState(true);

  // Status & Feedback
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [alert, setAlert] = useState(null);
  const [receipt, setReceipt] = useState(null);

  // Load from Query Params if navigated from colleges directory
  useEffect(() => {
    const qName = searchParams.get('name');
    const qEmail = searchParams.get('email');
    const qCity = searchParams.get('city');
    const qDept = searchParams.get('dept');
    const qContact = searchParams.get('contact');
    const qDesig = searchParams.get('desig');
    const qPhone = searchParams.get('phone');
    const qWeb = searchParams.get('web');

    if (qName) setCollegeName(qName);
    if (qEmail) setRecipientEmail(qEmail);
    if (qCity) setCity(qCity);
    if (qDept) setDepartment(qDept);
    if (qContact) setContactPerson(qContact);
    if (qDesig) setDesignation(qDesig);
    if (qPhone) setPhone(qPhone);
    if (qWeb) setWebsiteUrl(qWeb);
  }, [searchParams]);

  // Load Default Template
  const loadDefaultTemplate = async () => {
    setLoadingTemplate(true);
    try {
      const res = await fetch('/api/templates');
      const data = await res.json();
      if (res.ok && data.templates?.length > 0) {
        const tmpl = data.templates.find(t => t.is_default) || data.templates[0];
        
        // Personalize with current fields
        const cName = collegeName.trim() || '[College Name]';
        const subj = tmpl.subject.replace(/\[College Name\]/gi, cName);
        let b = tmpl.body
          .replace(/\[College Name\]/gi, cName)
          .replace(/\[City\]/gi, city || 'Odisha')
          .replace(/\[Department\]/gi, department || 'Academic & Creative Affairs')
          .replace(/\[Recipient Name\]/gi, contactPerson || designation || 'Sir/Madam')
          .replace(/\[Contact Person\]/gi, contactPerson || designation || 'Sir/Madam')
          .replace(/\[Designation\]/gi, designation || 'Training & Placement Head')
          .replace(/\[Your Name\]/gi, session?.user?.name || senderName)
          .replace(/\[Your Role\]/gi, 'Product Manager | Shortfundly');

        setSubject(subj);
        setBody(b);
        setAlert({ type: 'info', message: 'Loaded and customized Shortfundly proposal template.' });
      }
    } catch (err) {
      console.error('Failed to load template', err);
    } finally {
      setLoadingTemplate(false);
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      if (session?.user?.name) {
        setSenderName(session.user.name);
      }
      loadDefaultTemplate();
    }
  }, [status]);

  // Handle Send
  const handleSend = async (e) => {
    e.preventDefault();
    setIsSending(true);
    setAlert(null);
    setReceipt(null);

    try {
      const payload = {
        collegeName: collegeName.trim(),
        city: city.trim(),
        department: department.trim() || null,
        contactPerson: contactPerson.trim() || null,
        designation: designation.trim() || null,
        phone: phone.trim() || null,
        websiteUrl: websiteUrl.trim() || '',
        recipientEmail: recipientEmail.trim().toLowerCase(),
        subject: subject.trim(),
        body: body.trim(),
        senderName: senderName.trim(),
        saveToColleges,
        bypassDuplicateCheck,
      };

      const res = await fetch('/api/send-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setReceipt(data);
        setAlert({
          type: 'success',
          message: data.message || `Customized proposal email successfully sent to ${collegeName} (${recipientEmail}).`
        });
      } else {
        setAlert({
          type: 'danger',
          message: data.error || 'Failed to dispatch customized email. Check your Google SMTP settings.'
        });
      }
    } catch (err) {
      setAlert({ type: 'danger', message: 'Network error occurred during manual email dispatch.' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="role-badge admin">Bespoke Outreach</span>
            <span style={{ fontSize: '12px', color: '#64748B' }}>Direct College Entry • Company Sender</span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#FFFFFF' }}>
            Direct Send &amp; Custom Outreach
          </h1>
          <p style={{ fontSize: '14px', color: '#94A3B8', marginTop: '2px' }}>
            Enter individual college details, tailor the proposal on the fly, and send directly from Shortfundly.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={loadDefaultTemplate}
            disabled={loadingTemplate}
            className="btn btn-secondary btn-sm"
          >
            <Sparkles size={14} color="#FF324B" />
            <span>Reload Proposal Template</span>
          </button>
          <Link href="/logs" className="btn btn-outline btn-sm">
            <span>View Outreach Logs</span>
          </Link>
        </div>
      </div>

      {/* Alert Banner */}
      {alert && (
        <div className={`alert-box ${alert.type}`}>
          {alert.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span style={{ flex: 1 }}>{alert.message}</span>
          <button onClick={() => setAlert(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Main Grid: Input Form (Left) & Live Rendered View (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(420px, 1.15fr) minmax(380px, 1fr)', gap: '24px' }}>
        
        {/* FORM */}
        <div className="card">
          <form onSubmit={handleSend}>
            
            {/* Section 1: Institution Details */}
            <div style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Building size={16} color="#FF324B" />
                <span>Recipient College Information</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">College / University Name <span className="required">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ravenshaw University"
                    value={collegeName}
                    onChange={(e) => setCollegeName(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">City in Odisha <span className="required">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cuttack"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Official College Email Address <span className="required">*</span></label>
                <input
                  type="email"
                  required
                  placeholder="e.g. contact@ravenshawuniversity.ac.in"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="form-input"
                  style={{ fontFamily: 'monospace' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Department / Office</label>
                  <input
                    type="text"
                    placeholder="e.g. Dept of Media &amp; Cultural Affairs"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Contact Person</label>
                  <input
                    type="text"
                    placeholder="e.g. Prof. Asit Mohanty"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Designation / Role</label>
                  <input
                    type="text"
                    placeholder="e.g. Training &amp; Placement Officer (TPO)"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 9437012345"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Sender Details & Content */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <FileText size={16} color="#06B6D4" />
                <span>Custom Proposal Message</span>
              </div>

              <div className="form-group">
                <label className="form-label">Sender Display Name (Company Side)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shortfundly Campus Team"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Subject Line <span className="required">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="PROPOSAL FOR SHORTFUNDLY CAMPUS COLLABORATION - [College Name]"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Customized Proposal Body <span className="required">*</span></label>
                <textarea
                  rows={14}
                  required
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="form-textarea"
                  style={{ fontFamily: 'monospace', fontSize: '13px', lineHeight: 1.6 }}
                />
              </div>
            </div>

            {/* Section 3: Options & Checkboxes */}
            <div style={{ background: 'rgba(7, 9, 14, 0.6)', padding: '14px', borderRadius: '8px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="saveDirCheck"
                  checked={saveToColleges}
                  onChange={(e) => setSaveToColleges(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#FF324B' }}
                />
                <label htmlFor="saveDirCheck" style={{ fontSize: '13px', color: '#FFFFFF', cursor: 'pointer' }}>
                  Automatically save this college to the official directory if new
                </label>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="bypassCheck"
                  checked={bypassDuplicateCheck}
                  onChange={(e) => setBypassDuplicateCheck(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#10B981' }}
                />
                <label htmlFor="bypassCheck" style={{ fontSize: '13px', color: '#FFFFFF', cursor: 'pointer' }}>
                  Force send even if previously contacted (Manual Override)
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSending}
              className="btn btn-primary btn-lg"
              style={{ width: '100%', padding: '14px' }}
            >
              {isSending ? (
                <span>Dispatching via Google SMTP...</span>
              ) : (
                <>
                  <Send size={16} />
                  <span>Send Customized Email Now</span>
                </>
              )}
            </button>

          </form>
        </div>

        {/* PREVIEW & RECEIPT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Live Preview Card */}
          <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div className="card-header" style={{ marginBottom: '14px' }}>
              <div className="card-title">
                <Eye size={18} color="#FF324B" />
                <span>Live Outreach Preview</span>
              </div>
              <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 600 }}>
                Instant Sync
              </span>
            </div>

            <div style={{ background: 'rgba(7, 9, 14, 0.6)', padding: '12px 14px', borderRadius: '8px', marginBottom: '14px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: '#94A3B8' }}>To:</span>
                <span style={{ fontFamily: 'monospace', color: '#FF6B7E', fontWeight: 600 }}>
                  {recipientEmail || 'recipient@college.ac.in'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94A3B8' }}>From:</span>
                <span style={{ color: '#FFFFFF' }}>
                  {senderName} &lt;Google SMTP Verified&gt;
                </span>
              </div>
            </div>

            {/* Plain Text Email Canvas Preview */}
            <div style={{ flex: 1, minHeight: '440px', background: '#0B0D13', borderRadius: '8px', overflowY: 'auto', border: '1px solid var(--border-subtle)', padding: '16px' }}>
              
              {/* Subject */}
              <div style={{ padding: '12px 14px', borderRadius: '6px', background: 'rgba(15, 20, 32, 0.9)', border: '1px solid var(--border-subtle)', marginBottom: '14px' }}>
                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Subject:</span>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF', marginTop: '2px' }}>
                  {subject || '(No subject entered)'}
                </div>
              </div>

              {/* Pure Plain Text Message Body */}
              <pre style={{ 
                color: '#E2E8F0', 
                fontSize: '13px', 
                lineHeight: '1.65', 
                whiteSpace: 'pre-wrap', 
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace', 
                margin: 0,
                padding: '4px 2px'
              }}>
                {body || '(Email body is empty. Type in the form or click "Reload Proposal Template" above.)'}
                {'\n\n--\nShortfundly Campus Team\nShortfundly OTT Marketplace • Creative Partnerships\nOfficial Website: https://campus.shortfundly.com\nDirect Contact: +91 93612 23155\nInquiries: campus@shortfundly.com'}
              </pre>

            </div>
          </div>

          {/* Delivery Receipt Card (Shown on successful dispatch) */}
          {receipt && (
            <div className="card" style={{ borderColor: 'rgba(16, 185, 129, 0.4)', background: 'rgba(16, 185, 129, 0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <CheckCircle2 size={20} color="#10B981" />
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>
                  Delivery Receipt Confirmed
                </div>
              </div>
              <div style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '8px' }}>
                Status: <strong style={{ color: '#10B981' }}>{receipt.status}</strong>
              </div>
              {receipt.messageId && (
                <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#64748B', wordBreak: 'break-all' }}>
                  Message ID: {receipt.messageId}
                </div>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}

export default function ManualSendPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '60px' }}>Loading custom mailer...</div>}>
      <ManualSendContent />
    </Suspense>
  );
}
