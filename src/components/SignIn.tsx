import { useState } from 'react'
import { Link } from 'react-router-dom'
import { db, redirectTo } from '../lib/db'
import { useStore } from '../lib/store'
import { I } from './Icon'
import { Sheet } from './ui'

// Official Google "G" mark, served by Google (not redrawn here).
const GOOGLE_MARK = 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg'
// The Apple logo is a glyph in Apple's own system fonts, so it is only shown on Apple devices.
const IS_APPLE = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.userAgent)

export function AuthButtons({ size = 'lg', verb = 'Continue', email = true }: { size?: 'lg' | 'md'; verb?: 'Continue' | 'Sign in' | 'Sign up'; email?: boolean }) {
  const [busy, setBusy] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const h = size === 'lg' ? 56 : 52

  const oauth = async (provider: 'apple' | 'google') => {
    setErr(null); setBusy(provider)
    const { error } = await db.auth.signInWithOAuth({ provider, options: { redirectTo: redirectTo() } })
    if (error) {
      setBusy(null)
      setErr(/not enabled|unsupported|provider/i.test(error.message)
        ? `${provider === 'apple' ? 'Apple' : 'Google'} sign-in isn’t switched on yet. Use email for now.`
        : error.message)
    }
  }

  return (
    <div className="stack" style={{ gap: 10 }}>
      {IS_APPLE && (
        <button className="btn apple" style={{ height: h }} onClick={() => oauth('apple')} disabled={!!busy}>
          <span className="apple-mark" aria-hidden="true">{''}</span>{busy === 'apple' ? 'Opening Apple…' : `${verb} with Apple`}
        </button>
      )}
      <button className="btn google" style={{ height: h }} onClick={() => oauth('google')} disabled={!!busy}>
        <img src={GOOGLE_MARK} width={20} height={20} alt="" />{busy === 'google' ? 'Opening Google…' : `${verb} with Google`}
      </button>
      {email && <Link to="/auth/register" className="btn line" style={{ height: h }}><I n="mail" s={17} />Continue with email</Link>}
      {err && <p role="alert" className="sub" style={{ textAlign: 'center', color: 'var(--red)' }}>{err}</p>}
    </div>
  )
}

/** Shown once per visit after a guest adds something: sign in to keep it. */
export function SavePrompt() {
  const { guest, savePrompt, setSavePrompt } = useStore()
  if (!guest || !savePrompt) return null
  return (
    <Sheet label="Save your Tadween" onClose={() => setSavePrompt(false)}>
      <div className="mt12" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 8 }}>
        <span className="vorb" style={{ width: 56, height: 56 }}><I n="check" s={24} w={2.6} /></span>
        <h2 className="ttl" style={{ fontSize: 22, lineHeight: '28px', marginTop: 8 }}>Keep what you add</h2>
        <p className="sub" style={{ fontSize: 15, lineHeight: '22px' }}>It’s saved on this phone for now. Sign in to keep it safe, use it on any device and share lists with your family.</p>
      </div>
      <div className="mt20"><AuthButtons size="md" /></div>
      <p className="sub mt12" style={{ textAlign: 'center', fontSize: 15 }}>Have an account? <Link to="/auth/login" onClick={() => setSavePrompt(false)} style={{ color: 'var(--acc)', fontWeight: 700 }}>Sign in</Link></p>
      <button className="btn" style={{ marginTop: 4, background: 'transparent', color: 'var(--ink2)' }} onClick={() => setSavePrompt(false)}>Not now</button>
    </Sheet>
  )
}
