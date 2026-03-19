import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Auth from './Auth'
import DunlinPro from './DunlinPro'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for auth code in URL (PKCE flow from email confirmation)
    const params = new URLSearchParams(window.location.search)
    const hasCode = params.has('code')

    if (hasCode) {
      // Let Supabase exchange the code for a session
      supabase.auth.exchangeCodeForSession(window.location.href).then(({ data, error }) => {
        if (data.session) {
          setSession(data.session)
          // Clean up URL
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

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#F5F0E8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <svg width="32" height="23" viewBox="0 0 56 40" fill="none" style={{ marginBottom: 16 }}>
            <ellipse cx="28" cy="23" rx="15" ry="9" stroke="#1A4A4A" strokeWidth="1.5" fill="none"/>
            <circle cx="40" cy="14" r="6" stroke="#1A4A4A" strokeWidth="1.5" fill="none"/>
            <path d="M44 12 L52 9" stroke="#1A4A4A" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="23" y1="32" x2="21" y2="40" stroke="#1A4A4A" strokeWidth="1.3" strokeLinecap="round"/>
            <line x1="31" y1="32" x2="29" y2="40" stroke="#1A4A4A" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          <div style={{ fontFamily: 'serif', fontSize: 14, color: '#7A9696', letterSpacing: 2 }}>
            loading...
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return <Auth />
  }

  return <DunlinPro session={session} />
}
