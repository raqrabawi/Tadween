import { isAr } from './i18n'
import { getTone } from './tone'
import { db } from './db'
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
    r.lang = isAr || navigator.language?.startsWith('ar') ? 'ar-JO' : 'en-US'
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

/* Natural "AI" voice: a cloud voice (Azure neural, Jordanian Arabic) through the `tts` Neon function.
   Used when you're signed in and the voice service is set up; otherwise the phone's own voice speaks. */
const TTS_URL = 'https://br-lucky-boat-b9q7v5vp-tts.compute.c-7.eu-central-1.aws.neon.tech/'
const clips = new Map<string, string>() // text → audio URL, so repeated lines don't cost again
let aiOff = false // set when the service says it isn't set up, so we stop asking this session
// One audio element, unlocked during the tap so iPhones let it play once the clip arrives
let player: HTMLAudioElement | null = null
const SILENT = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQxAADB8AhSmxhIIEVCSiJrDCQBTcu3UrAIwUdkRgQbFAZC1CQEwTJ9mjRvBA4UOLD8nKVOWfh+UlK3z/177OXrfOdKl7pyn3Xf//WreyTRUoAWgBgkOAGbZHBgG1OF6zM82DWbZaUmMBptgQhGjsyYqc9ae9XFz280948NMBWInljyzsNRFLPWdnZGWrddDsjK1unuSrVN9jJsK8KuQtQCtMBjCEtImISdNKJOopIpBFpNSMbIHCSRpRR5iakjTiyzLhchUUBwCgyKiweBv/7UsQbg8isVNoMPMjAAAA0gAAABEVFGmgqK////9bP/6XCykxBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq'
let turn = 0

async function aiSpeak(text: string, myTurn: number, onEnd?: () => void): Promise<boolean> {
  if (aiOff) return false
  try {
    const key = `${isAr ? 'ar' : 'en'}|${getTone()}|${text}`
    let url = clips.get(key)
    if (!url) {
      const { data } = await db.auth.getSession()
      const token = (data?.session as { access_token?: string } | null)?.access_token
      if (!token) return false
      const r = await fetch(TTS_URL, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ text, lang: isAr ? 'ar' : 'en', tone: getTone() }) })
      if (r.status === 503) { aiOff = true; return false }
      if (!r.ok) return false
      url = URL.createObjectURL(await r.blob())
      if (clips.size > 40) { const [k, u] = clips.entries().next().value as [string, string]; URL.revokeObjectURL(u); clips.delete(k) }
      clips.set(key, url)
    }
    if (myTurn !== turn) return true // stopped or replaced while loading
    if (!player) player = new Audio()
    player.src = url
    player.onended = () => onEnd?.()
    player.onerror = () => onEnd?.()
    await player.play()
    return true
  } catch { return false }
}

export function speak(text: string, style = 'Warm', onEnd?: () => void) {
  const myTurn = ++turn
  if (!player) player = new Audio()
  player.pause(); player.onended = null; player.onerror = null
  player.src = SILENT; player.play().catch(() => undefined)
  if ('speechSynthesis' in window) window.speechSynthesis.cancel()
  void aiSpeak(text, myTurn, onEnd).then((ok) => { if (!ok && myTurn === turn) phoneSpeak(text, style, onEnd) })
}

function phoneSpeak(text: string, style: string, onEnd?: () => void) {
  if (!('speechSynthesis' in window)) { onEnd?.(); return }
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  const s = STYLE[style] ?? STYLE.Warm
  const formal = getTone() === 'formal'
  u.rate = s.rate * (formal ? 0.95 : 1)
  u.pitch = s.pitch
  const voices = window.speechSynthesis.getVoices()
  // Arabic: a Jordanian voice if the phone has one, then another Levantine one, then any Arabic voice
  const ar = (re: RegExp) => voices.find((v) => re.test(v.lang.replace('_', '-')))
  const pick = isAr
    ? ar(/^ar-JO/i) ?? ar(/^ar-(PS|LB|SY)/i) ?? ar(/^ar/i)
    : voices.find((v) => /en(-|_)(US|GB)/i.test(v.lang) && /(Samantha|Karen|Google US English|Ava|Serena|Daniel)/i.test(v.name)) ?? voices.find((v) => /^en/i.test(v.lang))
  u.lang = pick?.lang ?? (isAr ? 'ar-JO' : 'en-US')
  if (pick) u.voice = pick
  u.onend = () => onEnd?.()
  u.onerror = () => onEnd?.()
  window.speechSynthesis.speak(u)
}

export const stopSpeaking = () => { turn++; player?.pause(); if ('speechSynthesis' in window) window.speechSynthesis.cancel() }
