import { useEffect, useRef, useState } from 'react'
import { LogoMark } from './Logo'


/**
 * Launch splash: the T mark builds itself day by day (week, mic head, today, list item, note),
 * the bilingual name rises, and the whole thing fades away. Stays up while the app is still loading.
 */
export function Splash({ ready, onGone }: { ready: boolean; onGone: () => void }) {
  const [min, setMin] = useState(false)
  const [leaving, setLeaving] = useState(false)
  useEffect(() => { const tm = setTimeout(() => setMin(true), 1500); return () => clearTimeout(tm) }, [])
  const gone = useRef(onGone)
  gone.current = onGone
  useEffect(() => { if (min && ready) setLeaving(true) }, [min, ready])
  useEffect(() => {
    if (!leaving) return
    const tm = setTimeout(() => gone.current(), 450)
    return () => clearTimeout(tm)
  }, [leaving])
  const dark = document.documentElement.classList.contains('dark')
  return (
    <div className={leaving ? 'splash out' : 'splash'} role="status" aria-label="Tadween">
      <div className="splash-glow" aria-hidden="true" />
      <span className="splash-mark"><LogoMark size={112} dark={dark} animate /></span>
      <div className="splash-name">
        <span lang="ar">تدوين</span>
        <span lang="en">Tadween</span>
      </div>
    </div>
  )
}
