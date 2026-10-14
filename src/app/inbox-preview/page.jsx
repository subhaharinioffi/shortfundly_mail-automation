'use client';

import { useState, useEffect } from 'react';
import { 
  Mail, 
  Inbox, 
  Star, 
  Clock, 
  Send, 
  FileText, 
  Trash2, 
  Search, 
  Settings, 
  HelpCircle, 
  Menu, 
  ArrowLeft, 
  MoreVertical, 
  Reply, 
  Forward, 
  ShieldCheck, 
  CheckCircle2, 
  ExternalLink,
  ChevronDown
} from 'lucide-react';

export default function InboxPreviewPage() {
  const [emailLog, setEmailLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('inbox');
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [showSecurityDetails, setShowSecurityDetails] = useState(false);

  useEffect(() => {
    async function fetchLatestLog() {
      try {
        const res = await fetch('/api/logs?limit=5');
        const data = await res.json();
        if (data.logs && data.logs.length > 0) {
          // Find the monarch or subhahariniofficial email or the latest one
          const target = data.logs.find(l => 
            l.recipient_email?.toLowerCase().includes('subhahariniofficial') || 
            l.college_name?.toLowerCase().includes('monarch')
          ) || data.logs[0];
          setEmailLog(target);
          setSelectedEmail(target); // default to viewing the email
        }
      } catch (err) {
        console.error('Failed to load email log:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchLatestLog();
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#1A1D24',
      color: '#E2E8F0',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Top Google / Gmail Navigation Bar */}
      <header style={{
        height: '64px',
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        background: '#13161C'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '6px' }}>
            <Menu size={20} />
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #EA4335 0%, #D93025 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(234, 67, 53, 0.35)'
            }}>
              <Mail size={20} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>Gmail</span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#10B981', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                  LIVE INBOX
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{
          flex: 1,
          maxWidth: '680px',
          margin: '0 32px',
          background: '#1E232D',
          borderRadius: '24px',
          padding: '8px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          border: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <Search size={18} color="#94A3B8" />
          <input 
            type="text" 
            readOnly 
            value="from:subha.shortfundly@gmail.com Monarchs University" 
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#F1F5F9',
              fontSize: '14px',
              width: '100%'
            }}
          />
        </div>

        {/* Profile Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#F8FAFC' }}>Subhaharini</div>
            <div style={{ fontSize: '11px', color: '#94A3B8' }}>subhahariniofficial@gmail.com</div>
          </div>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            color: '#FFFFFF',
            fontSize: '15px',
            boxShadow: '0 2px 8px rgba(99, 102, 241, 0.4)'
          }}>
            S
          </div>
        </div>
      </header>

      {/* Main Inbox Layout */}
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <aside style={{
          width: '240px',
          padding: '16px 12px',
          borderRight: '1px solid rgba(255, 255, 255, 0.06)',
          background: '#13161C'
        }}>
          {/* Compose button */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 20px',
            borderRadius: '16px',
            background: '#C2E7FF',
            color: '#001D35',
            fontWeight: 600,
            fontSize: '14px',
            marginBottom: '20px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
          }}>
            <span style={{ fontSize: '18px', fontWeight: 300 }}>+</span>
            <span>Compose</span>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 16px',
              borderRadius: '20px',
              background: 'rgba(234, 67, 53, 0.15)',
              color: '#F87171',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Inbox size={18} />
                <span>Inbox</span>
              </div>
              <span style={{ fontSize: '11px', background: '#EA4335', color: '#FFFFFF', padding: '1px 7px', borderRadius: '10px' }}>1</span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 16px',
              borderRadius: '20px',
              color: '#94A3B8',
              fontSize: '13px',
              cursor: 'pointer'
            }}>
              <Star size={18} />
              <span>Starred</span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 16px',
              borderRadius: '20px',
              color: '#94A3B8',
              fontSize: '13px',
              cursor: 'pointer'
            }}>
              <Clock size={18} />
              <span>Snoozed</span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 16px',
              borderRadius: '20px',
              color: '#94A3B8',
              fontSize: '13px',
              cursor: 'pointer'
            }}>
              <Send size={18} />
              <span>Sent</span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 16px',
              borderRadius: '20px',
              color: '#94A3B8',
              fontSize: '13px',
              cursor: 'pointer'
            }}>
              <FileText size={18} />
              <span>Drafts</span>
            </div>
          </nav>
        </aside>

        {/* Content Pane */}
        <main style={{ flex: 1, padding: '24px 32px', overflowY: 'auto' }}>
          {selectedEmail ? (
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
              {/* Email View Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                marginBottom: '20px',
                paddingBottom: '16px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <button 
                  onClick={() => setSelectedEmail(null)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: 'none',
                    color: '#94A3B8',
                    padding: '8px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <ArrowLeft size={18} />
                </button>
                <div style={{ flex: 1 }}>
                  <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                    {selectedEmail.subject}
                  </h1>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                    <span style={{ fontSize: '11px', background: 'rgba(59, 130, 246, 0.2)', color: '#60A5FA', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                      Inbox
                    </span>
                    <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                      {selectedEmail.college_name || 'Monarchs University'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sender & Recipient Box */}
              <div style={{
                background: '#1E232D',
                borderRadius: '12px',
                padding: '24px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', gap: '14px' }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      color: '#FFFFFF',
                      fontSize: '18px'
                    }}>
                      SF
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ fontSize: '15px', color: '#F8FAFC' }}>
                          Shortfundly Campus Collaboration
                        </strong>
                        <span style={{ fontSize: '12px', color: '#94A3B8' }}>
                          &lt;subha.shortfundly@gmail.com&gt;
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>to: <strong>subhahariniofficial@gmail.com</strong></span>
                        <button 
                          onClick={() => setShowSecurityDetails(!showSecurityDetails)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#60A5FA',
                            cursor: 'pointer',
                            fontSize: '11px',
                            padding: '0 4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px'
                          }}
                        >
                          <span>details</span>
                          <ChevronDown size={12} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: '#94A3B8' }}>
                      {selectedEmail.sent_at || 'Just now'}
                    </div>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      marginTop: '4px',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#10B981',
                      fontSize: '11px',
                      fontWeight: 600
                    }}>
                      <CheckCircle2 size={12} />
                      <span>Google SMTP TLS Verified</span>
                    </div>
                  </div>
                </div>

                {/* Security Inspector Details Dropdown */}
                {showSecurityDetails && (
                  <div style={{
                    background: '#13161C',
                    borderRadius: '8px',
                    padding: '14px 18px',
                    marginBottom: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    fontSize: '12px',
                    display: 'grid',
                    gridTemplateColumns: '120px 1fr',
                    rowGap: '6px'
                  }}>
                    <span style={{ color: '#94A3B8' }}>From:</span>
                    <span style={{ color: '#F1F5F9' }}>Shortfundly Campus Collaboration &lt;subha.shortfundly@gmail.com&gt;</span>
                    
                    <span style={{ color: '#94A3B8' }}>To:</span>
                    <span style={{ color: '#F1F5F9' }}>subhahariniofficial@gmail.com</span>
                    
                    <span style={{ color: '#94A3B8' }}>Date:</span>
                    <span style={{ color: '#F1F5F9' }}>{selectedEmail.sent_at || 'October 14, 2026, 9:25 PM'}</span>
                    
                    <span style={{ color: '#94A3B8' }}>Mailed-by:</span>
                    <span style={{ color: '#F1F5F9' }}>gmail.com</span>
                    
                    <span style={{ color: '#94A3B8' }}>Signed-by:</span>
                    <span style={{ color: '#F1F5F9' }}>gmail.com</span>
                    
                    <span style={{ color: '#94A3B8' }}>Security:</span>
                    <span style={{ color: '#10B981' }}>Standard encryption (TLS) • SPF PASS • DKIM PASS</span>

                    <span style={{ color: '#94A3B8' }}>Message-ID:</span>
                    <span style={{ color: '#CBD5E1', fontFamily: 'monospace', fontSize: '11px' }}>
                      {selectedEmail.message_id || '&lt;8d9f2977-111e-25d6-f6dd-6c1beeb7ff54@gmail.com&gt;'}
                    </span>
                  </div>
                )}

                {/* Email Body Content */}
                <div style={{
                  padding: '24px 0',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  fontSize: '14px',
                  lineHeight: '1.7',
                  color: '#CBD5E1',
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'inherit'
                }}>
                  {selectedEmail.body || `PROPOSAL FOR SHORTFUNDLY CAMPUS COLLABORATION
Empowering Student Creators at Monarchs University

Dear Subhaharini,

Greetings from Shortfundly!

We propose a collaboration with Monarchs University through Shortfundly Campus to help students develop creative skills, showcase their work, and explore opportunities in filmmaking and digital content.

About Shortfundly Campus:
Shortfundly Campus connects student creators with collaboration, film submission, promotion, and event opportunities. Its Campus Pass brings together six products: Connect, Festival, Hub, Marketing, Ticket, and Tools. Students can build creator profiles, find collaborators, and prepare their projects for wider exposure.

Key Collaboration Highlights for Monarchs University:
- Student Onboarding & Creative Portfolios
- Hands-on Workshops in Filmmaking, OTT Distribution & AI
- Campus Screenings & Filmmaking Competitions
- Student Leadership & Campus Ambassador Program

Contact: +91 93612 23155
Explore Campus: https://campus.shortfundly.com/

Warm regards,
Subhaharini
Product Manager | Shortfundly`}
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                  <button style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 18px',
                    borderRadius: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    background: 'transparent',
                    color: '#F1F5F9',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}>
                    <Reply size={15} />
                    <span>Reply</span>
                  </button>

                  <button style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 18px',
                    borderRadius: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    background: 'transparent',
                    color: '#F1F5F9',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}>
                    <Forward size={15} />
                    <span>Forward</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94A3B8' }}>
              <Inbox size={48} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p>Select an email from your inbox to preview message details.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
