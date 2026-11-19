import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Back } from '../components/ui'
import { I } from '../components/Icon'

const COUNTRIES = [
  { code: '+962', name: 'Jordan' }, { code: '+966', name: 'Saudi Arabia' }, { code: '+971', name: 'UAE' },
  { code: '+965', name: 'Kuwait' }, { code: '+974', name: 'Qatar' }, { code: '+20', name: 'Egypt' },
  { code: '+44', name: 'United Kingdom' }, { code: '+1', name: 'United States' }
]

export default function PhoneAuth() {
  const [step, setStep] = useState<'phone' | 'code'>('phone')
  const [cc, setCc] = useState('+962')
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [left, setLeft] = useState(0)
  const codeRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (left <= 0) return
    const t = setTimeout(() => setLeft(left - 1), 1000)
    return () => clearTimeout(t)
  }, [left])

  const full = cc + phone.replace(/\D/g, '').replace(/^0+/, '')
  const valid = phone.replace(/\D/g, '').length >= 8

  const send = async () => {
    setErr(null); setBusy(true)
    const { error } = await supabase.auth.signInWithOtp({ phone: full, options: { data: name ? { name } : undefined } })
    setBusy(false)
    if (error) {
      setErr(/provider|sms|phone.*(disabled|not enabled)|unsupported/i.test(error.message)
        ? 'Text-message codes aren’t switched on for Nook yet. Use Google, Apple or email for now.'
        : error.message)
      return
    }
    setStep('code'); setLeft(42)
    setTimeout(() => codeRef.current?.focus(), 50)
  }

  const verify = async () => {
    setErr(null); setBusy(true)
    const { error } = await supabase.auth.verifyOtp({ phone: full, token: code, type: 'sms' })
    setBusy(false)
    if (error) setErr('That code didn’t work. Check it and try again.')
  }

  if (step === 'code') {
    return (
      <main className="screen col">
        <div className="hd"><button className="ib" aria-label="Back" onClick={() => setStep('phone')}><I n="back" s={18} w={2.4} /></button></div>
        <h1 className="h1 mt24" style={{ fontSize: 30 }}>Check your messages</h1>
        <p className="sub mt8" style={{ fontSize: 16 }}>Enter the 6-digit code we texted to <strong className="num" style={{ color: 'var(--ink)' }}>{cc} {phone}</strong></p>
        <label className="fld focus mt24" style={{ minHeight: 64 }}>
          <span className="sr">Verification code</span>
          <input ref={codeRef} className="inp num" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="••••••"
            style={{ fontSize: 28, letterSpacing: 12, textAlign: 'center' }} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
        </label>
        <p className="ffoot">Your phone can fill the code in for you.</p>
        <div className="mt16" style={{ textAlign: 'center' }}>
          {left > 0 ? <span className="sub num">Resend code in 0:{String(left).padStart(2, '0')}</span>
            : <button className="btn line" style={{ width: 'auto', padding: '0 20px', margin: '0 auto', color: 'var(--acc)' }} onClick={send}>Resend code</button>}
        </div>
        {err && <p role="alert" className="sub mt12" style={{ color: 'var(--red)' }}>{err}</p>}
        <button className="btn pri mtauto" disabled={code.length !== 6 || busy} onClick={verify}>{busy ? 'Checking…' : 'Verify'}<I n="next" s={16} w={2.6} /></button>
      </main>
    )
  }

  return (
    <main className="screen col">
      <div className="hd"><Back to="/" /></div>
      <h1 className="h1 mt24" style={{ fontSize: 36, lineHeight: '42px' }}>Your <em>number.</em></h1>
      <p className="sub mt8" style={{ fontSize: 16 }}>We’ll text you a code — no password to remember.</p>

      <div className="form mt24">
        <label className="frow"><span className="fl">Name</span><input className="inp" placeholder="Your name (new accounts)" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></label>
        <div className="frow">
          <label className="sr" htmlFor="cc">Country code</label>
          <select id="cc" className="cc" value={cc} onChange={(e) => setCc(e.target.value)} style={{ background: 'transparent', border: 0, borderRight: '.5px solid var(--fieldSep)', color: 'var(--ink)', fontSize: 17, outline: 'none' }}>
            {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.code} {c.name}</option>)}
          </select>
          <label className="sr" htmlFor="ph">Phone number</label>
          <input id="ph" className="inp num" type="tel" inputMode="tel" autoComplete="tel-national" placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} />
          {valid && <svg width="22" height="22" viewBox="0 0 24 24" role="img" aria-label="Looks valid"><circle cx="12" cy="12" r="10" fill="var(--swOn)" /><path d="M7.5 12.5l3 3 6-6.5" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>}
        </div>
      </div>
      <p className="ffoot">Email is optional — add it any time in Settings.</p>
      {err && <p role="alert" className="sub mt12" style={{ color: 'var(--red)' }}>{err}</p>}

      <button className="btn pri mt20" disabled={!valid || busy} onClick={send}>{busy ? 'Sending…' : 'Text me a code'}<I n="next" s={16} w={2.6} /></button>
      <p className="sub mtauto" style={{ textAlign: 'center', fontSize: 15 }}>No SMS? <Link to="/auth/email" className="lnk">Use email instead</Link></p>
    </main>
  )
}
