import { Shield, Sparkles, Radio } from 'lucide-react';
import { FilmstripIcon } from './Icons';

export default function Footer() {
  return (
    <footer className="app-footer">
      <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94A3B8' }}>
            <FilmstripIcon size={14} color="#FF324B" />
            <span>Shortfundly OTT Marketplace Platform</span>
          </div>
          <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>•</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10B981' }}>
            <Radio size={14} />
            <span>Google SMTP Cluster: Operational</span>
          </div>
          <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>•</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94A3B8' }}>
            <Shield size={14} color="#06B6D4" />
            <span>Role-Based Access Control (Admin, HR, Tech Lead)</span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '16px', marginTop: '4px', flexWrap: 'wrap', gap: '10px' }}>
          <span style={{ color: '#64748B' }}>
            Copyright 2026 Shortfundly Inc. All rights reserved. Empowering Campus Creators.
          </span>
          <div style={{ display: 'flex', gap: '16px' }}>
            <a href="https://campus.shortfundly.com" target="_blank" rel="noreferrer" style={{ color: '#FF324B', textDecoration: 'none' }}>
              Campus Network
            </a>
            <a href="https://calendly.com/shortfundly-meeting/30min" target="_blank" rel="noreferrer" style={{ color: '#94A3B8', textDecoration: 'none' }}>
              Book Meeting
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
