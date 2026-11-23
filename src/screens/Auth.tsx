import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { db, redirectTo } from '../lib/db'
import { Back } from '../components/ui'
import { I } from '../components/Icon'
import { AuthButtons } from '../components/SignIn'
import { t } from '../lib/i18n'

const EMAIL_KEY = 'tadween-auth-email'
export const NAME_KEY = 'tadween-pending-name'
const okEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim())
const store = (k: string, v: string) => { try { sessionStorage.setItem(k, v) } catch { /* private mode */ } }
const read = (k: string) => { try { return sessionStorage.getItem(k) ?? '' } catch { return '' } }

function Steps({ at }: { at: 1 | 2 | 3 }) {
  return (
    <span style={{ display: 'flex', gap: 6 }} role="img" aria-label={t('Step {n} of 3', { n: at })}>
      {[1, 2, 3].map((i) => <span key={i} style={{ width: i === at ? 24 : 6, height: 6, borderRadius: 3, background: i === at ? 'var(--acc)' : 'var(--line)' }} />)}
    </span>
  )
}

function Divider() {
  return <div className="cap" style={{ margin: '24px 4px 16px', display: 'flex', alignItems: 'center', gap: 12 }}><span style={{ flex: 1, height: 1, background: 'var(--line)' }} />{t('or with email')}<span style={{ flex: 1, height: 1, background: 'var(--line)' }} /></div>
}

/** Sends the 6-digit code, then moves to the code screen. */
function useSendCode(mode: 'login' | 'register') {
  const nav = useNavigate()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const send = async (email: string) => {
    setErr(null); setBusy(true)
    const { error } = await db.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: redirectTo() } })
    setBusy(false)
    if (error) { setErr(/rate|many/i.test(error.message) ? t('Too many tries. Wait a minute and try again.') : error.message); return }
    store(EMAIL_KEY, email.trim())
    nav('/auth/verify', { state: { email: email.trim(), mode } })
  }
  return { send, busy, err }
}

export function Login() {
  const [email, setEmail] = useState(read(EMAIL_KEY))
  const { send, busy, err } = useSendCode('login')
  return (
    <main className="screen col">
      <div className="hd"><Back to="/welcome" /></div>
      <h1 className="h1 mt24" style={{ fontSize: 36, lineHeight: '42px' }}>{t('Welcome')}<br /><em>{t('back.')}</em></h1>
      <p className="sub mt8" style={{ fontSize: 16 }}>{t('Pick up right where you left off.')}</p>
      <div className="mt24"><AuthButtons verb="Sign in" email={false} /></div>
      <Divider />
      <form onSubmit={(e) => { e.preventDefault(); if (okEmail(email)) send(email) }}>
        <div className="form"><label className="frow"><span className="fl">{t('Email')}</span><input className="inp" type="email" inputMode="email" autoComplete="email" placeholder={t('you@example.com')} value={email} onChange={(e) => setEmail(e.target.value)} /></label></div>
        <p className="ffoot">{t('We’ll email you a 6-digit code. No password to remember.')}</p>
        {err && <p role="alert" className="sub mt8" style={{ color: 'var(--red)' }}>{err}</p>}
        <button type="submit" className="btn pri mt20" disabled={!okEmail(email) || busy}>{busy ? t('Sending…') : t('Send code')}<I n="next" s={16} w={2.6} /></button>
      </form>
      <p className="sub mtauto" style={{ textAlign: 'center', fontSize: 15, paddingTop: 20 }}>{t('New to Tadween?')} <Link to="/auth/register" style={{ color: 'var(--acc)', fontWeight: 700 }}>{t('Create account')}</Link></p>
    </main>
  )
}

export function Register() {
  const [name, setName] = useState(read(NAME_KEY))
  const [email, setEmail] = useState(read(EMAIL_KEY))
  const { send, busy, err } = useSendCode('register')
  const go = () => { if (!okEmail(email)) return; store(NAME_KEY, name.trim()); send(email) }
  return (
    <main className="screen col">
      <div className="hd"><Back to="/welcome" /><Steps at={1} /></div>
      <h1 className="h1 mt24" style={{ fontSize: 36, lineHeight: '42px' }}>{t('Start your')}<br /><em>{t('Tadween.')}</em></h1>
      <p className="sub mt8" style={{ fontSize: 16 }}>{t('The fastest way in is one tap.')}</p>
      <div className="mt24"><AuthButtons verb="Sign up" email={false} /></div>
      <Divider />
      <form onSubmit={(e) => { e.preventDefault(); go() }}>
        <div className="form">
          <label className="frow"><span className="fl">{t('Name')}</span><input className="inp" autoComplete="name" placeholder={t('Your name')} value={name} onChange={(e) => setName(e.target.value)} /></label>
          <label className="frow"><span className="fl">{t('Email')}</span><input className="inp" type="email" inputMode="email" autoComplete="email" placeholder={t('you@example.com')} value={email} onChange={(e) => setEmail(e.target.value)} />{okEmail(email) && <span style={{ color: 'var(--grn)' }} aria-hidden="true"><I n="check" s={16} w={3} /></span>}</label>
        </div>
        <p className="ffoot">{t('We’ll email you a 6-digit code. No password to remember.')}</p>
        {err && <p role="alert" className="sub mt8" style={{ color: 'var(--red)' }}>{err}</p>}
        <button type="submit" className="btn pri mt20" disabled={!okEmail(email) || busy}>{busy ? t('Sending…') : t('Email me a code')}<I n="next" s={16} w={2.6} /></button>
      </form>
      <p className="sub mtauto" style={{ textAlign: 'center', fontSize: 15, paddingTop: 20 }}>{t('Have an account?')} <Link to="/auth/login" style={{ color: 'var(--acc)', fontWeight: 700 }}>{t('Sign in')}</Link></p>
    </main>
  )
}

