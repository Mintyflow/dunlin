import { useEffect } from 'react'
import { supabase } from './supabase'

const C = {
  dt:   '#1a4a4a',
  mt:   '#2a7a72',
  bt:   '#3aada0',
  lt:   '#7dd4cc',
  pt:   '#d6f0ee',
  mist: '#f0f9f8',
  sand: '#f5f0e8',
  ink:  '#1c2b2b',
  inkm: '#3d5252',
  inkl: '#7a9696',
  white:'#ffffff',
}

const BirdDark = ({ size = 56 }) => (
  <svg width={size} height={Math.round(size * 0.67)} viewBox="0 0 120 80" fill="none">
    <ellipse cx="62" cy="46" rx="28" ry="16" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.75)" strokeWidth="1.5"/>
    <circle cx="88" cy="34" r="10" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.75)" strokeWidth="1.5"/>
    <path d="M96 36 Q108 36 112 40" stroke="rgba(255,255,255,0.75)" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    <path d="M35 46 Q22 40 18 44" stroke="rgba(255,255,255,0.75)" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    <line x1="58" y1="60" x2="54" y2="72" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" strokeLinecap="round"/>
    <line x1="54" y1="72" x2="48" y2="74" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" strokeLinecap="round"/>
    <line x1="54" y1="72" x2="56" y2="76" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" strokeLinecap="round"/>
    <line x1="70" y1="61" x2="68" y2="72" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" strokeLinecap="round"/>
    <line x1="68" y1="72" x2="62" y2="74" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" strokeLinecap="round"/>
    <line x1="68" y1="72" x2="70" y2="76" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M40 44 Q62 38 82 42" stroke="rgba(255,255,255,0.25)" strokeWidth="1" strokeLinecap="round" fill="none"/>
  </svg>
)

const BirdLight = ({ size = 56 }) => (
  <svg width={size} height={Math.round(size * 0.67)} viewBox="0 0 120 80" fill="none">
    <ellipse cx="62" cy="46" rx="28" ry="16" fill="rgba(42,122,114,0.1)" stroke={C.mt} strokeWidth="1.5"/>
    <circle cx="88" cy="34" r="10" fill="rgba(42,122,114,0.1)" stroke={C.mt} strokeWidth="1.5"/>
    <path d="M96 36 Q108 36 112 40" stroke={C.mt} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    <path d="M35 46 Q22 40 18 44" stroke={C.mt} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    <line x1="58" y1="60" x2="54" y2="72" stroke={C.inkl} strokeWidth="1.2" strokeLinecap="round"/>
    <line x1="54" y1="72" x2="48" y2="74" stroke={C.inkl} strokeWidth="1.2" strokeLinecap="round"/>
    <line x1="54" y1="72" x2="56" y2="76" stroke={C.inkl} strokeWidth="1.2" strokeLinecap="round"/>
    <line x1="70" y1="61" x2="68" y2="72" stroke={C.inkl} strokeWidth="1.2" strokeLinecap="round"/>
    <line x1="68" y1="72" x2="62" y2="74" stroke={C.inkl} strokeWidth="1.2" strokeLinecap="round"/>
    <line x1="68" y1="72" x2="70" y2="76" stroke={C.inkl} strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M40 44 Q62 38 82 42" stroke="rgba(42,122,114,0.3)" strokeWidth="1" strokeLinecap="round" fill="none"/>
  </svg>
)

