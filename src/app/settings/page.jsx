'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Settings as SettingsIcon, 
  Save, 
  Radio, 
  Key, 
  Mail, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  ExternalLink, 
  Lock,
  Clock,
  X,
} from 'lucide-react';
import { FilmstripIcon } from '@/components/Icons';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [settings, setSettings] = useState({
    smtp_host: 'smtp.gmail.com',
    smtp_port: 465,
    smtp_secure: true,
    smtp_user: '',
    smtp_pass: '',
    from_name: 'Shortfundly Campus Collaboration',
    from_email: '',
    duplicate_cooldown_days: 30,
    has_password: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [alert, setAlert] = useState(null);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (res.ok && data.settings) {
        setSettings(data.settings);
      }
    } catch (err) {
      console.error('Failed to load settings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchSettings();
    }
  }, [status]);

  // Save Settings
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setAlert(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (res.ok) {
        setAlert({ type: 'success', message: 'Google SMTP settings updated successfully.' });
        fetchSettings();
      } else {
        setAlert({ type: 'danger', message: data.error || 'Failed to save settings.' });
      }
    } catch (err) {
      setAlert({ type: 'danger', message: 'Network error occurred while saving settings.' });
    } finally {
      setSaving(false);
    }
  };

  // Test Connection
  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test_connection',
          ...settings,
        }),
      });

      const data = await res.json();
      setTestResult(data);
    } catch (err) {
      setTestResult({
        success: false,
        message: 'Could not connect to backend to execute test probe.'
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="role-badge admin">System Configuration</span>
            <span style={{ fontSize: '12px', color: '#64748B' }}>Google SMTP &amp; Pipeline Engine</span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#FFFFFF' }}>
            Outreach &amp; Google SMTP Settings
          </h1>
          <p style={{ fontSize: '14px', color: '#94A3B8', marginTop: '2px' }}>
            Manage Google SMTP credentials, duplicate cooldown protection, and sender profile.
          </p>
        </div>

        <button
          type="button"
          onClick={handleTestConnection}
          disabled={testing}
          className="btn btn-secondary btn-sm"
        >
          <Radio size={14} color="#10B981" />
          <span>{testing ? 'Testing Handshake...' : 'Test SMTP Connection'}</span>
        </button>
      </div>

      {/* Global Alert */}
      {alert && (
        <div className={`alert-box ${alert.type}`}>
          {alert.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span style={{ flex: 1 }}>{alert.message}</span>
          <button onClick={() => setAlert(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Live Test Result Banner */}
      {testResult && (
        <div className={`alert-box ${testResult.success ? 'success' : 'danger'}`}>
          {testResult.success ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <div>
            <strong>Google SMTP Test Probe Result:</strong>
            <div style={{ marginTop: '4px' }}>{testResult.message}</div>
          </div>
        </div>
      )}

      {/* Settings Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
        
        {/* SETTINGS FORM */}
        <div className="card">
          <form onSubmit={handleSave}>
            
            <div className="card-header">
              <div className="card-title">
                <Radio size={18} color="#FF324B" />
                <span>Google SMTP Credentials</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Google Account / Gmail Address <span className="required">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="your-account@gmail.com"
                value={settings.smtp_user}
                onChange={(e) => setSettings({ ...settings, smtp_user: e.target.value })}
                className="form-input"
              />
              <div className="form-hint">Used for authenticating with Google SMTP.</div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Google 16-Character App Password <span className="required">*</span>
              </label>
              <input
                type="password"
                placeholder={settings.has_password ? '•••••••••••••••• (Configured)' : '16-character Google app password'}
                value={settings.smtp_pass}
                onChange={(e) => setSettings({ ...settings, smtp_pass: e.target.value })}
                className="form-input"
                style={{ fontFamily: 'monospace' }}
              />
              <div className="form-hint">
                Generate this in your Google Account Security tab under &quot;App Passwords&quot;.
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label className="form-label">SMTP Host</label>
                <input
                  type="text"
                  value={settings.smtp_host}
                  onChange={(e) => setSettings({ ...settings, smtp_host: e.target.value })}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">SMTP Port</label>
                <input
                  type="number"
                  value={settings.smtp_port}
                  onChange={(e) => setSettings({ ...settings, smtp_port: parseInt(e.target.value, 10) })}
                  className="form-input"
                />
              </div>
            </div>

            <div className="card-header" style={{ marginTop: '24px', paddingTop: '16px' }}>
              <div className="card-title">
                <Mail size={18} color="#06B6D4" />
                <span>Outreach Sender Profile</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Default From Name</label>
              <input
                type="text"
                value={settings.from_name}
                onChange={(e) => setSettings({ ...settings, from_name: e.target.value })}
                className="form-input"
                placeholder="Shortfundly Campus Collaboration"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Default From / Reply Email</label>
              <input
                type="email"
                value={settings.from_email}
                onChange={(e) => setSettings({ ...settings, from_email: e.target.value })}
                className="form-input"
                placeholder="campus@shortfundly.com"
              />
            </div>

            <div className="card-header" style={{ marginTop: '24px', paddingTop: '16px' }}>
              <div className="card-title">
                <Clock size={18} color="#F59E0B" />
                <span>Duplicate Cooldown Safeguard</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Duplicate Cooldown Period (Days)</label>
              <input
                type="number"
                min="1"
                max="365"
                value={settings.duplicate_cooldown_days}
                onChange={(e) => setSettings({ ...settings, duplicate_cooldown_days: parseInt(e.target.value, 10) })}
                className="form-input"
              />
              <div className="form-hint">
                Automated campaigns will automatically skip colleges that have already received an email within this many days.
              </div>
            </div>

            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary"
              >
                <Save size={14} />
                <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
              </button>
            </div>

          </form>
        </div>

        {/* GOOGLE APP PASSWORD GUIDE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="card" style={{ borderColor: 'rgba(6, 182, 212, 0.3)' }}>
            <div className="card-header">
              <div className="card-title" style={{ color: '#06B6D4' }}>
                <HelpCircle size={18} />
                <span>How to Get a Google App Password</span>
              </div>
            </div>

            <ol style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: '#94A3B8', lineHeight: 1.6 }}>
              <li>
                Visit your <a href="https://myaccount.google.com/security" target="_blank" rel="noreferrer" style={{ color: '#06B6D4', textDecoration: 'underline' }}>Google Account Security</a> settings.
              </li>
              <li>
                Ensure <strong>2-Step Verification</strong> is enabled for your Google account.
              </li>
              <li>
                In the search bar inside Google Account, type <strong>&quot;App passwords&quot;</strong> and select it.
              </li>
              <li>
                Enter an App name (e.g., <em>Shortfundly Email Automation</em>) and click <strong>Create</strong>.
              </li>
              <li>
                Copy the generated 16-character code (example: <code style={{ color: '#FF6B7E', background: 'rgba(0,0,0,0.4)', padding: '2px 4px', borderRadius: '4px' }}>abcd efgh ijkl mnop</code>) and paste it into the field on the left.
              </li>
            </ol>

            <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(6, 182, 212, 0.08)', borderRadius: '6px', fontSize: '12px', color: '#7DD3FC' }}>
              Note: Using a Google App Password allows secure SMTP automation without exposing your primary Google account password.
            </div>
          </div>

          {/* INBOX DELIVERABILITY & ANTI-SPAM INSPECTOR */}
          <div className="card" style={{ borderColor: 'rgba(16, 185, 129, 0.4)' }}>
            <div className="card-header">
              <div className="card-title" style={{ color: '#10B981' }}>
                <CheckCircle2 size={18} />
                <span>Inbox Deliverability &amp; Anti-Spam Engine</span>
              </div>
            </div>

            <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '14px', lineHeight: 1.5 }}>
              Configured to meet the strict 2024 Google &amp; Yahoo bulk sending requirements to route directly into the receiver&apos;s <strong>Primary Inbox</strong>:
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '6px', color: '#A7F3D0' }}>
                <CheckCircle2 size={14} color="#10B981" />
                <span><strong>SPF &amp; DKIM Alignment:</strong> Envelope From strictly matches authenticated Gmail account.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '6px', color: '#A7F3D0' }}>
                <CheckCircle2 size={14} color="#10B981" />
                <span><strong>RFC 8058 One-Click Unsubscribe:</strong> Mandatory List-Unsubscribe headers injected.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '6px', color: '#A7F3D0' }}>
                <CheckCircle2 size={14} color="#10B981" />
                <span><strong>Spam Trigger Auto-Sanitizer:</strong> ALL-CAPS subjects &amp; markdown symbols normalized.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '6px', color: '#A7F3D0' }}>
                <CheckCircle2 size={14} color="#10B981" />
                <span><strong>Academic Letterhead:</strong> High text-to-HTML ratio avoiding B2B promotional filters.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '6px', color: '#A7F3D0' }}>
                <CheckCircle2 size={14} color="#10B981" />
                <span><strong>CAN-SPAM Compliant Footer:</strong> Physical address, support phone, and opt-out link included.</span>
              </div>
            </div>

            <div style={{ marginTop: '14px', padding: '10px 12px', background: 'rgba(7, 9, 14, 0.6)', borderRadius: '6px', fontSize: '11px', color: '#94A3B8', borderLeft: '3px solid #10B981' }}>
              <strong>Best Practice Tip:</strong> When using a personal Gmail account for cold outreach, dispatch 30-50 emails per batch with an 800ms-1500ms delay to keep your sender reputation pristine.
            </div>
          </div>

          {/* Role Access Summary Card */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <ShieldCheck size={18} color="#FF324B" />
                <span>Authorized Operators</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(7, 9, 14, 0.6)', borderRadius: '6px' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>Admin</div>
                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>admin@shortfundly.com</div>
                </div>
                <span className="role-badge admin">Admin</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(7, 9, 14, 0.6)', borderRadius: '6px' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>HR</div>
                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>hr@shortfundly.com</div>
                </div>
                <span className="role-badge hr">HR</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(7, 9, 14, 0.6)', borderRadius: '6px' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>Tech Lead</div>
                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>techlead@shortfundly.com</div>
                </div>
                <span className="role-badge tech-lead">Tech Lead</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
