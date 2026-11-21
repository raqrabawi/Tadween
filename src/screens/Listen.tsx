import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useListener, canListen } from '../lib/voice'
import { understand, describeWhen } from '../lib/parse'
import { I } from '../components/Icon'

export default function Listen() {
  const nav = useNavigate()
  const v = useListener()
  const [secs, setSecs] = useState(0)
  const [typed, setTyped] = useState('')
  const supported = canListen()

  useEffect(() => { if (supported) v.start() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!v.listening) return
    const t = setInterval(() => setSecs((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [v.listening])

  const text = supported ? v.text : typed
  const drafts = useMemo(() => understand(text), [text])
  const done = () => { v.stop(); nav('/review', { state: { text } }) }
  const lit = Math.min(60, secs * 2)

  return (
    <div className="dark" style={{ minHeight: '100dvh', background: 'radial-gradient(420px 380px at 50% 74%,rgba(7,80,86,.7),transparent 70%),radial-gradient(440px 360px at 108% -12%,rgba(7,80,86,.6),transparent 66%),#0F181D', color: 'var(--ink)' }}>
      <main className="screen col" style={{ background: 'transparent' }}>
        <div className="hd">
          <Link to="/" className="ib" aria-label="Cancel" onClick={() => v.stop()}><I n="close" s={15} w={2.6} /></Link>
          <span role="status" className="ib wide num" style={{ height: 40 }}><span style={{ width: 8, height: 8, borderRadius: 4, background: v.listening ? 'var(--red)' : 'var(--ink3)', boxShadow: v.listening ? '0 0 10px var(--red)' : 'none' }} />{Math.floor(secs / 60)}:{String(secs % 60).padStart(2, '0')}</span>
          <span className="bi" style={{ height: 40, borderRadius: 20, padding: '0 12px 0 8px' }}><b>EN</b><b>AR</b>Auto</span>
        </div>

        {supported ? (
          <p style={{ marginTop: 32, fontSize: 27, lineHeight: '36px', fontWeight: 600, letterSpacing: -.5, minHeight: 108 }}>
            {v.finalText || (!v.interim && <span className="muted">Go ahead — I’m listening…</span>)}
            {v.interim && <span className="muted"> {v.interim}</span>}
            {v.listening && <span className="car" />}
          </p>
        ) : (
          <div className="mt24">
            <p className="sub">Voice isn’t available in this browser. Type it instead — Nook understands it the same way.</p>
            <label className="fld focus mt12"><span className="sr">What should Nook do?</span><input autoFocus className="inp" placeholder="Dentist Monday at 5, remind me the day before" value={typed} onChange={(e) => setTyped(e.target.value)} /></label>
          </div>
        )}
        {v.error === 'denied' && <p role="alert" className="sub mt12" style={{ color: 'var(--red)' }}>Microphone access is blocked. Allow it in your browser settings, then try again.</p>}

        <div className="row mt20" style={{ flexWrap: 'wrap', gap: 8 }}>
          {drafts.slice(0, 4).map((d, i) => (
            <span key={i} className="gl" style={{ minHeight: 40, padding: '0 14px 0 6px', borderRadius: 20, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="ib" style={{ width: 28, height: 28, background: d.kind === 'event' ? 'var(--k-event)' : d.kind === 'reminder' ? 'var(--k-reminder)' : d.kind === 'item' ? 'var(--k-item)' : 'var(--k-note)', color: '#16232A', boxShadow: 'none' }}>
                <I n={d.kind === 'event' ? 'cal' : d.kind === 'reminder' ? 'bell' : d.kind === 'item' ? 'bag' : d.kind === 'note' ? 'pen' : 'check'} s={13} w={2.4} />
              </span>
              {d.kind === 'event' ? describeWhen(d.start) : d.kind === 'reminder' ? (d.at ? `Remind ${describeWhen(d.at).split(' · ')[0]}` : 'Reminder') : d.kind === 'item' ? d.name : d.title}
            </span>
          ))}
        </div>

        <div style={{ position: 'relative', margin: 'auto auto 0', width: 300, height: 300 }}>
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0 }}>
            {Array.from({ length: 60 }, (_, i) => (
              <span key={i} style={{ position: 'absolute', left: 149, top: 0, width: 2, borderRadius: 1, transformOrigin: '1px 150px', height: i % 5 === 0 ? 16 : 10, transform: `rotate(${i * 6}deg)`, background: i < lit ? (i % 5 === 0 ? '#E4EEF0' : 'rgba(124,198,202,.85)') : 'rgba(228,238,240,.14)' }} />
            ))}
          </div>
          <span className="cap" style={{ position: 'absolute', left: 0, right: 0, top: 26, textAlign: 'center' }}>{v.listening ? 'Understanding · on device' : 'Paused'}</span>
          <div style={{ position: 'absolute', left: 60, top: 60, width: 180, height: 180 }}>
            {v.listening && <><span className="ring" /><span className="ring" style={{ animationDelay: '1s' }} /></>}
            <button className="vorb" style={{ position: 'absolute', inset: 0, flexDirection: 'column', gap: 12, boxShadow: '0 0 0 1px rgba(124,198,202,.45), 0 0 70px rgba(7,80,86,.75)' }} onClick={done} disabled={!text} aria-label="Done speaking">
              <span aria-hidden="true" style={{ height: 44, display: 'flex', alignItems: 'center', gap: 4 }}>
                {Array.from({ length: 9 }, (_, i) => <span key={i} style={{ width: 4, borderRadius: 2, background: '#fff', height: v.listening ? 10 + Math.abs(Math.sin(secs * 1.7 + i * 1.3)) * 28 * (1 - Math.abs(i - 4) / 6) : 6, transition: 'height .3s' }} />)}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{text ? 'Tap when done' : 'Listening'}</span>
            </button>
          </div>
        </div>

        <div className="spread mt24" style={{ alignItems: 'flex-start' }}>
          <Link to="/add" className="orb" onClick={() => v.stop()}><span className="ib lg"><I n="keyboard" s={22} w={1.8} /></span>Type</Link>
          <button className="btn pri" style={{ width: 'auto', padding: '0 32px' }} disabled={!text} onClick={done}><I n="stop" s={14} />Done</button>
          {supported ? (
            <button className="orb" onClick={() => (v.listening ? v.stop() : v.start())}><span className="ib lg"><I n={v.listening ? 'pause' : 'mic'} s={20} /></span>{v.listening ? 'Pause' : 'Resume'}</button>
          ) : <span style={{ width: 56 }} />}
        </div>
      </main>
    </div>
  )
}
