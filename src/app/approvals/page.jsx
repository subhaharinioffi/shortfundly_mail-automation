'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  ClipboardCheck, 
  Check, 
  X, 
  ExternalLink, 
  RefreshCw, 
  Building, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  ArrowLeft
} from 'lucide-react';

export default function ApprovalsPage() {
  const [requests, setRequests] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('PENDING'); // PENDING, APPROVED, REJECTED, all
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch change requests from review queue
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/change-requests?status=${statusFilter}`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data.changeRequests || []);
        setSelectedIds([]);
      }
    } catch (err) {
      console.error('Error fetching review queue:', err);
      showToast('Could not load review requests. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Handle Select All Checkbox
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(requests.map((r) => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  // Toggle individual selection
  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Submit Review Action (Single or Bulk)
  const handleReviewAction = async (action, targetIds) => {
    if (!targetIds || targetIds.length === 0) return;
    setProcessing(true);

    try {
      const res = await fetch('/api/change-requests/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestIds: targetIds,
          action,
          reviewerName: 'Admin Staff Reviewer',
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(data.message || `Successfully processed ${targetIds.length} item(s).`);
        fetchRequests();
      } else {
        showToast(`Error: ${data.error || 'Failed to process action'}`);
      }
    } catch (err) {
      console.error('Review submit error:', err);
      showToast('Encountered an unexpected error while submitting review.');
    } finally {
      setProcessing(false);
    }
  };

  // Map changeType to human-friendly badge label
  const renderUpdateTypeBadge = (type) => {
    switch (type) {
      case 'NEW_STAFF_FOUND':
        return <span className="update-type-badge new-staff">New Staff Member</span>;
      case 'STAFF_EMAIL_CHANGED':
        return <span className="update-type-badge email-change">Email Change</span>;
      case 'OFFICIAL_EMAIL_CHANGED':
        return <span className="update-type-badge email-change">Official Email Change</span>;
      case 'WEBSITE_CHANGED':
        return <span className="update-type-badge website-change">Website Updated</span>;
      case 'NEW_COLLEGE_FOUND':
        return <span className="update-type-badge new-staff">New Institution</span>;
      default:
        return <span className="update-type-badge">{type}</span>;
    }
  };

  // Format detected date
  const formatDate = (dateString) => {
    if (!dateString) return 'Just now';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const isAllSelected = requests.length > 0 && selectedIds.length === requests.length;

  return (
    <div style={{ paddingBottom: '40px' }}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-notice">
          <CheckCircle2 size={18} color="var(--success)" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="page-header-container">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Link 
              href="/colleges" 
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '13px' }}
            >
              <ArrowLeft size={14} />
              <span>Back to Directory</span>
            </Link>
          </div>
          <h1 className="page-title">Website Change Requests</h1>
          <p className="page-subtitle">
            Review and approve updates automatically found on college websites.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            onClick={fetchRequests} 
            disabled={loading || processing}
            className="btn btn-secondary btn-sm"
            title="Refresh review queue"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs (Pending Review / Approved History / Rejected History) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        <button
          onClick={() => setStatusFilter('PENDING')}
          className={`btn btn-sm ${statusFilter === 'PENDING' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <span>Pending Review</span>
          {statusFilter === 'PENDING' && requests.length > 0 && (
            <span style={{ background: '#ffffff', color: '#ff324b', padding: '1px 6px', borderRadius: '10px', fontSize: '11px', fontWeight: 800 }}>
              {requests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setStatusFilter('APPROVED')}
          className={`btn btn-sm ${statusFilter === 'APPROVED' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <span>Approved History</span>
        </button>

        <button
          onClick={() => setStatusFilter('REJECTED')}
          className={`btn btn-sm ${statusFilter === 'REJECTED' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <span>Rejected History</span>
        </button>

        <button
          onClick={() => setStatusFilter('all')}
          className={`btn btn-sm ${statusFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <span>All Records</span>
        </button>
      </div>

      {/* Action Bar (Bulk Approve / Reject for Pending items) */}
      {statusFilter === 'PENDING' && (
        <div className="action-bar-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13.5px', color: 'var(--text-main)' }}>
            <span style={{ fontWeight: 600 }}>
              {selectedIds.length > 0 ? (
                <span><strong>{selectedIds.length}</strong> update item(s) selected</span>
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>Select items below for bulk review:</span>
              )}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => handleReviewAction('APPROVE', selectedIds)}
              disabled={selectedIds.length === 0 || processing}
              className="btn-approve-solid"
              title="Apply selected updates to the verified college directory"
            >
              <Check size={16} />
              <span>Approve Selected {selectedIds.length > 0 && `(${selectedIds.length})`}</span>
            </button>

            <button
              onClick={() => handleReviewAction('REJECT', selectedIds)}
              disabled={selectedIds.length === 0 || processing}
              className="btn-reject-subtle"
              title="Reject selected updates without changing live data"
            >
              <X size={16} />
              <span>Reject Selected {selectedIds.length > 0 && `(${selectedIds.length})`}</span>
            </button>
          </div>
        </div>
      )}

      {/* Review Table */}
      <div className="responsive-table-container">
        <table className="data-table">
          <thead>
            <tr>
              {statusFilter === 'PENDING' && (
                <th style={{ width: '40px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    disabled={requests.length === 0}
                    className="custom-checkbox"
                    title="Select all"
                  />
                </th>
              )}
              <th style={{ width: '22%' }}>College & Location</th>
              <th style={{ width: '13%' }}>Update Type</th>
              <th style={{ width: '14%' }}>Role / Department</th>
              <th style={{ width: '16%' }}>Current Info</th>
              <th style={{ width: '17%' }}>New Found Info</th>
              <th style={{ width: '10%' }}>Found On</th>
              <th style={{ width: '9%' }}>Detected Date</th>
              {statusFilter === 'PENDING' && (
                <th style={{ width: '90px', textAlign: 'center' }}>Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                  <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto', display: 'block' }} />
                  Loading change requests...
                </td>
              </tr>
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                  <CheckCircle2 size={32} color="var(--success)" style={{ margin: '0 auto 12px auto', display: 'block' }} />
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>
                    No Pending Website Changes
                  </div>
                  <div>All college staff contacts and websites are verified and currently up to date.</div>
                  <div style={{ marginTop: '16px' }}>
                    <Link href="/colleges" className="btn btn-secondary btn-sm">
                      Go to College Directory
                    </Link>
                  </div>
                </td>
              </tr>
            ) : (
              requests.map((req) => {
                const isSelected = selectedIds.includes(req.id);
                const college = req.college || {};

                return (
                  <tr 
                    key={req.id}
                    style={{ background: isSelected ? 'rgba(255, 50, 75, 0.05)' : undefined }}
                  >
                    {/* Checkbox */}
                    {statusFilter === 'PENDING' && (
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(req.id)}
                          className="custom-checkbox"
                        />
                      </td>
                    )}

                    {/* College & Location */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <Building size={15} color="var(--primary)" style={{ flexShrink: 0, marginTop: '3px' }} />
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '13.5px', lineHeight: 1.3 }}>
                            {college.collegeName || 'Unknown College'}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            <MapPin size={11} />
                            <span>{college.district}, {college.state}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Update Type */}
                    <td>
                      {renderUpdateTypeBadge(req.changeType)}
                    </td>

                    {/* Role / Department */}
                    <td>
                      <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '13px' }}>
                        {req.staffRole || 'General Administration'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Field: {req.fieldName}
                      </div>
                    </td>

                    {/* Current Info (Red background or strikethrough) */}
                    <td>
                      {req.oldValue ? (
                        <span className="diff-old-value" title={`Original Value: ${req.oldValue}`}>
                          {req.oldValue}
                        </span>
                      ) : (
                        <span className="diff-empty-value">None (New)</span>
                      )}
                    </td>

                    {/* New Found Info (Clean bold green) */}
                    <td>
                      <span className="diff-new-value" title={`Detected New Value: ${req.newValue}`}>
                        {req.newValue}
                      </span>
                    </td>

                    {/* Found On (Clickable contact page link) */}
                    <td>
                      {req.sourceUrl ? (
                        <a
                          href={req.sourceUrl.startsWith('http') ? req.sourceUrl : `https://${req.sourceUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: 'var(--cinema-cyan)',
                            textDecoration: 'none',
                            fontSize: '12px',
                          }}
                          title={`Detected on: ${req.sourceUrl}`}
                        >
                          <span>Contact Page</span>
                          <ExternalLink size={11} />
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Official Website</span>
                      )}
                    </td>

                    {/* Detected Date */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-muted)' }}>
                        <Clock size={12} />
                        <span>{formatDate(req.detectedAt)}</span>
                      </div>
                    </td>

                    {/* Actions (Approve / Reject Quick Buttons) */}
                    {statusFilter === 'PENDING' && (
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            onClick={() => handleReviewAction('APPROVE', [req.id])}
                            disabled={processing}
                            className="btn-action-icon approve"
                            title="Approve this update and commit to directory"
                          >
                            <Check size={15} />
                          </button>
                          <button
                            onClick={() => handleReviewAction('REJECT', [req.id])}
                            disabled={processing}
                            className="btn-action-icon reject"
                            title="Reject this update"
                          >
                            <X size={15} />
                          </button>
                        </div>
                      </td>
                    )}

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
