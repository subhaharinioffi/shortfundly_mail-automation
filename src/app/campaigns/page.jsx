'use client';

import { useState, useEffect, useMemo } from 'react';
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
  XCircle,
  Layers,
  ChevronLeft,
  ChevronRight,
  Zap,
  Sparkles,
  Search,
  Check,
  X,
  Building,
  Mail,
  UserCheck
} from 'lucide-react';
import { FilmstripIcon, PlayCinemaIcon } from '@/components/Icons';

export default function CampaignsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Raw Database Data
  const [colleges, setColleges] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterCity, setFilterCity] = useState('all');
  const [filterStatus, setFilterStatus] = useState('uncontacted'); // default target uncontacted!
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [search, setSearch] = useState('');

  // Auto Separate Batch System
  const [batchSize, setBatchSize] = useState(50);
  const [customBatchInput, setCustomBatchInput] = useState('50');
  const [activeBatchIndex, setActiveBatchIndex] = useState(0);
  const [viewMode, setViewMode] = useState('active_batch'); // 'active_batch' | 'all_selected' | 'all_filtered'
  const [listPage, setListPage] = useState(1);
  const listPageSize = 25;

  // Selected Colleges for Current Dispatch
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Campaign Settings
  const [senderName, setSenderName] = useState('Shortfundly Campus Team');
  const [bypassDuplicateCheck, setBypassDuplicateCheck] = useState(false);
  const [customSubject, setCustomSubject] = useState('');
  const [customBody, setCustomBody] = useState('');
  const [showCustomizeContent, setShowCustomizeContent] = useState(false);
  const [throttleDelaySec, setThrottleDelaySec] = useState(1.5); // Safe Google SMTP spacing

  // Dispatch Execution State
  const [isSending, setIsSending] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [currentProgressText, setCurrentProgressText] = useState('');
  const [campaignResults, setCampaignResults] = useState(null);
  const [alert, setAlert] = useState(null);

  // Fetch colleges and templates
  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [colRes, tmplRes] = await Promise.all([
        fetch('/api/colleges?limit=all'),
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

      // Default select the first batch of 50 uncontacted colleges for instant, unstressful readiness
      const uncontacted = allColleges.filter(c => c.status === 'uncontacted');
      const firstBatchIds = uncontacted.slice(0, 50).map(c => c.id);
      setSelectedIds(new Set(firstBatchIds));

    } catch (err) {
      console.error('Failed to load campaign data', err);
      setAlert({ type: 'danger', message: 'Failed to load colleges data.' });
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

  // Distinct cities and departments for dropdowns
  const uniqueCities = useMemo(() => {
    const set = new Set();
    colleges.forEach(c => { if (c.city) set.add(c.city); });
    return Array.from(set).sort();
  }, [colleges]);

  // Memoized Filtered Colleges (Ultra Fast)
  const filteredColleges = useMemo(() => {
    return colleges.filter((col) => {
      if (filterCity !== 'all' && col.city !== filterCity) return false;
      if (filterStatus !== 'all' && col.status !== filterStatus) return false;
      
      if (filterDepartment !== 'all') {
        const dept = (col.department || '').toLowerCase();
        if (filterDepartment === 'principal') {
          if (!dept.includes('principal') && !dept.includes('dean') && !dept.includes('leadership') && !dept.includes('govt sams')) return false;
        } else if (filterDepartment === 'hod') {
          if (!dept.includes('hod')) return false;
        } else if (filterDepartment === 'faculty') {
          if (!dept.includes('faculty') && !dept.includes('professor') && !dept.includes('staff')) return false;
        } else if (filterDepartment === 'admin') {
          if (!dept.includes('admin') && !dept.includes('general') && !dept.includes('office')) return false;
        }
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = col.college_name && col.college_name.toLowerCase().includes(q);
        const matchEmail = col.email && col.email.toLowerCase().includes(q);
        const matchDept = col.department && col.department.toLowerCase().includes(q);
        const matchPerson = col.contact_person && col.contact_person.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchDept && !matchPerson) return false;
      }
      return true;
    });
  }, [colleges, filterCity, filterStatus, filterDepartment, search]);

  // AUTO-SEPARATE BATCH CALCULATION
  const batches = useMemo(() => {
    const bList = [];
    const size = Math.max(1, batchSize);
    const totalItems = filteredColleges.length;
    const totalBatches = Math.ceil(totalItems / size) || 1;

    for (let i = 0; i < totalBatches; i++) {
      const startIdx = i * size;
      const endIdx = Math.min(startIdx + size, totalItems);
      const items = filteredColleges.slice(startIdx, endIdx);
      const uncontactedCount = items.filter(c => c.status === 'uncontacted').length;
      
      bList.push({
        batchNumber: i + 1,
        startIndex: startIdx + 1,
        endIndex: endIdx,
        count: items.length,
        items,
        uncontactedCount,
      });
    }
    return bList;
  }, [filteredColleges, batchSize]);

  // Keep activeBatchIndex within bounds when filtered results change
  useEffect(() => {
    if (activeBatchIndex >= batches.length) {
      setActiveBatchIndex(0);
    }
  }, [batches.length, activeBatchIndex]);

  const activeBatch = batches[activeBatchIndex] || batches[0] || { items: [], count: 0, startIndex: 0, endIndex: 0 };

  // Determine which items to render in list based on viewMode (Ultra unstressful DOM load)
  const displayItems = useMemo(() => {
    if (viewMode === 'active_batch') {
      return activeBatch.items || [];
    }
    if (viewMode === 'all_selected') {
      return colleges.filter(c => selectedIds.has(c.id));
    }
    // all_filtered paginated
    const start = (listPage - 1) * listPageSize;
    return filteredColleges.slice(start, start + listPageSize);
  }, [viewMode, activeBatch, colleges, selectedIds, filteredColleges, listPage]);

  // BATCH ACTIONS
  const selectSingleBatch = (bIndex) => {
    setActiveBatchIndex(bIndex);
    const targetBatch = batches[bIndex];
    if (targetBatch && targetBatch.items) {
      setSelectedIds(new Set(targetBatch.items.map(c => c.id)));
    }
  };

  const appendBatchToSelection = (bIndex) => {
    const targetBatch = batches[bIndex];
    if (targetBatch && targetBatch.items) {
      const next = new Set(selectedIds);
      targetBatch.items.forEach(c => next.add(c.id));
      setSelectedIds(next);
    }
  };

  const selectAllFiltered = () => {
    setSelectedIds(new Set(filteredColleges.map(c => c.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const toggleSelectOne = (id, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // Change Batch Size Handler
  const handleBatchSizeChange = (newSize) => {
    setBatchSize(newSize);
    setCustomBatchInput(String(newSize));
    setActiveBatchIndex(0);
    // Auto select first batch of new size
    const newItems = filteredColleges.slice(0, newSize);
    setSelectedIds(new Set(newItems.map(c => c.id)));
  };

  // Launch Automated Dispatch
  const handleLaunchCampaign = async () => {
    const targetColleges = colleges.filter(c => selectedIds.has(c.id));
    if (targetColleges.length === 0) {
      setAlert({ type: 'danger', message: 'Please select at least one college recipient from the batch.' });
      return;
    }

    if (!selectedTemplateId && (!customSubject || !customBody)) {
      setAlert({ type: 'danger', message: 'Please choose an email template or write email content.' });
      return;
    }

    const confirmMsg = `CONFIRM BATCH DISPATCH:\n\n` +
      `• Target Recipients: ${targetColleges.length} institutions\n` +
      `• Active Batch: Batch #${activeBatchIndex + 1}\n` +
      `• Inter-Email Pacing: ${throttleDelaySec}s delay (Google SMTP Safe)\n` +
      `• Duplicate Shield: ${bypassDuplicateCheck ? 'DISABLED' : 'ENABLED (Active)'}\n\n` +
      `Proceed with automated outreach?`;

    if (!window.confirm(confirmMsg)) return;

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
      setCurrentProgressText(`[${currentNum}/${targetColleges.length}] Sending to ${col.college_name} (${col.email})...`);

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
          await new Promise(r => setTimeout(r, throttleDelaySec * 1000));
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
    setCurrentProgressText(`Batch completed! ${sentCount} sent, ${skippedCount} duplicate-shielded, ${failedCount} failed.`);
    setIsSending(false);

    // Refresh database colleges state
    fetchInitialData();
  };

  // Calculate estimated duration
  const estSeconds = Math.round(selectedIds.size * throttleDelaySec);
  const estMinutes = Math.floor(estSeconds / 60);
  const estRemainderSec = estSeconds % 60;
  const estFormatted = estMinutes > 0 ? `${estMinutes}m ${estRemainderSec}s` : `${estSeconds}s`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="role-badge admin" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Zap size={11} /> Auto Batch Engine
            </span>
            <span style={{ fontSize: '12px', color: '#94A3B8' }}>Google Workspace SMTP • High Deliverability • Zero Lag</span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.5px' }}>
            Automated Outreach Campaign Studio
          </h1>
          <p style={{ fontSize: '13px', color: '#94A3B8', marginTop: '3px' }}>
            Smart Auto-Batching engine configured for <strong>{colleges.length} verified Odisha college records</strong>.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/colleges" className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Building size={14} />
            <span>Colleges Directory</span>
          </Link>
          <Link href="/manual-send" className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Mail size={14} />
            <span>Direct Single Send</span>
          </Link>
          <Link href="/logs" className="btn btn-outline btn-sm">
            <span>Delivery Logs</span>
          </Link>
        </div>
      </div>

      {/* Global Alert Notification */}
      {alert && (
        <div className={`alert-box ${alert.type}`} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {alert.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span style={{ flex: 1, fontSize: '13px' }}>{alert.message}</span>
          <button onClick={() => setAlert(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>
            <XCircle size={15} />
          </button>
        </div>
      )}

      {/* Top Telemetry Metric Ribbon (Unstressful Overview) */}
      {/* Top Telemetry Metric Ribbon (Clean Overview) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px',
        background: 'var(--bg-card)',
        padding: '14px 18px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)'
      }}>
        <div>
          <span style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Filtered Recipients</span>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#FFFFFF', marginTop: '2px' }}>
            {filteredColleges.length} <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 400 }}>of {colleges.length}</span>
          </div>
        </div>

        <div>
          <span style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Available Batches</span>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#38BDF8', marginTop: '2px' }}>
            {batches.length} <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 400 }}>({batchSize} per batch)</span>
          </div>
        </div>

        <div>
          <span style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Current Batch</span>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#F59E0B', marginTop: '2px' }}>
            Batch #{batches.length > 0 ? activeBatchIndex + 1 : 0} <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 400 }}>({activeBatch.count} leads)</span>
          </div>
        </div>

        <div>
          <span style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Selected for Outreach</span>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#FF324B', marginTop: '2px' }}>
            {selectedIds.size} <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 400 }}>recipients</span>
          </div>
        </div>

        <div>
          <span style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Est. Delivery Time</span>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#10B981', marginTop: '2px' }}>
            ~{estFormatted}
          </div>
        </div>
      </div>

      {/* Main Studio 2-Column Split */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 0.75fr', gap: '22px' }}>
        
        {/* ================= COLUMN 1: RECIPIENT BATCH STUDIO ================= */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '18px 20px' }}>
          
          {/* Section Heading */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} color="#FF324B" />
              <span style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF' }}>Recipient &amp; Batch Selection</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={selectAllFiltered}
                className="btn btn-secondary btn-sm"
                title="Select all colleges in filtered pool"
                style={{ fontSize: '11px', padding: '4px 10px' }}
              >
                <CheckSquare size={12} color="#FF324B" />
                <span>Select All ({filteredColleges.length})</span>
              </button>
              <button
                type="button"
                onClick={deselectAll}
                className="btn btn-secondary btn-sm"
                title="Deselect all recipients"
                style={{ fontSize: '11px', padding: '4px 10px' }}
              >
                <Square size={12} />
                <span>Clear</span>
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1.3fr 1fr 1fr 1fr', 
            gap: '8px', 
            background: 'rgba(255, 255, 255, 0.02)', 
            padding: '10px 12px', 
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search college, email, person..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setActiveBatchIndex(0); }}
                className="form-input"
                style={{ fontSize: '12px', paddingLeft: '32px', height: '34px' }}
              />
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
              {search && (
                <button 
                  onClick={() => setSearch('')}
                  style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* City / District Filter */}
            <select
              value={filterCity}
              onChange={(e) => { setFilterCity(e.target.value); setActiveBatchIndex(0); }}
              className="form-select"
              style={{ fontSize: '12px', height: '34px' }}
            >
              <option value="all">All Districts ({uniqueCities.length})</option>
              {uniqueCities.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Role / Department Filter */}
            <select
              value={filterDepartment}
              onChange={(e) => { setFilterDepartment(e.target.value); setActiveBatchIndex(0); }}
              className="form-select"
              style={{ fontSize: '12px', height: '34px' }}
            >
              <option value="all">All Target Roles</option>
              <option value="principal">👑 Principals &amp; Deans (Leadership)</option>
              <option value="hod">🎓 HODs (Head of Dept)</option>
              <option value="faculty">🔬 Faculty &amp; Staff</option>
              <option value="admin">🏢 Administration / General</option>
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setActiveBatchIndex(0); }}
              className="form-select"
              style={{ fontSize: '12px', height: '34px' }}
            >
              <option value="uncontacted">Uncontacted Only (Safe)</option>
              <option value="sent">Already Contacted</option>
              <option value="failed">Failed Only</option>
              <option value="all">All Outreach Status</option>
            </select>
          </div>

          {/* AUTO SEPARATE BATCH CONTROLS */}
          <div style={{
            background: 'linear-gradient(180deg, rgba(31, 73, 125, 0.15) 0%, rgba(15, 23, 42, 0.25) 100%)',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            borderRadius: '8px',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={15} color="#38BDF8" />
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Smart Batch Splitter
                </span>
                <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                  ({filteredColleges.length} matching leads split into {batches.length} batches)
                </span>
              </div>

              {/* Batch Size Selector Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ fontSize: '11px', color: '#64748B' }}>Batch Size:</span>
                {[25, 50, 100, 200].map(sz => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => handleBatchSizeChange(sz)}
                    className="btn btn-sm"
                    style={{
                      padding: '3px 8px',
                      fontSize: '11px',
                      fontWeight: 600,
                      background: batchSize === sz ? '#FF324B' : 'rgba(255, 255, 255, 0.05)',
                      color: batchSize === sz ? '#FFFFFF' : '#94A3B8',
                      border: '1px solid ' + (batchSize === sz ? '#FF324B' : 'rgba(255, 255, 255, 0.1)')
                    }}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Scrollable Batch Tabs Ribbon */}
            <div style={{ 
              display: 'flex', 
              gap: '6px', 
              overflowX: 'auto', 
              paddingBottom: '4px',
              scrollbarWidth: 'thin'
            }}>
              {batches.map((b, idx) => {
                const isActive = activeBatchIndex === idx;
                const batchLeadIds = b.items.map(c => c.id);
                const selectedInBatch = batchLeadIds.filter(id => selectedIds.has(id)).length;
                const isFullySelected = selectedInBatch === b.count && b.count > 0;
                const isPartiallySelected = selectedInBatch > 0 && !isFullySelected;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => selectSingleBatch(idx)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      minWidth: '115px',
                      cursor: 'pointer',
                      border: isActive ? '1px solid #FF324B' : '1px solid rgba(255, 255, 255, 0.08)',
                      background: isActive ? 'rgba(255, 50, 75, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                      color: isActive ? '#FFFFFF' : '#94A3B8',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: isActive ? '#FF6B7E' : '#E2E8F0' }}>
                        Batch #{b.batchNumber}
                      </span>
                      {isFullySelected ? (
                        <Check size={12} color="#10B981" />
                      ) : isPartiallySelected ? (
                        <span style={{ fontSize: '9px', color: '#F59E0B' }}>{selectedInBatch}/{b.count}</span>
                      ) : null}
                    </div>
                    <div style={{ fontSize: '10px', color: '#64748B', marginTop: '2px' }}>
                      Leads {b.startIndex}–{b.endIndex} ({b.count})
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Active Batch Quick Action Bar */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              flexWrap: 'wrap', 
              gap: '8px', 
              paddingTop: '6px', 
              borderTop: '1px solid rgba(255, 255, 255, 0.06)' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  disabled={activeBatchIndex === 0}
                  onClick={() => selectSingleBatch(activeBatchIndex - 1)}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '3px 8px', fontSize: '11px' }}
                >
                  <ChevronLeft size={13} /> Prev Batch
                </button>
                <button
                  type="button"
                  disabled={activeBatchIndex >= batches.length - 1}
                  onClick={() => selectSingleBatch(activeBatchIndex + 1)}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '3px 8px', fontSize: '11px' }}
                >
                  Next Batch <ChevronRight size={13} />
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => selectSingleBatch(activeBatchIndex)}
                  className="btn btn-primary btn-sm"
                  style={{ padding: '3px 10px', fontSize: '11px' }}
                >
                  ⚡ Select Batch #{batches.length > 0 ? activeBatchIndex + 1 : 1} ({activeBatch.count} leads)
                </button>
                <button
                  type="button"
                  onClick={() => appendBatchToSelection(activeBatchIndex)}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '3px 10px', fontSize: '11px' }}
                >
                  + Add Batch
                </button>
              </div>
            </div>
          </div>

          {/* View Mode Tabs */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
            <div style={{ display: 'flex', gap: '4px', background: 'rgba(255, 255, 255, 0.03)', padding: '2px', borderRadius: '6px' }}>
              <button
                type="button"
                onClick={() => setViewMode('active_batch')}
                style={{
                  background: viewMode === 'active_batch' ? '#FF324B' : 'transparent',
                  color: viewMode === 'active_batch' ? '#FFFFFF' : '#94A3B8',
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '11px'
                }}
              >
                Current Batch ({activeBatch.count})
              </button>
              <button
                type="button"
                onClick={() => setViewMode('all_selected')}
                style={{
                  background: viewMode === 'all_selected' ? '#FF324B' : 'transparent',
                  color: viewMode === 'all_selected' ? '#FFFFFF' : '#94A3B8',
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '11px'
                }}
              >
                Selected ({selectedIds.size})
              </button>
              <button
                type="button"
                onClick={() => setViewMode('all_filtered')}
                style={{
                  background: viewMode === 'all_filtered' ? '#FF324B' : 'transparent',
                  color: viewMode === 'all_filtered' ? '#FFFFFF' : '#94A3B8',
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '11px'
                }}
              >
                All Filtered ({filteredColleges.length})
              </button>
            </div>

            <span style={{ color: '#64748B', fontSize: '11px' }}>
              Showing {displayItems.length} records in view
            </span>
          </div>

          {/* Recipient Cards Table */}
          <div style={{ 
            maxHeight: '440px', 
            overflowY: 'auto', 
            border: '1px solid var(--border-subtle)', 
            borderRadius: '8px',
            background: 'rgba(7, 9, 14, 0.8)'
          }}>
            {displayItems.length === 0 ? (
              <div style={{ padding: '44px 20px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
                <Users size={32} color="#64748B" style={{ margin: '0 auto 10px' }} />
                {colleges.length === 0 ? (
                  <>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>No Colleges Loaded Yet</div>
                    <div style={{ fontSize: '12px', color: '#94A3B8', maxWidth: '380px', margin: '6px auto 16px' }}>
                      Please upload your official Odisha colleges spreadsheet (.xlsx or .csv) from the College Directory page to start sending.
                    </div>
                    <Link href="/colleges" className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <Building size={14} />
                      <span>Go to College Directory &amp; Upload</span>
                    </Link>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFF' }}>No colleges match active filters</div>
                    <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
                      Try adjusting your search query, city filter, or selecting a different batch.
                    </div>
                  </>
                )}
              </div>
            ) : (
              displayItems.map((col, index) => {
                const isSelected = selectedIds.has(col.id);
                const deptLower = (col.department || '').toLowerCase();
                const isLeadership = deptLower.includes('principal') || deptLower.includes('dean') || deptLower.includes('leadership');
                const isHOD = deptLower.includes('hod');
                const isFaculty = deptLower.includes('faculty') || deptLower.includes('prof');

                return (
                  <div
                    key={col.id}
                    onClick={(e) => toggleSelectOne(col.id, e)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      background: isSelected ? 'rgba(255, 50, 75, 0.08)' : 'transparent',
                      borderLeft: isSelected ? '3px solid #FF324B' : '3px solid transparent',
                      cursor: 'pointer',
                      transition: 'background 0.12s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => toggleSelectOne(col.id, e)}
                        onClick={(e) => e.stopPropagation()}
                        style={{ width: '16px', height: '16px', accentColor: '#FF324B', cursor: 'pointer', flexShrink: 0 }}
                      />
                      <span style={{ fontSize: '11px', color: '#64748B', fontFamily: 'monospace', minWidth: '32px' }}>
                        #{index + 1}
                      </span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ 
                          fontSize: '13px', 
                          fontWeight: 600, 
                          color: isSelected ? '#FFFFFF' : '#CBD5E1',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {col.college_name}
                        </div>
                        <div style={{ fontSize: '11px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                          <span>{col.city}</span>
                          <span>•</span>
                          <span style={{ fontFamily: 'monospace', color: '#FF6B7E' }}>{col.email}</span>
                          {col.contact_person && (
                            <>
                              <span>•</span>
                              <span style={{ color: '#E2E8F0' }}>{col.contact_person}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginLeft: '12px' }}>
                      {/* Department / Role Badge */}
                      {isLeadership ? (
                        <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                          👑 Principal / Dean
                        </span>
                      ) : isHOD ? (
                        <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: 'rgba(168, 85, 247, 0.15)', color: '#C084FC', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
                          🎓 HOD
                        </span>
                      ) : isFaculty ? (
                        <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                          🔬 Faculty
                        </span>
                      ) : (
                        <span style={{ fontSize: '9px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.05)', color: '#94A3B8' }}>
                          Office
                        </span>
                      )}

                      <span className={`status-pill ${col.status}`} style={{ fontSize: '10px', padding: '2px 8px' }}>
                        {col.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination when in all_filtered mode */}
          {viewMode === 'all_filtered' && filteredColleges.length > listPageSize && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', marginTop: '4px' }}>
              <span style={{ color: '#94A3B8' }}>
                Page {listPage} of {Math.ceil(filteredColleges.length / listPageSize)}
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  disabled={listPage === 1}
                  onClick={() => setListPage(p => p - 1)}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '3px 8px', fontSize: '11px' }}
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={listPage >= Math.ceil(filteredColleges.length / listPageSize)}
                  onClick={() => setListPage(p => p + 1)}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '3px 8px', fontSize: '11px' }}
                >
                  Next
                </button>
              </div>
            </div>
          )}

        </div>

        {/* ================= COLUMN 2: DISPATCH CONSOLE & SAFEGUARDS ================= */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '18px 20px' }}>
          
          <div className="card-header" style={{ marginBottom: '4px', paddingBottom: '10px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div>
              <div className="card-title" style={{ fontSize: '16px' }}>
                <Sliders size={18} color="#FF324B" />
                <span>Campaign Settings &amp; Launch</span>
              </div>
              <div className="card-subtitle">
                Delivery parameters &amp; safe rate control
              </div>
            </div>
          </div>

          {/* Template Selection */}
          <div className="form-group" style={{ marginBottom: '10px' }}>
            <label className="form-label">
              Proposal Email Template <span className="required">*</span>
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
          <div className="form-group" style={{ marginBottom: '10px' }}>
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

          {/* Throttle Delay Control */}
          <div className="form-group" style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label className="form-label" style={{ margin: 0 }}>
                Sending Delay Between Emails
              </label>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#38BDF8', fontFamily: 'monospace' }}>
                {throttleDelaySec}s delay / send
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="5.0"
              step="0.5"
              value={throttleDelaySec}
              onChange={(e) => setThrottleDelaySec(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: '#FF324B', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748B', marginTop: '2px' }}>
              <span>Fast (0.5s)</span>
              <span style={{ color: '#10B981' }}>Safe Recommended (1.5s - 2.0s)</span>
              <span>Ultra-Safe (5.0s)</span>
            </div>
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
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF' }}>
                  Prevent Duplicate Emails
                </span>
              </div>
              <input
                type="checkbox"
                id="bypassDuplicate"
                checked={bypassDuplicateCheck}
                onChange={(e) => setBypassDuplicateCheck(e.target.checked)}
                style={{ width: '15px', height: '15px', accentColor: '#FF324B', cursor: 'pointer' }}
              />
            </div>
            <p style={{ fontSize: '11px', color: '#94A3B8', margin: 0 }}>
              {bypassDuplicateCheck ? (
                <span style={{ color: '#F59E0B' }}>⚠️ Protection off: Will re-send to previously contacted institutions.</span>
              ) : (
                <span style={{ color: '#10B981' }}>✓ Active: Prevents re-contacting any institution reached in the last 30 days.</span>
              )}
            </p>
          </div>

          {/* Custom Subject & Body Editor Toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowCustomizeContent(!showCustomizeContent)}
              style={{
                background: 'none',
                border: 'none',
                color: '#38BDF8',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: 0
              }}
            >
              <FileText size={13} />
              <span>{showCustomizeContent ? 'Hide Custom Email Editor' : 'Customize Email Content for this Batch'}</span>
            </button>

            {showCustomizeContent && (
              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '11px' }}>Custom Subject Line</label>
                  <input
                    type="text"
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    className="form-input"
                    style={{ fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '11px' }}>Custom Email Body</label>
                  <textarea
                    rows={6}
                    value={customBody}
                    onChange={(e) => setCustomBody(e.target.value)}
                    className="form-textarea"
                    style={{ fontSize: '11px', fontFamily: 'monospace' }}
                  />
                </div>
                <div style={{ fontSize: '10px', color: '#64748B' }}>
                  Supported tokens: <code>{"{{college_name}}"}</code>, <code>{"{{city}}"}</code>, <code>{"{{contact_person}}"}</code>, <code>{"{{department}}"}</code>
                </div>
              </div>
            )}
          </div>

          {/* Live Progress Bar during active dispatch */}
          {isSending && (
            <div style={{
              background: 'rgba(255, 50, 75, 0.08)',
              border: '1px solid rgba(255, 50, 75, 0.3)',
              borderRadius: '8px',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <RefreshCw size={13} className="spin" color="#FF324B" /> Dispatching Batch...
                </span>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#FF324B', fontFamily: 'monospace' }}>
                  {progressPercent}%
                </span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${progressPercent}%`, height: '100%', background: '#FF324B', transition: 'width 0.2s ease' }} />
              </div>
              <div style={{ fontSize: '11px', color: '#94A3B8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentProgressText}
              </div>
            </div>
          )}

          {/* Final Campaign Results Card */}
          {campaignResults && !isSending && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '8px',
              padding: '12px 14px'
            }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#10B981', marginBottom: '4px' }}>
                ✓ Campaign Batch Dispatched
              </div>
              <div style={{ fontSize: '11px', color: '#CBD5E1', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <span>Sent: <strong style={{ color: '#10B981' }}>{campaignResults.summary.sent}</strong></span>
                <span>Duplicate Skipped: <strong style={{ color: '#F59E0B' }}>{campaignResults.summary.skippedDuplicates}</strong></span>
                <span>Failed: <strong style={{ color: '#EF4444' }}>{campaignResults.summary.failed}</strong></span>
              </div>
            </div>
          )}

          {/* Action Button: Execute Batch Campaign */}
          <button
            type="button"
            disabled={isSending || selectedIds.size === 0}
            onClick={handleLaunchCampaign}
            className="btn btn-primary"
            style={{
              padding: '14px',
              fontSize: '14px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              marginTop: 'auto',
              boxShadow: selectedIds.size > 0 ? '0 4px 20px rgba(255, 50, 75, 0.35)' : 'none'
            }}
          >
            {isSending ? (
              <>
                <RefreshCw size={16} className="spin" />
                <span>Transmitting Batch ({progressPercent}%)...</span>
              </>
            ) : (
              <>
                <Send size={16} />
                <span>Launch Outreach to {selectedIds.size} Selected Colleges</span>
              </>
            )}
          </button>

        </div>

      </div>

    </div>
  );
}
