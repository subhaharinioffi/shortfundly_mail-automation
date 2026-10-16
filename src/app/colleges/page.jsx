'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  GraduationCap, 
  Search, 
  Filter, 
  Plus, 
  Upload, 
  ExternalLink, 
  Trash2, 
  Edit2, 
  Send, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  FileSpreadsheet, 
  CopyCheck, 
  X,
  Mail,
  Building,
  Sparkles
} from 'lucide-react';

export default function CollegesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [colleges, setColleges] = useState([]);
  const [total, setTotal] = useState(0);
  const [cities, setCities] = useState([]);
  const [stats, setStats] = useState({ total: 0, sent: 0, uncontacted: 0, failed: 0 });
  const [loading, setLoading] = useState(true);

  // Filters, Pagination & Batch Partitioning
  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [batchSize, setBatchSize] = useState(50);

  // Input & Import Panel State
  const [showInputPanel, setShowInputPanel] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentEdit, setCurrentEdit] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    state: 'Odisha',
    city: '',
    college_name: '',
    website_url: '',
    department: '',
    contact_person: '',
    email: '',
    source_page_url: '',
    notes: '',
  });

  // Import state
  const [importFile, setImportFile] = useState(null);
  const [importText, setImportText] = useState('');
  const [importMode, setImportMode] = useState('upsert');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  // Notifications
  const [alert, setAlert] = useState(null);

  const fetchColleges = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        city: selectedCity,
        status: selectedStatus,
        department: selectedDepartment,
        page: String(page),
        limit: String(batchSize),
      });
      const res = await fetch(`/api/colleges?${params.toString()}`);
      const data = await res.json();

      if (res.ok) {
        setColleges(data.colleges || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        setCities(data.cities || []);
        setStats(data.stats || { total: 0, sent: 0, uncontacted: 0, failed: 0 });
      }
    } catch (err) {
      console.error('Failed to load colleges', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchColleges();
    }
  }, [status, search, selectedCity, selectedStatus, selectedDepartment, page, batchSize]);

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setImportFile(e.dataTransfer.files[0]);
    }
  };

  // Handle Add College
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/colleges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (res.ok) {
        setAlert({ type: 'success', message: `College "${formData.college_name}" added successfully.` });
        setShowAddModal(false);
        setFormData({
          state: 'Odisha',
          city: '',
          college_name: '',
          website_url: '',
          department: '',
          contact_person: '',
          email: '',
          source_page_url: '',
          notes: '',
        });
        fetchColleges();
      } else {
        setAlert({ type: 'danger', message: data.error || 'Failed to add college' });
      }
    } catch (err) {
      setAlert({ type: 'danger', message: 'Network error occurred while adding college.' });
    }
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!currentEdit) return;

    try {
      const res = await fetch('/api/colleges', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentEdit),
      });
      const data = await res.json();

      if (res.ok) {
        setAlert({ type: 'success', message: `Updated "${currentEdit.college_name}".` });
        setShowEditModal(false);
        setCurrentEdit(null);
        fetchColleges();
      } else {
        setAlert({ type: 'danger', message: data.error || 'Failed to update college' });
      }
    } catch (err) {
      setAlert({ type: 'danger', message: 'Network error occurred.' });
    }
  };

  // Handle Delete
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove "${name}" from the database?`)) return;

    try {
      const res = await fetch(`/api/colleges?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAlert({ type: 'success', message: `Removed "${name}".` });
        fetchColleges();
      } else {
        const data = await res.json();
        setAlert({ type: 'danger', message: data.error || 'Failed to delete' });
      }
    } catch (err) {
      setAlert({ type: 'danger', message: 'Failed to delete college.' });
    }
  };

  // Handle Clear All Colleges for fresh upload
  const handleClearAllColleges = async () => {
    if (!window.confirm('WARNING: Are you sure you want to clear all colleges from the database?\n\nUse this if you want to upload your own official Odisha dataset from scratch.')) return;
    try {
      const res = await fetch('/api/colleges?action=clear_all', { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setAlert({ type: 'success', message: data.message || 'All college records cleared.' });
        fetchColleges();
      } else {
        setAlert({ type: 'danger', message: data.error || 'Failed to clear colleges.' });
      }
    } catch (err) {
      setAlert({ type: 'danger', message: 'Failed to clear colleges.' });
    }
  };

  // Handle Import Submit
  const handleImportSubmit = async (e) => {
    e.preventDefault();
    setImporting(true);
    setImportResult(null);

    try {
      let res;

      if (importFile) {
        const formData = new FormData();
        formData.append('file', importFile);
        formData.append('mode', importMode);

        res = await fetch('/api/colleges?action=import', {
          method: 'POST',
          body: formData,
        });
      } else if (importText && importText.trim()) {
        res = await fetch(`/api/colleges?action=import&mode=${encodeURIComponent(importMode)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'text/csv' },
          body: importText.trim(),
        });
      } else {
        setAlert({ type: 'warning', message: 'Please upload an Excel (.xlsx, .xls) or CSV file, or paste dataset rows.' });
        setImporting(false);
        return;
      }

      const data = await res.json();
      if (res.ok) {
        setImportResult(data);
        const stats = data.stats || {};
        const totalProcessed = stats.totalProcessed ?? stats.inserted ?? 0;
        setAlert({ 
          type: 'success', 
          message: `Import complete: ${totalProcessed} colleges saved to database (${stats.inserted ?? 0} new added, ${stats.updated ?? 0} updated from file, ${stats.skippedDuplicates ?? 0} internal file duplicates handled).` 
        });
        fetchColleges();
      } else {
        setAlert({ type: 'danger', message: data.error || 'Import failed.' });
      }
    } catch (err) {
      setAlert({ type: 'danger', message: 'Error processing dataset import: ' + err.message });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="role-badge admin">INSTITUTIONAL REGISTRY</span>
            <span style={{ fontSize: '12px', color: '#64748B' }}>State: Odisha • Official Websites Only</span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#FFFFFF' }}>
            College Contact Details &amp; Directory
          </h1>
          <p style={{ fontSize: '14px', color: '#94A3B8', marginTop: '2px' }}>
            Maintain verified official college emails, websites, departments, and leadership contacts.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => { setShowInputPanel(true); setImportResult(null); }}
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} color="#38BDF8" />
            <span>Sync &amp; Import Dataset</span>
          </button>

          <button 
            onClick={() => setShowAddModal(true)}
            className="btn btn-secondary btn-sm"
          >
            <Plus size={14} />
            <span>Add Single College</span>
          </button>

          {total > 0 && (
            <button 
              onClick={handleClearAllColleges}
              className="btn btn-secondary btn-sm"
              title="Clear database to upload your official dataset"
            >
              <Trash2 size={14} color="#EF4444" />
              <span>Reset Database</span>
            </button>
          )}
        </div>
      </div>

      {/* Global Alert Notification */}
      {alert && (
        <div className={`alert-box ${alert.type}`}>
          {alert.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span style={{ flex: 1 }}>{alert.message}</span>
          <button 
            onClick={() => setAlert(null)} 
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ================= COMPACT RIGHT-SIDE SLIDE-OVER INPUT & SYNC DRAWER ================= */}
      {showInputPanel && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'flex-end',
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(5px)',
          }}
          onClick={() => setShowInputPanel(false)}
        >
          <div 
            style={{
              width: '460px',
              maxWidth: '92vw',
              height: '100%',
              background: '#0B0F19',
              borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '-16px 0 48px rgba(0, 0, 0, 0.85)',
              padding: '24px 22px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileSpreadsheet size={18} color="#38BDF8" />
                </div>
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                    Dataset Sync &amp; Import
                  </h2>
                  <p style={{ fontSize: '11px', color: '#94A3B8', margin: '2px 0 0 0' }}>
                    Odisha Institutional Registry Engine
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowInputPanel(false)}
                style={{ background: 'rgba(255, 255, 255, 0.05)', border: 'none', borderRadius: '6px', color: '#94A3B8', padding: '6px', cursor: 'pointer', display: 'flex' }}
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Clear View Options for Sync & Update vs Fresh Import */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Import Mode Selection
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div
                  onClick={() => setImportMode('upsert')}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    border: importMode === 'upsert' ? '1.5px solid #10B981' : '1px solid rgba(255, 255, 255, 0.08)',
                    background: importMode === 'upsert' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: importMode === 'upsert' ? '#10B981' : '#FFFFFF', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <RefreshCw size={12} />
                      Sync &amp; Update
                    </span>
                    <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '3px', background: 'rgba(16, 185, 129, 0.25)', color: '#10B981', fontWeight: 700 }}>
                      SAFE
                    </span>
                  </div>
                  <span style={{ fontSize: '10px', color: '#94A3B8', lineHeight: 1.35 }}>
                    Updates contacts &amp; appends new colleges without wiping existing data.
                  </span>
                </div>

                <div
                  onClick={() => setImportMode('replace')}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    border: importMode === 'replace' ? '1.5px solid #F59E0B' : '1px solid rgba(255, 255, 255, 0.08)',
                    background: importMode === 'replace' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: importMode === 'replace' ? '#F59E0B' : '#FFFFFF', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Upload size={12} />
                      Fresh Import
                    </span>
                    <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '3px', background: 'rgba(245, 158, 11, 0.25)', color: '#F59E0B', fontWeight: 700 }}>
                      REPLACE
                    </span>
                  </div>
                  <span style={{ fontSize: '10px', color: '#94A3B8', lineHeight: 1.35 }}>
                    Clean slate: replaces current database records entirely with file data.
                  </span>
                </div>
              </div>
            </div>
          {/* Drag & Drop File Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
              border: isDragging ? '2px dashed #FF324B' : '2px dashed rgba(255, 255, 255, 0.15)',
              background: isDragging ? 'rgba(255, 50, 75, 0.08)' : 'rgba(7, 9, 14, 0.6)',
              borderRadius: '8px',
              padding: '16px 14px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onClick={() => document.getElementById('college-file-input')?.click()}
          >
            <input
              id="college-file-input"
              type="file"
              accept=".xlsx,.xls,.csv,.txt"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              style={{ display: 'none' }}
            />

            {importFile ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10B981', fontWeight: 600, fontSize: '13px' }}>
                  <CheckCircle2 size={16} />
                  <span>{importFile.name}</span>
                </div>
                <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                  {(importFile.size / 1024).toFixed(1)} KB • Click to change file
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <Upload size={24} color="#64748B" />
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#E2E8F0' }}>
                  Drop XLSX or CSV here, or <span style={{ color: '#FF324B', textDecoration: 'underline' }}>browse</span>
                </div>
                <div style={{ fontSize: '10px', color: '#64748B' }}>
                  Fast local parser • Max 25 MB
                </div>
              </div>
            )}
          </div>

          {/* Form and Action Buttons */}
          <form onSubmit={handleImportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Recognized Data Fields Tag Strip */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap', fontSize: '10px', color: '#94A3B8' }}>
              <span style={{ fontWeight: 600, color: '#CBD5E1' }}>Parsed Fields:</span>
              <span style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '2px 5px', borderRadius: '3px' }}>✓ College Name</span>
              <span style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '2px 5px', borderRadius: '3px' }}>✓ Official Emails</span>
              <span style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '2px 5px', borderRadius: '3px' }}>✓ District / City</span>
              <span style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '2px 5px', borderRadius: '3px' }}>✓ Website</span>
              <span style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '2px 5px', borderRadius: '3px' }}>✓ Leadership Contact</span>
            </div>

            {/* Submit Action Strip */}
            <div style={{ display: 'flex', gap: '8px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <button
                type="button"
                onClick={() => setShowInputPanel(false)}
                className="btn btn-secondary btn-sm"
                style={{ flex: '1' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={importing || !importFile}
                className="btn btn-primary btn-sm"
                style={{ flex: '2', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                {importing ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    {importMode === 'upsert' ? <RefreshCw size={13} /> : <Upload size={13} />}
                    <span>{importMode === 'upsert' ? 'Run Sync & Update' : 'Run Fresh Import'}</span>
                  </>
                )}
              </button>
            </div>

            {/* Result Summary Bar if Import Completed */}
            {importResult && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '8px',
                padding: '10px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                <div style={{ fontSize: '11px', color: '#E2E8F0', lineHeight: 1.4 }}>
                  ✓ <strong>Completed:</strong> Saved {importResult.stats.totalProcessed ?? importResult.stats.inserted} colleges ({importResult.stats.inserted} new added, {importResult.stats.updated || 0} updated, {importResult.stats.skippedDuplicates || 0} duplicates skipped).
                </div>
                <button
                  type="button"
                  onClick={() => { setImportResult(null); setImportFile(null); setShowInputPanel(false); }}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '10px', padding: '3px 8px', alignSelf: 'flex-start' }}
                >
                  Close Drawer
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    )}

      {/* Stats Summary Bar */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
        gap: '12px', 
        background: 'var(--bg-card)', 
        padding: '16px 20px', 
        borderRadius: 'var(--radius-md)', 
        border: '1px solid var(--border-subtle)' 
      }}>
        <div>
          <span style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase' }}>Total Institutions</span>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF' }}>{total}</div>
        </div>
        <div>
          <span style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase' }}>Colleges Contacted</span>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#10B981' }}>{stats.sent || 0}</div>
        </div>
        <div>
          <span style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase' }}>Pending Uncontacted</span>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#F59E0B' }}>{stats.uncontacted || 0}</div>
        </div>
        <div>
          <span style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase' }}>Covered Cities</span>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#06B6D4' }}>{cities.length}</div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
          
          {/* Search Box */}
          <div style={{ flex: '1', minWidth: '260px', position: 'relative' }}>
            <input
              type="text"
              placeholder="Search college name, email, department, contact person..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="form-input"
              style={{ paddingLeft: '38px', fontSize: '13px' }}
            />
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
          </div>

          {/* City Filter */}
          <div style={{ width: '200px' }}>
            <select
              value={selectedCity}
              onChange={(e) => { setSelectedCity(e.target.value); setPage(1); }}
              className="form-select"
              style={{ fontSize: '13px' }}
            >
              <option value="all">All Odisha Cities ({cities.length})</option>
              {cities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ width: '170px' }}>
            <select
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
              className="form-select"
              style={{ fontSize: '13px' }}
            >
              <option value="all">All Outreach Status</option>
              <option value="uncontacted">Uncontacted Only</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Role / Department Filter */}
          <div style={{ width: '190px' }}>
            <select
              value={selectedDepartment}
              onChange={(e) => { setSelectedDepartment(e.target.value); setPage(1); }}
              className="form-select"
              style={{ fontSize: '13px' }}
            >
              <option value="all">All Roles &amp; Staff</option>
              <option value="principal">👑 Principals &amp; Leadership</option>
              <option value="hod">🎓 HODs (Head of Dept)</option>
              <option value="faculty">🔬 Faculty &amp; Staff</option>
              <option value="admin">🏢 Administration / General</option>
            </select>
          </div>

          {/* Reset Filters */}
          {(search || selectedCity !== 'all' || selectedStatus !== 'all' || selectedDepartment !== 'all') && (
            <button
              onClick={() => { setSearch(''); setSelectedCity('all'); setSelectedStatus('all'); setSelectedDepartment('all'); setPage(1); }}
              className="btn btn-secondary btn-sm"
              title="Reset Filters"
            >
              <RefreshCw size={12} />
              <span>Reset</span>
            </button>
          )}

          {/* Quick Launch Campaign Link */}
          <Link
            href="/campaigns"
            className="btn btn-primary btn-sm"
            style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Send size={13} />
            <span>Automated Campaigns →</span>
          </Link>

        </div>
      </div>

      {/* ================= AUTO SEPARATE BATCH SYSTEM WITH APPLIED FILTERS ================= */}
      {total > 0 && (
        <div style={{
          background: 'linear-gradient(180deg, rgba(31, 73, 125, 0.12) 0%, rgba(15, 23, 42, 0.3) 100%)',
          border: '1px solid rgba(56, 189, 248, 0.2)',
          borderRadius: '8px',
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} color="#38BDF8" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Auto Batch Partitioning (Filtered Leads)
              </span>
              <span style={{ fontSize: '12px', color: '#94A3B8' }}>
                • {total} matching colleges split into {totalPages} batches ({batchSize} per batch)
              </span>
            </div>

            {/* Batch Size Selector Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: '#64748B' }}>Batch Size:</span>
              {[25, 50, 100, 200].map(sz => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => { setBatchSize(sz); setPage(1); }}
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

          {/* Interactive Batch Pills Ribbon */}
          <div style={{
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            paddingBottom: '4px',
            scrollbarWidth: 'thin'
          }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((batchNum) => {
              const isActive = page === batchNum;
              const startIdx = (batchNum - 1) * batchSize + 1;
              const endIdx = Math.min(batchNum * batchSize, total);

              return (
                <button
                  key={batchNum}
                  type="button"
                  onClick={() => setPage(batchNum)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    minWidth: '115px',
                    cursor: 'pointer',
                    border: isActive ? '1px solid #FF324B' : '1px solid rgba(255, 255, 255, 0.08)',
                    background: isActive ? 'rgba(255, 50, 75, 0.18)' : 'rgba(15, 23, 42, 0.6)',
                    color: isActive ? '#FFFFFF' : '#94A3B8',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ fontSize: '11px', fontWeight: 700, color: isActive ? '#FF6B7E' : '#E2E8F0' }}>
                    Batch #{batchNum}
                  </span>
                  <span style={{ fontSize: '10px', color: '#64748B', marginTop: '2px' }}>
                    Leads {startIdx}–{endIdx}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Batch Quick Action Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px',
            paddingTop: '6px',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)'
          }}>
            <span style={{ fontSize: '12px', color: '#94A3B8' }}>
              Currently viewing <strong>Batch #{page}</strong> (leads {Math.min((page - 1) * batchSize + 1, total)} to {Math.min(page * batchSize, total)} of {total})
            </span>
            <Link
              href="/campaigns"
              className="btn btn-primary btn-sm"
              style={{ fontSize: '11px', padding: '4px 12px' }}
            >
              <Send size={12} />
              <span>Launch Outreach with Batch #{page} →</span>
            </Link>
          </div>
        </div>
      )}

      {/* Colleges Data Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>College &amp; Location</th>
              <th>Official Website</th>
              <th>Department / Contact</th>
              <th>Official Email Address</th>
              <th>Outreach Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '48px 20px', color: '#94A3B8' }}>
                  <RefreshCw size={24} className="animate-spin" style={{ color: '#FF324B', margin: '0 auto 12px' }} />
                  <div>Loading Odisha Colleges Database...</div>
                </td>
              </tr>
            ) : colleges.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '52px 20px', color: '#94A3B8' }}>
                  {total === 0 ? (
                    <div>
                      <GraduationCap size={40} style={{ color: '#64748B', margin: '0 auto 12px' }} />
                      <div style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF' }}>Database is Clean &amp; Ready</div>
                      <div style={{ fontSize: '13px', color: '#94A3B8', maxWidth: '420px', margin: '6px auto 16px' }}>
                        No colleges are currently in the database. Use the input panel above to upload your official Odisha colleges spreadsheet (.xlsx or .csv).
                      </div>
                      <button 
                        onClick={() => setShowInputPanel(true)} 
                        className="btn btn-primary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Upload size={14} />
                        <span>Open Dataset Input Panel</span>
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Search size={36} style={{ color: '#64748B', margin: '0 auto 12px' }} />
                      <div style={{ fontSize: '15px', fontWeight: 600, color: '#FFFFFF' }}>No Matching Colleges Found</div>
                      <div style={{ fontSize: '13px', marginTop: '4px' }}>
                        Try adjusting your search query, city filter, or role filter.
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              colleges.map((col) => (
                <tr key={col.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#FFFFFF' }}>{col.college_name}</div>
                    <div style={{ fontSize: '12px', color: '#94A3B8' }}>
                      {col.city}, {col.state}
                    </div>
                  </td>
                  <td>
                    {col.website_url ? (
                      <a 
                        href={col.website_url} 
                        target="_blank" 
                        rel="noreferrer" 
                        style={{ color: '#06B6D4', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                      >
                        <span>{col.website_url.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
                        <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span style={{ color: '#64748B' }}>Not listed</span>
                    )}
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{col.contact_person || 'Coordinator / Principal'}</div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>{col.department || 'Academic & Student Affairs'}</div>
                  </td>
                  <td>
                    <div style={{ fontFamily: 'monospace', color: '#FF6B7E', fontWeight: 600 }}>
                      {col.email}
                    </div>
                  </td>
                  <td>
                    <span className={`status-pill ${col.status}`}>
                      {col.status}
                    </span>
                    {col.last_contacted_at && (
                      <div style={{ fontSize: '10px', color: '#64748B', marginTop: '3px' }}>
                        {new Date(col.last_contacted_at).toLocaleDateString('en-IN')}
                      </div>
                    )}
                  </td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      {/* Send Customized Direct Email */}
                      <Link
                        href={`/manual-send?name=${encodeURIComponent(col.college_name)}&email=${encodeURIComponent(col.email)}&city=${encodeURIComponent(col.city)}&dept=${encodeURIComponent(col.department || '')}&contact=${encodeURIComponent(col.contact_person || '')}&web=${encodeURIComponent(col.website_url || '')}`}
                        className="btn btn-secondary btn-sm"
                        title="Send Customized Email"
                        style={{ padding: '6px 8px' }}
                      >
                        <Send size={13} color="#FF324B" />
                      </Link>

                      {/* Edit */}
                      <button
                        onClick={() => { setCurrentEdit(col); setShowEditModal(true); }}
                        className="btn btn-secondary btn-sm"
                        title="Edit Details"
                        style={{ padding: '6px 8px' }}
                      >
                        <Edit2 size={13} />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(col.id, col.college_name)}
                        className="btn btn-danger btn-sm"
                        title="Delete Record"
                        style={{ padding: '6px 8px' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
          <span style={{ fontSize: '13px', color: '#94A3B8' }}>
            Showing page {page} of {totalPages} ({total} colleges total)
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="btn btn-secondary btn-sm"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="btn btn-secondary btn-sm"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD SINGLE COLLEGE */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-window">
            <div className="modal-header">
              <div className="card-title">
                <Building size={18} color="#FF324B" />
                <span>Add Official Odisha College</span>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">
                      College Name <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Utkal University"
                      value={formData.college_name}
                      onChange={(e) => setFormData({ ...formData, college_name: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      City <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bhubaneswar"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      State
                    </label>
                    <input
                      type="text"
                      value={formData.state}
                      disabled
                      className="form-input"
                      style={{ opacity: 0.7 }}
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">
                      Official College Email Address <span className="required">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. registrar@utkaluniversity.ac.in"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="form-input"
                    />
                    <div className="form-hint">Must be an official email from the college's verified website.</div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Official Website URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://utkaluniversity.ac.in"
                      value={formData.website_url}
                      onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Source Page URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://utkaluniversity.ac.in/contact-us"
                      value={formData.source_page_url}
                      onChange={(e) => setFormData({ ...formData, source_page_url: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Department
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Department of Mass Media / Dean Student Affairs"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Contact Person
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. S. K. Nayak"
                      value={formData.contact_person}
                      onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Notes</label>
                    <textarea
                      rows={2}
                      placeholder="Optional notes or details"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="form-textarea"
                    />
                  </div>

                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  <Plus size={14} />
                  <span>Save College</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: UPLOAD ODISHA DATASET (CSV / EXCEL / TEXT) WITH DE-DUPLICATION */}
      {showImportModal && (
        <div className="modal-backdrop">
          <div className="modal-window" style={{ maxWidth: '720px' }}>
            <div className="modal-header">
              <div className="card-title">
                <Upload size={18} color="#FF324B" />
                <span>Upload Odisha Colleges Dataset</span>
              </div>
              <button 
                onClick={() => setShowImportModal(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleImportSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                <div className="alert-box info">
                  <FileSpreadsheet size={18} />
                  <div>
                    <strong>Smart Dataset Sync:</strong> Upload your official Odisha colleges file. 
                    New colleges are added, and any existing colleges are updated with the latest contacts and website details.
                  </div>
                </div>

                {/* Import Mode Selection */}
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <label className="form-label" style={{ marginBottom: '8px', fontWeight: 600 }}>Import Action Mode</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                      <input 
                        type="radio" 
                        name="importMode" 
                        value="upsert" 
                        checked={importMode === 'upsert'} 
                        onChange={() => setImportMode('upsert')} 
                      />
                      <span><strong>Sync &amp; Update Directory</strong> (Recommended) — Save new colleges and update existing colleges with this file's data</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                      <input 
                        type="radio" 
                        name="importMode" 
                        value="replace" 
                        checked={importMode === 'replace'} 
                        onChange={() => setImportMode('replace')} 
                      />
                      <span><strong>Fresh Import (Replace All)</strong> — Wipe the existing directory and import all 1000+ colleges fresh from this spreadsheet</span>
                    </label>
                  </div>
                </div>

                {/* File picker */}
                <div className="form-group">
                  <label className="form-label">Select Excel (.xlsx, .xls) or CSV File</label>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv,.txt"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    className="form-input"
                    style={{ padding: '8px' }}
                  />
                  <div className="form-hint">Upload an official Odisha colleges spreadsheet (.xlsx, .xls) or .csv file.</div>
                </div>

                <div style={{ textAlign: 'center', color: '#64748B', fontSize: '12px', margin: '-4px 0' }}>
                  — OR PASTE RAW CSV CONTENT DIRECTLY —
                </div>

                {/* Direct Paste */}
                <div className="form-group">
                  <label className="form-label">Paste CSV Rows</label>
                  <textarea
                    rows={5}
                    placeholder="State,City,College Name,Official website URL,Department,Contact Person,Official email address,Source page URL&#10;Odisha,Bhubaneswar,Example College,https://example.ac.in,Computer Science,Prof. Sen,contact@example.ac.in,https://example.ac.in/contact"
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    className="form-textarea"
                    style={{ fontFamily: 'monospace', fontSize: '12px' }}
                  />
                </div>

                {/* Import Result Feedback */}
                {importResult && (
                  <div style={{ background: 'rgba(7, 9, 14, 0.8)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#10B981', marginBottom: '8px' }}>
                      Import Summary
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', fontSize: '12px' }}>
                      <div>Total Rows: <strong>{importResult.stats.totalRows}</strong></div>
                      <div>Colleges Saved: <strong style={{ color: '#10B981' }}>{importResult.stats.totalProcessed ?? (importResult.stats.inserted + (importResult.stats.updated || 0))}</strong></div>
                      <div>New Added: <strong style={{ color: '#38BDF8' }}>{importResult.stats.inserted}</strong></div>
                      <div>Updated from File: <strong style={{ color: '#A78BFA' }}>{importResult.stats.updated || 0}</strong></div>
                    </div>
                    {importResult.stats.skippedDuplicates > 0 && (
                      <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '6px' }}>
                        Note: {importResult.stats.skippedDuplicates} row(s) inside this file shared identical emails and were de-duplicated.
                      </div>
                    )}
                  </div>
                )}

              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="btn btn-secondary"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={importing}
                  className="btn btn-primary"
                >
                  {importing ? (
                    <span>Processing &amp; Saving...</span>
                  ) : (
                    <>
                      <Upload size={14} />
                      <span>Upload &amp; Sync Dataset</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EDIT COLLEGE */}
      {showEditModal && currentEdit && (
        <div className="modal-backdrop">
          <div className="modal-window">
            <div className="modal-header">
              <div className="card-title">
                <Edit2 size={18} color="#FF324B" />
                <span>Edit College Details</span>
              </div>
              <button 
                onClick={() => setShowEditModal(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">College Name</label>
                    <input
                      type="text"
                      required
                      value={currentEdit.college_name}
                      onChange={(e) => setCurrentEdit({ ...currentEdit, college_name: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input
                      type="text"
                      required
                      value={currentEdit.city}
                      onChange={(e) => setCurrentEdit({ ...currentEdit, city: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">State</label>
                    <input
                      type="text"
                      value={currentEdit.state}
                      onChange={(e) => setCurrentEdit({ ...currentEdit, state: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Official Email</label>
                    <input
                      type="email"
                      required
                      value={currentEdit.email}
                      onChange={(e) => setCurrentEdit({ ...currentEdit, email: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Website URL</label>
                    <input
                      type="url"
                      value={currentEdit.website_url || ''}
                      onChange={(e) => setCurrentEdit({ ...currentEdit, website_url: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Source URL</label>
                    <input
                      type="url"
                      value={currentEdit.source_page_url || ''}
                      onChange={(e) => setCurrentEdit({ ...currentEdit, source_page_url: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <input
                      type="text"
                      value={currentEdit.department || ''}
                      onChange={(e) => setCurrentEdit({ ...currentEdit, department: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Contact Person</label>
                    <input
                      type="text"
                      value={currentEdit.contact_person || ''}
                      onChange={(e) => setCurrentEdit({ ...currentEdit, contact_person: e.target.value })}
                      className="form-input"
                    />
                  </div>

                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Update Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
