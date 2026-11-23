import { useEffect, useState } from 'react'

const WAVES = ['M15 25.5c4.8-5.9 10.4-8.8 17-8.8s12.2 2.9 17 8.8', 'M20.8 33c3.2-3.8 6.9-5.7 11.2-5.7s8 1.9 11.2 5.7', 'M26.5 40.5c1.6-1.8 3.4-2.7 5.5-2.7s3.9.9 5.5 2.7']

/**
 * Launch splash: the listening-to-writing mark draws in (waves, then the voice dot, then the pen line),
 * the bilingual name rises, and the whole thing fades away. Stays up while the app is still loading.
 */
export function Splash({ ready, onGone }: { ready: boolean; onGone: () => void }) {
  const [min, setMin] = useState(false)
  const [leaving, setLeaving] = useState(false)
  useEffect(() => { const tm = setTimeout(() => setMin(true), 1500); return () => clearTimeout(tm) }, [])
  useEffect(() => {
    if (!(min && ready) || leaving) return
    setLeaving(true)
    const tm = setTimeout(onGone, 450)
    return () => clearTimeout(tm)
  }, [min, ready, leaving, onGone])
  const dark = document.documentElement.classList.contains('dark')
  return (
    <div className={leaving ? 'splash out' : 'splash'} role="status" aria-label="Tadween">
      <div className="splash-glow" aria-hidden="true" />
      <svg className="splash-mark" width="112" height="112" viewBox="0 0 64 64" fill="none" aria-hidden="true">
        {WAVES.map((d, i) => <path key={d} d={d} className="sw" style={{ animationDelay: `${i * 0.12}s` }} stroke={dark ? '#DCE8D9' : '#627A6B'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" pathLength={1} />)}
        <circle cx="32" cy="48" r="3.8" className="sd" fill={dark ? '#E99168' : '#DE7449'} />
        <path d="M36 48h13" className="sw pen" stroke={dark ? '#DCE8D9' : '#627A6B'} strokeWidth="3" strokeLinecap="round" pathLength={1} />
      </svg>
      <div className="splash-name">
        <span lang="ar">تدوين</span>
        <span lang="en">Tadween</span>
      </div>
    </div>
  )
}
