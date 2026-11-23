import { haptic } from '../lib/a11y'
import { useEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { HoldMic } from './HoldMic'
import { t } from '../lib/i18n'

// The mic knows which tab it was opened from, so it only adds things for that page
const FROM: Record<string, string> = { '/calendar': 'calendar', '/lists': 'lists', '/notes': 'notes' }
const TABS = [
  { to: '/', label: 'Today', icon: 'today' },
  { to: '/calendar', label: 'Calendar', icon: 'calendar' },
  null, // the mic sits in the notch here
  { to: '/lists', label: 'Lists', icon: 'lists' },
  { to: '/notes', label: 'Notes', icon: 'notes' }
] as const

/**
 * Tab icons: minimal 1.7px line icons; the selected tab switches to a solid version of the
 * same shape (negative space keeps the detail). One colour only, nothing decorative.
 */
const NAV: Record<string, { off: string[]; on: string[]; onStroke?: string }> = {
  today: {
    off: ['M4 10.5L12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5H15v-5h-6v5H5.5A1.5 1.5 0 0 1 4 19z'],
    on: ['M12 3.2a1 1 0 0 1 .63.22l7.9 6.4c.3.24.47.6.47.98V19a2 2 0 0 1-2 2h-4v-5.5h-6V21H5a2 2 0 0 1-2-2v-8.2c0-.38.17-.74.47-.98l7.9-6.4A1 1 0 0 1 12 3.2z']
  },
  calendar: {
    off: ['M6 4.5h12a2.5 2.5 0 0 1 2.5 2.5v11a2.5 2.5 0 0 1-2.5 2.5H6A2.5 2.5 0 0 1 3.5 18V7A2.5 2.5 0 0 1 6 4.5zM3.5 9.5h17M8 2.75v3.5M16 2.75v3.5'],
    on: ['M6 4h12a3 3 0 0 1 3 3v1.6H3V7a3 3 0 0 1 3-3zM3 10.2h18V18a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3z'],
    onStroke: 'M8 2.5v3M16 2.5v3'
  },
  lists: {
    off: ['M9 6.5h11M9 12h11M9 17.5h11', 'M4.75 5.25a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5zM4.75 10.75a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5zM4.75 16.25a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5z'],
    on: ['M9 5.3h11a1.2 1.2 0 0 1 0 2.4H9a1.2 1.2 0 0 1 0-2.4zM9 10.8h11a1.2 1.2 0 0 1 0 2.4H9a1.2 1.2 0 0 1 0-2.4zM9 16.3h11a1.2 1.2 0 0 1 0 2.4H9a1.2 1.2 0 0 1 0-2.4zM4.75 4.7a1.8 1.8 0 1 1 0 3.6 1.8 1.8 0 0 1 0-3.6zM4.75 10.2a1.8 1.8 0 1 1 0 3.6 1.8 1.8 0 0 1 0-3.6zM4.75 15.7a1.8 1.8 0 1 1 0 3.6 1.8 1.8 0 0 1 0-3.6z']
  },
  notes: {
    off: ['M7 3.5h10a2.5 2.5 0 0 1 2.5 2.5v12a2.5 2.5 0 0 1-2.5 2.5H7A2.5 2.5 0 0 1 4.5 18V6A2.5 2.5 0 0 1 7 3.5zM8.5 9h7M8.5 12.5h7M8.5 16h4'],
    on: ['M7 3h10a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3zM8.5 8.2v1.6h7V8.2zM8.5 11.7v1.6h7v-1.6zM8.5 15.2v1.6h4v-1.6z']
  }
}
function NavIcon({ name, on }: { name: string; on: boolean }) {
  const ic = NAV[name]
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" strokeLinecap="round" strokeLinejoin="round">
      {on
        ? <>{ic.on.map((d) => <path key={d} d={d} fill="currentColor" fillRule="evenodd" />)}{ic.onStroke && <path d={ic.onStroke} fill="none" stroke="currentColor" strokeWidth="2" />}</>
        : ic.off.map((d, i) => <path key={d} d={d} fill={name === 'lists' && i === 1 ? 'currentColor' : 'none'} stroke={name === 'lists' && i === 1 ? 'none' : 'currentColor'} strokeWidth="1.7" />)}
    </svg>
  )
}

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
                <span className="tb-ic" key={isActive ? 'on' : 'off'}><NavIcon name={tb.icon} on={isActive} /></span>
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
