'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { 
  GraduationCap, 
  ClipboardCheck, 
  LayoutDashboard,
  LogOut, 
  LogIn
} from 'lucide-react';
import RoleSwitcher from './RoleSwitcher';

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [pendingCount, setPendingCount] = useState(0);

  // Poll pending change requests count for the live badge
  useEffect(() => {
    let isMounted = true;
    const fetchPendingCount = async () => {
      try {
        const res = await fetch('/api/change-requests?status=PENDING');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setPendingCount(data.pendingCount || data.count || 0);
          }
        }
      } catch (err) {
        // Silently handle offline/loading errors
      }
    };

    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [pathname]);

  const primaryNavItems = [
    { label: 'College Directory', href: '/colleges', icon: GraduationCap },
    { 
      label: 'Review Changes & Approvals', 
      href: '/approvals', 
      icon: ClipboardCheck,
      badge: pendingCount 
    },
  ];

  const secondaryNavItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  ];

  return (
    <>
      <div className="filmstrip-border" />
      <header className="navbar-header">
        <div className="navbar-container">
          
          {/* Brand Logo & Name */}
          <Link href="/colleges" className="brand-link" style={{ flexShrink: 0, textDecoration: 'none' }}>
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
                Shortfundly Campus
              </span>
              <span style={{ fontSize: '11px', color: '#94A3B8', whiteSpace: 'nowrap' }}>
                College Outreach & Data Pipeline
              </span>
            </div>
          </Link>

          {/* Primary Two-Tab Navigation Bar */}
          <nav className="nav-container-desktop" style={{ flexShrink: 0, overflowX: 'auto' }}>
            <ul className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0, padding: 0, listStyle: 'none', flexWrap: 'nowrap' }}>
              {primaryNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <li key={item.href} style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
                    <Link 
                      href={item.href} 
                      className={`nav-item-link ${isActive ? 'active' : ''}`}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        padding: '8px 14px', 
                        fontSize: '14px',
                        fontWeight: 600,
                        position: 'relative'
                      }}
                    >
                      <Icon size={16} style={{ flexShrink: 0 }} />
                      <span>{item.label}</span>
                      {typeof item.badge === 'number' && item.badge > 0 && (
                        <span className="nav-badge" title={`${item.badge} pending review items`}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}

              {/* Optional Secondary Nav for logged in users */}
              {session && secondaryNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <li key={item.href} style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
                    <Link 
                      href={item.href} 
                      className={`nav-item-link ${isActive ? 'active' : ''}`}
                      style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px', opacity: 0.8 }}
                    >
                      <Icon size={14} style={{ flexShrink: 0 }} />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Right Side: Role & User Info */}
          <div className="nav-user-panel" style={{ flexShrink: 0 }}>
            {session ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.2 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF', whiteSpace: 'nowrap' }}>
                      {session.user.name}
                    </span>
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
