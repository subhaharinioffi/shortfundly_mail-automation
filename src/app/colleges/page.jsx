'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Search, 
  RefreshCw, 
  ExternalLink, 
  Copy, 
  Check, 
  Mail, 
  MapPin, 
  Globe, 
  AlertCircle,
  Building,
  CheckCircle2,
  Clock,
  Filter,
  ArrowRight,
  Send
} from 'lucide-react';

export default function CollegeDirectoryPage() {
  const [colleges, setColleges] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [crawling, setCrawling] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Filters State
  const [country, setCountry] = useState('India');
  const [state, setState] = useState('all');
  const [district, setDistrict] = useState('all');
  const [role, setRole] = useState('all');
  const [search, setSearch] = useState('');

  // Dropdown options
  const [availableStates, setAvailableStates] = useState([]);
  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [countriesList, setCountriesList] = useState([]);

  // Toast Notice State
  const [toastMessage, setToastMessage] = useState(null);
  const [copiedEmail, setCopiedEmail] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch filter options dynamically
  const fetchFilters = useCallback(async (currentState) => {
    try {
      const url = currentState && currentState !== 'all' 
        ? `/api/colleges/filters?state=${encodeURIComponent(currentState)}` 
        : '/api/colleges/filters';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAvailableStates(data.states || []);
        setAvailableDistricts(data.districts || []);
        if (data.countries) setCountriesList(data.countries);
      }
    } catch (err) {
      console.warn('Failed to fetch dynamic filter options:', err);
    }
  }, []);

  // Fetch colleges list
  const fetchColleges = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (country && country !== 'all') params.append('country', country);
      if (state && state !== 'all') params.append('state', state);
      if (district && district !== 'all') params.append('district', district);
      if (role && role !== 'all') {
        // Map Placement Cell to Placement Officer for broader match
        const queryRole = role === 'Placement Cell' ? 'Placement' : role;
        params.append('role', queryRole);
      }
      if (search.trim()) params.append('search', search.trim());
      params.append('page', String(page));
      params.append('limit', '25');

      const res = await fetch(`/api/colleges?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setColleges(data.colleges || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error('Error fetching colleges:', err);
      showToast('Could not load college directory. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [country, state, district, role, search, page]);

  // Fetch pending review items count
  const fetchPendingStats = async () => {
    try {
      const res = await fetch('/api/change-requests?status=PENDING');
      if (res.ok) {
        const data = await res.json();
        setPendingCount(data.pendingCount || data.count || 0);
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchFilters('all');
    fetchPendingStats();
  }, [fetchFilters]);

  // When state changes, re-fetch districts for that state
  useEffect(() => {
    fetchFilters(state);
    setDistrict('all');
  }, [state, fetchFilters]);

  // Trigger query when filter values change
  useEffect(() => {
    fetchColleges();
  }, [fetchColleges]);

  // Copy email to clipboard
  const handleCopyEmail = (email, e) => {
    e.stopPropagation();
    if (!email) return;
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    showToast(`Email copied: ${email}`);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  // Run Backend Crawler / Deep Scrape
  const handleCheckForUpdates = async () => {
    setCrawling(true);
    showToast('Checking for website updates via Firecrawl deep scraper...');
    try {
      const res = await fetch('/api/crawler/trigger', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        const detected = data.result?.phase2?.changeRequestsDetected || 0;
        showToast(
          detected > 0
            ? `Check complete! ${detected} update(s) detected and routed to Review Queue.`
            : 'Check complete! All college records are currently up to date.'
        );
        fetchColleges();
        fetchPendingStats();
      } else {
        showToast(`Check failed: ${data.error || 'Server error'}`);
      }
    } catch (err) {
      showToast('Error running update check. Please try again.');
    } finally {
      setCrawling(false);
    }
  };

  const handleResetFilters = () => {
    setCountry('India');
    setState('all');
    setDistrict('all');
    setRole('all');
    setSearch('');
    setPage(1);
  };

  return (
    <div style={{ paddingBottom: '40px' }}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-notice">
          <CheckCircle2 size={18} color="var(--success)" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header-container">
        <div>
          <h1 className="page-title">College Directory</h1>
          <p className="page-subtitle">
            Verified Indian higher education directory with validated administrative staff contacts.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button 
            onClick={handleCheckForUpdates}
            disabled={crawling}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            title="Deep-scrape college websites and identify new or changed emails"
          >
            <RefreshCw size={15} className={crawling ? 'animate-spin' : ''} />
            <span>{crawling ? 'Checking Websites...' : 'Check for Updates'}</span>
          </button>

          <Link 
            href="/approvals" 
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <span>Review Pending Changes</span>
            {pendingCount > 0 && (
              <span className="nav-badge" style={{ marginLeft: 0 }}>
                {pendingCount}
              </span>
            )}
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      {/* Filter Bar Card */}
      <div className="filter-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
            <Filter size={16} color="var(--primary)" />
            <span>Filter Institutions</span>
          </div>
          {(state !== 'all' || district !== 'all' || role !== 'all' || search.trim() !== '') && (
            <button 
              onClick={handleResetFilters}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="filter-grid">
          
          {/* Country Selection */}
          <div className="filter-field">
            <label className="filter-label">Country</label>
            <select 
              value={country} 
              onChange={(e) => { setCountry(e.target.value); setPage(1); }}
              className="filter-select"
            >
              <option value="India">India</option>
              <option value="US" disabled>United States (Coming Soon)</option>
              <option value="UK" disabled>United Kingdom (Coming Soon)</option>
              <option value="CA" disabled>Canada (Coming Soon)</option>
            </select>
          </div>

          {/* State Selection */}
          <div className="filter-field">
            <label className="filter-label">State</label>
            <select 
              value={state} 
              onChange={(e) => { setState(e.target.value); setPage(1); }}
              className="filter-select"
            >
              <option value="all">All States</option>
              {availableStates.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* District Selection */}
          <div className="filter-field">
            <label className="filter-label">District</label>
            <select 
              value={district} 
              onChange={(e) => { setDistrict(e.target.value); setPage(1); }}
              className="filter-select"
              disabled={availableDistricts.length === 0}
            >
              <option value="all">All Districts</option>
              {availableDistricts.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Staff Role Selection */}
          <div className="filter-field">
            <label className="filter-label">Staff Role</label>
            <select 
              value={role} 
              onChange={(e) => { setRole(e.target.value); setPage(1); }}
              className="filter-select"
            >
              <option value="all">All Roles</option>
              <option value="Principal">Principal</option>
              <option value="Dean">Dean</option>
              <option value="Head of Department (HOD)">Head of Department (HOD)</option>
              <option value="Placement Cell">Placement Cell</option>
              <option value="Registrar">Registrar</option>
            </select>
          </div>

          {/* Text Search Input */}
          <div className="filter-field" style={{ gridColumn: 'span 2' }}>
            <label className="filter-label">Search</label>
            <div style={{ position: 'relative' }}>
              <Search 
                size={15} 
                color="var(--text-muted)" 
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} 
              />
              <input 
                type="text" 
                placeholder="Search college name or email..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="filter-input"
                style={{ paddingLeft: '36px' }}
              />
            </div>
          </div>

        </div>
      </div>

      {/* Directory Metrics Strip */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', color: 'var(--text-muted)', fontSize: '13px' }}>
        <div>
          Showing <strong style={{ color: '#ffffff' }}>{colleges.length}</strong> of <strong style={{ color: '#ffffff' }}>{total}</strong> institutions found
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span>Source verification: <strong style={{ color: '#ffffff' }}>Official Portals (AISHE, AICTE, UGC, NIRF)</strong></span>
        </div>
      </div>

      {/* Colleges Data Table */}
      <div className="responsive-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '25%' }}>College Name</th>
              <th style={{ width: '14%' }}>Location (State, District)</th>
              <th style={{ width: '13%' }}>Official Website</th>
              <th style={{ width: '14%' }}>Official Email</th>
              <th style={{ width: '20%' }}>Staff Contacts</th>
              <th style={{ width: '9%', textAlign: 'center' }}>Send Mail</th>
              <th style={{ width: '5%' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                  <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto', display: 'block' }} />
                  Loading college directory data...
                </td>
              </tr>
            ) : colleges.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                  <AlertCircle size={24} style={{ margin: '0 auto 12px auto', display: 'block', color: 'var(--cinema-gold)' }} />
                  No colleges matched the selected filter criteria.
                  <div style={{ marginTop: '8px' }}>
                    <button onClick={handleResetFilters} className="btn btn-secondary btn-sm">
                      Reset Filters
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              colleges.map((col) => {
                const hasPending = col.changeRequests && col.changeRequests.length > 0;
                return (
                  <tr key={col.id}>
                    
                    {/* College Name */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <Building size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: '3px' }} />
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '13.5px', lineHeight: 1.3 }}>
                            {col.collegeName}
                          </div>
                          {col.contactNumber && (
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                              Ph: {col.contactNumber}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Location */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={13} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                        <span>
                          {col.district}, <strong style={{ color: 'var(--text-main)' }}>{col.state}</strong>
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '19px' }}>
                        {col.country}
                      </div>
                    </td>

                    {/* Official Website */}
                    <td>
                      {col.officialWebsite && col.officialWebsite !== '-' ? (
                        <a 
                          href={col.officialWebsite.startsWith('http') ? col.officialWebsite : `https://${col.officialWebsite}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '5px', 
                            color: 'var(--cinema-cyan)', 
                            textDecoration: 'none',
                            fontSize: '12.5px',
                            wordBreak: 'break-all'
                          }}
                          title={col.officialWebsite}
                        >
                          <Globe size={13} style={{ flexShrink: 0 }} />
                          <span>{col.officialWebsite.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}</span>
                          <ExternalLink size={11} style={{ flexShrink: 0 }} />
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Not Listed</span>
                      )}
                    </td>

                    {/* Official Email */}
                    <td>
                      {col.officialEmail ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Mail size={13} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                          <span style={{ fontSize: '12px', wordBreak: 'break-all' }}>{col.officialEmail}</span>
                          <button 
                            onClick={(e) => handleCopyEmail(col.officialEmail, e)}
                            className="contact-copy-btn"
                            title="Copy official email"
                          >
                            {copiedEmail === col.officialEmail ? (
                              <Check size={12} color="var(--success)" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>None</span>
                      )}
                    </td>

                    {/* Staff Contacts (Pills with Copy Buttons) */}
                    <td>
                      {col.contacts && col.contacts.length > 0 ? (
                        <div className="contact-pills-list">
                          {col.contacts.map((contact) => (
                            <span key={contact.id} className="contact-pill" title={`${contact.role}: ${contact.email}`}>
                              <span className="contact-pill-role">{contact.role}:</span>
                              <span style={{ fontSize: '11.5px' }}>{contact.email}</span>
                              <button 
                                onClick={(e) => handleCopyEmail(contact.email, e)}
                                className="contact-copy-btn"
                                title={`Copy ${contact.email}`}
                              >
                                {copiedEmail === contact.email ? (
                                  <Check size={11} color="var(--success)" />
                                ) : (
                                  <Copy size={11} />
                                )}
                              </button>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px', fontStyle: 'italic' }}>
                          No staff emails recorded
                        </span>
                      )}
                    </td>

                    {/* Send Mail CTA Button */}
                    <td style={{ textAlign: 'center' }}>
                      <Link 
                        href={`/manual-send?name=${encodeURIComponent(col.collegeName)}&email=${encodeURIComponent(col.officialEmail || (col.contacts && col.contacts[0] ? col.contacts[0].email : ''))}&city=${encodeURIComponent(col.district)}&web=${encodeURIComponent(col.officialWebsite || '')}`}
                        className="btn btn-primary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', padding: '6px 12px', fontSize: '12px' }}
                        title={`Send outreach email to ${col.collegeName}`}
                      >
                        <Send size={12} />
                        <span>Send Mail</span>
                      </Link>
                    </td>

                    {/* Status */}
                    <td>
                      {hasPending ? (
                        <Link 
                          href="/approvals" 
                          style={{ textDecoration: 'none' }}
                          title="Pending changes detected on website. Click to review."
                        >
                          <span 
                            className="status-pill pending"
                            style={{ cursor: 'pointer', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Clock size={11} />
                            <span>Pending Update</span>
                          </span>
                        </Link>
                      ) : (
                        <span 
                          className="status-pill sent" 
                          style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <CheckCircle2 size={11} />
                          <span>Active</span>
                        </span>
                      )}
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Page {page} of {totalPages}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="btn btn-secondary btn-sm"
            >
              Previous Page
            </button>
            <button 
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="btn btn-secondary btn-sm"
            >
              Next Page
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
