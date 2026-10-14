'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Activity, 
  Search, 
  Filter, 
  RefreshCw, 
  Eye, 
  RotateCw, 
  Trash2, 
  MailCheck, 
  AlertTriangle, 
  CheckCircle2, 
  CopyX, 
  Clock, 
  ExternalLink, 
  X,
  FileText
} from 'lucide-react';
import { FilmstripIcon, PlayCinemaIcon } from '@/components/Icons';

export default function LogsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ total: 0, sent: 0, failed: 0, skipped_duplicate: 0 });
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals & Feedback
  const [viewLogModal, setViewLogModal] = useState(null);
  const [retryingId, setRetryingId] = useState(null);
  const [alert, setAlert] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        status: statusFilter,
        page: String(page),
        limit: '25',
      });
      const res = await fetch(`/api/logs?${params.toString()}`);
      const data = await res.json();

      if (res.ok) {
        setLogs(data.logs || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        setStats(data.stats || { total: 0, sent: 0, failed: 0, skipped_duplicate: 0 });
      }
    } catch (err) {
      console.error('Failed to load logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchLogs();
    }
  }, [status, search, statusFilter, page]);

  // Retry a failed email
  const handleRetry = async (logId) => {
    setRetryingId(logId);
    setAlert(null);

    try {
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logId }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setAlert({ type: 'success', message: 'Email retry successfully sent via Google SMTP.' });
        fetchLogs();
      } else {
        setAlert({ type: 'danger', message: data.error || 'Retry attempt failed.' });
      }
    } catch (err) {
      setAlert({ type: 'danger', message: 'Network error during retry attempt.' });
    } finally {
      setRetryingId(null);
    }
  };

  // Delete Log
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this email log record?')) return;
    try {
      const res = await fetch(`/api/logs?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAlert({ type: 'success', message: 'Log record removed.' });
        fetchLogs();
      }
    } catch (err) {
      setAlert({ type: 'danger', message: 'Failed to delete log.' });
    }
  };

  // Clear All
  const handleClearAll = async () => {
    if (!window.confirm('WARNING: Are you sure you want to permanently clear all outreach delivery logs?')) return;
    try {
      const res = await fetch('/api/logs?action=clear_all', { method: 'DELETE' });
      if (res.ok) {
        setAlert({ type: 'success', message: 'All delivery logs cleared.' });
        fetchLogs();
      }
    } catch (err) {
      setAlert({ type: 'danger', message: 'Failed to clear logs.' });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="role-badge admin">Requirement 4</span>
            <span style={{ fontSize: '12px', color: '#64748B' }}>Real-Time Delivery Auditing &amp; Safeguards</span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#FFFFFF' }}>
            Email Status &amp; Delivery Tracking
          </h1>
          <p style={{ fontSize: '14px', color: '#94A3B8', marginTop: '2px' }}>
            Comprehensive audit logs of all sent proposals, failed attempts, and duplicate-shield blocks.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={fetchLogs} 
            className="btn btn-secondary btn-sm"
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
          {total > 0 && (
            <button 
              onClick={handleClearAll} 
              className="btn btn-danger btn-sm"
            >
              <Trash2 size={14} />
              <span>Clear Audit Logs</span>
            </button>
          )}
        </div>
      </div>

      {/* Global Alert Notification */}
      {alert && (
        <div className={`alert-box ${alert.type}`}>
          {alert.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span style={{ flex: 1 }}>{alert.message}</span>
          <button onClick={() => setAlert(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Stats Metric Strip */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '14px', 
        background: 'var(--bg-card)', 
        padding: '16px 20px', 
        borderRadius: 'var(--radius-md)', 
        border: '1px solid var(--border-subtle)' 
      }}>
        <div>
          <span style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase' }}>Total Attempts</span>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#FFFFFF' }}>{total}</div>
        </div>
        <div>
          <span style={{ fontSize: '11px', color: '#34d399', textTransform: 'uppercase' }}>Successfully Sent</span>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#10B981' }}>{stats.sent || 0}</div>
        </div>
        <div>
          <span style={{ fontSize: '11px', color: '#fbbf24', textTransform: 'uppercase' }}>Duplicates Prevented</span>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#F59E0B' }}>{stats.skipped_duplicate || 0}</div>
        </div>
        <div>
          <span style={{ fontSize: '11px', color: '#f87171', textTransform: 'uppercase' }}>Failed / Bounced</span>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#EF4444' }}>{stats.failed || 0}</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
          
          <div style={{ flex: '1', minWidth: '260px', position: 'relative' }}>
            <input
              type="text"
              placeholder="Search college, recipient email, subject, or sender..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="form-input"
              style={{ paddingLeft: '38px', fontSize: '13px' }}
            />
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
          </div>

          <div style={{ width: '220px' }}>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="form-select"
              style={{ fontSize: '13px' }}
            >
              <option value="all">All Delivery Statuses</option>
              <option value="sent">Sent Successfully</option>
              <option value="skipped_duplicate">Duplicate Blocked</option>
              <option value="failed">Failed Delivery</option>
            </select>
          </div>

          {(search || statusFilter !== 'all') && (
            <button
              onClick={() => { setSearch(''); setStatusFilter('all'); setPage(1); }}
              className="btn btn-secondary btn-sm"
            >
              <RefreshCw size={12} />
              <span>Reset</span>
            </button>
          )}

        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Target College</th>
              <th>Official Email</th>
              <th>Subject Line</th>
              <th>Delivery Status</th>
              <th>Dispatched By</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '48px 20px', color: '#94A3B8' }}>
                  <RefreshCw size={24} className="animate-spin" style={{ color: '#FF324B', margin: '0 auto 12px' }} />
                  <div>Loading Transmission Logs...</div>
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '48px 20px', color: '#94A3B8' }}>
                  <Activity size={36} style={{ color: '#64748B', margin: '0 auto 12px' }} />
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#FFFFFF' }}>No Delivery Records</div>
                  <div style={{ fontSize: '13px', marginTop: '4px' }}>
                    Sent outreach emails or duplicate blocks will be tracked here in real-time.
                  </div>
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id}>
                  <td style={{ whiteSpace: 'nowrap', color: '#94A3B8', fontSize: '12px' }}>
                    {new Date(log.sent_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'medium' })}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#FFFFFF' }}>{log.college_name}</div>
                  </td>
                  <td>
                    <div style={{ fontFamily: 'monospace', color: '#FF6B7E', fontSize: '12px' }}>
                      {log.recipient_email}
                    </div>
                  </td>
                  <td style={{ maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {log.subject}
                  </td>
                  <td>
                    <span className={`status-pill ${log.status}`}>
                      {log.status.replace('_', ' ')}
                    </span>
                    {log.error_message && (
                      <div style={{ fontSize: '11px', color: '#EF4444', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '3px' }} title={log.error_message}>
                        {log.error_message}
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ fontSize: '12px', color: '#FFFFFF' }}>{log.sent_by_user}</div>
                    <div style={{ fontSize: '10px', color: '#64748B' }}>{log.sender_name}</div>
                  </td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      
                      {/* View Email Body */}
                      <button
                        onClick={() => setViewLogModal(log)}
                        className="btn btn-secondary btn-sm"
                        title="View Email Message"
                        style={{ padding: '6px 8px' }}
                      >
                        <Eye size={13} />
                      </button>

                      {/* Retry button for failed emails */}
                      {log.status === 'failed' && (
                        <button
                          onClick={() => handleRetry(log.id)}
                          disabled={retryingId === log.id}
                          className="btn btn-primary btn-sm"
                          title="Retry Transmission"
                          style={{ padding: '6px 8px' }}
                        >
                          <RotateCw size={13} className={retryingId === log.id ? 'animate-spin' : ''} />
                        </button>
                      )}

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(log.id)}
                        className="btn btn-secondary btn-sm"
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
            Showing page {page} of {totalPages} ({total} log entries total)
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

      {/* MODAL: VIEW SENT EMAIL CONTENT */}
      {viewLogModal && (
        <div className="modal-backdrop">
          <div className="modal-window" style={{ maxWidth: '720px' }}>
            <div className="modal-header">
              <div>
                <div className="card-title">
                  <FileText size={18} color="#FF324B" />
                  <span>Dispatched Outreach Content</span>
                </div>
                <div className="card-subtitle">
                  Sent to {viewLogModal.college_name} on {new Date(viewLogModal.sent_at).toLocaleString('en-IN')}
                </div>
              </div>
              <button 
                onClick={() => setViewLogModal(null)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={{ background: 'rgba(7, 9, 14, 0.8)', padding: '12px 16px', borderRadius: '8px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div><span style={{ color: '#64748B' }}>To:</span> <strong>{viewLogModal.recipient_email}</strong></div>
                <div><span style={{ color: '#64748B' }}>From:</span> {viewLogModal.sender_name} &lt;{viewLogModal.sender_email}&gt;</div>
                <div><span style={{ color: '#64748B' }}>Subject:</span> <strong style={{ color: '#FFFFFF' }}>{viewLogModal.subject}</strong></div>
                {viewLogModal.message_id && (
                  <div><span style={{ color: '#64748B' }}>Message ID:</span> <span style={{ fontFamily: 'monospace' }}>{viewLogModal.message_id}</span></div>
                )}
                {viewLogModal.error_message && (
                  <div style={{ color: '#EF4444' }}><span>Status Detail:</span> {viewLogModal.error_message}</div>
                )}
              </div>

              <div>
                <label className="form-label">Message Body Delivered:</label>
                <pre style={{ 
                  background: '#07090E', 
                  padding: '16px', 
                  borderRadius: '8px', 
                  fontSize: '12px', 
                  lineHeight: 1.6, 
                  whiteSpace: 'pre-wrap', 
                  fontFamily: 'monospace',
                  color: '#E2E8F0',
                  maxHeight: '360px',
                  overflowY: 'auto',
                  border: '1px solid var(--border-subtle)'
                }}>
                  {viewLogModal.body}
                </pre>
              </div>

            </div>

            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setViewLogModal(null)}
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
