import { useCallback, useEffect, useRef, useState } from 'react'

/* Speech in the browser:
   - Listening uses the Web Speech API (Chrome/Edge/Android, Safari on iOS 14.5+).
   - Speaking uses speechSynthesis, with the person's voice style mapped to rate and pitch. */

type Rec = {
  lang: string; continuous: boolean; interimResults: boolean; maxAlternatives: number
  start(): void; stop(): void; abort(): void
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
}

const Ctor = (): (new () => Rec) | null => {
  const w = window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export const canListen = () => !!Ctor()

export function useListener() {
  const [finalText, setFinal] = useState('')
  const [interim, setInterim] = useState('')
  const [listening, setListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const rec = useRef<Rec | null>(null)
  const wanted = useRef(false)

  const start = useCallback(() => {
    const C = Ctor()
    if (!C) { setError('unsupported'); return }
    setError(null)
    const r = new C()
    r.lang = navigator.language?.startsWith('ar') ? 'ar-JO' : 'en-US'
    r.continuous = true
    r.interimResults = true
    r.maxAlternatives = 1
    r.onresult = (e) => {
      let fin = ''
      let mid = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i]
        if (res.isFinal) fin += res[0].transcript
        else mid += res[0].transcript
      }
      if (fin) setFinal((p) => (p ? p.trim() + ' ' : '') + fin.trim())
      setInterim(mid)
    }
    r.onerror = (e) => {
      if (e.error === 'no-speech' || e.error === 'aborted') return
      setError(e.error === 'not-allowed' ? 'denied' : e.error)
      wanted.current = false
    }
    r.onend = () => {
      // Safari and Chrome stop after silence; keep listening until the person taps Done.
      if (wanted.current) { try { r.start() } catch { /* already running */ } } else setListening(false)
    }
    rec.current = r
    wanted.current = true
    try { r.start(); setListening(true) } catch { setError('busy') }
  }, [])

  const stop = useCallback(() => {
    wanted.current = false
    rec.current?.stop()
    setListening(false)
    setInterim('')
  }, [])

  const reset = useCallback(() => { setFinal(''); setInterim('') }, [])

  useEffect(() => () => { wanted.current = false; rec.current?.abort() }, [])

  return { text: (finalText + (interim ? ' ' + interim : '')).trim(), finalText, interim, listening, error, start, stop, reset, setFinal }
}

const STYLE: Record<string, { rate: number; pitch: number }> = {
  Warm: { rate: 1, pitch: 1 },
  Calm: { rate: 0.9, pitch: 0.92 },
  Bright: { rate: 1.08, pitch: 1.12 }
}

export function speak(text: string, style = 'Warm', onEnd?: () => void) {
  if (!('speechSynthesis' in window)) { onEnd?.(); return }
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  const s = STYLE[style] ?? STYLE.Warm
  u.rate = s.rate
  u.pitch = s.pitch
  u.lang = 'en-US'
  const voices = window.speechSynthesis.getVoices()
  const pick = voices.find((v) => /en(-|_)(US|GB)/i.test(v.lang) && /(Samantha|Karen|Google US English|Ava|Serena|Daniel)/i.test(v.name)) ?? voices.find((v) => /^en/i.test(v.lang))
  if (pick) u.voice = pick
  u.onend = () => onEnd?.()
  u.onerror = () => onEnd?.()
  window.speechSynthesis.speak(u)
}

export const stopSpeaking = () => { if ('speechSynthesis' in window) window.speechSynthesis.cancel() }
