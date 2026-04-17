import { useState, useEffect } from 'react'
import { supabase } from './supabase'

const C = {
  dt: '#1A4A4A', mt: '#2A7A72', bt: '#3AADA0',
  lt: '#7DD4CC', pt: '#D6F0EE', sand: '#F5F0E8',
  sand2: '#EDE8DF', ink: '#1C2B2B', inkm: '#3D5252', inkl: '#7A9696',
}

const inp = (focused, error) => ({
  width: '100%',
  background: '#fff',
  border: '1px solid ' + (error ? '#ef4444' : focused ? C.bt : 'rgba(26,74,74,0.15)'),
  color: C.ink,
  padding: '13px 15px',
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 15,
  borderRadius: 8,
  outline: 'none',
  transition: 'border-color 0.2s',
  boxSizing: 'border-box',
})

function Field({ label, type = 'text', value, onChange, placeholder, error }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', fontSize: 12, color: C.inkl, letterSpacing: '0.5px', marginBottom: 7, fontFamily: "'DM Sans', sans-serif" }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={inp(focused, error)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {error && <div style={{ fontSize: 12, color: '#ef4444', marginTop: 5, fontFamily: "'DM Sans', sans-serif" }}>{error}</div>}
    </div>
  )
}

const Bird = () => (
  <svg width="26" height="19" viewBox="0 0 56 40" fill="none">
    <ellipse cx="28" cy="23" rx="15" ry="9" stroke={C.dt} strokeWidth="1.5" fill="none"/>
    <circle cx="40" cy="14" r="6" stroke={C.dt} strokeWidth="1.5" fill="none"/>
    <path d="M44 12 L52 9" stroke={C.dt} strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="23" y1="32" x2="21" y2="40" stroke={C.dt} strokeWidth="1.3" strokeLinecap="round"/>
    <line x1="31" y1="32" x2="29" y2="40" stroke={C.dt} strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
)

function SignUp({ onSwitch }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [serverError, setServerError] = useState('')

  const set = field => e => setForm(p => ({ ...p, [field]: e.target.value }))

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Your name is required.'
    if (!form.email.includes('@')) e.email = 'Enter a valid email address.'
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters.'
    if (form.password !== form.confirm) e.confirm = "Passwords don't match."
    return e
  }

  const submit = async () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setLoading(true)
    setServerError('')

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.name },
        emailRedirectTo: window.location.origin,
      },
    })

    setLoading(false)
    if (error) { setServerError(error.message); return }
    setDone(true)
  }

  if (done) {
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 44, marginBottom: 18 }}>✉</div>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: 32, color: C.dt, marginBottom: 12 }}>
          Check your inbox
        </h2>
        <p style={{ fontSize: 15, color: C.inkm, lineHeight: 1.7, fontWeight: 300, marginBottom: 20 }}>
          We sent a confirmation link to<br />
          <strong style={{ color: C.dt }}>{form.email}</strong>
        </p>
        <p style={{ fontSize: 13, color: C.inkl, lineHeight: 1.6 }}>
          Click the link in the email to activate your account.<br />
          Your 14-day free trial starts the moment you confirm.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 30 }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: 38, color: C.dt, marginBottom: 8, lineHeight: 1.1 }}>
          Start your free trial.
        </h1>
        <p style={{ fontSize: 14, color: C.inkl, fontWeight: 300 }}>14 days free. No credit card required.</p>
      </div>

      <Field label="Full name" value={form.name} onChange={set('name')} placeholder="Sarah Winters" error={errors.name} />
      <Field label="Work email" type="email" value={form.email} onChange={set('email')} placeholder="you@company.co.uk" error={errors.email} />
      <Field label="Password" type="password" value={form.password} onChange={set('password')} placeholder="At least 8 characters" error={errors.password} />
      <Field label="Confirm password" type="password" value={form.confirm} onChange={set('confirm')} placeholder="Repeat your password" error={errors.confirm} />

      {serverError && (
        <div style={{ background: '#FEE2E2', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '11px 14px', marginBottom: 16, fontSize: 13, color: '#991B1B', fontFamily: "'DM Sans', sans-serif" }}>
          {serverError}
        </div>
      )}

      <button
        onClick={submit}
        disabled={loading}
        style={{ width: '100%', background: loading ? C.lt : C.bt, color: '#fff', border: 'none', padding: '14px', fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', borderRadius: 8, marginBottom: 16, transition: 'background 0.2s' }}
      >
        {loading ? 'Creating your account...' : 'Create account'}
      </button>

      <div style={{ background: C.pt, border: '1px solid rgba(58,173,160,0.2)', borderRadius: 8, padding: '11px 15px', marginBottom: 22 }}>
        <p style={{ fontSize: 12, color: C.mt, lineHeight: 1.6, textAlign: 'center' }}>
          Your 14-day trial starts on confirmation. We will remind you before it ends.
        </p>
      </div>

      <p style={{ textAlign: 'center', fontSize: 13, color: C.inkl }}>
        Already have an account?{' '}
        <span onClick={onSwitch} style={{ color: C.bt, cursor: 'pointer', fontWeight: 500 }}>Sign in</span>
      </p>
    </div>
  )
}

