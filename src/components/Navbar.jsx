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
  LogIn
} from 'lucide-react';
import RoleSwitcher from './RoleSwitcher';

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Directory', href: '/colleges', icon: GraduationCap },
    { label: 'Templates', href: '/templates', icon: FileText },
    { label: 'Campaigns', href: '/campaigns', icon: Send },
    { label: 'Direct Send', href: '/manual-send', icon: PenTool },
    { label: 'Logs', href: '/logs', icon: Activity },
    { label: 'Settings', href: '/settings', icon: SettingsIcon },
  ];

  return (
    <>
      <div className="filmstrip-border" />
      <header className="navbar-header">
        <div className="navbar-container">
          
          {/* Brand Logo & Name: Clean single-line subtitle without wrapping */}
          <Link href="/" className="brand-link" style={{ flexShrink: 0, textDecoration: 'none' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/shortfundly-logo.png" 
              alt="Shortfundly" 
              style={{ 
                height: '36px', 
                width: '36px', 
                borderRadius: '50%', 
                objectFit: 'cover', 
                filter: 'drop-shadow(0 2px 8px rgba(255, 50, 75, 0.4))',
                flexShrink: 0
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
              <span style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.2px', whiteSpace: 'nowrap' }}>
                Shortfundly
              </span>
              <span className="text-xs text-slate-400 whitespace-nowrap" style={{ fontSize: '11px', color: '#94A3B8', whiteSpace: 'nowrap' }}>
                Odisha Campus Outreach
              </span>
            </div>
          </Link>

          {/* Navigation Links: Forced single-line with whitespace-nowrap */}
          {session && (
            <nav className="nav-container-desktop" style={{ flexShrink: 0, overflowX: 'auto' }}>
              <ul className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: 0, padding: 0, listStyle: 'none', flexWrap: 'nowrap' }}>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.href} style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
                      <Link 
                        href={item.href} 
                        className={`whitespace-nowrap text-sm font-medium px-3 py-2 rounded-lg nav-item-link ${isActive ? 'active' : ''}`}
                        style={{ display: 'flex', alignItems: 'center', gap: '7px', whiteSpace: 'nowrap' }}
                      >
                        <Icon size={15} style={{ flexShrink: 0 }} />
                        <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          )}

          {/* Right Side: Interactive Role Switcher & User Profile */}
          <div className="nav-user-panel" style={{ flexShrink: 0 }}>
            {session ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.2 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF', whiteSpace: 'nowrap' }}>
                      {session.user.name}
                    </span>
                    {/* Interactive Role Switcher replaces static Admin badge */}
                    <RoleSwitcher />
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748B', whiteSpace: 'nowrap' }}>
                    {session.user.email}
                  </span>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="btn btn-secondary btn-sm"
                  title="Sign Out"
                  style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <LogOut size={14} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <Link href="/login" className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}>
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
