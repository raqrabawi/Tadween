import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { I } from './Icon'
import { HoldMic } from './HoldMic'

// The mic knows which tab it was opened from, so it only adds things for that page
const FROM: Record<string, string> = { '/calendar': 'calendar', '/lists': 'lists', '/notes': 'notes' }
const TABS = [
  { to: '/', label: 'Today', icon: 'home' },
  { to: '/calendar', label: 'Calendar', icon: 'cal' },
  null, // the mic sits in the notch here
  { to: '/lists', label: 'Lists', icon: 'list' },
  { to: '/notes', label: 'Notes', icon: 'book' }
]

/**
 * Floating tab bar with a notch for the mic.
 * The selected tab's icon fills in with a little pop; every tab shows its name.
 * Scrolling down tucks the bar in; scrolling up brings it back.
 */
export function TabBar() {
  const { pathname } = useLocation()
  const from = FROM[pathname]
  const first = useRef(true)
  const [tucked, setTucked] = useState(false)

  // A light tap of haptics when the tab changes
  useEffect(() => {
    if (!first.current) navigator.vibrate?.(6)
    first.current = false
  }, [pathname])

  // Tuck away while scrolling down, come back when scrolling up
  useEffect(() => {
    let last = window.scrollY
    const on = () => {
      const y = window.scrollY, d = y - last
      if (Math.abs(d) > 6) { setTucked(d > 0 && y > 60); last = y }
    }
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  useEffect(() => { setTucked(false) }, [pathname])

  return (
    <div className={tucked ? 'tabbar tucked' : 'tabbar'}>
      <div className="tb-shell">
        <nav aria-label="Main" className="tb-nav">
          {TABS.map((t, i) => t ? (
            <NavLink key={t.to} to={t.to} end className={({ isActive }) => (isActive ? 'tb-link on' : 'tb-link')} aria-label={t.label}>
              {({ isActive }) => <>
                <span className="tb-ic" key={isActive ? 'on' : 'off'}><I n={isActive ? `${t.icon}F` : t.icon} s={24} w={1.9} /></span>
                <span className="tb-lbl">{t.label}</span>
              </>}
            </NavLink>
          ) : <span key={i} aria-hidden="true" />)}
        </nav>
      </div>
      <HoldMic from={from} />
    </div>
  )
}
