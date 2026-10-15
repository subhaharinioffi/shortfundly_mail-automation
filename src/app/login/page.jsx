'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, Mail, AlertCircle, AlertTriangle, RotateCw, KeyRound } from 'lucide-react';
import { PlayCinemaIcon } from '@/components/Icons';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaSvg, setCaptchaSvg] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Real-time uppercase and format validation
  const hasUpperCase = /[A-Z]/.test(email);
  const isValidEmailFormat = !email || /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(email.trim());

  const fetchCaptcha = async () => {
    setCaptchaLoading(true);
    try {
      const res = await fetch(`/api/auth/captcha?t=${Date.now()}`, {
        cache: 'no-store'
      });
      const data = await res.json();
      if (data.success) {
        setCaptchaSvg(data.svg);
        setCaptchaToken(data.token);
        setCaptchaInput('');
      }
    } catch (err) {
      console.error('Failed to load CAPTCHA challenge:', err);
    } finally {
      setCaptchaLoading(false);
    }
  };

  useEffect(() => {
    fetchCaptcha();
  }, []);

  const handleLogin = async (e) => {
    e?.preventDefault();
    setError('');

    // Client-side uppercase validation gate
    if (hasUpperCase) {
      setError('Uppercase letters are not allowed in email addresses. Please enter a proper lowercase email address (e.g. admin@shortfundly.com).');
      return;
    }

    // Client-side format validation gate
    if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(email.trim())) {
      setError('Please enter a valid lowercase email address (e.g. admin@shortfundly.com).');
      return;
    }

    // Client-side CAPTCHA validation gate
    if (!captchaInput.trim()) {
      setError('Please enter the security verification CAPTCHA characters.');
      return;
    }

    setLoading(true);

    try {
      const res = await signIn('credentials', {
        email: email.trim(),
        password,
        captcha: captchaInput.trim(),
        captchaToken,
        redirect: false,
      });

      if (res?.error) {
        setError(res.error || 'Invalid email, password, or security CAPTCHA.');
        setLoading(false);
        fetchCaptcha(); // Refresh CAPTCHA immediately on failure
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      setError('An unexpected error occurred during sign-in.');
      setLoading(false);
      fetchCaptcha();
    }
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

          {/* Security CAPTCHA Verification */}
          <div className="form-group" style={{ marginTop: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>
                Security Verification (CAPTCHA) <span className="required">*</span>
              </label>
              <span style={{ fontSize: '11px', color: '#64748B' }}>
                Case-insensitive
              </span>
            </div>

            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              gap: '12px', 
              marginBottom: '10px',
              padding: '10px 12px',
              background: '#090d16',
              border: '1px solid #1e293b',
              borderRadius: '8px'
            }}>
              <div 
                id="captcha-preview"
                style={{ flex: 1, display: 'flex', alignItems: 'center', minHeight: '50px' }}
                dangerouslySetInnerHTML={{ __html: captchaSvg || '<div style="color:#64748B;font-size:12px;padding:12px;">Generating Security Code...</div>' }}
              />

              <button
                type="button"
                onClick={fetchCaptcha}
                disabled={captchaLoading}
                title="Generate new CAPTCHA code"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#151d30',
                  border: '1px solid #334155',
                  color: '#94A3B8',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: captchaLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                <RotateCw size={13} style={{ transform: captchaLoading ? 'rotate(180deg)' : 'none', transition: 'transform 0.4s ease' }} />
                <span>Refresh</span>
              </button>
            </div>

            <div style={{ position: 'relative' }}>
              <input
                type="text"
                id="captcha-input"
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value.toUpperCase())}
                required
                maxLength={8}
                autoComplete="off"
                spellCheck="false"
                className="form-input"
                placeholder="Enter the 6 characters above"
                style={{ 
                  paddingLeft: '38px', 
                  letterSpacing: '3px', 
                  fontFamily: "'Courier New', Courier, monospace",
                  fontWeight: 700,
                  textTransform: 'uppercase'
                }}
              />
              <KeyRound 
                size={16} 
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} 
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '16px', padding: '12px' }}
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
            <span>Cryptographic CAPTCHA • Bcrypt Hashed • Role-Protected Session</span>
          </div>
        </div>

      </div>
    </div>
  );
}
