import { useEffect, useRef } from 'react'

/**
 * Live loudness of the microphone (0–1), read with the Web Audio API.
 * Runs alongside speech recognition so the waves move with the voice.
 * If the mic can't be opened, `level` stays at 0 and the waves just breathe.
 */
export function useMicLevel(active: boolean) {
  const level = useRef(0)
  useEffect(() => {
    if (!active) { level.current = 0; return }
    let stream: MediaStream | null = null
    let ctx: AudioContext | null = null
    let raf = 0
    let stopped = false
    ;(async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })
        if (stopped) { stream.getTracks().forEach((t) => t.stop()); return }
        const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        ctx = new AC()
        const an = ctx.createAnalyser()
        an.fftSize = 512
        an.smoothingTimeConstant = 0.6
        ctx.createMediaStreamSource(stream).connect(an)
        const buf = new Uint8Array(an.fftSize)
        const tick = () => {
          an.getByteTimeDomainData(buf)
          let sum = 0
          for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; sum += v * v }
          const rms = Math.sqrt(sum / buf.length)
          // Speech sits around 0.02–0.25 RMS; stretch that to 0–1
          const target = Math.min(1, Math.max(0, (rms - 0.012) * 5.5))
          level.current += (target - level.current) * (target > level.current ? 0.5 : 0.12)
          raf = requestAnimationFrame(tick)
        }
        tick()
      } catch { /* no mic access: waves keep breathing */ }
    })()
    return () => {
      stopped = true
      cancelAnimationFrame(raf)
      stream?.getTracks().forEach((t) => t.stop())
      ctx?.close().catch(() => {})
      level.current = 0
    }
  }, [active])
  return level
}
