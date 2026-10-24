'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { 
  GraduationCap, 
  ClipboardCheck, 
  FileText,
  Settings as SettingsIcon,
  PenTool,
  Send,
  Activity,
  LayoutDashboard,
  LogOut, 
  LogIn,
  Menu,
  X
} from 'lucide-react';
import RoleSwitcher from './RoleSwitcher';

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [pendingCount, setPendingCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

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

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Directory', href: '/colleges', icon: GraduationCap },
    { 
      label: 'Approvals', 
      href: '/approvals', 
      icon: ClipboardCheck,
      badge: pendingCount 
    },
    { label: 'Campaigns', href: '/campaigns', icon: Send },
    { label: 'Direct Send', href: '/manual-send', icon: PenTool },
    { label: 'Templates', href: '/templates', icon: FileText },
    { label: 'Logs', href: '/logs', icon: Activity },
    { label: 'Settings', href: '/settings', icon: SettingsIcon },
  ];

  return (
    <>
      <div className="filmstrip-border" />
      <header className="navbar-header">
        <div className="navbar-container">
          
          {/* Brand Logo & Name */}
          <Link href="/dashboard" className="brand-link">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/shortfundly-logo.png" 
              alt="Shortfundly" 
              className="brand-logo-img"
            />
            <div className="brand-text-container">
              <span className="brand-title">
                Shortfundly Campus
              </span>
              <span className="brand-subtext">
                Outreach & Data Pipeline
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Bar Links */}
          <nav className="nav-container-desktop">
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
                      <Icon size={14} style={{ flexShrink: 0 }} />
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
            </ul>
          </nav>

          {/* Right Side: Role & User Info & Logout Button */}
          <div className="nav-user-panel">
            {session ? (
              <div className="nav-user-controls">
                <div className="nav-user-info">
                  <div className="nav-user-name-row">
                    <span className="nav-user-name">
                      {session.user.name || 'User'}
                    </span>
                    <RoleSwitcher />
                  </div>
                  <span className="nav-user-email">
                    {session.user.email}
                  </span>
                </div>
                {/* Prominent High-Visibility Logout Button */}
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="btn-logout"
                  title="Sign Out of Session"
                  aria-label="Logout"
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

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              className="mobile-nav-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>

        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="mobile-nav-drawer">
            <ul className="nav-links">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link 
                      href={item.href} 
                      className={`nav-item-link ${isActive ? 'active' : ''}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Icon size={16} />
                      <span>{item.label}</span>
                      {typeof item.badge === 'number' && item.badge > 0 && (
                        <span className="nav-badge">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {session && (
              <div className="mobile-nav-user-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>
                      {session.user.name}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                      {session.user.email}
                    </div>
                  </div>
                  <RoleSwitcher />
                </div>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="btn-logout"
                  style={{ width: '100%', padding: '10px 16px', justifyContent: 'center' }}
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        )}
      </header>
    </>
  );
}
