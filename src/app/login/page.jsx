'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, AlertTriangle, Sparkles, CheckCircle2 } from 'lucide-react';
import { FilmstripIcon, PlayCinemaIcon } from '@/components/Icons';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@shortfundly.com');
  const [password, setPassword] = useState('Admin@ShortFundly2026');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Real-time uppercase and format validation
  const hasUpperCase = /[A-Z]/.test(email);
  const isValidEmailFormat = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(email.trim());

  const handleLogin = async (e) => {
    e?.preventDefault();
    setError('');

    // Client-side uppercase validation gate
    if (hasUpperCase) {
      setError('Uppercase letters are not allowed in email addresses. Please enter a proper lowercase email address (e.g. admin@shortfundly.com).');
      return;
    }

    // Client-side format validation gate
    if (!isValidEmailFormat) {
      setError('Please enter a valid lowercase email address (e.g. admin@shortfundly.com).');
      return;
    }

    setLoading(true);

    try {
      const res = await signIn('credentials', {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (res?.error) {
        setError(res.error || 'Invalid email or password.');
        setLoading(false);
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      setError('An unexpected error occurred during sign-in.');
      setLoading(false);
    }
  };

  const selectRolePreset = (presetEmail, presetPass) => {
    setEmail(presetEmail);
    setPassword(presetPass);
    setError('');
  };

  return (
    <div style={{ maxWidth: '480px', margin: '40px auto', width: '100%' }}>
      <div className="card" style={{ padding: '36px 32px', boxShadow: 'var(--shadow-cinema)' }}>
        
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src="/shortfundly-logo.png" 
            alt="ShortFundly OTT marketplace" 
            style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 12px', filter: 'drop-shadow(0 2px 14px rgba(255, 50, 75, 0.5))' }}
          />
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF' }}>
            ShortFundly OTT marketplace
          </h2>
          <p style={{ fontSize: '13px', color: '#94A3B8', marginTop: '4px' }}>
            Campus Outreach Engine • Portal Authentication
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert-box danger">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Quick 1-Click Role Credentials Selection */}
        <div style={{ marginBottom: '24px' }}>
          <label className="form-label" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Quick Role Selection (3 Accounts)
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            <button
              type="button"
              onClick={() => selectRolePreset('admin@shortfundly.com', 'Admin@ShortFundly2026')}
              className={`btn btn-sm ${email === 'admin@shortfundly.com' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '11px', padding: '6px 4px' }}
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => selectRolePreset('hr@shortfundly.com', 'HR@ShortFundly2026')}
              className={`btn btn-sm ${email === 'hr@shortfundly.com' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '11px', padding: '6px 4px' }}
            >
              HR
            </button>
            <button
              type="button"
              onClick={() => selectRolePreset('techlead@shortfundly.com', 'TechLead@ShortFundly2026')}
              className={`btn btn-sm ${email === 'techlead@shortfundly.com' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '11px', padding: '6px 4px' }}
            >
              Tech Lead
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">
              Official Email Address <span className="required">*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="form-input"
                placeholder="name@shortfundly.com"
                style={{ 
                  paddingLeft: '38px',
                  borderColor: hasUpperCase ? '#F59E0B' : undefined,
                  boxShadow: hasUpperCase ? '0 0 0 2px rgba(245, 158, 11, 0.2)' : undefined,
                }}
              />
              <Mail 
                size={16} 
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: hasUpperCase ? '#F59E0B' : '#64748B' }} 
              />
            </div>

            {/* Real-Time Uppercase Email Warning */}
            {hasUpperCase && (
              <div 
                id="email-case-warning"
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  marginTop: '8px',
                  padding: '10px 12px',
                  background: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  borderRadius: '6px',
                  color: '#FBBF24',
                  fontSize: '12px',
                  lineHeight: '1.4'
                }}
              >
                <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '1px', color: '#F59E0B' }} />
                <div>
                  <strong style={{ color: '#FDE68A' }}>Warning:</strong> Email address must be in lowercase. Please enter a proper email address (e.g., <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 4px', borderRadius: '3px', color: '#FDE68A' }}>admin@shortfundly.com</code>).
                </div>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">
              Account Password <span className="required">*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="form-input"
                placeholder="Enter password"
                style={{ paddingLeft: '38px' }}
              />
              <Lock 
                size={16} 
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} 
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '10px', padding: '12px' }}
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <PlayCinemaIcon size={14} color="#FFFFFF" />
                <span>Sign In to Workflow</span>
              </>
            )}
          </button>
        </form>

        {/* Security Note */}
        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11px', color: '#64748B' }}>
            <ShieldCheck size={13} color="#10B981" />
            <span>Bcrypt Hashed • Role-Protected SQLite Session</span>
          </div>
        </div>

      </div>
    </div>
  );
}
