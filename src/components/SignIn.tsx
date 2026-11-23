import { useState } from 'react'
import { db, redirectTo } from '../lib/db'
import { useStore } from '../lib/store'
import { I } from './Icon'
import { Sheet } from './ui'
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

/** Shown once per visit after a guest adds something: sign in to keep it. */
export function SavePrompt() {
  const { guest, savePrompt, setSavePrompt } = useStore()
  if (!guest || !savePrompt) return null
  return (
    <Sheet label={t('Save your Tadween')} onClose={() => setSavePrompt(false)}>
      <div className="mt12" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 8 }}>
        <span className="vorb" style={{ width: 56, height: 56 }}><I n="check" s={24} w={2.6} /></span>
        <h2 className="ttl" style={{ fontSize: 22, lineHeight: '28px', marginTop: 8 }}>{t('Keep what you add')}</h2>
        <p className="sub" style={{ fontSize: 15, lineHeight: '22px' }}>{t('It’s saved on this phone for now. Sign in to keep it safe, use it on any device and share lists with your family.')}</p>
      </div>
      <div className="mt20"><AuthButtons size="md" /></div>
      <button className="btn" style={{ marginTop: 4, background: 'transparent', color: 'var(--ink2)' }} onClick={() => setSavePrompt(false)}>{t('Not now')}</button>
    </Sheet>
  )
}
