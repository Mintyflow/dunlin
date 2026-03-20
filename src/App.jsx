import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Auth from './Auth'
import DunlinPro from './DunlinPro'
import Paywall from './Paywall'
import PrivacyPolicy from './PrivacyPolicy'
import TermsOfService from './TermsOfService'

const TRIAL_DAYS = 14

function daysLeftOnTrial(trialStarted) {
  if (!trialStarted) return TRIAL_DAYS
  const start = new Date(trialStarted)
  const now = new Date()
  const elapsed = Math.floor((now - start) / (1000 * 60 * 60 * 24))
  return Math.max(0, TRIAL_DAYS - elapsed)
}

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [page, setPage] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.has('code')) {
      supabase.auth.exchangeCodeForSession(window.location.href).then(({ data }) => {
        if (data.session) {
          setSession(data.session)
          window.history.replaceState(null, '', '/')
        }
        setLoading(false)
      })
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session)
        setLoading(false)
      })
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session?.user?.id) { setProfile(null); return }
    supabase.from('profiles').select('*').eq('id', session.user.id).single()
      .then(({ data }) => { if (data) setProfile(data) })
  }, [session])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <svg width="32" height="23" viewBox="0 0 56 40" fill="none" style={{ marginBottom: 16 }}>
            <ellipse cx="28" cy="23" rx="15" ry="9" stroke="#1A4A4A" strokeWidth="1.5" fill="none"/>
            <circle cx="40" cy="14" r="6" stroke="#1A4A4A" strokeWidth="1.5" fill="none"/>
            <path d="M44 12 L52 9" stroke="#1A4A4A" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="23" y1="32" x2="21" y2="40" stroke="#1A4A4A" strokeWidth="1.3" strokeLinecap="round"/>
            <line x1="31" y1="32" x2="29" y2="40" stroke="#1A4A4A" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, color: '#7A9696', letterSpacing: 2, fontWeight: 300 }}>loading...</div>
        </div>
      </div>
    )
  }

  if (page === 'privacy') return <PrivacyPolicy onBack={() => setPage(null)}/>
  if (page === 'terms') return <TermsOfService onBack={() => setPage(null)}/>

  if (!session) return <Auth />

  const daysLeft = daysLeftOnTrial(profile?.trial_started)
  const isPaid = ['paid','starter','growth','pro','team'].includes(profile?.plan)
  const trialExpired = daysLeft <= 0 && !isPaid

  if (page === 'paywall' || trialExpired) {
    return (
      <Paywall
        daysLeft={daysLeft}
        onPrivacy={() => setPage('privacy')}
        onTerms={() => setPage('terms')}
      />
    )
  }

  return (
    <div>
      {!isPaid && daysLeft <= 3 && daysLeft > 0 && (
        <div style={{ background: '#ef4444', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <span style={{ fontSize: 13, color: '#fff', fontFamily: "'DM Sans',sans-serif" }}>
            {daysLeft === 1 ? '1 day left on your trial.' : daysLeft + ' days left on your trial.'} Upgrade to keep your data.
          </span>
          <button onClick={() => setPage('paywall')} style={{ background: '#fff', color: '#ef4444', border: 'none', padding: '6px 16px', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", fontWeight: 500 }}>
            Upgrade now
          </button>
        </div>
      )}
      <DunlinPro
        session={session}
        daysLeft={daysLeft}
        isPaid={isPaid}
        onUpgrade={() => setPage('paywall')}
        onPrivacy={() => setPage('privacy')}
        onTerms={() => setPage('terms')}
      />
    </div>
  )
}
