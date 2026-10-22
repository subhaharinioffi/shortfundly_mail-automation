'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';
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
  UserCheck,
  ExternalLink,
  Sliders,
  FileText,
  MapPin,
  Clock,
  Globe,
  Copy,
} from 'lucide-react';

export default function CampaignsPage() {
  const { data: session } = useSession();

  // Colleges & Templates Data
  const [colleges, setColleges] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [loading, setLoading] = useState(true);

  // Filter States
  const [availableStates, setAvailableStates] = useState([]);
  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('India');
  const [selectedState, setSelectedState] = useState('all');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');
  const [search, setSearch] = useState('');

  // Selected Colleges and Target Contact Overrides
  // selectedIds: Set of collegeId strings
  const [selectedIds, setSelectedIds] = useState(new Set());
  // contactOverrides: { [collegeId]: { email, role, personName } }
  const [contactOverrides, setContactOverrides] = useState({});

  // Auto Batching System
  const [batchSize, setBatchSize] = useState(25);
  const [customBatchInput, setCustomBatchInput] = useState('25');
  const [activeBatchIndex, setActiveBatchIndex] = useState(0);
  const [viewMode, setViewMode] = useState('active_batch'); // 'active_batch' | 'all_selected' | 'all_filtered'
  const [listPage, setListPage] = useState(1);
  const listPageSize = 25;

  // Campaign Settings
  const [senderName, setSenderName] = useState('Shortfundly Campus Team');
  const [bypassDuplicateCheck, setBypassDuplicateCheck] = useState(false);
  const [customSubject, setCustomSubject] = useState('');
  const [customBody, setCustomBody] = useState('');
  const [showCustomizeContent, setShowCustomizeContent] = useState(false);
  const [throttleDelaySec, setThrottleDelaySec] = useState(1.5); // Safe anti-spam spacing

  // Live Dispatch Execution State
  const [isSending, setIsSending] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [currentProgressText, setCurrentProgressText] = useState('');
  const [campaignResults, setCampaignResults] = useState(null);
  const [alert, setAlert] = useState(null);
  const [copiedEmail, setCopiedEmail] = useState(null);

  // 1. Load Filter Options (States & Districts)
  const fetchFilters = useCallback(async (stateParam = '') => {
    try {
      const url = stateParam && stateParam !== 'all'
        ? `/api/colleges/filters?state=${encodeURIComponent(stateParam)}`
        : '/api/colleges/filters';
      const res = await fetch(url);
      const data = await res.json();
      if (data.states && availableStates.length === 0) {
        setAvailableStates(data.states);
      }
      if (data.districts) {
        setAvailableDistricts(data.districts);
      }
    } catch (err) {
      console.warn('Failed to load filter options:', err);
    }
  }, [availableStates.length]);

  // 2. Fetch Colleges matching current filters
  const fetchColleges = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('limit', 'all');
      if (selectedCountry && selectedCountry !== 'all') params.append('country', selectedCountry);
      if (selectedState && selectedState !== 'all') params.append('state', selectedState);
      if (selectedDistrict && selectedDistrict !== 'all') params.append('district', selectedDistrict);
      if (selectedRole && selectedRole !== 'all') params.append('role', selectedRole);
      if (search.trim()) params.append('search', search.trim());

      const res = await fetch(`/api/colleges?${params.toString()}`);
      const data = await res.json();
      const list = data.colleges || [];
      setColleges(list);

      // Auto-select first batch if nothing selected yet or filters changed
      const initialBatch = list.slice(0, batchSize).map((c) => c.id);
      setSelectedIds(new Set(initialBatch));
      setActiveBatchIndex(0);
      setListPage(1);
    } catch (err) {
      console.error('Failed to load colleges:', err);
      setAlert({ type: 'danger', message: 'Failed to retrieve college directory data.' });
    } finally {
      setLoading(false);
    }
  }, [selectedCountry, selectedState, selectedDistrict, selectedRole, search, batchSize]);

  // 3. Fetch Templates
  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/templates');
      const data = await res.json();
      const tmpls = data.templates || [];
      setTemplates(tmpls);

      if (tmpls.length > 0) {
        const defaultTmpl = tmpls.find((t) => t.is_default) || tmpls[0];
        setSelectedTemplateId(defaultTmpl.id);
        setCustomSubject(defaultTmpl.subject);
        setCustomBody(defaultTmpl.body);
      }
    } catch (err) {
      console.warn('Failed to load email templates:', err);
    }
  };

  // Initial Load
  useEffect(() => {
    fetchFilters();
    fetchTemplates();
    if (session?.user?.name) {
      setSenderName(session.user.name);
    }
  }, [fetchFilters, session]);

  // Re-fetch districts when selected state changes
  useEffect(() => {
    fetchFilters(selectedState);
    setSelectedDistrict('all');
  }, [selectedState, fetchFilters]);

  // Re-fetch colleges when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchColleges();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchColleges]);

  // Handle Template Dropdown Change
  const handleTemplateChange = (e) => {
    const id = parseInt(e.target.value, 10);
    setSelectedTemplateId(id);
    const tmpl = templates.find((t) => t.id === id);
    if (tmpl) {
      setCustomSubject(tmpl.subject);
      setCustomBody(tmpl.body);
    }
  };

  // Helper to resolve the best recipient email for a college
  const getResolvedRecipient = useCallback((col) => {
    if (contactOverrides[col.id]) {
      return contactOverrides[col.id];
    }
    // Match filtered role if active
    if (selectedRole !== 'all' && col.contacts?.length > 0) {
      const matched = col.contacts.find((ct) =>
        ct.role.toLowerCase().includes(selectedRole.toLowerCase())
      );
      if (matched) {
        return {
          email: matched.email,
          role: matched.role,
          personName: matched.personName || '',
        };
      }
    }
    // Default to first contact or official email
    if (col.contacts?.length > 0) {
      return {
        email: col.contacts[0].email,
        role: col.contacts[0].role,
        personName: col.contacts[0].personName || '',
      };
    }
    return {
      email: col.officialEmail || '',
      role: 'Official Institution',
      personName: '',
    };
  }, [contactOverrides, selectedRole]);

  // Set contact override for a specific college
  const setContactOverride = (collegeId, email, role, personName) => {
    setContactOverrides((prev) => ({
      ...prev,
      [collegeId]: { email, role, personName },
    }));
  };

  // AUTO-SEPARATE BATCHES CALCULATION
  const batches = useMemo(() => {
    const bList = [];
    const size = Math.max(1, batchSize);
    const totalItems = colleges.length;
    const totalBatches = Math.ceil(totalItems / size) || 1;

    for (let i = 0; i < totalBatches; i++) {
      const startIdx = i * size;
      const endIdx = Math.min(startIdx + size, totalItems);
      const items = colleges.slice(startIdx, endIdx);

      bList.push({
        batchNumber: i + 1,
        startIndex: startIdx + 1,
        endIndex: endIdx,
        count: items.length,
        items,
      });
    }
    return bList;
  }, [colleges, batchSize]);

  // Keep active batch index within bounds
  useEffect(() => {
    if (activeBatchIndex >= batches.length) {
      setActiveBatchIndex(0);
    }
  }, [batches.length, activeBatchIndex]);

  const activeBatch = batches[activeBatchIndex] || batches[0] || { items: [], count: 0, startIndex: 0, endIndex: 0 };

  // Determine which items to render in list based on viewMode
  const displayItems = useMemo(() => {
    if (viewMode === 'active_batch') {
      return activeBatch.items || [];
    }
    if (viewMode === 'all_selected') {
      return colleges.filter((c) => selectedIds.has(c.id));
    }
    // all_filtered paginated
    const start = (listPage - 1) * listPageSize;
    return colleges.slice(start, start + listPageSize);
  }, [viewMode, activeBatch, colleges, selectedIds, listPage]);

  // BATCH & SELECTION ACTIONS
  const selectSingleBatch = (bIndex) => {
    setActiveBatchIndex(bIndex);
    const targetBatch = batches[bIndex];
    if (targetBatch && targetBatch.items) {
      setSelectedIds(new Set(targetBatch.items.map((c) => c.id)));
    }
  };

  const appendBatchToSelection = (bIndex) => {
    const targetBatch = batches[bIndex];
    if (targetBatch && targetBatch.items) {
      const next = new Set(selectedIds);
      targetBatch.items.forEach((c) => next.add(c.id));
      setSelectedIds(next);
    }
  };

  const selectAllFiltered = () => {
    setSelectedIds(new Set(colleges.map((c) => c.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const selectFirstN = (count) => {
    const target = colleges.slice(0, count).map((c) => c.id);
    setSelectedIds(new Set(target));
  };

  const toggleSelectOne = (id, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBatchSizeChange = (newSize) => {
    const sz = Math.max(1, newSize);
    setBatchSize(sz);
    setCustomBatchInput(String(sz));
    setActiveBatchIndex(0);
    const newItems = colleges.slice(0, sz).map((c) => c.id);
    setSelectedIds(new Set(newItems));
  };

  const copyToClipboard = (text, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedEmail(text);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  // Launch Automated Bulk Outreach Campaign
  const handleLaunchCampaign = async () => {
    const targetColleges = colleges.filter((c) => selectedIds.has(c.id));
    if (targetColleges.length === 0) {
      setAlert({ type: 'danger', message: 'Please select at least one college from the directory.' });
      return;
    }

    if (!selectedTemplateId && (!customSubject || !customBody)) {
      setAlert({ type: 'danger', message: 'Please choose an email template or write email content.' });
      return;
    }

    // Build specific recipient payload with verified email addresses
    const recipients = targetColleges.map((col) => {
      const resolved = getResolvedRecipient(col);
      return {
        collegeId: col.id,
        collegeName: col.collegeName,
        recipientEmail: resolved.email,
        role: resolved.role,
        personName: resolved.personName,
        state: col.state,
        district: col.district,
        websiteUrl: col.officialWebsite || '',
      };
    }).filter((r) => r.recipientEmail && r.recipientEmail.includes('@'));

    if (recipients.length === 0) {
      setAlert({
        type: 'danger',
        message: 'None of the selected institutions have a valid contact email. Please choose colleges with email addresses.',
      });
      return;
    }

    const confirmMsg =
      `CONFIRM BULK OUTREACH DISPATCH:\n\n` +
      `• Target Colleges: ${targetColleges.length} selected institutions\n` +
      `• Valid Email Recipients: ${recipients.length} addresses\n` +
      `• Batch / Delay: ${throttleDelaySec}s pause between emails (Anti-Spam Throttling)\n` +
      `• Duplicate Protection: ${bypassDuplicateCheck ? 'OFF (Will Resend)' : 'ON (Protects Previously Contacted)'}\n\n` +
      `Do you want to dispatch this email campaign now?`;

    if (!window.confirm(confirmMsg)) return;

    setIsSending(true);
    setAlert(null);
    setProgressPercent(0);

    const results = [];
    let sentCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    setCampaignResults({
      summary: { total: recipients.length, sent: 0, failed: 0, skippedDuplicates: 0 },
      results: [],
    });

    for (let i = 0; i < recipients.length; i++) {
      const rec = recipients[i];
      const currentNum = i + 1;
      const pct = Math.round((i / recipients.length) * 100);
      setProgressPercent(pct);
      setCurrentProgressText(`[${currentNum}/${recipients.length}] Sending to ${rec.collegeName} (${rec.recipientEmail})...`);

      try {
        const payload = {
          recipients: [rec],
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
          collegeName: rec.collegeName,
          email: rec.recipientEmail,
          status: 'failed',
          error: data.error || 'Server error',
        };

        if (outcome.status === 'sent') sentCount++;
        else if (outcome.status === 'skipped_duplicate') skippedCount++;
        else failedCount++;

        results.push(outcome);

        setCampaignResults({
          summary: {
            total: recipients.length,
            sent: sentCount,
            failed: failedCount,
            skippedDuplicates: skippedCount,
          },
          results: [...results],
        });

        // Delay between recipients to respect SMTP limits
        if (i < recipients.length - 1) {
          await new Promise((r) => setTimeout(r, throttleDelaySec * 1000));
        }
      } catch (err) {
        failedCount++;
        results.push({
          collegeName: rec.collegeName,
          email: rec.recipientEmail,
          status: 'failed',
          error: err.message || 'Transmission failed',
        });
      }
    }

    setProgressPercent(100);
    setCurrentProgressText(`Campaign completed! ${sentCount} sent, ${skippedCount} duplicate skipped, ${failedCount} failed.`);
    setIsSending(false);
  };

  // Estimate duration
  const estSeconds = Math.round(selectedIds.size * throttleDelaySec);
  const estMinutes = Math.floor(estSeconds / 60);
  const estRemainderSec = estSeconds % 60;
  const estFormatted = estMinutes > 0 ? `${estMinutes}m ${estRemainderSec}s` : `${estSeconds}s`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="role-badge admin" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Zap size={11} /> Bulk Outreach Engine
            </span>
            <span style={{ fontSize: '12px', color: '#94A3B8' }}>
              Automated Batch Processing • Anti-Spam Safe • Verified Indian Institutions
            </span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.5px' }}>
            Automated Bulk Email Campaigns
          </h1>
          <p style={{ fontSize: '13px', color: '#94A3B8', marginTop: '3px' }}>
            Target colleges by State, District, and Staff Role. Send structured outreach in clean, rate-controlled batches.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/colleges" className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Building size={14} />
            <span>College Directory</span>
          </Link>
          <Link href="/manual-send" className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Mail size={14} />
            <span>Single Send</span>
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
          <button
            onClick={() => setAlert(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Metric Summary Ribbon */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          background: 'var(--bg-card)',
          padding: '14px 18px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div>
          <span style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Filtered Colleges
          </span>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#FFFFFF', marginTop: '2px' }}>
            {loading ? '...' : colleges.length}{' '}
            <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 400 }}>institutions</span>
          </div>
        </div>

        <div>
          <span style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Total Batches
          </span>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#38BDF8', marginTop: '2px' }}>
            {batches.length}{' '}
            <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 400 }}>
              ({batchSize} per batch)
            </span>
          </div>
        </div>

        <div>
          <span style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Active Batch
          </span>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#F59E0B', marginTop: '2px' }}>
            Batch #{batches.length > 0 ? activeBatchIndex + 1 : 0}{' '}
            <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 400 }}>
              ({activeBatch.count} colleges)
            </span>
          </div>
        </div>

        <div>
          <span style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Ready to Send
          </span>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#FF324B', marginTop: '2px' }}>
            {selectedIds.size}{' '}
            <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 400 }}>
              selected
            </span>
          </div>
        </div>

        <div>
          <span style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Estimated Dispatch
          </span>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#10B981', marginTop: '2px' }}>
            ~{estFormatted}
          </div>
        </div>
      </div>

      {/* Main Studio 2-Column Split */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.28fr 0.72fr', gap: '22px' }}>
        {/* ================= COLUMN 1: RECIPIENT & BATCH SELECTION ================= */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '18px 20px' }}>
          {/* Section Heading & Quick Select Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} color="#FF324B" />
              <span style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF' }}>
                Target Colleges &amp; Batch Groups
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={selectAllFiltered}
                className="btn btn-secondary btn-sm"
                title="Select all colleges in filtered pool"
                style={{ fontSize: '11px', padding: '4px 10px' }}
              >
                <CheckSquare size={12} color="#FF324B" />
                <span>Select All ({colleges.length})</span>
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
              <div style={{ display: 'flex', gap: '4px' }}>
                {[10, 25, 50, 100].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => selectFirstN(n)}
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: '10px', padding: '3px 6px' }}
                    title={`Select first ${n} colleges`}
                  >
                    +{n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Filters Bar: Country, State, District, Role, Search */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '0.85fr 1.15fr 1.15fr 1.1fr 1.4fr',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.02)',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            {/* Country Selector */}
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="form-select"
              style={{ fontSize: '12px', height: '34px' }}
            >
              <option value="India">🇮🇳 India</option>
              <option value="United States" disabled>🇺🇸 United States (Coming Soon)</option>
              <option value="United Kingdom" disabled>🇬🇧 United Kingdom (Coming Soon)</option>
              <option value="Canada" disabled>🇨🇦 Canada (Coming Soon)</option>
            </select>

            {/* State Selector */}
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="form-select"
              style={{ fontSize: '12px', height: '34px' }}
            >
              <option value="all">All States ({availableStates.length})</option>
              {availableStates.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>

            {/* District Selector */}
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="form-select"
              style={{ fontSize: '12px', height: '34px' }}
            >
              <option value="all">
                {selectedState === 'all'
                  ? 'All Districts'
                  : `All ${selectedState} Districts (${availableDistricts.length})`}
              </option>
              {availableDistricts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            {/* Staff Role Selector */}
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="form-select"
              style={{ fontSize: '12px', height: '34px' }}
            >
              <option value="all">All Roles</option>
              <option value="Principal">👑 Principal</option>
              <option value="Dean">🎓 Dean</option>
              <option value="Head of Department">🔬 HOD</option>
              <option value="Placement">💼 Placement Cell</option>
              <option value="Registrar">🏛️ Registrar</option>
            </select>

            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search college, city, or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input"
                style={{ fontSize: '12px', paddingLeft: '30px', height: '34px' }}
              />
              <Search
                size={13}
                style={{
                  position: 'absolute',
                  left: '9px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#64748B',
                }}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                  }}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* AUTO-SEPARATE BATCH SYSTEM CONTROLS */}
          <div
            style={{
              background: 'linear-gradient(180deg, rgba(31, 73, 125, 0.15) 0%, rgba(15, 23, 42, 0.25) 100%)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              borderRadius: '8px',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={15} color="#38BDF8" />
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#38BDF8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Batch Partitioning
                </span>
                <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                  ({colleges.length} colleges divided into {batches.length} batch groups)
                </span>
              </div>

              {/* Batch Size Selector Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ fontSize: '11px', color: '#64748B' }}>Batch Size:</span>
                {[10, 25, 50, 100, 200].map((sz) => (
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
                      border: '1px solid ' + (batchSize === sz ? '#FF324B' : 'rgba(255, 255, 255, 0.1)'),
                    }}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Scrollable Batch Tabs Ribbon */}
            <div
              style={{
                display: 'flex',
                gap: '6px',
                overflowX: 'auto',
                paddingBottom: '4px',
                scrollbarWidth: 'thin',
              }}
            >
              {batches.map((b, idx) => {
                const isActive = activeBatchIndex === idx;
                const batchColIds = b.items.map((c) => c.id);
                const selectedInBatch = batchColIds.filter((id) => selectedIds.has(id)).length;
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
                      minWidth: '120px',
                      cursor: 'pointer',
                      border: isActive ? '1px solid #FF324B' : '1px solid rgba(255, 255, 255, 0.08)',
                      background: isActive ? 'rgba(255, 50, 75, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                      color: isActive ? '#FFFFFF' : '#94A3B8',
                      transition: 'all 0.15s ease',
                      flexShrink: 0,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: isActive ? '#FF6B7E' : '#E2E8F0' }}>
                        Batch #{b.batchNumber}
                      </span>
                      {isFullySelected ? (
                        <Check size={12} color="#10B981" />
                      ) : isPartiallySelected ? (
                        <span style={{ fontSize: '9px', color: '#F59E0B' }}>
                          {selectedInBatch}/{b.count}
                        </span>
                      ) : null}
                    </div>
                    <div style={{ fontSize: '10px', color: '#64748B', marginTop: '2px' }}>
                      Colleges {b.startIndex}–{b.endIndex} ({b.count})
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Active Batch Quick Action Bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px',
                paddingTop: '6px',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
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
                  Select Batch #{batches.length > 0 ? activeBatchIndex + 1 : 1} ({activeBatch.count} colleges)
                </button>
                <button
                  type="button"
                  onClick={() => appendBatchToSelection(activeBatchIndex)}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '3px 10px', fontSize: '11px' }}
                >
                  + Add to Selection
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
                  fontSize: '11px',
                }}
              >
                Active Batch ({activeBatch.count})
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
                  fontSize: '11px',
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
                  fontSize: '11px',
                }}
              >
                All Filtered ({colleges.length})
              </button>
            </div>

            <span style={{ color: '#64748B', fontSize: '11px' }}>
              Showing {displayItems.length} records in view
            </span>
          </div>

          {/* Recipient Cards Table */}
          <div
            style={{
              maxHeight: '440px',
              overflowY: 'auto',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              background: 'rgba(7, 9, 14, 0.8)',
            }}
          >
            {loading ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
                <RefreshCw size={24} className="spin" style={{ margin: '0 auto 10px', color: '#FF324B' }} />
                <div>Loading colleges from directory...</div>
              </div>
            ) : displayItems.length === 0 ? (
              <div style={{ padding: '44px 20px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
                <Building size={32} color="#64748B" style={{ margin: '0 auto 10px' }} />
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFF' }}>
                  No colleges match the active filters
                </div>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
                  Try choosing a different state, clearing the district filter, or broadening the search query.
                </div>
              </div>
            ) : (
              displayItems.map((col, index) => {
                const isSelected = selectedIds.has(col.id);
                const resolved = getResolvedRecipient(col);
                const hasMultipleContacts = col.contacts && col.contacts.length > 1;

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
                      transition: 'background 0.12s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => toggleSelectOne(col.id, e)}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          width: '16px',
                          height: '16px',
                          accentColor: '#FF324B',
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontSize: '11px',
                          color: '#64748B',
                          fontFamily: 'monospace',
                          minWidth: '32px',
                        }}
                      >
                        #{index + 1}
                      </span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            color: isSelected ? '#FFFFFF' : '#CBD5E1',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {col.collegeName}
                        </div>
                        <div
                          style={{
                            fontSize: '11px',
                            color: '#94A3B8',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            flexWrap: 'wrap',
                            marginTop: '2px',
                          }}
                        >
                          <span style={{ color: '#38BDF8' }}>
                            {col.state} • {col.district}
                          </span>
                          <span>•</span>
                          <span
                            style={{
                              fontFamily: 'monospace',
                              color: resolved.email ? '#FF6B7E' : '#EF4444',
                              fontWeight: 500,
                            }}
                          >
                            {resolved.email || 'No email detected'}
                          </span>
                          {resolved.personName && (
                            <>
                              <span>•</span>
                              <span style={{ color: '#E2E8F0' }}>{resolved.personName}</span>
                            </>
                          )}
                          {col.officialWebsite && (
                            <a
                              href={col.officialWebsite}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              style={{ color: '#64748B', display: 'inline-flex', alignItems: 'center', gap: '2px' }}
                            >
                              <ExternalLink size={10} />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginLeft: '12px' }}>
                      {/* Target Role Selector or Pill */}
                      {hasMultipleContacts ? (
                        <select
                          value={resolved.email}
                          onChange={(e) => {
                            e.stopPropagation();
                            const chosenEmail = e.target.value;
                            const matchedContact = col.contacts.find((ct) => ct.email === chosenEmail);
                            if (matchedContact) {
                              setContactOverride(col.id, matchedContact.email, matchedContact.role, matchedContact.personName);
                            } else if (chosenEmail === col.officialEmail) {
                              setContactOverride(col.id, col.officialEmail, 'Official Institution', '');
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="form-select"
                          style={{
                            fontSize: '11px',
                            padding: '2px 8px',
                            height: '26px',
                            background: 'rgba(15, 23, 42, 0.8)',
                            borderColor: 'rgba(56, 189, 248, 0.3)',
                            color: '#38BDF8',
                          }}
                        >
                          {col.officialEmail && (
                            <option value={col.officialEmail}>🏛️ Official: {col.officialEmail}</option>
                          )}
                          {col.contacts.map((ct) => (
                            <option key={ct.id || ct.email} value={ct.email}>
                              {ct.role}: {ct.email} {ct.personName ? `(${ct.personName})` : ''}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            padding: '2px 7px',
                            borderRadius: '4px',
                            background: 'rgba(56, 189, 248, 0.1)',
                            color: '#38BDF8',
                            border: '1px solid rgba(56, 189, 248, 0.25)',
                          }}
                        >
                          {resolved.role}
                        </span>
                      )}

                      {/* Quick copy email */}
                      {resolved.email && (
                        <button
                          type="button"
                          onClick={(e) => copyToClipboard(resolved.email, e)}
                          title="Copy target email address"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: copiedEmail === resolved.email ? '#10B981' : '#64748B',
                            cursor: 'pointer',
                            padding: '3px',
                          }}
                        >
                          {copiedEmail === resolved.email ? <Check size={13} /> : <Copy size={13} />}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination when in all_filtered mode */}
          {viewMode === 'all_filtered' && colleges.length > listPageSize && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', marginTop: '4px' }}>
              <span style={{ color: '#94A3B8' }}>
                Page {listPage} of {Math.ceil(colleges.length / listPageSize)}
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  disabled={listPage === 1}
                  onClick={() => setListPage((p) => p - 1)}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '3px 8px', fontSize: '11px' }}
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={listPage >= Math.ceil(colleges.length / listPageSize)}
                  onClick={() => setListPage((p) => p + 1)}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '3px 8px', fontSize: '11px' }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ================= COLUMN 2: EMAIL SETTINGS & DISPATCH ================= */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '18px 20px' }}>
          <div className="card-header" style={{ marginBottom: '4px', paddingBottom: '10px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div>
              <div className="card-title" style={{ fontSize: '16px' }}>
                <Sliders size={18} color="#FF324B" />
                <span>Campaign Configuration</span>
              </div>
              <div className="card-subtitle">
                Choose outreach template, sender identity, and delivery rate
              </div>
            </div>
          </div>

          {/* Template Selection */}
          <div className="form-group" style={{ marginBottom: '8px' }}>
            <label className="form-label">
              Choose Email Template <span className="required">*</span>
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
          <div className="form-group" style={{ marginBottom: '8px' }}>
            <label className="form-label">
              Sender Name (From Name)
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
          <div className="form-group" style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label className="form-label" style={{ margin: 0 }}>
                Delay Between Emails (Anti-Spam)
              </label>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#38BDF8', fontFamily: 'monospace' }}>
                {throttleDelaySec}s pause / email
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
              <span style={{ color: '#10B981' }}>Safe (1.5s - 2.0s)</span>
              <span>Extra Safe (5.0s)</span>
            </div>
          </div>

          {/* Duplicate Protection Safeguard */}
          <div
            style={{
              background: 'rgba(7, 9, 14, 0.7)',
              padding: '12px 14px',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={16} color="#10B981" />
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF' }}>
                  Duplicate Outreach Protection
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
                <span style={{ color: '#F59E0B' }}>⚠️ Protection off: Will re-send to previously contacted colleges.</span>
              ) : (
                <span style={{ color: '#10B981' }}>✓ Protected: Skips institutions emailed within the last 30 days.</span>
              )}
            </p>
          </div>

          {/* Preview or Custom Subject & Body Editor Toggle */}
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
                padding: 0,
              }}
            >
              <FileText size={13} />
              <span>{showCustomizeContent ? 'Hide Email Preview & Editor' : 'Preview or Customize Email Content'}</span>
            </button>

            {showCustomizeContent && (
              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '11px' }}>Subject Line</label>
                  <input
                    type="text"
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    className="form-input"
                    style={{ fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '11px' }}>Email Body</label>
                  <textarea
                    rows={6}
                    value={customBody}
                    onChange={(e) => setCustomBody(e.target.value)}
                    className="form-textarea"
                    style={{ fontSize: '11px', fontFamily: 'monospace' }}
                  />
                </div>
                <div style={{ fontSize: '10px', color: '#64748B' }}>
                  Tokens: <code>{"[College Name]"}</code>, <code>{"[State]"}</code>, <code>{"[District]"}</code>, <code>{"[Recipient Name]"}</code>
                </div>
              </div>
            )}
          </div>

          {/* Live Progress Bar during active dispatch */}
          {isSending && (
            <div
              style={{
                background: 'rgba(255, 50, 75, 0.08)',
                border: '1px solid rgba(255, 50, 75, 0.3)',
                borderRadius: '8px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <RefreshCw size={13} className="spin" color="#FF324B" /> Dispatching Batch...
                </span>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#FF324B', fontFamily: 'monospace' }}>
                  {progressPercent}%
                </span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: '6px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '3px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${progressPercent}%`,
                    height: '100%',
                    background: '#FF324B',
                    transition: 'width 0.2s ease',
                  }}
                />
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: '#94A3B8',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {currentProgressText}
              </div>
            </div>
          )}

          {/* Final Campaign Results Card */}
          {campaignResults && !isSending && (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '8px',
                padding: '12px 14px',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#10B981', marginBottom: '4px' }}>
                ✓ Campaign Batch Dispatched
              </div>
              <div style={{ fontSize: '11px', color: '#CBD5E1', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <span>
                  Delivered: <strong style={{ color: '#10B981' }}>{campaignResults.summary.sent}</strong>
                </span>
                <span>
                  Skipped Duplicates: <strong style={{ color: '#F59E0B' }}>{campaignResults.summary.skippedDuplicates}</strong>
                </span>
                <span>
                  Failed: <strong style={{ color: '#EF4444' }}>{campaignResults.summary.failed}</strong>
                </span>
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
              boxShadow: selectedIds.size > 0 ? '0 4px 20px rgba(255, 50, 75, 0.35)' : 'none',
            }}
          >
            {isSending ? (
              <>
                <RefreshCw size={16} className="spin" />
                <span>Sending Batch ({progressPercent}%)...</span>
              </>
            ) : (
              <>
                <Send size={16} />
                <span>
                  Send Emails to {selectedIds.size} Selected Colleges
                  {batches.length > 0 && ` (Batch #${activeBatchIndex + 1})`}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
