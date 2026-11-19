import { useState } from 'react'
import { supabase, redirectTo } from '../lib/supabase'
import { Back } from '../components/ui'
import { I } from '../components/Icon'

export default function EmailAuth() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const send = async () => {
    setErr(null); setBusy(true)
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo() } })
    setBusy(false)
    if (error) setErr(error.message); else setSent(true)
  }
  const verify = async () => {
    setErr(null); setBusy(true)
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' })
    setBusy(false)
    if (error) setErr('That code didn’t work. Try again, or tap the link in the email.')
  }

  return (
    <main className="screen col">
      <div className="hd"><Back to="/" /></div>
      <h1 className="h1 mt24" style={{ fontSize: 34, lineHeight: '40px' }}>{sent ? <>Check your <em>inbox.</em></> : <>Sign in with <em>email.</em></>}</h1>
      <p className="sub mt8" style={{ fontSize: 16 }}>{sent ? `We sent a code and a sign-in link to ${email}.` : 'We’ll email you a one-time code.'}</p>

      {!sent ? (
        <>
          <div className="form mt24"><label className="frow"><span className="fl">Email</span><input className="inp" type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} /></label></div>
          {err && <p role="alert" className="sub mt12" style={{ color: 'var(--red)' }}>{err}</p>}
          <button className="btn pri mt20" disabled={!/.+@.+\..+/.test(email) || busy} onClick={send}>{busy ? 'Sending…' : 'Email me a code'}<I n="next" s={16} w={2.6} /></button>
        </>
      ) : (
        <>
          <label className="fld focus mt24" style={{ minHeight: 64 }}>
            <span className="sr">Code from the email</span>
            <input className="inp num" inputMode="numeric" autoComplete="one-time-code" maxLength={8} placeholder="Code" style={{ fontSize: 26, letterSpacing: 8, textAlign: 'center' }} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
          </label>
          <p className="ffoot">Or just tap the link in the email on this device.</p>
          {err && <p role="alert" className="sub mt12" style={{ color: 'var(--red)' }}>{err}</p>}
          <button className="btn pri mtauto" disabled={code.length < 6 || busy} onClick={verify}>{busy ? 'Checking…' : 'Verify'}<I n="next" s={16} w={2.6} /></button>
        </>
      )}
    </main>
  )
}
