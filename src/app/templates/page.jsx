'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FileText, 
  Save, 
  Plus, 
  Trash2, 
  Eye, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Send,
  Layers,
  X,
  Image as ImageIcon,
  Link2,
  MousePointerClick,
  Check,
  Upload,
  Paperclip,
  File,
  Download,
  ExternalLink
} from 'lucide-react';

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

  // File Explorer Upload State
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedSessionFiles, setUploadedSessionFiles] = useState([]);

  // Custom User/Admin Modals (Zero default presets)
  const [activeModal, setActiveModal] = useState(null); // 'image_url' | 'link' | 'button' | null
  const [customImgUrl, setCustomImgUrl] = useState('');
  const [customImgAlt, setCustomImgAlt] = useState('');
  const [customLinkText, setCustomLinkText] = useState('');
  const [customLinkUrl, setCustomLinkUrl] = useState('');
  const [customBtnText, setCustomBtnText] = useState('');
  const [customBtnUrl, setCustomBtnUrl] = useState('');

  // Preview state
  const [previewTab, setPreviewTab] = useState('rich'); // 'rich' | 'plain'
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

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

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

  // Insert token into textarea at cursor or end
  const insertToken = (token) => {
    setBody((prev) => prev + ' ' + token);
  };

  // Trigger Native File Explorer
  const handleOpenFileExplorer = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle File Upload from File Explorer (Images, PDFs, Documents, Spreadsheets)
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setAlert(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload file');
      }

      const uploaded = data.file;
      setUploadedSessionFiles(prev => [uploaded, ...prev]);

      if (uploaded.isImage) {
        // Insert clean image markdown pointing to the uploaded file
        const imgMarkdown = `\n\n![${uploaded.filename}](${uploaded.url})\n\n`;
        setBody(prev => prev + imgMarkdown);
        setAlert({ 
          type: 'success', 
          message: `Image "${uploaded.filename}" (${formatFileSize(uploaded.size)}) uploaded from your computer and added to proposal.` 
        });
      } else {
        // Insert document attachment markdown pointing to the uploaded file
        const docMarkdown = `\n\n[📎 Attached Document: ${uploaded.filename} (${formatFileSize(uploaded.size)})](${uploaded.url})\n\n`;
        setBody(prev => prev + docMarkdown);
        setAlert({ 
          type: 'success', 
          message: `File "${uploaded.filename}" (${formatFileSize(uploaded.size)}) uploaded from your computer and attached to proposal.` 
        });
      }
    } catch (err) {
      setAlert({ type: 'danger', message: `Upload failed: ${err.message}` });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Insert Image via custom user URL
  const handleInsertCustomImage = (e) => {
    e?.preventDefault();
    if (!customImgUrl) return;
    const cleanAlt = customImgAlt ? customImgAlt.trim() : 'Proposal Visual';
    setBody((prev) => prev + `\n\n![${cleanAlt}](${customImgUrl.trim()})\n\n`);
    setActiveModal(null);
    setCustomImgUrl('');
    setCustomImgAlt('');
    setAlert({ type: 'success', message: 'Image link added to proposal body.' });
  };

  // Insert Custom Link / Document source
  const handleInsertCustomLink = (e) => {
    e?.preventDefault();
    if (!customLinkUrl) return;
    const cleanText = customLinkText ? customLinkText.trim() : 'Resource Link';
    setBody((prev) => prev + ` [${cleanText}](${customLinkUrl.trim()}) `);
    setActiveModal(null);
    setCustomLinkText('');
    setCustomLinkUrl('');
    setAlert({ type: 'success', message: 'Resource link added to proposal body.' });
  };

  // Insert Custom CTA Button
  const handleInsertCustomButton = (e) => {
    e?.preventDefault();
    if (!customBtnUrl) return;
    const cleanText = customBtnText ? customBtnText.trim() : 'Take Action';
    setBody((prev) => prev + `\n\n[button:${cleanText}](${customBtnUrl.trim()})\n\n`);
    setActiveModal(null);
    setCustomBtnText('');
    setCustomBtnUrl('');
    setAlert({ type: 'success', message: 'Action button added to proposal body.' });
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

  // Handle New Template (Clean, zero default presets)
  const handleCreateNew = () => {
    setSelectedTemplateId(null);
    setName('New Odisha Outreach Proposal');
    setSubject('PROPOSAL FOR SHORTFUNDLY CAMPUS COLLABORATION - [College Name]');
    setBody('Dear Sir/Madam,\n\nGreetings from Shortfundly!\n\nWe propose an educational collaboration with [College Name] through Shortfundly Campus to help students develop creative skills, showcase their work, and explore opportunities in filmmaking and digital content.\n\nWarm regards,\n[Your Name]\n[Your Role]');
    setCategory('Campus Outreach');
    setIsDefault(false);
    setAlert({ type: 'info', message: 'Drafting new template. Use "Upload Image / File" to add your media or documents from your computer.' });
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

  // Safe live HTML renderer for preview pane
  const renderLiveHtml = (rawText) => {
    if (!rawText) return '';
    let safe = rawText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // 1. Markdown Images (supports URLs, data URLs, and uploaded files)
    safe = safe.replace(/!\[([^\]]*)\]\(((?:https?:\/\/|data:image\/|\/api\/upload)[^)]+)\)/gi, (m, alt, url) => {
      return `<div style="margin: 16px 0; text-align: center;"><img src="${url}" alt="${alt || 'Image'}" style="max-width: 100%; max-height: 250px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.12); box-shadow: 0 4px 14px rgba(0,0,0,0.3); display: inline-block; object-fit: contain;" /></div>`;
    });

    // 2. Action Buttons
    safe = safe.replace(/\[(?:button|cta):([^\]]+)\]\((https?:\/\/[^)]+)\)/gi, (m, label, url) => {
      return `<div style="margin: 18px 0; text-align: center;"><a href="${url}" target="_blank" rel="noopener noreferrer" style="background: linear-gradient(135deg, #FF324B, #E0283E); color: #FFFFFF !important; padding: 11px 24px; text-decoration: none; border-radius: 6px; font-weight: 700; display: inline-block; box-shadow: 0 4px 14px rgba(255,50,75,0.3); font-size: 13px; letter-spacing: 0.02em;">${label}</a></div>`;
    });

    // 3. Document Attachments and Links
    safe = safe.replace(/\[([^\]]+)\]\(((?:https?:\/\/|mailto:|\/api\/upload)[^)]+)\)/gi, (m, label, url) => {
      if (label.includes('📎') || url.includes('/api/upload')) {
        return `<div style="margin: 10px 0;"><a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #38BDF8; background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.25); padding: 8px 14px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; font-size: 13px;">${label}</a></div>`;
      }
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #FF6B7E; text-decoration: underline; font-weight: 600;">${label}</a>`;
    });

    // 4. Bold
    safe = safe.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    safe = safe.replace(/\*([^*]+)\*/g, '<strong>$1</strong>');

    // 5. Paragraphs and lists
    const blocks = safe.split(/\n\s*\n/).map(block => {
      const trimmed = block.trim();
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const lis = trimmed.split(/\n/).map(l => `<li style="margin-bottom: 4px;">${l.replace(/^[-*]\s*/, '')}</li>`).join('');
        return `<ul style="margin: 10px 0 14px 20px; line-height: 1.6; color: #CBD5E1;">${lis}</ul>`;
      }
      if (/^\d+\.\s/.test(trimmed)) {
        const lis = trimmed.split(/\n/).map(l => `<li style="margin-bottom: 4px;">${l.replace(/^\d+\.\s*/, '')}</li>`).join('');
        return `<ol style="margin: 10px 0 14px 20px; line-height: 1.6; color: #CBD5E1;">${lis}</ol>`;
      }
      if (trimmed.startsWith('<div style="margin:') && trimmed.endsWith('</div>')) {
        return trimmed;
      }
      return `<p style="margin: 0 0 12px 0; line-height: 1.65; color: #CBD5E1;">${trimmed.replace(/\n/g, '<br/>')}</p>`;
    });

    return blocks.join('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Hidden Native File Explorer Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
        style={{ display: 'none' }}
      />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="role-badge admin">TEMPLATE STUDIO</span>
            <span style={{ fontSize: '12px', color: '#64748B' }}>Proposal Templates • File Upload from Device • Live Preview</span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#FFFFFF' }}>
            Proposal Email Templates
          </h1>
          <p style={{ fontSize: '14px', color: '#94A3B8', marginTop: '2px' }}>
            Upload images and document files from your computer, customize proposal content, and preview outreach in real time.
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
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(420px, 1.15fr) minmax(380px, 1fr)', gap: '24px' }}>
        
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

            {/* ADMIN MEDIA & FILE MANAGER TOOLBAR */}
            <div style={{ 
              background: 'linear-gradient(180deg, rgba(31, 73, 125, 0.14) 0%, rgba(15, 23, 42, 0.3) 100%)', 
              border: '1px solid rgba(56, 189, 248, 0.25)', 
              borderRadius: '8px', 
              padding: '12px 14px', 
              marginBottom: '14px' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Paperclip size={13} color="#38BDF8" />
                  Upload from Device &amp; Add Sources:
                </span>
                <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                  Supports Images, PDFs &amp; Documents
                </span>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {/* PRIMARY ACTION: Native File Explorer Upload */}
                <button
                  type="button"
                  onClick={handleOpenFileExplorer}
                  disabled={uploading}
                  className="btn btn-primary btn-sm"
                  style={{
                    fontSize: '11px',
                    padding: '6px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: 700
                  }}
                  title="Choose image or any document file from your computer"
                >
                  {uploading ? (
                    <>
                      <RefreshCw size={13} className="spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={13} />
                      <span>Upload Image or File (File Explorer)</span>
                    </>
                  )}
                </button>

                {/* Optional Custom Image via URL */}
                <button
                  type="button"
                  onClick={() => setActiveModal(activeModal === 'image_url' ? null : 'image_url')}
                  className="btn btn-secondary btn-sm"
                  style={{
                    fontSize: '11px',
                    padding: '6px 10px',
                    background: activeModal === 'image_url' ? 'rgba(255, 50, 75, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    borderColor: activeModal === 'image_url' ? '#FF324B' : 'rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <ImageIcon size={13} color="#FF6B7E" />
                  <span>Image URL</span>
                </button>

                {/* Custom Link / Source */}
                <button
                  type="button"
                  onClick={() => setActiveModal(activeModal === 'link' ? null : 'link')}
                  className="btn btn-secondary btn-sm"
                  style={{
                    fontSize: '11px',
                    padding: '6px 10px',
                    background: activeModal === 'link' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    borderColor: activeModal === 'link' ? '#38BDF8' : 'rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <Link2 size={13} color="#38BDF8" />
                  <span>Add Web Link / Source</span>
                </button>

                {/* Custom CTA Action Button */}
                <button
                  type="button"
                  onClick={() => setActiveModal(activeModal === 'button' ? null : 'button')}
                  className="btn btn-secondary btn-sm"
                  style={{
                    fontSize: '11px',
                    padding: '6px 10px',
                    background: activeModal === 'button' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    borderColor: activeModal === 'button' ? '#10B981' : 'rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <MousePointerClick size={13} color="#10B981" />
                  <span>Add Action Button</span>
                </button>
              </div>

              {/* DRAWER 1: Custom Image via URL */}
              {activeModal === 'image_url' && (
                <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(7, 9, 14, 0.9)', borderRadius: '6px', border: '1px solid rgba(255, 50, 75, 0.3)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Insert Image via Custom Web URL</span>
                    <button type="button" onClick={() => setActiveModal(null)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}><X size={12} /></button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      placeholder="Enter Image URL (e.g. https://your-domain.com/banner.png)"
                      value={customImgUrl}
                      onChange={(e) => setCustomImgUrl(e.target.value)}
                      className="form-input"
                      style={{ fontSize: '11px', height: '32px' }}
                    />
                    <input
                      type="text"
                      placeholder="Image Description / Alt Text"
                      value={customImgAlt}
                      onChange={(e) => setCustomImgAlt(e.target.value)}
                      className="form-input"
                      style={{ fontSize: '11px', height: '32px' }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleInsertCustomImage}
                    disabled={!customImgUrl}
                    className="btn btn-primary btn-sm"
                    style={{ fontSize: '11px', padding: '4px 12px' }}
                  >
                    Insert Image
                  </button>
                </div>
              )}

              {/* DRAWER 2: Custom Link / Web Source */}
              {activeModal === 'link' && (
                <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(7, 9, 14, 0.9)', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Insert Custom Web Link or Source</span>
                    <button type="button" onClick={() => setActiveModal(null)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}><X size={12} /></button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      placeholder="Link Title (e.g. Official University Portal)"
                      value={customLinkText}
                      onChange={(e) => setCustomLinkText(e.target.value)}
                      className="form-input"
                      style={{ fontSize: '11px', height: '32px' }}
                    />
                    <input
                      type="text"
                      placeholder="Destination URL (e.g. https://...)"
                      value={customLinkUrl}
                      onChange={(e) => setCustomLinkUrl(e.target.value)}
                      className="form-input"
                      style={{ fontSize: '11px', height: '32px' }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleInsertCustomLink}
                    disabled={!customLinkUrl}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '11px', padding: '4px 12px' }}
                  >
                    Insert Link
                  </button>
                </div>
              )}

              {/* DRAWER 3: Custom Action Button */}
              {activeModal === 'button' && (
                <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(7, 9, 14, 0.9)', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Insert Custom Action Button</span>
                    <button type="button" onClick={() => setActiveModal(null)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}><X size={12} /></button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      placeholder="Button Label (e.g. Schedule Presentation)"
                      value={customBtnText}
                      onChange={(e) => setCustomBtnText(e.target.value)}
                      className="form-input"
                      style={{ fontSize: '11px', height: '32px' }}
                    />
                    <input
                      type="text"
                      placeholder="Target Action URL (e.g. https://...)"
                      value={customBtnUrl}
                      onChange={(e) => setCustomBtnUrl(e.target.value)}
                      className="form-input"
                      style={{ fontSize: '11px', height: '32px' }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleInsertCustomButton}
                    disabled={!customBtnUrl}
                    className="btn btn-primary btn-sm"
                    style={{ fontSize: '11px', padding: '4px 12px' }}
                  >
                    Insert Action Button
                  </button>
                </div>
              )}

              {/* Uploaded Files Chips in Current Session */}
              {uploadedSessionFiles.length > 0 && (
                <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ fontSize: '10px', color: '#94A3B8', marginBottom: '5px' }}>
                    Files Uploaded from Device (Click to insert into proposal):
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {uploadedSessionFiles.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => {
                          if (f.isImage) {
                            setBody(prev => prev + `\n\n![${f.filename}](${f.url})\n\n`);
                          } else {
                            setBody(prev => prev + `\n\n[📎 Attached Document: ${f.filename} (${formatFileSize(f.size)})](${f.url})\n\n`);
                          }
                          setAlert({ type: 'success', message: `Inserted "${f.filename}" into proposal body.` });
                        }}
                        style={{
                          fontSize: '11px',
                          background: 'rgba(255, 255, 255, 0.06)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          color: '#E2E8F0',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                        title="Click to insert into email body"
                      >
                        {f.isImage ? <ImageIcon size={11} color="#FF6B7E" /> : <Paperclip size={11} color="#38BDF8" />}
                        <span>{f.filename}</span>
                        <span style={{ fontSize: '9px', color: '#64748B' }}>({formatFileSize(f.size)})</span>
                        <span style={{ color: '#38BDF8', fontWeight: 700 }}>+</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

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

            {/* View Mode Toggle: Rich vs Plain */}
            <div style={{ display: 'flex', gap: '4px', background: 'rgba(255, 255, 255, 0.05)', padding: '2px', borderRadius: '6px' }}>
              <button
                type="button"
                onClick={() => setPreviewTab('rich')}
                style={{
                  background: previewTab === 'rich' ? '#FF324B' : 'transparent',
                  color: previewTab === 'rich' ? '#FFFFFF' : '#94A3B8',
                  border: 'none',
                  padding: '3px 9px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Rich Email View
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab('plain')}
                style={{
                  background: previewTab === 'plain' ? '#FF324B' : 'transparent',
                  color: previewTab === 'plain' ? '#FFFFFF' : '#94A3B8',
                  border: 'none',
                  padding: '3px 9px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Plain Text
              </button>
            </div>
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

          {/* Body Preview Area */}
          <div style={{ flex: 1, minHeight: '440px', overflowY: 'auto', background: '#0B0D13', borderRadius: '8px', border: '1px solid var(--border-subtle)', padding: '20px' }}>
            {previewTab === 'rich' ? (
              <div style={{ maxWidth: '580px', margin: '0 auto' }}>
                <div 
                  dangerouslySetInnerHTML={{ __html: renderLiveHtml(renderedBody) }} 
                  style={{ fontSize: '13px', lineHeight: '1.65' }}
                />

                {/* Professional Shortfundly Verified Footer */}
                <div style={{ marginTop: '28px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '12px', color: '#94A3B8', lineHeight: 1.6 }}>
                  <div style={{ fontWeight: 700, color: '#FFFFFF' }}>Shortfundly Campus Team</div>
                  <div>Shortfundly OTT Marketplace • Creative Partnerships Initiative</div>
                  <div style={{ marginTop: '4px' }}>
                    Official Portal: <a href="https://campus.shortfundly.com" target="_blank" rel="noopener noreferrer" style={{ color: '#FF6B7E', textDecoration: 'underline' }}>campus.shortfundly.com</a> | Inquiries: +91 93612 23155
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748B', marginTop: '8px' }}>
                    You are receiving this official correspondence regarding student development in Odisha. To unsubscribe, reply with &quot;Unsubscribe&quot;.
                  </div>
                </div>
              </div>
            ) : (
              <pre style={{ color: '#E2E8F0', fontSize: '13px', lineHeight: '1.65', whiteSpace: 'pre-wrap', fontFamily: 'monospace', margin: 0 }}>
                {renderedBody}
                {'\n\n--\nShortfundly Campus Team\nShortfundly OTT Marketplace • Creative Partnerships\nOfficial Portal: https://campus.shortfundly.com | Inquiries: +91 93612 23155\nTo unsubscribe, reply with \'Unsubscribe\'.'}
              </pre>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
