'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { 
  Send, 
  GraduationCap, 
  ShieldCheck, 
  ArrowRight, 
  PenTool, 
  Radio, 
  MailCheck, 
  Layers
} from 'lucide-react';
import { FilmstripIcon, PlayCinemaIcon } from '@/components/Icons';
import Threads from '@/components/Threads';

export default function LandingPage() {
  const { data: session } = useSession();

  return (
    <div style={{ position: 'relative', minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      
      {/* React Bits Threads Animated WebGL Background */}
      <div 
        style={{ 
          position: 'absolute', 
          inset: 0, 
          overflow: 'hidden', 
          zIndex: 0, 
          opacity: 0.75,
          pointerEvents: 'auto',
          maskImage: 'radial-gradient(ellipse at center, black 50%, transparent 95%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 50%, transparent 95%)'
        }}
      >
        <Threads
          color={[1, 1, 1]}
          accentColor={[1, 0.2, 0.3]} // ShortFundly crimson
          amplitude={1.7}
          distance={0.35}
          enableMouseInteraction={true}
          lineCount={75}
          thickness={0.7}
          speed={0.45}
          fade={0.15}
          opacity={0.85}
        />
      </div>

      {/* Hero Foreground Content */}
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '820px', padding: '40px 20px', margin: '0 auto' }}>
        
        {/* Company Logo and Brand Name */}
        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', marginBottom: '28px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src="/shortfundly-logo.png" 
            alt="ShortFundly OTT marketplace" 
            style={{ 
              width: '88px', 
              height: '88px', 
              borderRadius: '50%', 
              objectFit: 'cover',
              filter: 'drop-shadow(0 0 28px rgba(255, 50, 75, 0.6))',
              marginBottom: '18px'
            }} 
          />

          {/* Company Name in White Color */}
          <h1 style={{ 
            fontSize: '36px', 
            fontWeight: 800, 
            letterSpacing: '-0.5px', 
            color: '#FFFFFF', 
            lineHeight: 1.2,
            textShadow: '0 2px 14px rgba(0,0,0,0.8)'
          }}>
            ShortFundly OTT marketplace
          </h1>

          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px', 
            marginTop: '12px',
            padding: '5px 14px', 
            borderRadius: '9999px', 
            background: 'rgba(255, 50, 75, 0.12)', 
            border: '1px solid rgba(255, 50, 75, 0.35)', 
            color: '#FF6B7E', 
            fontSize: '12px', 
            fontWeight: 700, 
            letterSpacing: '1px', 
            textTransform: 'uppercase' 
          }}>
            <FilmstripIcon size={14} color="#FF324B" />
            <span>Campus Outreach Automation Engine • Odisha</span>
          </div>
        </div>

        {/* Simple Minimalist Headline */}
        <p style={{ 
          fontSize: '17px', 
          color: '#94A3B8', 
          lineHeight: 1.6, 
          maxWidth: '640px', 
          margin: '0 auto 36px',
          textShadow: '0 2px 8px rgba(0,0,0,0.6)'
        }}>
          Automated email workflow for connecting colleges in Odisha with Shortfundly Campus. 
          Collect verified contacts, personalize collaboration proposals, and dispatch with Google SMTP.
        </p>

        {/* Action CTAs */}
        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '44px' }}>
          {session ? (
            <>
              <Link href="/dashboard" className="btn btn-primary btn-lg">
                <PlayCinemaIcon size={15} color="#FFFFFF" />
                <span>Open Operations Dashboard</span>
              </Link>
              <Link href="/campaigns" className="btn btn-secondary btn-lg">
                <Send size={15} />
                <span>Automated Batch Send</span>
              </Link>
              <Link href="/manual-send" className="btn btn-outline btn-lg">
                <PenTool size={15} />
                <span>Custom Manual Mailer</span>
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-primary btn-lg">
                <ShieldCheck size={18} />
                <span>Sign In to Access Automation</span>
              </Link>
              <Link href="/login" className="btn btn-secondary btn-lg">
                <span>View Dashboard</span>
                <ArrowRight size={16} />
              </Link>
            </>
          )}
        </div>

        {/* Minimalist 3-Pill Feature Bar */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '12px', 
          maxWidth: '680px', 
          margin: '0 auto' 
        }}>
          <div className="card" style={{ padding: '14px', textAlign: 'center', background: 'rgba(15, 20, 32, 0.75)', backdropFilter: 'blur(10px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#FFFFFF', fontWeight: 600, fontSize: '13px' }}>
              <GraduationCap size={16} color="#FF324B" />
              <span>Odisha Colleges Directory</span>
            </div>
            <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '3px' }}>
              Official domains &amp; de-duplication
            </div>
          </div>

          <div className="card" style={{ padding: '14px', textAlign: 'center', background: 'rgba(15, 20, 32, 0.75)', backdropFilter: 'blur(10px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#FFFFFF', fontWeight: 600, fontSize: '13px' }}>
              <Radio size={16} color="#06B6D4" />
              <span>Google SMTP Transport</span>
            </div>
            <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '3px' }}>
              Verified delivery &amp; rate limiting
            </div>
          </div>

          <div className="card" style={{ padding: '14px', textAlign: 'center', background: 'rgba(15, 20, 32, 0.75)', backdropFilter: 'blur(10px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#FFFFFF', fontWeight: 600, fontSize: '13px' }}>
              <MailCheck size={16} color="#10B981" />
              <span>Duplicate Shield Guard</span>
            </div>
            <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '3px' }}>
              Zero unintentional re-sends
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
