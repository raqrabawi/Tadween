import { useEffect, useRef, useState } from 'react'
import { COUNTRIES, latinDigits, sendPhoneCode, toE164, verifyPhoneCode } from '../lib/phone'
import { isAr, t } from '../lib/i18n'
import { I } from './Icon'

/** Two steps: phone number → 6-digit code. `link` adds the phone to the signed-in account. */
export function PhoneFlow({ link = false, onDone }: { link?: boolean; onDone: () => void }) {
  const [country, setCountry] = useState('+962')
  const [local, setLocal] = useState('')
  const [phone, setPhone] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [wait, setWait] = useState(0)
  const codeRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (wait <= 0) return; const tm = setTimeout(() => setWait(wait - 1), 1000); return () => clearTimeout(tm) }, [wait])
  useEffect(() => { if (phone) codeRef.current?.focus() }, [phone])

  const send = async (to: string) => {
    setBusy(true); setErr(null)
    const e = await sendPhoneCode(to)
    setBusy(false)
    if (e) { setErr(e); return }
    setPhone(to); setWait(30)
  }
  const submitPhone = () => {
    const p = toE164(country, local)
    if (!p) { setErr('Check the number — it looks too short or too long.'); return }
    send(p)
  }
  const verify = async (c = code) => {
    if (!phone || c.length < 6) return
    setBusy(true); setErr(null)
    const e = await verifyPhoneCode(phone, c, link)
    setBusy(false)
    if (e) { setErr(e); setCode(''); codeRef.current?.focus(); return }
    onDone()
  }

  if (!phone) return (
    <form className="mt20" onSubmit={(e) => { e.preventDefault(); submitPhone() }}>
      <div className="form">
        <label className="frow"><span className="fl">{t('Country')}</span>
          <select className="inp" style={{ background: 'transparent' }} value={country} onChange={(e) => setCountry(e.target.value)}>
            {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.flag} {isAr ? c.ar : c.name} ({c.code})</option>)}
          </select>
        </label>
        <label className="frow"><span className="fl">{t('Phone')}</span>
          <span className="num" dir="ltr" style={{ color: 'var(--ink3)', fontWeight: 600 }}>{country}</span>
          <input autoFocus className="inp num" dir="ltr" type="tel" inputMode="tel" autoComplete="tel-national" placeholder="79 123 4567" value={local} onChange={(e) => setLocal(e.target.value)} />
        </label>
      </div>
      <p className="ffoot">{link ? t('We’ll text a code to confirm it’s yours. Next time you can sign in with just your phone.') : t('We’ll text you a 6-digit code. Your phone must already be added to your Tadween account.')}</p>
      {err && <p role="alert" className="ffoot" style={{ color: 'var(--red)' }}>{t(err)}</p>}
      <button className="btn pri mt20" type="submit" disabled={busy || latinDigits(local).length < 6}>{busy ? t('Sending…') : t('Text me a code')}<I n="next" s={16} w={2.6} /></button>
    </form>
  )

  return (
    <div className="mt20">
      <p className="sub" style={{ textAlign: 'center', fontSize: 16, lineHeight: '23px' }}>{t('Enter the 6-digit code we texted to')}<br /><strong className="num" dir="ltr" style={{ color: 'var(--ink)' }}>{phone}</strong></p>
      <label className="fld focus mt16" style={{ minHeight: 64 }}>
        <span className="sr">{t('6-digit code')}</span>
        <input ref={codeRef} className="inp num" dir="ltr" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="••••••"
          style={{ fontSize: 28, letterSpacing: 10, textAlign: 'center' }} value={code}
          onChange={(e) => { const v = latinDigits(e.target.value).slice(0, 6); setCode(v); if (v.length === 6) verify(v) }} />
      </label>
      {err && <p role="alert" className="ffoot" style={{ color: 'var(--red)' }}>{t(err)}</p>}
      <div className="spread mt12" style={{ padding: '0 4px' }}>
        <button className="lnk" onClick={() => { setPhone(null); setCode(''); setErr(null) }}>{t('Change number')}</button>
        {wait > 0
          ? <span className="sub num" role="status">{t('Resend code in {time}', { time: '0:' + String(wait).padStart(2, '0') })}</span>
          : <button className="lnk" disabled={busy} onClick={() => send(phone)}>{t('Resend code')}</button>}
      </div>
      <button className="btn pri mt20" disabled={busy || code.length < 6} onClick={() => verify()}>{busy ? t('Checking…') : t('Verify')}<I n="next" s={16} w={2.6} /></button>
    </div>
  )
}
