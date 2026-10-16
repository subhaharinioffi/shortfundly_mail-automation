'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FileText, 
  Save, 
  Plus, 
  Trash2, 
  Eye, 
  Code, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  RefreshCw, 
  Send,
  Layers,
  X
} from 'lucide-react';
import { FilmstripIcon, ClapperboardIcon } from '@/components/Icons';

export default function TemplatesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);

  // Form state
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('Campus Outreach');
  const [isDefault, setIsDefault] = useState(false);

  // Preview state
  const [liveColleges, setLiveColleges] = useState([]);
  const [activeCollege, setActiveCollege] = useState({
    college_name: 'Utkal University',
    city: 'Bhubaneswar',
    department: 'Department of Journalism & Mass Communication',
    contact_person: 'Dr. Upendra Kumar Nayak',
    website_url: 'https://utkaluniversity.ac.in',
    sender_name: 'Shortfundly Campus Team',
  });

  const tokens = [
    { label: '[College Name]', token: '[College Name]' },
    { label: '[Department]', token: '[Department]' },
    { label: '[Recipient Name]', token: '[Recipient Name]' },
    { label: '[City]', token: '[City]' },
    { label: '[Official Website]', token: '[Official Website]' },
    { label: '[Your Name]', token: '[Your Name]' },
    { label: '[Your Role]', token: '[Your Role]' },
  ];

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const [tmplRes, colRes] = await Promise.all([
        fetch('/api/templates'),
        fetch('/api/colleges?limit=100'),
      ]);

      const data = await tmplRes.json();
      const colData = await colRes.json();

      if (tmplRes.ok) {
        setTemplates(data.templates || []);
        if (data.templates?.length > 0) {
          const current = selectedTemplateId 
            ? data.templates.find(t => t.id === selectedTemplateId) || data.templates[0]
            : data.templates[0];
          selectTemplate(current);
        }
      }

      if (colRes.ok && colData.colleges?.length > 0) {
        setLiveColleges(colData.colleges);
        setActiveCollege(colData.colleges[0]);
      }
    } catch (err) {
      console.error('Failed to load templates or colleges', err);
    } finally {
      setLoading(false);
    }
  };

  const selectTemplate = (tmpl) => {
    setSelectedTemplateId(tmpl.id);
    setName(tmpl.name);
    setSubject(tmpl.subject);
    setBody(tmpl.body);
    setCategory(tmpl.category || 'Campus Outreach');
    setIsDefault(Boolean(tmpl.is_default));
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchTemplates();
    }
  }, [status]);

  // Insert token into textarea at cursor
  const insertToken = (token) => {
    setBody((prev) => prev + ' ' + token);
  };

  // Save changes to current template or create new
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setAlert(null);

    try {
      const isUpdate = Boolean(selectedTemplateId);
      const url = '/api/templates';
      const method = isUpdate ? 'PUT' : 'POST';
      const payload = {
        id: selectedTemplateId,
        name,
        subject,
        body,
        category,
        is_default: isDefault ? 1 : 0,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setAlert({ type: 'success', message: `Template "${name}" saved successfully.` });
        if (!isUpdate && data.template) {
          setSelectedTemplateId(data.template.id);
        }
        fetchTemplates();
      } else {
        setAlert({ type: 'danger', message: data.error || 'Failed to save template.' });
      }
    } catch (err) {
      setAlert({ type: 'danger', message: 'Network error occurred while saving.' });
    } finally {
      setSaving(false);
    }
  };

  // Handle New Template
  const handleCreateNew = () => {
    setSelectedTemplateId(null);
    setName('New Odisha Outreach Proposal');
    setSubject('PROPOSAL FOR SHORTFUNDLY CAMPUS COLLABORATION - [College Name]');
    setBody('Dear Sir/Madam,\n\nGreetings from Shortfundly!\n\nWe propose a collaboration with [College Name] through Shortfundly Campus...\n\nWarm regards,\n[Your Name]\n[Your Role]');
    setCategory('Campus Outreach');
    setIsDefault(false);
    setAlert({ type: 'info', message: 'Drafting new template. Click "Save Template" when ready.' });
  };

  // Handle Delete Template
  const handleDelete = async () => {
    if (!selectedTemplateId) return;
    if (!window.confirm(`Are you sure you want to delete template "${name}"?`)) return;

    try {
      const res = await fetch(`/api/templates?id=${selectedTemplateId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setAlert({ type: 'success', message: 'Template deleted.' });
        setSelectedTemplateId(null);
        fetchTemplates();
      } else {
        setAlert({ type: 'danger', message: data.error || 'Failed to delete template.' });
      }
    } catch (err) {
      setAlert({ type: 'danger', message: 'Error deleting template.' });
    }
  };

  // Live personalization calculation
  const getRenderedContent = (text) => {
    if (!text) return '';
    return text
      .replace(/\[College Name\]/gi, activeCollege.college_name || 'your institution')
      .replace(/\[City\]/gi, activeCollege.city || 'Odisha')
      .replace(/\[Department\]/gi, activeCollege.department || 'Academic & Creative Affairs')
      .replace(/\[Recipient Name\]/gi, activeCollege.contact_person || 'Sir/Madam')
      .replace(/\[Contact Person\]/gi, activeCollege.contact_person || 'Sir/Madam')
      .replace(/\[Official Website\]/gi, activeCollege.website_url || 'https://campus.shortfundly.com')
      .replace(/\[Your Name\]/gi, session?.user?.name || activeCollege.sender_name || 'Shortfundly Team')
      .replace(/\[Your Role\]/gi, 'Product Manager | Shortfundly');
  };

  const renderedSubject = getRenderedContent(subject);
  const renderedBody = getRenderedContent(body);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="role-badge admin">TEMPLATE STUDIO</span>
            <span style={{ fontSize: '12px', color: '#64748B' }}>Editable Templates • Dynamic Personalization</span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#FFFFFF' }}>
            Proposal Email Templates
          </h1>
          <p style={{ fontSize: '14px', color: '#94A3B8', marginTop: '2px' }}>
            Upload, customize, and preview personalized outreach proposals for Odisha institutions.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={handleCreateNew} 
            className="btn btn-secondary btn-sm"
          >
            <Plus size={14} />
            <span>Create New Template</span>
          </button>
          <Link href="/campaigns" className="btn btn-primary btn-sm">
            <Send size={14} />
            <span>Use in Automated Campaign</span>
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

      {/* Main Split Grid: Editor (Left) & Live Preview (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1.1fr) minmax(380px, 1fr)', gap: '24px' }}>
        
        {/* LEFT COLUMN: TEMPLATE EDITOR */}
        <div className="card">
          <form onSubmit={handleSave}>
            
            {/* Template Selector Bar */}
            <div style={{ marginBottom: '18px', paddingBottom: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
              <label className="form-label">Select Active Template</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  value={selectedTemplateId || ''}
                  onChange={(e) => {
                    const id = parseInt(e.target.value, 10);
                    const found = templates.find(t => t.id === id);
                    if (found) selectTemplate(found);
                  }}
                  className="form-select"
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} {t.is_default ? '(Default)' : ''}
                    </option>
                  ))}
                </select>
                {selectedTemplateId && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="btn btn-danger btn-sm"
                    title="Delete this template"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Template Name & Category */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label className="form-label">Template Title <span className="required">*</span></label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input"
                  placeholder="e.g. Campus Collaboration Proposal"
                />
              </div>
              <div>
                <label className="form-label">Category</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="form-input"
                  placeholder="Outreach"
                />
              </div>
            </div>

            {/* Subject Line */}
            <div className="form-group">
              <label className="form-label">
                Email Subject Line <span className="required">*</span>
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="form-input"
                placeholder="PROPOSAL FOR SHORTFUNDLY CAMPUS COLLABORATION - [College Name]"
              />
            </div>

            {/* Token Inserters */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Click to Insert Personalization Token:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {tokens.map((t) => (
                  <button
                    key={t.token}
                    type="button"
                    onClick={() => insertToken(t.token)}
                    className="token-tag"
                  >
                    + {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Body Textarea */}
            <div className="form-group">
              <label className="form-label">
                Proposal Body Content <span className="required">*</span>
              </label>
              <textarea
                rows={16}
                required
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="form-textarea"
                style={{ fontFamily: 'monospace', fontSize: '13px', lineHeight: 1.6 }}
              />
            </div>

            {/* Default Checkbox */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <input
                type="checkbox"
                id="isDefaultCheckbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#FF324B' }}
              />
              <label htmlFor="isDefaultCheckbox" style={{ fontSize: '13px', color: '#FFFFFF', cursor: 'pointer' }}>
                Set as Default Template for Automated Campaigns
              </label>
            </div>

            {/* Save Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
              <div style={{ fontSize: '12px', color: '#64748B' }}>
                Last updated: {new Date().toLocaleDateString('en-IN')}
              </div>
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary"
              >
                <Save size={14} />
                <span>{saving ? 'Saving...' : 'Save Template'}</span>
              </button>
            </div>

          </form>
        </div>

        {/* RIGHT COLUMN: LIVE INTERACTIVE PREVIEW */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          
          <div className="card-header" style={{ marginBottom: '14px' }}>
            <div>
              <div className="card-title">
                <Eye size={18} color="#FF324B" />
                <span>Live Outreach Preview</span>
              </div>
              <div className="card-subtitle">
                Rendered with verified Odisha college database records
              </div>
            </div>

            {/* Pure Plain Text Format Badge */}
            <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 600, padding: '4px 10px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '6px' }}>
              Pure Plain-Text Delivery
            </span>
          </div>

          {/* Database College Context Selector */}
          <div style={{ background: 'rgba(7, 9, 14, 0.6)', padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: '#94A3B8', whiteSpace: 'nowrap' }}>Target College:</span>
            {liveColleges.length > 0 ? (
              <select
                value={activeCollege.id || ''}
                onChange={(e) => {
                  const id = parseInt(e.target.value, 10);
                  const selected = liveColleges.find(c => c.id === id);
                  if (selected) setActiveCollege(selected);
                }}
                className="form-select"
                style={{ fontSize: '12px', padding: '4px 8px' }}
              >
                {liveColleges.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.college_name} ({col.city})
                  </option>
                ))}
              </select>
            ) : (
              <div style={{ fontWeight: 600, color: '#FF6B7E' }}>
                {activeCollege.college_name} ({activeCollege.city})
              </div>
            )}
          </div>

          {/* Subject Line Preview */}
          <div style={{ background: 'rgba(15, 20, 32, 0.9)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginBottom: '14px' }}>
            <div style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>
              Subject:
            </div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF', marginTop: '2px' }}>
              {renderedSubject || '(No Subject Line)'}
            </div>
          </div>

          {/* Pure Plain Text Body Preview Area */}
          <div style={{ flex: 1, minHeight: '440px', overflowY: 'auto', background: '#0B0D13', borderRadius: '8px', border: '1px solid var(--border-subtle)', padding: '20px' }}>
            <pre style={{ color: '#E2E8F0', fontSize: '13px', lineHeight: '1.65', whiteSpace: 'pre-wrap', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace', margin: 0 }}>
              {renderedBody}
              {'\n\n--\nShortfundly Campus Team\nShortfundly OTT Marketplace • Creative Partnerships\nOfficial Portal: https://campus.shortfundly.com | Inquiries: +91 93612 23155\nTo unsubscribe, reply with \'Unsubscribe\'.'}
            </pre>
          </div>

        </div>

      </div>

    </div>
  );
}