function Login({ onSwitch }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const [forgot, setForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotFocused, setForgotFocused] = useState(false)

  const set = field => e => setForm(p => ({ ...p, [field]: e.target.value }))

  const submit = async () => {
    const e = {}
    if (!form.email.includes('@')) e.email = 'Enter a valid email address.'
    if (!form.password) e.password = 'Enter your password.'
    if (Object.keys(e).length) { setErrors(e); return }

    setLoading(true)
    setServerError('')

    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })

    setLoading(false)
    if (error) {
      setServerError(error.message === 'Invalid login credentials'
        ? 'Email or password is incorrect.'
        : error.message
      )
    }
    // On success, App.jsx picks up the session change automatically
  }

  const sendReset = async () => {
    if (!forgotEmail.includes('@')) return
    setForgotLoading(true)
    await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: window.location.origin + '/reset-password',
    })
    setForgotLoading(false)
    setForgotSent(true)
  }

  if (forgot) {
    return (
      <div>
        <button onClick={() => { setForgot(false); setForgotSent(false) }} style={{ background: 'none', border: 'none', color: C.inkl, cursor: 'pointer', fontSize: 13, marginBottom: 24, padding: 0, fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', gap: 6 }}>
          ← Back to sign in
        </button>
        {forgotSent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>✉</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: 30, color: C.dt, marginBottom: 12 }}>Check your inbox</h2>
            <p style={{ fontSize: 14, color: C.inkm, lineHeight: 1.7, fontWeight: 300 }}>If that address is registered, a reset link is on its way.</p>
          </div>
        ) : (
          <div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: 34, color: C.dt, marginBottom: 8 }}>Reset password</h2>
            <p style={{ fontSize: 14, color: C.inkl, marginBottom: 26, fontWeight: 300 }}>Enter your email and we will send a reset link.</p>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 12, color: C.inkl, letterSpacing: '0.5px', marginBottom: 7, fontFamily: "'DM Sans', sans-serif" }}>Email address</label>
              <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="you@company.co.uk"
                style={inp(forgotFocused, false)} onFocus={() => setForgotFocused(true)} onBlur={() => setForgotFocused(false)} />
            </div>
            <button onClick={sendReset} disabled={forgotLoading} style={{ width: '100%', background: C.bt, color: '#fff', border: 'none', padding: '13px', fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 500, cursor: 'pointer', borderRadius: 8 }}>
              {forgotLoading ? 'Sending...' : 'Send reset link'}
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 30 }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: 38, color: C.dt, marginBottom: 8, lineHeight: 1.1 }}>
          Welcome back.
        </h1>
        <p style={{ fontSize: 14, color: C.inkl, fontWeight: 300 }}>Sign in to your dunlin account.</p>
      </div>

      <Field label="Email address" type="email" value={form.email} onChange={set('email')} placeholder="you@company.co.uk" error={errors.email} />
      <Field label="Password" type="password" value={form.password} onChange={set('password')} placeholder="Your password" error={errors.password} />

      <div style={{ textAlign: 'right', marginBottom: 20, marginTop: -10 }}>
        <span onClick={() => setForgot(true)} style={{ fontSize: 13, color: C.bt, cursor: 'pointer' }}>Forgot password?</span>
      </div>

      {serverError && (
        <div style={{ background: '#FEE2E2', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '11px 14px', marginBottom: 16, fontSize: 13, color: '#991B1B', fontFamily: "'DM Sans', sans-serif" }}>
          {serverError}
        </div>
      )}

      <button onClick={submit} disabled={loading}
        style={{ width: '100%', background: loading ? C.lt : C.bt, color: '#fff', border: 'none', padding: '14px', fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', borderRadius: 8, marginBottom: 22, transition: 'background 0.2s' }}>
        {loading ? 'Signing in...' : 'Sign in'}
      </button>

      <p style={{ textAlign: 'center', fontSize: 13, color: C.inkl }}>
        No account yet?{' '}
        <span onClick={onSwitch} style={{ color: C.bt, cursor: 'pointer', fontWeight: 500 }}>Start free trial</span>
      </p>
    </div>
  )
}

