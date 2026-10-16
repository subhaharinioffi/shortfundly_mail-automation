'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export const ROLES = {
  CEO: {
    id: 'CEO',
    title: 'CEO',
    shortTitle: 'CEO',
    viewName: 'Executive View',
    badgeClass: 'ceo',
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
    glowColor: 'rgba(245, 158, 11, 0.25)',
    summary: 'Executive View: Highlights state-wide Odisha saturation, district breakdown, and export reports; disables raw SMTP/batch delay overrides.',
    description: 'Executive View: highlights state-wide Odisha saturation, district breakdown, and export reports; disables raw SMTP/batch delay overrides',
    focus: 'State-wide Institutional Saturation & Governance',
    isTechnicalSettingsAllowed: false,
    kpiHighlights: [
      { label: 'Odisha Saturation', value: '1,048 Institutions', change: '100% State Coverage', trend: 'positive' },
      { label: 'Territorial Scope', value: '30 of 30 Districts', change: 'All Revenue Zones Active', trend: 'positive' },
      { label: 'Governance Mode', value: 'Protected SMTP', change: 'Overrides Restricted', trend: 'neutral' }
    ]
  },
  HR: {
    id: 'HR / Outreach Lead',
    title: 'HR / Outreach Lead',
    shortTitle: 'HR Lead',
    viewName: 'Campaign View',
    badgeClass: 'hr',
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
    glowColor: 'rgba(16, 185, 129, 0.25)',
    summary: 'Campaign View: Full access to Institutional Directory, Templates, Automated Campaigns, and Direct Send.',
    description: 'Campaign View: full access to Directory, Templates, Automated Campaigns, and Direct Send',
    focus: 'Campus Partnerships & Student Engagement',
    isTechnicalSettingsAllowed: true,
    kpiHighlights: [
      { label: 'Outreach Registry', value: '1,048 Colleges', change: 'Principals & Placement Desks', trend: 'positive' },
      { label: 'Campaign Engine', value: 'Auto-Batch Paced', change: '50-100 Cohort Delivery', trend: 'positive' },
      { label: 'Template Studio', value: 'Dynamic Tags Active', change: 'Personalized Merge Tags', trend: 'positive' }
    ]
  },
  TECH_LEAD: {
    id: 'Tech Lead',
    title: 'Tech Lead',
    shortTitle: 'Tech Lead',
    viewName: 'System Console View',
    badgeClass: 'tech-lead',
    color: '#06B6D4',
    bgColor: 'rgba(6, 182, 212, 0.12)',
    borderColor: 'rgba(6, 182, 212, 0.4)',
    glowColor: 'rgba(6, 182, 212, 0.25)',
    summary: 'System Console View: Unlocks SMTP cluster diagnostics, webhook delivery logs, rate-limit controls, and dead-letter retry.',
    description: 'System Console View: unlocks SMTP cluster diagnostics, webhook delivery logs, rate-limit controls, and dead-letter retry',
    focus: 'SMTP Cluster Telemetry & Cryptographic Security',
    isTechnicalSettingsAllowed: true,
    kpiHighlights: [
      { label: 'SMTP Cluster Node', value: 'Google SMTP (250 OK)', change: 'TLS 1.3 Strict Verified', trend: 'positive' },
      { label: 'Anti-Spam Throttle', value: '50 Emails / min', change: 'Batch Cooldown Active', trend: 'positive' },
      { label: 'Security Firewall', value: 'Visual CAPTCHA', change: 'HMAC-SHA256 Tokenized', trend: 'positive' }
    ]
  }
};

const RoleContext = createContext({
  activeRole: ROLES.CEO,
  setActiveRoleId: () => {},
  roles: Object.values(ROLES),
  isInitialized: false,
});

export function RoleProvider({ children }) {
  const { data: session } = useSession();
  const [activeRole, setActiveRole] = useState(ROLES.CEO);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('sf_active_role');
      if (stored) {
        const found = Object.values(ROLES).find(
          r => r.id === stored || r.title === stored || r.shortTitle === stored
        );
        if (found) {
          setActiveRole(found);
          setIsInitialized(true);
          return;
        }
      }

      if (session?.user?.role) {
        const sessRole = session.user.role.toLowerCase();
        if (sessRole.includes('tech')) {
          setActiveRole(ROLES.TECH_LEAD);
        } else if (sessRole.includes('hr')) {
          setActiveRole(ROLES.HR);
        } else {
          setActiveRole(ROLES.CEO);
        }
      }
    } catch (err) {
      console.warn('RoleProvider initialization notice:', err);
    }
    setIsInitialized(true);
  }, [session]);

  const setActiveRoleId = (roleId) => {
    const roleObj = Object.values(ROLES).find(
      r => r.id === roleId || r.title === roleId || r.shortTitle === roleId
    );
    if (roleObj) {
      setActiveRole(roleObj);
      try {
        localStorage.setItem('sf_active_role', roleObj.id);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('sf_role_changed', { detail: roleObj }));
        }
      } catch (err) {
        console.warn('Failed to persist active role', err);
      }
    }
  };

  return (
    <RoleContext.Provider
      value={{
        activeRole,
        setActiveRoleId,
        roles: Object.values(ROLES),
        isInitialized,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}
