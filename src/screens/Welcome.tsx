import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, redirectTo } from '../lib/supabase'
import { I, Logo } from '../components/Icon'

export default function Welcome() {
  const [busy, setBusy] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const oauth = async (provider: 'apple' | 'google') => {
    setErr(null); setBusy(provider)
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: redirectTo() } })
    if (error) {
      setBusy(null)
      setErr(/not enabled|unsupported/i.test(error.message)
        ? `${provider === 'apple' ? 'Apple' : 'Google'} sign-in isn’t switched on yet. Use your phone or email for now.`
        : error.message)
    }
  }

  return (
    <main className="screen col">
      <div className="hd">
        <span className="row" style={{ gap: 10 }}><span className="vorb" style={{ width: 32, height: 32, boxShadow: 'none' }} /><span style={{ fontSize: 20, fontWeight: 700, letterSpacing: -.4 }}>tadween</span></span>
        <span className="bi"><b>EN</b><b>AR</b>Bilingual</span>
      </div>

      <div style={{ position: 'relative', height: 300, marginTop: 12 }} aria-hidden="true">
        <div style={{ position: 'absolute', left: '50%', top: '50%', width: 280, height: 280, margin: '-140px 0 0 -140px', borderRadius: '50%', border: '1px dashed var(--line)' }} />
        <div style={{ position: 'absolute', left: '50%', top: '50%', width: 190, height: 190, margin: '-95px 0 0 -95px', borderRadius: '50%', border: '1px solid var(--line)' }} />
        <span className="vorb" style={{ position: 'absolute', left: '50%', top: '50%', width: 104, height: 104, margin: '-52px 0 0 -52px' }}><I n="mic" s={34} w={1.8} /></span>
        <div className="gl" style={{ position: 'absolute', left: -4, top: 20, transform: 'rotate(-5deg)', borderRadius: 22, padding: '10px 16px 10px 10px', display: 'flex', gap: 10, alignItems: 'center', fontSize: 14, fontWeight: 600 }}>
          <span className="ib sm" style={{ background: 'var(--k-event)', color: '#16232A' }}><I n="cal" s={16} /></span>
          <span style={{ display: 'flex', flexDirection: 'column' }}>Design review<span className="sub" style={{ fontSize: 12 }}>Today · 09:30</span></span>
        </div>
        <div className="gl" style={{ position: 'absolute', right: -4, top: 116, transform: 'rotate(4deg)', borderRadius: 22, padding: '10px 16px 10px 10px', display: 'flex', gap: 10, alignItems: 'center', fontSize: 14, fontWeight: 600 }}>
          <span className="ib sm" style={{ background: 'var(--k-item)', color: '#16232A' }}><I n="bag" s={16} /></span>
          <span style={{ display: 'flex', flexDirection: 'column' }}>Bread, milk<span className="sub" style={{ fontSize: 12 }}>Family · added by Mama</span></span>
        </div>
      </div>

      <h1 className="h1 mtauto" style={{ fontSize: 38, lineHeight: '44px', letterSpacing: -1.2 }}>Just say it.<br /><em>Tadween keeps it.</em></h1>
      <p className="sub mt12" style={{ fontSize: 16, lineHeight: '23px' }}>Your calendar, lists, family groceries and journal — by voice, in English or Arabic.</p>

      <div className="stack mt24" style={{ gap: 10 }}>
        <button className="btn ink" style={{ height: 60, borderRadius: 30, fontSize: 18 }} onClick={() => oauth('apple')} disabled={!!busy}>
          <Logo />{busy === 'apple' ? 'Opening Apple…' : 'Continue with Apple'}
        </button>
        <button className="btn sec" style={{ height: 60, borderRadius: 30, fontSize: 18 }} onClick={() => oauth('google')} disabled={!!busy}>
          <Logo />{busy === 'google' ? 'Opening Google…' : 'Continue with Google'}
        </button>
        <Link to="/auth/phone" className="btn line"><I n="phone" s={17} />Use phone number</Link>
      </div>
      {err && <p role="alert" className="sub mt12" style={{ textAlign: 'center', color: 'var(--red)' }}>{err}</p>}
      <p className="sub mt16" style={{ textAlign: 'center', fontSize: 15 }}>Prefer email? <Link to="/auth/email" className="lnk">Get a sign-in code</Link></p>
    </main>
  )
}
