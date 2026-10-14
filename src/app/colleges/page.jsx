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
  Building
} from 'lucide-react';

export default function CollegesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [colleges, setColleges] = useState([]);
  const [total, setTotal] = useState(0);
  const [cities, setCities] = useState([]);
  const [stats, setStats] = useState({ total: 0, sent: 0, uncontacted: 0, failed: 0 });
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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
        page: String(page),
        limit: '25',
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
  }, [status, search, selectedCity, selectedStatus, page]);

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

        res = await fetch('/api/colleges/import', {
          method: 'POST',
          body: formData,
        });
      } else if (importText && importText.trim()) {
        res = await fetch('/api/colleges/import', {
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
        setAlert({ 
          type: 'success', 
          message: `Import complete: ${stats.inserted ?? 0} new colleges imported, ${stats.skippedDuplicates ?? 0} duplicates prevented (${stats.totalRows ?? 0} total rows processed).` 
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
            <span className="role-badge admin">Requirement 1</span>
            <span style={{ fontSize: '12px', color: '#64748B' }}>State: Odisha • Official Websites Only</span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#FFFFFF' }}>
            College Contact Details &amp; Directory
          </h1>
          <p style={{ fontSize: '14px', color: '#94A3B8', marginTop: '2px' }}>
            Maintain verified official college emails, websites, departments, and source links.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => { setShowImportModal(true); setImportResult(null); }}
            className="btn btn-secondary btn-sm"
          >
            <Upload size={14} />
            <span>Upload Odisha Dataset</span>
          </button>

          <button 
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary btn-sm"
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
          <div style={{ width: '180px' }}>
            <select
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
              className="form-select"
              style={{ fontSize: '13px' }}
            >
              <option value="all">All Outreach Status</option>
              <option value="uncontacted">Uncontacted</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Reset Filters */}
          {(search || selectedCity !== 'all' || selectedStatus !== 'all') && (
            <button
              onClick={() => { setSearch(''); setSelectedCity('all'); setSelectedStatus('all'); setPage(1); }}
              className="btn btn-secondary btn-sm"
              title="Reset Filters"
            >
              <RefreshCw size={12} />
              <span>Reset</span>
            </button>
          )}

        </div>
      </div>

      {/* Colleges Data Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>College &amp; Location</th>
              <th>Official Website</th>
              <th>Department / Contact</th>
              <th>Official Email Address</th>
              <th>Source URL</th>
              <th>Outreach Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '48px 20px', color: '#94A3B8' }}>
                  <RefreshCw size={24} className="animate-spin" style={{ color: '#FF324B', margin: '0 auto 12px' }} />
                  <div>Loading Odisha Colleges Database...</div>
                </td>
              </tr>
            ) : colleges.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '48px 20px', color: '#94A3B8' }}>
                  <GraduationCap size={36} style={{ color: '#64748B', margin: '0 auto 12px' }} />
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#FFFFFF' }}>No Colleges Found</div>
                  <div style={{ fontSize: '13px', marginTop: '4px' }}>Try adjusting your search query or upload the official dataset.</div>
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
                    {col.source_page_url ? (
                      <a 
                        href={col.source_page_url} 
                        target="_blank" 
                        rel="noreferrer" 
                        style={{ color: '#94A3B8', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontSize: '12px' }}
                      >
                        <span>Official Source</span>
                        <ExternalLink size={11} />
                      </a>
                    ) : (
                      <span style={{ color: '#64748B', fontSize: '12px' }}>Verified</span>
                    )}
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
                    <strong>Automated De-Duplication Active:</strong> The engine automatically parses headers 
                    (State, City, College Name, Official website URL, Department or contact person, Official email address, Source page URL) 
                    and skips any colleges whose official email is already present in your database.
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
                    rows={6}
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
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', fontSize: '13px' }}>
                      <div>Total Rows: <strong>{importResult.stats.totalRows}</strong></div>
                      <div>New Added: <strong style={{ color: '#10B981' }}>{importResult.stats.inserted}</strong></div>
                      <div>Duplicates Skipped: <strong style={{ color: '#F59E0B' }}>{importResult.stats.skippedDuplicates}</strong></div>
                    </div>
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
                    <span>Validating &amp; Importing...</span>
                  ) : (
                    <>
                      <Upload size={14} />
                      <span>Process &amp; Deduplicate Dataset</span>
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
