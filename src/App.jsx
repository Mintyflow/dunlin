import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Auth from './Auth'
import Dashboard from './Dashboard'
import DunlinPro from './DunlinPro'

// ── Placeholder for New Lease Opportunity tool (coming soon) ──────────────────
function OpportunityTool({ session, onBack }) {
  const C = {
    dt: '#1a4a4a', mt: '#2a7a72', bt: '#3aada0',
    lt: '#7dd4cc', pt: '#d6f0ee', sand: '#f5f0e8',
    ink: '#1c2b2b', inkm: '#3d5252', inkl: '#7a9696', white: '#ffffff',
  }

  return (
    <div style={{ minHeight: '100vh', background: C.sand, fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div style={{ background: C.dt, padding: '0 28px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={onBack}
            style={{ background: 'none', border: 'none', color: 'rgba(125,212,204,0.6)', cursor: 'pointer', fontSize: 13, padding: 0, fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', gap: 6 }}
          >
            ← back
          </button>
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="22" height="15" viewBox="0 0 120 80" fill="none">
              <ellipse cx="62" cy="46" rx="28" ry="16" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" fill="none"/>
              <circle cx="88" cy="34" r="10" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" fill="none"/>
              <path d="M96 36 Q108 36 112 40" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
            </svg>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: 22, color: C.white, letterSpacing: '0.06em' }}>dunlin</span>
          </div>
        </div>
        <span style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.lt, opacity: 0.7 }}>Space Matcher</span>
      </div>

      {/* Coming soon body */}
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '80px 32px', textAlign: 'center' }}>
        <svg width="72" height="48" viewBox="0 0 120 80" fill="none" style={{ marginBottom: 32 }}>
          <ellipse cx="62" cy="46" rx="28" ry="16" fill="rgba(42,122,114,0.12)" stroke={C.mt} strokeWidth="1.5"/>
          <circle cx="88" cy="34" r="10" fill="rgba(42,122,114,0.12)" stroke={C.mt} strokeWidth="1.5"/>
          <path d="M96 36 Q108 36 112 40" stroke={C.mt} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
          <path d="M35 46 Q22 40 18 44" stroke={C.mt} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
          <line x1="58" y1="60" x2="54" y2="72" stroke={C.inkl} strokeWidth="1.2" strokeLinecap="round"/>
          <line x1="54" y1="72" x2="48" y2="74" stroke={C.inkl} strokeWidth="1.2" strokeLinecap="round"/>
          <line x1="70" y1="61" x2="68" y2="72" stroke={C.inkl} strokeWidth="1.2" strokeLinecap="round"/>
          <line x1="68" y1="72" x2="62" y2="74" stroke={C.inkl} strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
        <div style={{ fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.mt, marginBottom: 16 }}>Coming soon</div>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: 42, color: C.dt, lineHeight: 1.15, marginBottom: 20 }}>
          Space Matcher
        </h1>
        <p style={{ fontSize: 14, color: C.inkm, lineHeight: 1.8, fontWeight: 300, marginBottom: 40 }}>
          Capture a client brief, match them to available flex spaces, and track the opportunity all the way through to a signed deal — in one place.
        </p>
        <div style={{ background: C.pt, border: `1px solid rgba(58,173,160,0.2)`, borderRadius: 12, padding: '20px 24px', marginBottom: 32 }}>
          <p style={{ fontSize: 13, color: C.mt, lineHeight: 1.7 }}>
            This tool is in development. In the meantime, use <strong>Contact Search</strong> to build your pipeline of leads whose leases are coming up for renewal.
          </p>
        </div>
        <button
          onClick={onBack}
          style={{ background: C.dt, color: C.white, border: 'none', padding: '13px 32px', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.02em' }}
        >
          ← Back to tools
        </button>
      </div>
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession]     = useState(null)
  const [loading, setLoading]     = useState(true)
  const [activeTool, setActiveTool] = useState(null) // null = dashboard

  useEffect(() => {
    // Load fonts
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=DM+Sans:wght@300;400;500&display=swap'
    document.head.appendChild(link)

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (!session) setActiveTool(null) // reset on logout
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f0e8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <svg width="40" height="27" viewBox="0 0 120 80" fill="none" style={{ marginBottom: 20 }}>
            <ellipse cx="62" cy="46" rx="28" ry="16" stroke="#1a4a4a" strokeWidth="1.5" fill="none"/>
            <circle cx="88" cy="34" r="10" stroke="#1a4a4a" strokeWidth="1.5" fill="none"/>
            <path d="M96 36 Q108 36 112 40" stroke="#1a4a4a" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
            <path d="M35 46 Q22 40 18 44" stroke="#1a4a4a" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
            <line x1="58" y1="60" x2="54" y2="72" stroke="#7a9696" strokeWidth="1.2" strokeLinecap="round"/>
            <line x1="70" y1="61" x2="68" y2="72" stroke="#7a9696" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, color: '#7a9696', letterSpacing: '0.2em' }}>
            loading…
          </div>
        </div>
      </div>
    )
  }

  // Not logged in → auth screen
  if (!session) return <Auth />

  // Logged in, tool selected
  if (activeTool === 'search') {
    return <DunlinPro session={session} onBack={() => setActiveTool(null)} />
  }

  if (activeTool === 'opportunity') {
    return <OpportunityTool session={session} onBack={() => setActiveTool(null)} />
  }

  // Logged in, no tool selected → dashboard
  return <Dashboard session={session} onSelect={setActiveTool} />
}
