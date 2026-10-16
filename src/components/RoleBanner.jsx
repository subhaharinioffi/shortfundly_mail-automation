'use client';

import React, { useState } from 'react';
import { useRole } from '@/context/RoleContext';
import { useSession } from 'next-auth/react';
import { 
  Crown, 
  Users, 
  Terminal, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles,
  X,
  Sliders,
  ChevronRight
} from 'lucide-react';

export default function RoleBanner() {
  const { activeRole, setActiveRoleId, roles } = useRole();
  const { data: session } = useSession();
  const [minimized, setMinimized] = useState(false);

  if (!session) return null;

  const getRoleIcon = (roleId) => {
    if (roleId === 'CEO') return <Crown size={14} />;
    if (roleId === 'HR / Outreach Lead' || roleId === 'HR') return <Users size={14} />;
    return <Terminal size={14} />;
  };

  if (minimized) {
    return (
      <div 
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          margin: '-16px 0 16px 0',
        }}
      >
        <button
          onClick={() => setMinimized(false)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            color: activeRole.color,
            background: activeRole.bgColor,
            border: `1px solid ${activeRole.borderColor}`,
            borderRadius: '9999px',
            padding: '2px 10px',
            cursor: 'pointer',
          }}
          title="Show Role Focus Banner"
        >
          {getRoleIcon(activeRole.id)}
          <span>{activeRole.viewName} Active</span>
          <ChevronRight size={12} />
        </button>
      </div>
    );
  }

  return (
    <div
      className="role-indicator-banner"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '8px 16px',
        background: `linear-gradient(90deg, ${activeRole.bgColor} 0%, rgba(15, 23, 42, 0.6) 100%)`,
        border: `1px solid ${activeRole.borderColor}`,
        borderRadius: '8px',
        marginBottom: '20px',
        backdropFilter: 'blur(8px)',
        boxShadow: `0 2px 12px ${activeRole.glowColor}`,
        transition: 'all 0.3s ease',
      }}
    >
      {/* Left: Persona info and description */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 300px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '26px',
            height: '26px',
            borderRadius: '6px',
            background: activeRole.color,
            color: '#000000',
            flexShrink: 0,
          }}
        >
          {getRoleIcon(activeRole.id)}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.3px' }}>
              {activeRole.viewName.toUpperCase()}
            </span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: activeRole.color,
                background: 'rgba(0, 0, 0, 0.4)',
                padding: '1px 6px',
                borderRadius: '4px',
                border: `1px solid ${activeRole.borderColor}`,
              }}
            >
              {activeRole.title}
            </span>
            <span style={{ fontSize: '11px', color: '#94A3B8' }}>
              • {activeRole.focus}
            </span>
          </div>
          <div style={{ fontSize: '11px', color: '#CBD5E1', marginTop: '2px', lineHeight: 1.3 }}>
            {activeRole.summary}
          </div>
        </div>
      </div>

      {/* Right: Key Role Metrics */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {activeRole.kpiHighlights.map((kpi, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              flexDirection: 'column',
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '3px 10px',
              borderRadius: '6px',
              minWidth: '95px',
            }}
          >
            <span style={{ fontSize: '9px', textTransform: 'uppercase', color: '#64748B', fontWeight: 600 }}>
              {kpi.label}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#FFFFFF' }}>
                {kpi.value}
              </span>
            </div>
          </div>
        ))}

        <button
          onClick={() => setMinimized(true)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#64748B',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            marginLeft: '4px',
          }}
          title="Minimize Role Banner"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
