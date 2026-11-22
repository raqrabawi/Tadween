import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useListener, canListen } from '../lib/voice'
import { understandIn, describeWhen, SCOPES, type Scope } from '../lib/parse'
import { I } from '../components/Icon'
import { VoiceWave } from '../components/VoiceWave'
import { useMicLevel } from '../lib/level'

export default function Listen() {
  const nav = useNavigate()
  const v = useListener()
  const [secs, setSecs] = useState(0)
  const [typed, setTyped] = useState('')
  const supported = canListen()
  const [sp] = useSearchParams()
  const page = (['calendar', 'lists', 'notes'].includes(sp.get('from') ?? '') ? sp.get('from') : 'all') as Scope
  const [scope, setScope] = useState<Scope>(page)
  // On Lists, items go to the list whose mic was tapped, else the category on screen
  const [listHint] = useState(() => {
    try {
      const l = sessionStorage.getItem('tadween-list'); sessionStorage.removeItem('tadween-list')
      return l ?? sessionStorage.getItem('tadween-cat') ?? undefined
    } catch { return undefined }
  })
  const info = SCOPES[scope]
  const level = useMicLevel(v.listening)

  useEffect(() => { if (supported) v.start() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!v.listening) return
    const t = setInterval(() => setSecs((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [v.listening])

  const text = supported ? v.text : typed
  const drafts = useMemo(() => understandIn(text, scope, { listHint }), [text, scope, listHint])
  const noteCategory = (() => { try { return sessionStorage.getItem('tadween-notecat') } catch { return null } })()
  const [empty, setEmpty] = useState(false)
  const back = page === 'all' ? '/' : `/${page}`
  const cancel = () => { v.stop(); v.reset(); nav(back) }
  // Stop is always available: with words it moves on to review, without them it just stops
  const stop = () => {
    if (!text) { v.stop(); setEmpty(true); return }
    done()
  }
  const done = () => { v.stop(); nav('/review', { state: { text, scope, listHint, from: page, noteCategory: page === 'notes' ? noteCategory : null } }) }

  return (
    <div className="lvw" style={{ minHeight: '100dvh', color: 'var(--ink)' }}>
      <main className="screen col" style={{ background: 'transparent' }}>
        <div className="hd">
          <Link to={scope === 'calendar' ? '/add?type=Event' : scope === 'lists' ? '/add?type=Shopping' : scope === 'notes' ? '/note/new' : '/add'} className="ib" aria-label="Type instead" onClick={() => v.stop()}><I n="keyboard" s={18} w={1.8} /></Link>
          <span role="status" className="ib wide num" style={{ height: 40 }}><span style={{ width: 8, height: 8, borderRadius: 4, background: v.listening ? 'var(--red)' : 'var(--ink3)', boxShadow: v.listening ? '0 0 10px var(--red)' : 'none' }} />{Math.floor(secs / 60)}:{String(secs % 60).padStart(2, '0')}</span>
          <span className="bi" style={{ height: 40, borderRadius: 20, padding: '0 12px 0 8px' }}><b>EN</b><b>AR</b>Auto</span>
        </div>

        <div className="row mt20" style={{ gap: 8, flexWrap: 'wrap' }}>
          <span className="tag" aria-live="polite"><I n={info.icon} s={14} w={2.2} />{scope === 'all' ? 'Adding anything' : `Adding to ${info.name}`}</span>
          {page !== 'all' && (
            <button className="tag" style={{ background: 'transparent', boxShadow: 'inset 0 0 0 1px var(--line)' }} onClick={() => setScope(scope === 'all' ? page : 'all')}>
              {scope === 'all' ? `Only ${SCOPES[page].name}` : 'Anything instead'}
            </button>
          )}
        </div>

        {!text && (
          <div className="card tight mt16" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span className="cap">You can say</span>
            <span className="sub" style={{ fontSize: 14 }}>{info.lead}{scope === 'lists' && listHint ? ` Now: ${listHint}.` : ''}</span>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {info.examples.map((e) => <li key={e} style={{ fontSize: 15, lineHeight: '21px', fontWeight: 600 }}>“{e}”</li>)}
            </ul>
          </div>
        )}

        {supported ? (
          <p style={{ marginTop: 24, fontSize: 27, lineHeight: '36px', fontWeight: 600, letterSpacing: -.5, minHeight: 108 }}>
            {v.finalText || (!v.interim && <span className="muted">Go ahead — I’m listening…</span>)}
            {v.interim && <span className="muted"> {v.interim}</span>}
            {v.listening && <span className="car" />}
          </p>
        ) : (
          <div className="mt24">
            <p className="sub">Voice isn’t available in this browser. Type it instead — Tadween understands it the same way.</p>
            <label className="fld focus mt12"><span className="sr">What should Tadween do?</span><input autoFocus className="inp" placeholder={info.examples[0]} value={typed} onChange={(e) => setTyped(e.target.value)} /></label>
          </div>
        )}
        {v.error === 'denied' && <p role="alert" className="sub mt12" style={{ color: 'var(--red)' }}>Microphone access is blocked. Allow it in your browser settings, then try again.</p>}

        <div className="row mt20" style={{ flexWrap: 'wrap', gap: 8 }}>
          {drafts.slice(0, 4).map((d, i) => (
            <span key={i} className="gl" style={{ minHeight: 40, padding: '0 14px 0 6px', borderRadius: 20, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="ib" style={{ width: 28, height: 28, background: d.kind === 'event' ? 'var(--k-event)' : d.kind === 'reminder' ? 'var(--k-reminder)' : d.kind === 'item' ? 'var(--k-item)' : 'var(--k-note)', color: '#16232A', boxShadow: 'none' }}>
                <I n={d.kind === 'event' ? 'cal' : d.kind === 'reminder' ? 'bell' : d.kind === 'item' ? 'bag' : d.kind === 'note' ? (d.items ? 'checklist' : 'pen') : 'check'} s={13} w={2.4} />
              </span>
              {d.kind === 'event' ? (d.birthday ? d.title : describeWhen(d.start)) : d.kind === 'reminder' ? (d.at ? `Remind ${describeWhen(d.at).split(' · ')[0]}` : 'Reminder') : d.kind === 'item' ? d.name : d.title}
            </span>
          ))}
        </div>

        <div className="vwave">
          <VoiceWave level={level} height={220} muted={!v.listening} />
        </div>

        {empty && <p role="status" className="sub" style={{ textAlign: 'center', marginTop: 12 }}>I didn’t catch anything. Tap the mic to try again.</p>}

        <div className="spread mt24" style={{ alignItems: 'flex-start' }}>
          <button className="orb" onClick={cancel}><span className="ib lg"><I n="close" s={18} w={2.6} /></span>Cancel</button>
          {v.listening || !supported
            ? <button className="btn pri" style={{ width: 'auto', padding: '0 32px' }} disabled={!supported && !text} onClick={stop}><I n="stop" s={14} />Stop</button>
            : <button className="btn pri" style={{ width: 'auto', padding: '0 32px' }} disabled={!text} onClick={done}><I n="check" s={16} w={2.6} />Save</button>}
          {supported ? (
            <button className="orb" onClick={() => { if (v.listening) v.stop(); else { setEmpty(false); v.start() } }}><span className="ib lg"><I n={v.listening ? 'pause' : 'mic'} s={20} /></span>{v.listening ? 'Pause' : 'Resume'}</button>
          ) : <span style={{ width: 56 }} />}
        </div>
      </main>
    </div>
  )
}