export function Verify() {
  const loc = useLocation()
  const nav = useNavigate()
  const st = (loc.state ?? {}) as { email?: string; mode?: 'login' | 'register' }
  const email = st.email ?? read(EMAIL_KEY)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [wait, setWait] = useState(30)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => { if (!email) nav('/auth/login', { replace: true }) }, [email, nav])
  useEffect(() => { if (wait <= 0) return; const t = setTimeout(() => setWait(wait - 1), 1000); return () => clearTimeout(t) }, [wait])

  const verify = async (c = code) => {
    if (c.length < 6 || busy) return
    setErr(null); setBusy(true)
    const { error } = await db.auth.verifyOtp({ email, token: c, type: 'email' })
    setBusy(false)
    // On success the session arrives and the app moves on (to Set up for new accounts)
    if (error) { setErr(t('That code didn’t work. Check it, or send a new one.')); setCode(''); input.current?.focus() }
  }
  const resend = async () => {
    setErr(null); setWait(30)
    const { error } = await db.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo() } })
    if (error) setErr(error.message)
  }

  return (
    <main className="screen col">
      <div className="hd"><Back to={st.mode === 'login' ? '/auth/login' : '/auth/register'} />{st.mode !== 'login' && <Steps at={2} />}</div>
      <span className="vorb" style={{ width: 96, height: 96, margin: '32px auto 0' }} aria-hidden="true"><I n="mail" s={36} w={1.8} /></span>
      <h1 className="h1 mt24" style={{ textAlign: 'center', fontSize: 30, lineHeight: '36px' }}>{t('Check your messages')}</h1>
      <p className="sub mt8" style={{ textAlign: 'center', fontSize: 16, lineHeight: '23px' }}>{t('Enter the 6-digit code we emailed to')}<br /><strong style={{ color: 'var(--ink)', fontWeight: 600 }}>{email}</strong></p>

      <label style={{ position: 'relative', marginTop: 32, display: 'block' }}>
        <span className="sr">{t('6-digit code')}</span>
        <span aria-hidden="true" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0,1fr))', gap: 8 }}>
          {Array.from({ length: 6 }, (_, i) => (
            <span key={i} className="fld" style={{ height: 60, borderRadius: 12, padding: 0, justifyContent: 'center', fontSize: 26, fontWeight: 600, boxShadow: i === Math.min(code.length, 5) ? 'var(--edge), 0 0 0 2px var(--acc)' : undefined }}>{code[i] ?? ''}</span>
          ))}
        </span>
        <input ref={input} autoFocus inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code}
          onChange={(e) => { const c = e.target.value.replace(/\D/g, '').slice(0, 6); setCode(c); if (c.length === 6) verify(c) }}
          style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', fontSize: 16 }} />
      </label>
      <p className="sub mt12" style={{ textAlign: 'center', fontSize: 13 }}>{t('The code expires in a few minutes.')}</p>
      {err && <p role="alert" className="sub mt8" style={{ textAlign: 'center', color: 'var(--red)' }}>{err}</p>}
      <div className="mt16" style={{ display: 'flex', justifyContent: 'center' }}>
        {wait > 0
          ? <span role="status" className="sub num" style={{ fontSize: 15 }}>{t('Resend code in {time}', { time: '0:' + String(wait).padStart(2, '0') })}</span>
          : <button className="btn line" style={{ padding: '0 20px', color: 'var(--acc)', width: 'auto' }} onClick={resend}>{t('Resend code')}</button>}
      </div>
      <button className="btn pri mtauto" disabled={code.length < 6 || busy} onClick={() => verify()}>{busy ? t('Checking…') : t('Verify')}<I n="next" s={16} w={2.6} /></button>
    </main>
  )
}
