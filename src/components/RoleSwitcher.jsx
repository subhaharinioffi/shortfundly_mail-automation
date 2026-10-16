'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRole, ROLES } from '@/context/RoleContext';
import { 
  Crown, 
  Users, 
  Terminal, 
  ChevronDown, 
  Check, 
  Sparkles,
  ShieldCheck,
  Lock,
  Layers,
  Activity
} from 'lucide-react';

export default function RoleSwitcher() {
  const { activeRole, setActiveRoleId, roles } = useRole();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const getRoleIcon = (roleId, size = 13) => {
    if (roleId === 'CEO') return <Crown size={size} />;
    if (roleId === 'HR / Outreach Lead' || roleId === 'HR') return <Users size={size} />;
    return <Terminal size={size} />;
  };

  return (
    <div className="role-switcher-container" ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Interactive Trigger Pill */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`role-switcher-trigger role-badge ${activeRole.badgeClass}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: '9999px',
          cursor: 'pointer',
          border: `1px solid ${activeRole.borderColor}`,
          background: activeRole.bgColor,
          color: activeRole.color,
          fontWeight: 700,
          fontSize: '11px',
          letterSpacing: '0.4px',
          textTransform: 'uppercase',
          boxShadow: `0 0 10px ${activeRole.glowColor}`,
          transition: 'all 0.2s ease',
        }}
        title="Switch Operating Persona (RBAC)"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {getRoleIcon(activeRole.id, 12)}
        <span>{activeRole.shortTitle || activeRole.title}</span>
        <ChevronDown 
          size={11} 
          style={{ 
            transition: 'transform 0.2s ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
          }} 
        />
      </button>

      {/* Floating Dropdown Modal / Popover */}
      {isOpen && (
        <div
          className="role-switcher-menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '340px',
            background: '#0B0F19',
            border: '1px solid #1E293B',
            borderRadius: '12px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05)',
            zIndex: 100,
            padding: '12px',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Header */}
          <div style={{ paddingBottom: '10px', marginBottom: '8px', borderBottom: '1px solid #1E293B' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                Role-Based Access (RBAC)
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#64748B' }}>
                <ShieldCheck size={11} color="#10B981" />
                Live Switcher
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#CBD5E1', marginTop: '2px', fontWeight: 500 }}>
              Select your operational cockpit persona:
            </div>
          </div>

          {/* Role List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {roles.map((r) => {
              const isSelected = activeRole.id === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    setActiveRoleId(r.id);
                    setIsOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    textAlign: 'left',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: isSelected ? r.bgColor : 'rgba(255, 255, 255, 0.02)',
                    border: `1px solid ${isSelected ? r.borderColor : 'rgba(255, 255, 255, 0.06)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    position: 'relative',
                    width: '100%',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          background: isSelected ? r.color : 'rgba(255, 255, 255, 0.08)',
                          color: isSelected ? '#000000' : r.color,
                        }}
                      >
                        {getRoleIcon(r.id, 13)}
                      </span>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{r.title}</span>
                          <span style={{ fontSize: '10px', color: r.color, fontWeight: 600, padding: '1px 6px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.05)' }}>
                            {r.viewName}
                          </span>
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <span style={{ color: r.color, display: 'flex', alignItems: 'center' }}>
                        <Check size={16} />
                      </span>
                    )}
                  </div>

                  <p style={{ fontSize: '11px', color: '#94A3B8', margin: '2px 0 0 0', lineHeight: 1.35 }}>
                    {r.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Footer note */}
          <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #1E293B', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={11} color="#F59E0B" />
            <span style={{ fontSize: '10px', color: '#64748B' }}>
              Persisted in localStorage • Real-time UI synchronization
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
