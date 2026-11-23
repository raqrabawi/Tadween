import { useEffect, useState } from 'react'
import { db, redirectTo } from '../lib/db'
import { useStore } from '../lib/store'
import { I } from './Icon'
import { t } from '../lib/i18n'

// Official Google "G" mark, served by Google (not redrawn here).
const GOOGLE_MARK = 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg'

// Sign-in is Google only for now (email was switched off; phone codes are planned).
export function AuthButtons({ size = 'lg', verb = 'Continue' }: { size?: 'lg' | 'md'; verb?: 'Continue' | 'Sign in' | 'Sign up' }) {
  const [busy, setBusy] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const h = size === 'lg' ? 56 : 52

  const oauth = async (provider: 'apple' | 'google') => {
    setErr(null); setBusy(provider)
    const { error } = await db.auth.signInWithOAuth({ provider, options: { redirectTo: redirectTo() } })
    if (error) {
      setBusy(null)
      setErr(/not enabled|unsupported|provider/i.test(error.message)
        ? t('{provider} sign-in isn’t switched on yet.', { provider: provider === 'apple' ? 'Apple' : 'Google' })
        : error.message)
    }
  }

  return (
    <div className="stack" style={{ gap: 10 }}>
      <button className="btn google" style={{ height: h }} onClick={() => oauth('google')} disabled={!!busy}>
        <img src={GOOGLE_MARK} width={20} height={20} alt="" />{busy === 'google' ? t('Opening Google…') : t(verb + ' with Google')}
      </button>
      {err && <p role="alert" className="sub" style={{ textAlign: 'center', color: 'var(--red)' }}>{err}</p>}
    </div>
  )
}

/** Start Google sign-in; returns an error message or null (the page leaves for Google on success). */
export async function signInWithGoogle(): Promise<string | null> {
  const { error } = await db.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: redirectTo() } })
  if (!error) return null
  return /not enabled|unsupported|provider/i.test(error.message) ? t('{provider} sign-in isn’t switched on yet.', { provider: 'Google' }) : error.message
}

const SNOOZE_KEY = 'tadween-sync-snooze'
const snoozed = () => { try { return Date.now() < Number(localStorage.getItem(SNOOZE_KEY) || 0) } catch { return false } }

/**
 * Guests: a small snackbar suggesting sign-in to sync. Shows a few seconds after opening the app,
 * and again after they add something. Dismissing hides it for 3 days.
 */
export function SavePrompt() {
  const { guest, savePrompt, setSavePrompt } = useStore()
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  useEffect(() => {
    if (!guest || snoozed()) return
    const tm = window.setTimeout(() => setShow(true), 2500)
    return () => window.clearTimeout(tm)
  }, [guest])
  useEffect(() => { if (guest && savePrompt && !snoozed()) setShow(true) }, [guest, savePrompt])
  if (!guest || !show) return null
  const close = () => {
    setShow(false); setSavePrompt(false)
    try { localStorage.setItem(SNOOZE_KEY, String(Date.now() + 3 * 864e5)) } catch { /* private mode */ }
  }
  return (
    <div className="snack" role="status" aria-live="polite">
      <span className="snack-ic"><I n="cloud" s={18} /></span>
      <span className="grow" style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <span style={{ fontSize: 14, fontWeight: 700, lineHeight: '19px' }}>{t('Sign in to sync your data')}</span>
        <span style={{ fontSize: 12, lineHeight: '16px', opacity: .8 }}>{err ?? t('It’s saved on this phone. Sign in to keep it safe on every device.')}</span>
      </span>
      <button className="snack-go" disabled={busy} onClick={async () => { setBusy(true); const e = await signInWithGoogle(); if (e) { setErr(e); setBusy(false) } }}>{busy ? t('Opening…') : t('Sign in')}</button>
      <button className="snack-x" aria-label={t('Not now')} onClick={close}><I n="close" s={13} w={2.6} /></button>
    </div>
  )
}
