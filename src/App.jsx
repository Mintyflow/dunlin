import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Auth from './Auth'
import Dashboard from './Dashboard'
import DunlinPro from './DunlinPro'

// ── Shared App Footer ─────────────────────────────────────────────────────────
const C = {
  dt: '#1a4a4a', mt: '#2a7a72', bt: '#3aada0', lt: '#7dd4cc',
  sand: '#f5f0e8', ink: '#1c2b2b', inkl: '#7a9696',
}

function AppFooter() {
  const col = (title, links) => (
    <div key={title}>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 14 }}>{title}</div>
      {links.map(({ label, href }) => (
        <a key={label} href={href}
          style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', marginBottom: 10, transition: 'color 0.2s' }}
          onMouseOver={e => e.currentTarget.style.color = C.lt} onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}>
          {label}
        </a>
      ))}
    </div>
  )
  return (
    <div style={{ background: C.dt, marginTop: 0 }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 32px 28px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
        {col('Product', [
          { label: 'Home', href: '/' },
          { label: 'Features', href: '/#features' },
          { label: 'Pricing', href: '/#pricing' },
          { label: 'Product Overview', href: '/one-pager.html' },
        ])}
        {col('Company', [
          { label: 'Affiliate Programme', href: '/affiliate.html' },
          { label: 'Refer a Friend — earn £50', href: '/refer.html' },
          { label: 'Sitemap', href: '/sitemap.html' },
          { label: 'Contact us', href: 'mailto:hello@getdunlin.com' },
        ])}
        {col('Legal', [
          { label: 'Privacy Policy', href: '/privacy.html' },
          { label: 'Terms of Service', href: '/terms.html' },
          { label: 'Cookie Policy', href: '/cookies.html' },
          { label: 'GDPR', href: '/privacy.html#gdpr' },
        ])}
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>© 2026 Dunlin · Marvanova Ltd · All rights reserved</span>
        <a href="https://marvanova.com" target="_blank" rel="noopener noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none', opacity: 0.6, transition: 'opacity 0.2s' }}
          onMouseOver={e => e.currentTarget.style.opacity = '1'} onMouseOut={e => e.currentTarget.style.opacity = '0.6'}>
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: '#6a8a9a', letterSpacing: '0.08em' }}>Built by</span>
          <span style={{ fontFamily: 'Arial,sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em' }}>
            <span style={{ background: 'linear-gradient(90deg,#0066cc,#00aadd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>MARVA</span>
            <span style={{ color: '#8a9aaa', WebkitTextFillColor: '#8a9aaa' }}>NOVA</span>
          </span>
        </a>
      </div>
    </div>
  )
}

