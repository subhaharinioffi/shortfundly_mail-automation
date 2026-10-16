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
  CheckCircle2, 
  Upload 
} from 'lucide-react';
import { FilmstripIcon, ClapperboardIcon, PlayCinemaIcon } from '@/components/Icons';

export default function DashboardPage() {
  const { data: session, status } = useSession();
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
