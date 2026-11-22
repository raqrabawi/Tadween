import { useEffect, useRef } from 'react'

/**
 * Flowing ribbons of sound that swell with the voice — the "agent is listening" visual.
 * level: a ref holding 0–1 loudness. muted: drawn grey (e.g. about to cancel).
 */
export function VoiceWave({ level, height = 180, muted = false }: { level: { current: number }; height?: number; muted?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const mutedRef = useRef(muted)
  mutedRef.current = muted

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const g = c.getContext('2d')
    if (!g) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const css = getComputedStyle(document.documentElement)
    const pick = (v: string, f: string) => css.getPropertyValue(v).trim() || f
    const colors = [pick('--ctaFlat', '#E08E26'), pick('--acc', '#3E6B5A'), pick('--sun', '#F2B84B'), pick('--grn', '#6FA287')]
    let raf = 0
    let t = 0
    let amp = 0.22
    const draw = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const w = c.clientWidth, h = c.clientHeight
      if (c.width !== w * dpr || c.height !== h * dpr) { c.width = w * dpr; c.height = h * dpr }
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
      g.clearRect(0, 0, w, h)
      const lv = level.current
      // Gentle breathing when quiet, big swells when speaking
      amp += (0.22 + lv * 0.78 - amp) * 0.18
      t += reduce ? 0.01 : 0.035 + lv * 0.06
      const mid = h / 2
      g.globalCompositeOperation = 'source-over'
      const layers = 4
      for (let k = 0; k < layers; k++) {
        const col = mutedRef.current ? pick('--ink3', '#999') : colors[k % colors.length]
        const speed = 1 + k * 0.35, freq = 1.4 + k * 0.55, phase = k * 1.7
        const a = amp * (h * 0.42) * (1 - k * 0.16)
        g.beginPath()
        for (let x = 0; x <= w; x += 3) {
          const p = x / w
          // Taper at both ends so the ribbons look like they come from one source
          const env = Math.pow(Math.sin(Math.PI * p), 1.5)
          const y = mid + Math.sin(p * Math.PI * 2 * freq + t * speed + phase) * a * env
            + Math.sin(p * Math.PI * 5 + t * 1.9 + k) * a * 0.18 * env
          x === 0 ? g.moveTo(x, y) : g.lineTo(x, y)
        }
        for (let x = w; x >= 0; x -= 3) {
          const p = x / w
          const env = Math.pow(Math.sin(Math.PI * p), 1.5)
          const y = mid - Math.sin(p * Math.PI * 2 * freq + t * speed * 0.8 + phase + 1.2) * a * 0.55 * env
          g.lineTo(x, y)
        }
        g.closePath()
        g.globalAlpha = mutedRef.current ? 0.18 : 0.32 - k * 0.04
        g.fillStyle = col
        g.fill()
      }
      // Bright core line
      g.globalAlpha = mutedRef.current ? 0.4 : 0.9
      g.lineWidth = 2
      g.strokeStyle = mutedRef.current ? pick('--ink3', '#999') : colors[0]
      g.beginPath()
      for (let x = 0; x <= w; x += 3) {
        const p = x / w, env = Math.pow(Math.sin(Math.PI * p), 1.5)
        const y = mid + Math.sin(p * Math.PI * 3.1 + t * 1.3) * amp * h * 0.3 * env
        x === 0 ? g.moveTo(x, y) : g.lineTo(x, y)
      }
      g.stroke()
      g.globalAlpha = 1
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [level])

  return <canvas ref={ref} aria-hidden="true" style={{ display: 'block', width: '100%', height }} />
}