export default function Auth() {
  const [screen, setScreen] = useState('login')

  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=DM+Sans:wght@300;400;500&display=swap'
    document.head.appendChild(link)

    // Fix browser autofill grey background on inputs
    const style = document.createElement('style')
    style.innerHTML = `
      input:-webkit-autofill,
      input:-webkit-autofill:hover,
      input:-webkit-autofill:focus {
        -webkit-box-shadow: 0 0 0px 1000px #ffffff inset !important;
        -webkit-text-fill-color: #1c2b2b !important;
        transition: background-color 5000s ease-in-out 0s;
      }
    `
    document.head.appendChild(style)
  }, [])

  const sidebar = (
    <div style={{ background: C.dt, width: 360, minHeight: '100vh', padding: '48px 40px', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <svg width="26" height="19" viewBox="0 0 56 40" fill="none">
          <ellipse cx="28" cy="23" rx="15" ry="9" stroke={C.sand} strokeWidth="1.5" fill="none"/>
          <circle cx="40" cy="14" r="6" stroke={C.sand} strokeWidth="1.5" fill="none"/>
          <path d="M44 12 L52 9" stroke={C.sand} strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="23" y1="32" x2="21" y2="40" stroke={C.sand} strokeWidth="1.3" strokeLinecap="round"/>
          <line x1="31" y1="32" x2="29" y2="40" stroke={C.sand} strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: 22, color: C.sand, letterSpacing: 1 }}>dunlin</span>
      </div>

      <div style={{ marginTop: 56 }}>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: 26, color: C.sand, lineHeight: 1.4, marginBottom: 28, fontStyle: 'italic' }}>
          "The calendar changed how I plan my week. I can see exactly who's coming up for renewal and get there before anyone else."
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 19, background: C.pt, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: C.mt, flexShrink: 0 }}>KM</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: C.sand }}>Karen M.</div>
            <div style={{ fontSize: 11, color: 'rgba(125,212,204,0.6)', marginTop: 1 }}>Centre Manager, Leeds</div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 'auto', paddingTop: 40 }}>
        {[
          ['14-day free trial', 'No credit card needed to start'],
          ['Email verified leads', 'Know before you dial'],
          ['Contract renewal dates', 'Call at exactly the right moment'],
        ].map(([title, desc]) => (
          <div key={title} style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 20, height: 20, borderRadius: 10, background: 'rgba(58,173,160,0.15)', border: '1px solid rgba(125,212,204,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
              <span style={{ fontSize: 10, color: C.lt }}>✓</span>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: C.sand }}>{title}</div>
              <div style={{ fontSize: 12, color: 'rgba(214,240,238,0.45)', marginTop: 1 }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar - hide on small screens */}
      <div style={{ display: 'flex', flexShrink: 0 }}>
        {sidebar}
      </div>

      {/* Form */}
      <div style={{ flex: 1, background: C.sand, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '48px 32px', minHeight: '100vh' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          {screen === 'signup'
            ? <SignUp onSwitch={() => setScreen('login')} />
            : <Login onSwitch={() => setScreen('signup')} />
          }
          <p style={{ textAlign: 'center', fontSize: 12, color: C.inkl, marginTop: 28, lineHeight: 1.7 }}>
            By continuing you agree to dunlin's{' '}
            <span style={{ color: C.bt, cursor: 'pointer' }}>Terms of Service</span>
            {' '}and{' '}
            <span style={{ color: C.bt, cursor: 'pointer' }}>Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  )
}
