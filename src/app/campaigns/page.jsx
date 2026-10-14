'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Send, 
  CheckSquare, 
  Square, 
  ShieldCheck, 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Filter, 
  Clock, 
  FileText, 
  Users, 
  GraduationCap, 
  ExternalLink, 
  ArrowRight,
  Sliders,
  XCircle
} from 'lucide-react';
import { FilmstripIcon, PlayCinemaIcon } from '@/components/Icons';

export default function CampaignsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Data
  const [colleges, setColleges] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterCity, setFilterCity] = useState('all');
  const [filterStatus, setFilterStatus] = useState('uncontacted'); // default target uncontacted!
  const [search, setSearch] = useState('');

  // Selected Colleges
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Campaign Settings
  const [senderName, setSenderName] = useState('Shortfundly Campus Team');
  const [bypassDuplicateCheck, setBypassDuplicateCheck] = useState(false);
  const [customSubject, setCustomSubject] = useState('');
  const [customBody, setCustomBody] = useState('');
  const [showCustomizeContent, setShowCustomizeContent] = useState(false);

  // Dispatch Execution State
  const [isSending, setIsSending] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [currentProgressText, setCurrentProgressText] = useState('');
  const [campaignResults, setCampaignResults] = useState(null);
  const [alert, setAlert] = useState(null);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [colRes, tmplRes] = await Promise.all([
        fetch('/api/colleges?limit=100'),
        fetch('/api/templates'),
      ]);

      const colData = await colRes.json();
      const tmplData = await tmplRes.json();

      const allColleges = colData.colleges || [];
      setColleges(allColleges);

      const allTemplates = tmplData.templates || [];
      setTemplates(allTemplates);

      if (allTemplates.length > 0) {
        const defaultTmpl = allTemplates.find(t => t.is_default) || allTemplates[0];
        setSelectedTemplateId(defaultTmpl.id);
        setCustomSubject(defaultTmpl.subject);
        setCustomBody(defaultTmpl.body);
      }

      // Default select all uncontacted
      const uncontacted = allColleges.filter(c => c.status === 'uncontacted').map(c => c.id);
      setSelectedIds(new Set(uncontacted));

    } catch (err) {
      console.error('Failed to load campaign data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchInitialData();
      if (session?.user?.name) {
        setSenderName(session.user.name);
      }
    }
  }, [status]);

  // When template selection changes
  const handleTemplateChange = (e) => {
    const id = parseInt(e.target.value, 10);
    setSelectedTemplateId(id);
    const tmpl = templates.find(t => t.id === id);
    if (tmpl) {
      setCustomSubject(tmpl.subject);
      setCustomBody(tmpl.body);
    }
  };

  // Filtered colleges list
  const filteredColleges = colleges.filter((col) => {
    if (filterCity !== 'all' && col.city !== filterCity) return false;
    if (filterStatus !== 'all' && col.status !== filterStatus) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        col.college_name.toLowerCase().includes(q) ||
        col.email.toLowerCase().includes(q) ||
        (col.department && col.department.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const uniqueCities = Array.from(new Set(colleges.map(c => c.city))).sort();

  // Selection toggles
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredColleges.length && filteredColleges.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredColleges.map(c => c.id)));
    }
  };

  const toggleSelectOne = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // Launch Automated Dispatch
  const handleLaunchCampaign = async () => {
    const targetColleges = colleges.filter(c => selectedIds.has(c.id));
    if (targetColleges.length === 0) {
      setAlert({ type: 'danger', message: 'Please select at least one college recipient.' });
      return;
    }

    if (!selectedTemplateId && (!customSubject || !customBody)) {
      setAlert({ type: 'danger', message: 'Please choose an email template or write email content.' });
      return;
    }

    if (!window.confirm(`Confirm Automated Dispatch:\n\nSend separate personalized proposal emails to ${targetColleges.length} selected Odisha institutions?`)) {
      return;
    }

    setIsSending(true);
    setAlert(null);
    setProgressPercent(0);

    const results = [];
    let sentCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    setCampaignResults({
      summary: { total: targetColleges.length, sent: 0, failed: 0, skippedDuplicates: 0 },
      results: []
    });

    for (let i = 0; i < targetColleges.length; i++) {
      const col = targetColleges[i];
      const currentNum = i + 1;
      const pct = Math.round((i / targetColleges.length) * 100);
      setProgressPercent(pct);
      setCurrentProgressText(`[${currentNum}/${targetColleges.length}] Dispatching to ${col.college_name} (${col.email})...`);

      try {
        const payload = {
          collegeIds: [col.id],
          templateId: selectedTemplateId,
          customSubject: showCustomizeContent ? customSubject : undefined,
          customBody: showCustomizeContent ? customBody : undefined,
          senderName,
          bypassDuplicateCheck,
          delayMs: 0,
        };

        const res = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        const outcome = data.results?.[0] || {
          collegeName: col.college_name,
          email: col.email,
          status: 'failed',
          error: data.error || 'Server error'
        };

        if (outcome.status === 'sent') sentCount++;
        else if (outcome.status === 'skipped_duplicate') skippedCount++;
        else failedCount++;

        results.push(outcome);

        setCampaignResults({
          summary: {
            total: targetColleges.length,
            sent: sentCount,
            failed: failedCount,
            skippedDuplicates: skippedCount,
          },
          results: [...results]
        });

        // Throttle interval between recipients to respect Google SMTP rate limits
        if (i < targetColleges.length - 1) {
          await new Promise(r => setTimeout(r, 800));
        }
      } catch (err) {
        failedCount++;
        results.push({
          collegeName: col.college_name,
          email: col.email,
          status: 'failed',
          error: err.message || 'Transmission failed'
        });
      }
    }

    setProgressPercent(100);
    setCurrentProgressText(`Batch completed. ${sentCount} sent, ${skippedCount} duplicate-shielded, ${failedCount} failed.`);
    setIsSending(false);

    // Refresh database colleges state
    fetchInitialData();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="role-badge admin">Requirements 3 &amp; 4</span>
            <span style={{ fontSize: '12px', color: '#64748B' }}>Automated Dispatch • Duplicate Guard • Google SMTP</span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#FFFFFF' }}>
            Automated Outreach Campaign Studio
          </h1>
          <p style={{ fontSize: '14px', color: '#94A3B8', marginTop: '2px' }}>
            Filter recipient colleges, select proposal template, and execute high-deliverability Google SMTP batch outreach.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/manual-send" className="btn btn-secondary btn-sm">
            <span>Direct Send</span>
          </Link>
          <Link href="/logs" className="btn btn-outline btn-sm">
            <span>Outreach Logs</span>
          </Link>
        </div>
      </div>

      {/* Global Alert Notification */}
      {alert && (
        <div className={`alert-box ${alert.type}`}>
          {alert.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span style={{ flex: 1 }}>{alert.message}</span>
          <button onClick={() => setAlert(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>
            <XCircle size={14} />
          </button>
        </div>
      )}

      {/* 2-Column Campaign Setup: Recipient Selection & Configuration Console */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
        
        {/* COLUMN 1: RECIPIENT SELECTION */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <GraduationCap size={18} color="#FF324B" />
                <span>Select Target Odisha Institutions</span>
              </div>
              <div className="card-subtitle">
                {selectedIds.size} of {filteredColleges.length} colleges selected
              </div>
            </div>

            <button
              type="button"
              onClick={toggleSelectAll}
              className="btn btn-secondary btn-sm"
            >
              {selectedIds.size === filteredColleges.length && filteredColleges.length > 0 ? (
                <>
                  <CheckSquare size={13} color="#FF324B" />
                  <span>Deselect All</span>
                </>
              ) : (
                <>
                  <Square size={13} />
                  <span>Select All Filtered</span>
                </>
              )}
            </button>
          </div>

          {/* Filter Toolbar */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '14px' }}>
            <input
              type="text"
              placeholder="Search college or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
              style={{ fontSize: '12px' }}
            />
            <select
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              className="form-select"
              style={{ fontSize: '12px' }}
            >
              <option value="all">All Cities</option>
              {uniqueCities.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="form-select"
              style={{ fontSize: '12px' }}
            >
              <option value="all">All Outreach Status</option>
              <option value="uncontacted">Uncontacted Only</option>
              <option value="sent">Already Sent</option>
              <option value="failed">Failed Only</option>
            </select>
          </div>

          {/* Scrollable College Checklist */}
          <div style={{ maxHeight: '420px', overflowY: 'auto', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}>
            {filteredColleges.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
                No colleges match current filters.
              </div>
            ) : (
              filteredColleges.map((col) => {
                const isSelected = selectedIds.has(col.id);
                return (
                  <div
                    key={col.id}
                    onClick={() => toggleSelectOne(col.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      background: isSelected ? 'rgba(255, 50, 75, 0.08)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // handled by parent div click
                        style={{ width: '16px', height: '16px', accentColor: '#FF324B' }}
                      />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>
                          {col.college_name}
                        </div>
                        <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                          {col.city} • <span style={{ fontFamily: 'monospace', color: '#FF6B7E' }}>{col.email}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`status-pill ${col.status}`} style={{ fontSize: '10px', padding: '2px 8px' }}>
                        {col.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* COLUMN 2: DISPATCH CONTROLS & EXECUTION */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div className="card-header" style={{ marginBottom: '8px' }}>
            <div>
              <div className="card-title">
                <Sliders size={18} color="#FF324B" />
                <span>Outreach Launch Console</span>
              </div>
              <div className="card-subtitle">
                Google SMTP parameters &amp; safeguard rules
              </div>
            </div>
          </div>

          {/* Template Selection */}
          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label className="form-label">
              Outreach Proposal Template <span className="required">*</span>
            </label>
            <select
              value={selectedTemplateId}
              onChange={handleTemplateChange}
              className="form-select"
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.is_default ? '(Default Proposal)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Sender Identity */}
          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label className="form-label">
              Sender Signature Name
            </label>
            <input
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              className="form-input"
              placeholder="e.g. Shortfundly Campus Outreach"
            />
          </div>

          {/* Safeguard: Duplicate Protection */}
          <div style={{ 
            background: 'rgba(7, 9, 14, 0.7)', 
            padding: '12px 14px', 
            borderRadius: '8px', 
            border: '1px solid var(--border-subtle)' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={16} color="#10B981" />
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>Duplicate Email Shield</span>
              </div>
              <input
                type="checkbox"
                checked={!bypassDuplicateCheck}
                onChange={(e) => setBypassDuplicateCheck(!e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#10B981' }}
              />
            </div>
            <p style={{ fontSize: '11px', color: '#94A3B8' }}>
              Protects against sending multiple proposals to the same institution within the 30-day cooldown period.
            </p>
          </div>

          {/* Rate Limiting Notice */}
          <div style={{ 
            background: 'rgba(7, 9, 14, 0.7)', 
            padding: '12px 14px', 
            borderRadius: '8px', 
            border: '1px solid var(--border-subtle)',
            fontSize: '11px',
            color: '#94A3B8'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#06B6D4', fontWeight: 600, marginBottom: '2px' }}>
              <Clock size={14} />
              <span>Throttling Queue: 1.0s interval</span>
            </div>
            Sequentially paces outbound requests to respect Google SMTP throughput guidelines.
          </div>

          {/* Launch Action Button */}
          <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
            <button
              type="button"
              disabled={isSending || selectedIds.size === 0}
              onClick={handleLaunchCampaign}
              className="btn btn-primary btn-lg"
              style={{ width: '100%', padding: '14px', fontSize: '15px' }}
            >
              {isSending ? (
                <span>Dispatching Campaign...</span>
              ) : (
                <>
                  <Send size={16} />
                  <span>Execute Automated Send ({selectedIds.size} Colleges)</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>

      {/* EXECUTION & RESULTS CONSOLE */}
      {(isSending || campaignResults) && (
        <div className="card" style={{ borderColor: 'rgba(255, 50, 75, 0.4)' }}>
          <div className="card-header">
            <div className="card-title">
              <PlayCinemaIcon size={16} color="#FF324B" />
              <span>Outreach Execution Status</span>
            </div>
            {campaignResults && (
              <span style={{ fontSize: '12px', color: '#10B981', fontWeight: 600 }}>
                Batch Completed
              </span>
            )}
          </div>

          {/* Progress Bar */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94A3B8', marginBottom: '6px' }}>
              <span>{currentProgressText}</span>
              <span>{progressPercent}%</span>
            </div>
            <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '9999px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  width: `${progressPercent}%`, 
                  height: '100%', 
                  background: 'linear-gradient(90deg, #FF324B, #10B981)', 
                  transition: 'width 0.4s ease' 
                }} 
              />
            </div>
          </div>

          {/* Summary Chips */}
          {campaignResults && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
              <div style={{ background: 'rgba(7, 9, 14, 0.8)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: '#94A3B8' }}>Total Processed</span>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF' }}>
                  {campaignResults.summary.total}
                </div>
              </div>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: '#34d399' }}>Sent Successfully</span>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#10B981' }}>
                  {campaignResults.summary.sent}
                </div>
              </div>
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: '#fbbf24' }}>Duplicates Prevented</span>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#F59E0B' }}>
                  {campaignResults.summary.skippedDuplicates}
                </div>
              </div>
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: '#f87171' }}>Failed Attempts</span>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#EF4444' }}>
                  {campaignResults.summary.failed}
                </div>
              </div>
            </div>
          )}

          {/* Detailed Execution Items */}
          {campaignResults && campaignResults.results && (
            <div className="table-wrapper" style={{ maxHeight: '280px', overflowY: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>College Name</th>
                    <th>Official Email</th>
                    <th>Dispatch Status</th>
                    <th>Details / Error Log</th>
                  </tr>
                </thead>
                <tbody>
                  {campaignResults.results.map((r, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{r.collegeName}</td>
                      <td style={{ fontFamily: 'monospace', color: '#94A3B8' }}>{r.email}</td>
                      <td>
                        <span className={`status-pill ${r.status}`}>
                          {r.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px', color: r.error ? '#F87171' : '#94A3B8' }}>
                        {r.error || (r.messageId ? `Message ID: ${r.messageId}` : 'Delivered')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
