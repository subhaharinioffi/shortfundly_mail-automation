'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  GraduationCap, 
  Send, 
  MailCheck, 
  AlertTriangle, 
  CopyX, 
  FileText, 
  ArrowRight, 
  PenTool, 
  Settings as SettingsIcon, 
  Clock, 
  ShieldCheck, 
  RefreshCw, 
  Upload,
  Crown,
  Users,
  Terminal,
  Lock,
  Download,
  FileSpreadsheet,
  Layers,
  Zap,
  Activity
} from 'lucide-react';
import { FilmstripIcon, ClapperboardIcon, PlayCinemaIcon } from '@/components/Icons';
import { useRole } from '@/context/RoleContext';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const { activeRole } = useRole();
  const router = useRouter();

  const [stats, setStats] = useState({
    totalColleges: 0,
    sentColleges: 0,
    uncontactedColleges: 0,
    failedColleges: 0,
    totalLogs: 0,
    sentLogs: 0,
    failedLogs: 0,
    skippedDuplicates: 0,
    templateCount: 0,
  });
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Colleges Stats
      const colRes = await fetch('/api/colleges?limit=1');
      const colData = await colRes.json();

      // 2. Fetch Logs Stats
      const logRes = await fetch('/api/logs?limit=5');
      const logData = await logRes.json();

      // 3. Fetch Templates
      const tmplRes = await fetch('/api/templates');
      const tmplData = await tmplRes.json();

      setStats({
        totalColleges: colData.stats?.total || colData.total || 0,
        sentColleges: colData.stats?.sent || 0,
        uncontactedColleges: colData.stats?.uncontacted || 0,
        failedColleges: colData.stats?.failed || 0,
        totalLogs: logData.stats?.total || 0,
        sentLogs: logData.stats?.sent || 0,
        failedLogs: logData.stats?.failed || 0,
        skippedDuplicates: logData.stats?.skipped_duplicate || 0,
        templateCount: tmplData.templates?.length || 0,
      });

      setRecentLogs(logData.logs || []);
    } catch (err) {
      console.error('Failed to load dashboard statistics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchDashboardData();
    }
  }, [status, router]);

  if (status === 'loading' || loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <RefreshCw size={28} className="animate-spin" style={{ color: '#FF324B', margin: '0 auto 16px' }} />
        <p style={{ color: '#94A3B8', fontSize: '14px' }}>Loading Outreach Mission Control...</p>
      </div>
    );
  }

  const coveragePercent = stats.totalColleges > 0 
    ? Math.round((stats.sentColleges / stats.totalColleges) * 100) 
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="role-badge admin" style={{ fontSize: '10px' }}>
              Mission Control Active
            </span>
            <span style={{ fontSize: '12px', color: '#64748B' }}>
              State Assigned: Odisha, India
            </span>
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#FFFFFF' }}>
            Welcome back, {session?.user?.name}
          </h1>
          <p style={{ fontSize: '14px', color: '#94A3B8', marginTop: '2px' }}>
            Shortfundly Campus Outreach Engine • Automated College Collaboration Pipeline
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={fetchDashboardData}
            className="btn btn-secondary btn-sm"
            title="Refresh Metrics"
          >
            <RefreshCw size={14} />
            <span>Refresh HUD</span>
          </button>
          <Link href="/campaigns" className="btn btn-primary btn-sm">
            <Send size={14} />
            <span>Launch Batch Send</span>
          </Link>
          <Link href="/manual-send" className="btn btn-outline btn-sm">
            <PenTool size={14} />
            <span>Manual Send</span>
          </Link>
        </div>
      </div>

      {/* Tailored Persona Cockpit Widget */}
      <div 
        style={{
          background: `linear-gradient(135deg, ${activeRole.bgColor} 0%, rgba(15, 23, 42, 0.7) 100%)`,
          border: `1px solid ${activeRole.borderColor}`,
          borderRadius: '12px',
          padding: '20px 24px',
          boxShadow: `0 4px 20px ${activeRole.glowColor}`,
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div 
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: activeRole.color,
                color: '#000000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              {activeRole.id === 'CEO' && <Crown size={20} />}
              {(activeRole.id === 'HR / Outreach Lead' || activeRole.id === 'HR') && <Users size={20} />}
              {activeRole.id === 'Tech Lead' && <Terminal size={20} />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF' }}>
                  {activeRole.viewName}: {activeRole.title} Cockpit
                </span>
                <span className={`role-badge ${activeRole.badgeClass}`} style={{ fontSize: '10px' }}>
                  Live Persona
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#CBD5E1', margin: '2px 0 0 0' }}>
                {activeRole.summary}
              </p>
            </div>
          </div>

          {/* Quick Context Actions */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {activeRole.id === 'CEO' && (
              <>
                <a 
                  href="/Odisha_Colleges_Master_Unique_Directory.xlsx" 
                  download 
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <FileSpreadsheet size={14} color="#F59E0B" />
                  <span>Master Directory (XLSX)</span>
                </a>
                <a 
                  href="/SHORTFUNDLY_CAMPUS_EMAIL_AUTOMATION_DOCUMENTATION.docx" 
                  download 
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Download size={14} color="#F59E0B" />
                  <span>Executive Brief (DOCX)</span>
                </a>
              </>
            )}

            {(activeRole.id === 'HR / Outreach Lead' || activeRole.id === 'HR') && (
              <>
                <Link href="/colleges" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <GraduationCap size={14} color="#10B981" />
                  <span>Institutional Registry</span>
                </Link>
                <Link href="/templates" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={14} color="#10B981" />
                  <span>Template Studio</span>
                </Link>
              </>
            )}

            {activeRole.id === 'Tech Lead' && (
              <>
                <Link href="/settings" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Zap size={14} color="#06B6D4" />
                  <span>SMTP Node Console</span>
                </Link>
                <Link href="/logs" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Activity size={14} color="#06B6D4" />
                  <span>Telemetry Audit</span>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Tailored Focus Strip */}
        {activeRole.id === 'CEO' && (
          <div style={{ background: 'rgba(0, 0, 0, 0.4)', borderRadius: '8px', padding: '12px 16px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#F59E0B', letterSpacing: '0.5px' }}>
                State-Wide Saturation (All 30 Revenue Districts Covered)
              </span>
              <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                1,048 Verified Target Colleges in Odisha
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { name: 'Khordha (Bhubaneswar)', count: 142 },
                { name: 'Cuttack', count: 98 },
                { name: 'Sundargarh (Rourkela)', count: 76 },
                { name: 'Ganjam (Berhampur)', count: 74 },
                { name: 'Balasore', count: 62 },
                { name: 'Mayurbhanj', count: 58 },
                { name: 'Sambalpur', count: 52 },
                { name: '+23 Other Districts', count: 486 },
              ].map((d, i) => (
                <div 
                  key={i} 
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span style={{ color: '#E2E8F0', fontWeight: 500 }}>{d.name}</span>
                  <span style={{ color: '#F59E0B', fontWeight: 700, fontFamily: 'monospace' }}>{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {(activeRole.id === 'HR / Outreach Lead' || activeRole.id === 'HR') && (
          <div style={{ background: 'rgba(0, 0, 0, 0.4)', borderRadius: '8px', padding: '12px 16px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#10B981', letterSpacing: '0.5px' }}>
                Outreach Pipeline Readiness
              </span>
              <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                Hierarchical Contact Routing Active
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <span style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase' }}>Designation Target</span>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF' }}>Principal &amp; T&amp;P Placement Desks</div>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <span style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase' }}>Campaign Pacing</span>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF' }}>Safe 1.5s Google SMTP Delay</div>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <span style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase' }}>Personalization Tags</span>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF' }}>[College Name], [City], [Principal Name]</div>
              </div>
            </div>
          </div>
        )}

        {activeRole.id === 'Tech Lead' && (
          <div style={{ background: 'rgba(0, 0, 0, 0.4)', borderRadius: '8px', padding: '12px 16px', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#06B6D4', letterSpacing: '0.5px' }}>
                System Infrastructure Telemetry
              </span>
              <span style={{ fontSize: '11px', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }} />
                Cluster Healthy
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <span style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase' }}>SMTP Gateway</span>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF' }}>smtp.gmail.com:465 (TLS 1.3 Strict)</div>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <span style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase' }}>Security Layer</span>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF' }}>HMAC-SHA256 Visual CAPTCHA</div>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <span style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase' }}>Storage Engine</span>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF' }}>better-sqlite3 (WAL Mode + /tmp Lambda)</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Metric Cards Grid */}
      <div className="stats-grid">
        
        <div className="stat-card">
          <div className="stat-icon-wrap" style={{ background: 'rgba(255, 50, 75, 0.15)', color: '#FF324B' }}>
            <GraduationCap size={22} />
          </div>
          <div>
            <div className="stat-number">{stats.totalColleges}</div>
            <div className="stat-label">Total Odisha Colleges</div>
          </div>
        </div>

        <div className="stat-card" style={{ borderColor: 'rgba(16, 185, 129, 0.2)' }}>
          <div className="stat-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}>
            <MailCheck size={22} />
          </div>
          <div>
            <div className="stat-number" style={{ color: '#10B981' }}>{stats.sentColleges}</div>
            <div className="stat-label">Colleges Contacted</div>
          </div>
        </div>

        <div className="stat-card" style={{ borderColor: 'rgba(245, 158, 11, 0.2)' }}>
          <div className="stat-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B' }}>
            <Clock size={22} />
          </div>
          <div>
            <div className="stat-number" style={{ color: '#F59E0B' }}>{stats.uncontactedColleges}</div>
            <div className="stat-label">Uncontacted Pipeline</div>
          </div>
        </div>

        <div className="stat-card" style={{ borderColor: 'rgba(6, 182, 212, 0.2)' }}>
          <div className="stat-icon-wrap" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#06B6D4' }}>
            <CopyX size={22} />
          </div>
          <div>
            <div className="stat-number" style={{ color: '#06B6D4' }}>{stats.skippedDuplicates}</div>
            <div className="stat-label">Duplicates Prevented</div>
          </div>
        </div>

      </div>

      {/* Campaign Coverage Progress Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <FilmstripIcon size={18} color="#FF324B" />
              <span>Odisha Outreach Saturation</span>
            </div>
            <div className="card-subtitle">
              Progress towards contacting all institutions across Odisha
            </div>
          </div>
          <span style={{ fontSize: '18px', fontWeight: 800, color: '#FF324B' }}>
            {coveragePercent}%
          </span>
        </div>

        <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '9999px', height: '10px', overflow: 'hidden', marginBottom: '20px' }}>
          <div 
            style={{ 
              width: `${coveragePercent}%`, 
              height: '100%', 
              background: 'linear-gradient(90deg, #FF324B, #FF6B7E)', 
              transition: 'width 0.6s ease' 
            }} 
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', textAlign: 'center', background: 'rgba(7, 9, 14, 0.6)', padding: '14px', borderRadius: '8px' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#94A3B8' }}>Contacted</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#10B981' }}>{stats.sentColleges}</div>
          </div>
          <div style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.08)', borderRight: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: '11px', color: '#94A3B8' }}>Uncontacted</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#F59E0B' }}>{stats.uncontactedColleges}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#94A3B8' }}>Failed Attempts</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: stats.failedColleges > 0 ? '#EF4444' : '#64748B' }}>
              {stats.failedColleges}
            </div>
          </div>
        </div>

        <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
          <Link href="/campaigns" className="btn btn-primary" style={{ flex: 1 }}>
            <Send size={14} />
            <span>Continue Outreach</span>
          </Link>
          <Link href="/colleges" className="btn btn-secondary">
            <Upload size={14} />
            <span>Import Dataset</span>
          </Link>
        </div>
      </div>

      {/* Recent Email Activity Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <MailCheck size={18} color="#FF324B" />
              <span>Recent Delivery Activity</span>
            </div>
            <div className="card-subtitle">
              Live audit record of recently transmitted emails
            </div>
          </div>
          <Link href="/logs" className="btn btn-secondary btn-sm">
            <span>View Full Audit Log</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {recentLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94A3B8' }}>
            <MailCheck size={36} style={{ color: '#64748B', margin: '0 auto 12px' }} />
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFF' }}>No emails dispatched yet.</p>
            <p style={{ fontSize: '13px', marginTop: '4px' }}>
              Launch an automated outreach campaign or send a customized manual email to see records here.
            </p>
            <div style={{ marginTop: '16px' }}>
              <Link href="/campaigns" className="btn btn-primary btn-sm">
                <span>Start First Campaign</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>College Name</th>
                  <th>Recipient Email</th>
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Sender</th>
                </tr>
              </thead>
              <tbody>
                {recentLogs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ whiteSpace: 'nowrap', color: '#94A3B8' }}>
                      {new Date(log.sent_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td style={{ fontWeight: 600 }}>{log.college_name}</td>
                    <td style={{ fontFamily: 'monospace', color: '#94A3B8' }}>{log.recipient_email}</td>
                    <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.subject}
                    </td>
                    <td>
                      <span className={`status-pill ${log.status}`}>
                        {log.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', color: '#94A3B8' }}>{log.sent_by_user}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
