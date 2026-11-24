import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import { I } from './Icon'
import { t } from '../lib/i18n'

// Sign-in is email + password (Google was disconnected; phone codes are planned).
export function AuthButtons({ size = 'lg' }: { size?: 'lg' | 'md' }) {
  const h = size === 'lg' ? 56 : 52
  return (
    <div className="stack" style={{ gap: 10 }}>
      <Link to="/auth/email?mode=up" className="btn pri" style={{ height: h }}><I n="mail" s={17} />{t('Create account')}</Link>
      <Link to="/auth/email" className="btn line" style={{ height: h }}>{t('I already have an account')}</Link>
    </div>
  )
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
  const nav = useNavigate()
  const loc = useLocation()
  useEffect(() => {
    if (!guest || snoozed()) return
    const tm = window.setTimeout(() => setShow(true), 2500)
    return () => window.clearTimeout(tm)
  }, [guest])
  useEffect(() => { if (guest && savePrompt && !snoozed()) setShow(true) }, [guest, savePrompt])
  // Not on the sign-in screens themselves
  if (!guest || !show || /^\/(welcome|auth)/.test(loc.pathname)) return null
  const close = () => {
    setShow(false); setSavePrompt(false)
    try { localStorage.setItem(SNOOZE_KEY, String(Date.now() + 3 * 864e5)) } catch { /* private mode */ }
  }
  return (
    <div className="snack" role="status" aria-live="polite">
      <span className="snack-ic"><I n="cloud" s={18} /></span>
      <span className="grow" style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <span style={{ fontSize: 14, fontWeight: 700, lineHeight: '19px' }}>{t('Sign in to sync your data')}</span>
        <span style={{ fontSize: 12, lineHeight: '16px', opacity: .8 }}>{t('It’s saved on this phone. Sign in to keep it safe on every device.')}</span>
      </span>
      <button className="snack-go" onClick={() => { setShow(false); setSavePrompt(false); nav('/auth/email') }}>{t('Sign in')}</button>
      <button className="snack-x" aria-label={t('Not now')} onClick={close}><I n="close" s={13} w={2.6} /></button>
    </div>
  )
}
