import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { db } from '../lib/db'
import { Back } from '../components/ui'
import { I } from '../components/Icon'
import { Tabs } from '../components/Tabs'
import { t } from '../lib/i18n'

const okEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim())

/** Email + password sign-in and sign-up. On success the session arrives and the app moves on (Set up for new accounts). */
export default function EmailAuth() {
  const [q] = useSearchParams()
  const [mode, setMode] = useState<'in' | 'up'>(q.get('mode') === 'up' ? 'up' : 'in')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const ok = okEmail(email) && pw.length >= 8 && (mode === 'in' || name.trim().length > 0)

  const friendly = (m: string) =>
    /invalid|credential|password/i.test(m) && mode === 'in' ? t('Wrong email or password.')
      : /exist|already/i.test(m) ? t('An account with this email already exists. Sign in instead.')
        : /rate|many/i.test(m) ? t('Too many tries. Wait a minute and try again.')
          : m

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ok || busy) return
    setErr(null); setBusy(true)
    const r = mode === 'up'
      ? await db.auth.signUp({ email: email.trim(), password: pw, options: { data: { displayName: name.trim() } } })
      : await db.auth.signInWithPassword({ email: email.trim(), password: pw })
    setBusy(false)
    if (r.error) setErr(friendly(r.error.message))
  }

  const forgot = async () => {
    if (!okEmail(email)) { setErr(t('Type your email first, then tap “Forgot password?”.')); return }
    setErr(null)
    const { error } = await db.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin + window.location.pathname })
    if (error) setErr(friendly(error.message)); else setSent(true)
  }

  return (
    <main className="screen col">
      <div className="hd"><Back to="/welcome" /></div>
      <h1 className="h1 mt24" style={{ fontSize: 34, lineHeight: '40px' }}>{mode === 'in' ? t('Welcome back.') : t('Create your account.')}</h1>
      <p className="sub mt8" style={{ fontSize: 16 }}>{mode === 'in' ? t('Pick up right where you left off.') : t('Keep your notes, lists and calendar safe on every device.')}</p>

      <Tabs active={mode} className="mt24" role="tablist" aria-label={t('Sign in or create account')}>
        <button role="tab" aria-selected={mode === 'in'} className={mode === 'in' ? 'on' : ''} onClick={() => { setMode('in'); setErr(null) }}>{t('Sign in')}</button>
        <button role="tab" aria-selected={mode === 'up'} className={mode === 'up' ? 'on' : ''} onClick={() => { setMode('up'); setErr(null) }}>{t('Create account')}</button>
      </Tabs>

      <form onSubmit={submit} className="mt20">
        <div className="form">
          {mode === 'up' && <label className="frow"><span className="fl">{t('Name')}</span><input className="inp" autoComplete="name" placeholder={t('Your name')} value={name} onChange={(e) => setName(e.target.value)} /></label>}
          <label className="frow"><span className="fl">{t('Email')}</span><input className="inp" type="email" inputMode="email" autoComplete="email" dir="ltr" placeholder={t('you@example.com')} value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <label className="frow"><span className="fl">{t('Password')}</span>
            <input className="inp" type={show ? 'text' : 'password'} dir="ltr" autoComplete={mode === 'up' ? 'new-password' : 'current-password'} placeholder={mode === 'up' ? t('At least 8 characters') : ''} value={pw} onChange={(e) => setPw(e.target.value)} />
            <button type="button" className="ib sm" style={{ background: 'transparent' }} aria-label={show ? t('Hide password') : t('Show password')} onClick={() => setShow(!show)}><I n={show ? 'eyeoff' : 'eye'} s={16} /></button>
          </label>
        </div>
        {err && <p role="alert" className="sub mt12" style={{ color: 'var(--red)' }}>{err}</p>}
        {sent && <p role="status" className="sub mt12">{t('If that email has an account, we sent a link to reset the password.')}</p>}
        <button type="submit" className="btn pri mt20" disabled={!ok || busy}>{busy ? t('One moment…') : mode === 'in' ? t('Sign in') : t('Create account')}<I n="next" s={16} w={2.6} /></button>
      </form>
      {mode === 'in' && <button className="lnk mt16" style={{ alignSelf: 'center' }} onClick={forgot}>{t('Forgot password?')}</button>}
    </main>
  )
}