// ── Space Matcher — coming soon ───────────────────────────────────────────────
function OpportunityTool({ session, onBack }) {
  const C = {
    dt: '#1a4a4a', mt: '#2a7a72', bt: '#3aada0',
    lt: '#7dd4cc', pt: '#d6f0ee', sand: '#f5f0e8',
    ink: '#1c2b2b', inkm: '#3d5252', inkl: '#7a9696', white: '#ffffff',
  }
  const [notifyEmail, setNotifyEmail] = useState(session?.user?.email || '')
  const [notifySent, setNotifySent]   = useState(false)
  const [notifyLoading, setNotifyLoading] = useState(false)

  const handleNotify = async () => {
    if (!notifyEmail.includes('@')) return
    setNotifyLoading(true)
    await supabase.from('waitlist').upsert(
      { email: notifyEmail, tool: 'space_matcher', created_at: new Date().toISOString() },
      { onConflict: 'email,tool' }
    )
    setNotifyLoading(false)
    setNotifySent(true)
  }

  return (
    <div style={{ minHeight: '100vh', background: C.sand, fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div style={{ background: C.dt, padding: '0 28px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={onBack} style={{ background: 'rgba(58,173,160,0.15)', border: '1px solid rgba(58,173,160,0.35)', color: '#7dd4cc', cursor: 'pointer', fontSize: 12, padding: '5px 12px', fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', gap: 6, borderRadius: 6, fontWeight: 500 }}>
            ← Home
          </button>
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="22" height="15" viewBox="0 0 120 80" fill="none">
              <ellipse cx="62" cy="46" rx="28" ry="16" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" fill="none"/>
              <circle cx="88" cy="34" r="10" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" fill="none"/>
              <path d="M96 36 Q108 36 112 40" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
              <path d="M35 46 Q22 40 18 44" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
              <line x1="58" y1="60" x2="54" y2="72" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" strokeLinecap="round"/>
              <line x1="70" y1="61" x2="68" y2="72" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: 22, color: C.white, letterSpacing: '0.06em' }}>dunlin</span>
          </div>
        </div>
        <span style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.lt, opacity: 0.7 }}>Space Matcher</span>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '72px 32px', textAlign: 'center' }}>
        <svg width="72" height="48" viewBox="0 0 120 80" fill="none" style={{ marginBottom: 28 }}>
          <ellipse cx="62" cy="46" rx="28" ry="16" fill="rgba(42,122,114,0.12)" stroke={C.mt} strokeWidth="1.5"/>
          <circle cx="88" cy="34" r="10" fill="rgba(42,122,114,0.12)" stroke={C.mt} strokeWidth="1.5"/>
          <path d="M96 36 Q108 36 112 40" stroke={C.mt} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
          <path d="M35 46 Q22 40 18 44" stroke={C.mt} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
          <line x1="58" y1="60" x2="54" y2="72" stroke={C.inkl} strokeWidth="1.2" strokeLinecap="round"/>
          <line x1="70" y1="61" x2="68" y2="72" stroke={C.inkl} strokeWidth="1.2" strokeLinecap="round"/>
        </svg>

        <div style={{ fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.mt, marginBottom: 14 }}>Coming soon</div>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: 42, color: C.dt, lineHeight: 1.15, marginBottom: 16 }}>
          Space Matcher
        </h1>
        <p style={{ fontSize: 14, color: C.inkm, lineHeight: 1.8, fontWeight: 300, marginBottom: 36 }}>
          Capture a client brief, match them to available flex spaces, and track the opportunity from first contact through to signed deal — all in one place.
        </p>

        {/* Email capture */}
        {notifySent ? (
          <div style={{ background: C.pt, border: `1px solid rgba(58,173,160,0.25)`, borderRadius: 12, padding: '20px 24px', marginBottom: 32 }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>✓</div>
            <p style={{ fontSize: 14, color: C.mt, fontWeight: 500 }}>You're on the list.</p>
            <p style={{ fontSize: 13, color: C.inkl, marginTop: 4 }}>We'll email you the moment Space Matcher launches.</p>
          </div>
        ) : (
          <div style={{ marginBottom: 32 }}>
            <p style={{ fontSize: 13, color: C.inkl, marginBottom: 14 }}>Get notified when it launches:</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="email"
                value={notifyEmail}
                onChange={e => setNotifyEmail(e.target.value)}
                placeholder="your@email.com"
                style={{ flex: 1, background: C.white, border: `1px solid rgba(26,74,74,0.15)`, color: C.ink, padding: '12px 14px', fontFamily: "'DM Sans', sans-serif", fontSize: 14, borderRadius: 8, outline: 'none', boxSizing: 'border-box' }}
              />
              <button
                onClick={handleNotify}
                disabled={notifyLoading}
                style={{ background: C.dt, color: C.white, border: 'none', padding: '12px 20px', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap' }}
              >
                {notifyLoading ? '…' : 'Notify me'}
              </button>
            </div>
          </div>
        )}

        <button onClick={onBack} style={{ background: C.dt, border: 'none', color: '#fff', fontSize: 14, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", padding: '12px 28px', borderRadius: 8, fontWeight: 500 }}>
          ← Back to home
        </button>
      </div>

      {/* ── App Footer ── */}
      <AppFooter />
    </div>
  )
}

// ── Reset Password Screen ─────────────────────────────────────────────────────
function ResetPassword({ onDone }) {
  const C = { dt:'#1a4a4a', mt:'#2a7a72', bt:'#3aada0', lt:'#7dd4cc', pt:'#d6f0ee', sand:'#f5f0e8', ink:'#1c2b2b', inkm:'#3d5252', inkl:'#7a9696', white:'#ffffff' }
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [done, setDone]           = useState(false)

  const submit = async () => {
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirm) { setError("Passwords don't match."); return }
    setLoading(true); setError('')
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) { setError(error.message); return }
    setDone(true)
    setTimeout(onDone, 2000)
  }

  return (
    <div style={{ minHeight:'100vh', background:C.sand, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'DM Sans', sans-serif" }}>
      <div style={{ width:'100%', maxWidth:400, padding:'0 24px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:40 }}>
          <svg width="24" height="16" viewBox="0 0 120 80" fill="none">
            <ellipse cx="62" cy="46" rx="28" ry="16" stroke={C.dt} strokeWidth="1.5" fill="none"/>
            <circle cx="88" cy="34" r="10" stroke={C.dt} strokeWidth="1.5" fill="none"/>
            <path d="M96 36 Q108 36 112 40" stroke={C.dt} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
            <path d="M35 46 Q22 40 18 44" stroke={C.dt} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
            <line x1="58" y1="60" x2="54" y2="72" stroke={C.inkl} strokeWidth="1.2" strokeLinecap="round"/>
            <line x1="70" y1="61" x2="68" y2="72" stroke={C.inkl} strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <span style={{ fontFamily:"'Cormorant Garamond', serif", fontWeight:300, fontSize:22, color:C.dt, letterSpacing:'0.06em' }}>dunlin</span>
        </div>

        {done ? (
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:44, marginBottom:16 }}>✓</div>
            <h2 style={{ fontFamily:"'Cormorant Garamond', serif", fontWeight:300, fontSize:32, color:C.dt, marginBottom:12 }}>Password updated</h2>
            <p style={{ fontSize:14, color:C.inkl }}>Taking you to your dashboard…</p>
          </div>
        ) : (
          <div>
            <h1 style={{ fontFamily:"'Cormorant Garamond', serif", fontWeight:300, fontSize:38, color:C.dt, marginBottom:8, lineHeight:1.1 }}>Set new password.</h1>
            <p style={{ fontSize:14, color:C.inkl, marginBottom:30, fontWeight:300 }}>Choose a strong password for your account.</p>

            <div style={{ marginBottom:18 }}>
              <label style={{ display:'block', fontSize:12, color:C.inkl, letterSpacing:'0.5px', marginBottom:7 }}>New password</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters"
                style={{ width:'100%', background:'#fff', border:`1px solid rgba(26,74,74,0.15)`, color:C.ink, padding:'13px 15px', fontFamily:"'DM Sans', sans-serif", fontSize:15, borderRadius:8, outline:'none', boxSizing:'border-box' }}/>
            </div>
            <div style={{ marginBottom:18 }}>
              <label style={{ display:'block', fontSize:12, color:C.inkl, letterSpacing:'0.5px', marginBottom:7 }}>Confirm password</label>
              <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Repeat your password"
                style={{ width:'100%', background:'#fff', border:`1px solid rgba(26,74,74,0.15)`, color:C.ink, padding:'13px 15px', fontFamily:"'DM Sans', sans-serif", fontSize:15, borderRadius:8, outline:'none', boxSizing:'border-box' }}/>
            </div>

            {error && <div style={{ background:'#FEE2E2', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, padding:'11px 14px', marginBottom:16, fontSize:13, color:'#991B1B' }}>{error}</div>}

            <button onClick={submit} disabled={loading}
              style={{ width:'100%', background:loading?C.lt:C.bt, color:'#fff', border:'none', padding:'14px', fontFamily:"'DM Sans', sans-serif", fontSize:15, fontWeight:500, cursor:loading?'not-allowed':'pointer', borderRadius:8, transition:'background 0.2s' }}>
              {loading ? 'Saving…' : 'Set new password'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession]         = useState(null)
  const [loading, setLoading]         = useState(true)
  const [activeTool, setActiveTool]   = useState(null)
  const [resetting, setResetting]     = useState(false)

  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=DM+Sans:wght@300;400;500&display=swap'
    document.head.appendChild(link)

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      if (event === 'PASSWORD_RECOVERY') {
        setResetting(true)  // show the set-new-password screen
      }
      if (!session && event !== 'PASSWORD_RECOVERY') setActiveTool(null)
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

  // Password recovery flow
  if (resetting) return <ResetPassword onDone={() => setResetting(false)} />

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
