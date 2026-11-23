import { haptic } from '../lib/a11y'
import { useEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { I } from './Icon'
import { HoldMic } from './HoldMic'
import { t } from '../lib/i18n'

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
 * It stays fixed in place while the page scrolls.
 */
export function TabBar() {
  const { pathname } = useLocation()
  const from = FROM[pathname]
  const first = useRef(true)

  // A light tap of haptics when the tab changes
  useEffect(() => {
    if (!first.current) haptic(6)
    first.current = false
  }, [pathname])

  return (
    <div className="tabbar">
      <div className="tb-shell">
        <nav aria-label={t('Main')} className="tb-nav">
          {TABS.map((tb, i) => tb ? (
            <NavLink key={tb.to} to={tb.to} end className={({ isActive }) => (isActive ? 'tb-link on' : 'tb-link')} aria-label={t(tb.label)}>
              {({ isActive }) => <>
                <span className="tb-ic" key={isActive ? 'on' : 'off'}><I n={isActive ? `${tb.icon}F` : tb.icon} s={24} w={1.9} /></span>
                <span className="tb-lbl">{t(tb.label)}</span>
              </>}
            </NavLink>
          ) : <span key={i} aria-hidden="true" />)}
        </nav>
      </div>
      <HoldMic from={from} />
    </div>
  )
}
