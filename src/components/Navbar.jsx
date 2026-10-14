'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { 
  LayoutDashboard, 
  GraduationCap, 
  FileText, 
  Send, 
  PenTool, 
  Activity, 
  Settings as SettingsIcon, 
  LogOut, 
  LogIn, 
  ShieldCheck, 
  UserCheck 
} from 'lucide-react';
import { FilmstripIcon } from './Icons';

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'College Directory', href: '/colleges', icon: GraduationCap },
    { label: 'Email Templates', href: '/templates', icon: FileText },
    { label: 'Automated Campaigns', href: '/campaigns', icon: Send },
    { label: 'Direct Send', href: '/manual-send', icon: PenTool },
    { label: 'Outreach Logs', href: '/logs', icon: Activity },
    { label: 'Settings', href: '/settings', icon: SettingsIcon },
  ];

  const getRoleClass = (role) => {
    if (!role) return '';
    const r = role.toLowerCase().replace(' ', '-');
    return `role-badge ${r}`;
  };

  return (
    <>
      <div className="filmstrip-border" />
      <header className="navbar-header">
        <div className="navbar-container">
          {/* Brand Logo & Name */}
          <Link href="/" className="brand-link">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/shortfundly-logo.png" 
              alt="ShortFundly OTT marketplace" 
              style={{ height: '36px', width: '36px', borderRadius: '50%', objectFit: 'cover', filter: 'drop-shadow(0 2px 8px rgba(255, 50, 75, 0.4))' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
              <span style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.2px' }}>
                ShortFundly OTT marketplace
              </span>
              <span style={{ fontSize: '10px', color: '#94A3B8', letterSpacing: '0.5px' }}>
                Odisha Email Automation
              </span>
            </div>
          </Link>

          {/* Navigation Links (Visible when logged in) */}
          {session && (
            <nav>
              <ul className="nav-links">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.href}>
                      <Link 
                        href={item.href} 
                        className={`nav-item-link ${isActive ? 'active' : ''}`}
                      >
                        <Icon size={16} />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          )}

          {/* Right Side: User Profile or Login CTA */}
          <div className="nav-user-panel">
            {session ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.2 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>
                      {session.user.name}
                    </span>
                    <span className={getRoleClass(session.user.role)}>
                      <ShieldCheck size={11} />
                      {session.user.role}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>
                    {session.user.email}
                  </span>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="btn btn-secondary btn-sm"
                  title="Sign Out"
                >
                  <LogOut size={14} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <Link href="/login" className="btn btn-primary btn-sm">
                <LogIn size={14} />
                <span>Portal Login</span>
              </Link>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