export default function Dashboard({ session, onSelect }) {
  const email = session?.user?.email || ''
  const name  = session?.user?.user_metadata?.full_name || email.split('@')[0]

  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap'
    document.head.appendChild(link)
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div style={{ minHeight: '100vh', background: C.sand, fontFamily: "'DM Sans', sans-serif", color: C.ink }}>

      {/* ── Top nav ── */}
      <div style={{ background: C.dt, padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <BirdDark size={32} />
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: 26, color: C.white, letterSpacing: '0.08em' }}>
            dunlin
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <span style={{ fontSize: 13, color: 'rgba(214,240,238,0.6)' }}>{name}</span>
          <button
            onClick={signOut}
            style={{ background: 'none', border: '1px solid rgba(125,212,204,0.25)', color: C.lt, fontSize: 12, padding: '6px 16px', borderRadius: 6, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.04em' }}
          >
            Sign out
          </button>
        </div>
      </div>

      {/* ── Hero band ── */}
      <div style={{ background: C.dt, padding: '48px 32px 64px', position: 'relative', overflow: 'hidden' }}>
        {/* Subtle radial glow */}
        <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(58,173,160,0.12) 0%, transparent 70%)', top: -200, right: -100, pointerEvents: 'none' }} />
        <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative' }}>
          <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.lt, opacity: 0.75, marginBottom: 14 }}>
            Lease Intelligence Platform
          </div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: 52, color: C.white, lineHeight: 1.1, marginBottom: 16 }}>
            Good morning, {name.split(' ')[0]}.
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(214,240,238,0.55)', fontWeight: 300, maxWidth: 500 }}>
            Select a tool to get started. Each one is built to help you find the right opportunity at exactly the right moment.
          </p>
        </div>
      </div>

      {/* ── Wave separator ── */}
      <div style={{ background: C.dt, marginBottom: 0 }}>
        <svg viewBox="0 0 1440 40" fill="none" style={{ display: 'block', width: '100%' }}>
          <path d="M0 0 Q360 40 720 20 Q1080 0 1440 30 L1440 40 L0 40 Z" fill={C.sand}/>
        </svg>
      </div>

      {/* ── Tool cards ── */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '48px 24px 80px' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.inkl, marginBottom: 32, textAlign: 'center' }}>
          Your tools
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24 }}>

          {/* ── Card 1: DARK (teal-deep) ── Contact Search */}
          <button
            onClick={() => onSelect('search')}
            style={{
              background: C.dt,
              border: 'none',
              borderRadius: 20,
              padding: '40px 36px',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 4px 24px rgba(26,74,74,0.18)',
              display: 'flex',
              flexDirection: 'column',
              gap: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(26,74,74,0.28)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(26,74,74,0.18)' }}
          >
            <div style={{ marginBottom: 28 }}>
              <BirdDark size={52} />
            </div>
            <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.lt, opacity: 0.75, marginBottom: 10 }}>
              Tool 01
            </div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: 34, color: C.white, lineHeight: 1.15, marginBottom: 16 }}>
              Renewal Radar
            </h2>
            <p style={{ fontSize: 13, color: 'rgba(214,240,238,0.55)', lineHeight: 1.7, fontWeight: 300, marginBottom: 32, flex: 1 }}>
              Find the right decision-makers — Office Managers, Facilities Directors, Operations leads — before their lease expires. Sorted by renewal urgency so you call at exactly the right moment.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.lt, fontSize: 13, fontWeight: 500 }}>
              <span>Open tool</span>
              <span style={{ fontSize: 18, lineHeight: 1 }}>→</span>
            </div>
          </button>

          {/* ── Card 2: LIGHT (sand/white) ── New Lease Opportunity */}
          <button
            onClick={() => onSelect('opportunity')}
            style={{
              background: C.white,
              border: `2px solid ${C.pt}`,
              borderRadius: 20,
              padding: '40px 36px',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
              boxShadow: '0 4px 24px rgba(26,74,74,0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(26,74,74,0.14)'; e.currentTarget.style.borderColor = C.bt }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(26,74,74,0.08)'; e.currentTarget.style.borderColor = C.pt }}
          >
            <div style={{ marginBottom: 28 }}>
              <BirdLight size={52} />
            </div>
            <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.mt, marginBottom: 10 }}>
              Tool 02
            </div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: 34, color: C.dt, lineHeight: 1.15, marginBottom: 16 }}>
              Space Matcher
            </h2>
            <p style={{ fontSize: 13, color: C.inkm, lineHeight: 1.7, fontWeight: 300, marginBottom: 32, flex: 1 }}>
              Capture a client brief — location, size, budget, and flex requirements — and build a shortlist of matching spaces. Track the opportunity from first contact through to signed deal.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.mt, fontSize: 13, fontWeight: 500 }}>
              <span>Open tool</span>
              <span style={{ fontSize: 18, lineHeight: 1 }}>→</span>
            </div>
          </button>

        </div>

        {/* ── Footer note ── */}
        <p style={{ textAlign: 'center', fontSize: 12, color: C.inkl, marginTop: 52, lineHeight: 1.7 }}>
          More tools coming soon —{' '}
          <span style={{ color: C.bt, cursor: 'pointer' }}>send us a request</span>
        </p>
      </div>
    </div>
  )
}
