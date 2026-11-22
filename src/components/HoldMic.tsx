import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { canListen, useListener } from '../lib/voice'
import { useMicLevel } from '../lib/level'
import { SCOPES, type Scope } from '../lib/parse'
import { VoiceWave } from './VoiceWave'
import { I } from './Icon'
import { Toast } from './ui'

const CANCEL_PX = 90 // swipe up this far to cancel
const TAP_MS = 280 // shorter than this is a tap: open hands-free voice

/**
 * The tab bar mic. Press and hold to talk, release to save, swipe up to cancel.
 * A quick tap opens the hands-free voice screen instead.
 */
export function HoldMic({ from }: { from?: string }) {
  const nav = useNavigate()
  const v = useListener()
  const [holding, setHolding] = useState(false)
  const [cancel, setCancel] = useState(false)
  const [drag, setDrag] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const level = useMicLevel(holding)
  const start = useRef({ y: 0, t: 0 })
  const textRef = useRef('')
  textRef.current = v.text
  const scope = (from ?? 'all') as Scope
  const info = SCOPES[scope]
  const listenUrl = from ? `/listen?from=${from}` : '/listen'

  // Keep the page from scrolling or selecting text while holding
  useEffect(() => {
    if (!holding) return
    const stop = (e: Event) => e.preventDefault()
    document.addEventListener('touchmove', stop, { passive: false })
    document.body.style.userSelect = 'none'
    document.documentElement.classList.add('holding-voice')
    return () => { document.removeEventListener('touchmove', stop); document.body.style.userSelect = ''; document.documentElement.classList.remove('holding-voice') }
  }, [holding])

  const down = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return
    if (!canListen()) { nav(listenUrl); return }
    e.currentTarget.setPointerCapture(e.pointerId)
    start.current = { y: e.clientY, t: Date.now() }
    setCancel(false); setDrag(0); v.reset(); v.start(); setHolding(true)
    navigator.vibrate?.(12)
  }
  const move = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!holding) return
    const dy = Math.max(0, start.current.y - e.clientY)
    setDrag(dy)
    const c = dy > CANCEL_PX
    if (c !== cancel) { setCancel(c); navigator.vibrate?.(c ? 20 : 8) }
  }
  const finish = (aborted: boolean) => {
    if (!holding) return
    const quick = Date.now() - start.current.t < TAP_MS
    setHolding(false); setDrag(0)
    v.stop()
    if (quick && !textRef.current) { nav(listenUrl); return }
    if (aborted || cancel) { v.reset(); setToast('Cancelled — nothing was added'); return }
    // The last words can arrive just after the mic stops
    setTimeout(() => {
      const text = textRef.current.trim()
      if (!text) { setToast('I didn’t catch that. Hold the mic and speak.'); return }
      let listHint: string | undefined, noteCategory: string | null = null
      try { listHint = sessionStorage.getItem('tadween-cat') ?? undefined; noteCategory = sessionStorage.getItem('tadween-notecat') } catch { /* ignore */ }
      nav('/review', { state: { auto: true, text, scope, listHint, from: scope, noteCategory: scope === 'notes' ? noteCategory : null } })
    }, 450)
  }

  return (
    <>
      {holding && createPortal(
        <div className={cancel ? 'hold-layer lvw cancel' : 'hold-layer lvw'} role="dialog" aria-label="Listening" aria-live="polite">
          <div className="hold-top">
            <span className="tag"><I n={info.icon} s={14} w={2.2} />{scope === 'all' ? 'Adding anything' : `Adding to ${info.name}`}</span>
            <span className="hold-dot" aria-hidden="true" />
          </div>
          <p className="hold-text">
            {v.finalText || (!v.interim && <span className="muted">Listening…</span>)}
            {v.interim && <span className="muted"> {v.interim}</span>}
          </p>
          {!v.text && <p className="sub hold-try">Try “{info.examples[0]}”</p>}
          {v.error === 'denied' && <p role="alert" className="sub" style={{ color: 'var(--red)', marginTop: 12 }}>Microphone access is blocked. Allow it in your browser settings.</p>}
          <div className="hold-wave" style={{ transform: `translateY(${-Math.min(drag, 140) * 0.4}px)` }}>
            <VoiceWave level={level} height={200} muted={cancel} />
          </div>
          <div className="hold-hint" style={{ opacity: cancel ? 1 : 0.9 }}>
            <span className={cancel ? 'hold-x on' : 'hold-x'} style={{ transform: `translateY(${-Math.min(drag, CANCEL_PX)}px)` }}><I n="close" s={16} w={2.6} /></span>
            <span>{cancel ? 'Release to cancel' : <>Release to save · <b>swipe up to cancel</b></>}</span>
          </div>
        </div>,
        document.body
      )}
      <button
        className={holding ? (cancel ? 'mic holding cancel' : 'mic holding') : 'mic'}
        aria-label={`Hold to talk${from ? ` to ${info.name}` : ''}. Tap for hands-free.`}
        onPointerDown={down} onPointerMove={move}
        onPointerUp={() => finish(false)} onPointerCancel={() => finish(true)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); nav(listenUrl) } }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <span className="vorb" style={holding ? { transform: `scale(${1.12 + level.current * 0.1})` } : undefined}><I n="mic" s={26} /></span>
      </button>
      {toast && createPortal(<Toast text={toast} onDone={() => setToast(null)} ms={2600} />, document.body)}
    </>
  )
}
