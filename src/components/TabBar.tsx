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
 * Tab icons: rounded line drawings that turn duotone when selected — a soft tint of the
 * tab colour plus one terracotta detail (the rising sun, today's square, the ticked box,
 * the handwriting) so the nav carries the brand's voice colour.
 */
function NavIcon({ name, on }: { name: string; on: boolean }) {
  const tint = on ? 'currentColor' : 'none'
  const cta = on ? 'var(--cta)' : 'currentColor'
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true" {...common}>
      {name === 'today' && <>
        <path d="M6.5 18.5a5.5 5.5 0 0 1 11 0z" fill={on ? 'var(--cta)' : 'none'} stroke={cta} />
        <path d="M12 8.5v2M5.3 11.8l1.4 1.4M18.7 11.8l-1.4 1.4M3 18.5h18M8.5 21.5h7" />
      </>}
      {name === 'calendar' && <>
        <path d="M3.5 10V8.5a3.5 3.5 0 0 1 3.5-3.5h10a3.5 3.5 0 0 1 3.5 3.5V10z" fill={tint} fillOpacity={0.18} stroke="none" />
        <rect x="3.5" y="5" width="17" height="15.5" rx="3.5" />
        <path d="M3.5 10h17M8 3v4M16 3v4" />
        <rect x="13" y="13" width="4" height="4" rx="1.2" fill={on ? 'var(--cta)' : 'none'} stroke={cta} />
      </>}
      {name === 'lists' && <>
        <circle cx="5.5" cy="6.5" r="2.4" fill={on ? 'var(--cta)' : 'none'} stroke={cta} />
        {on && <path d="M4.4 6.5l.8.8 1.5-1.6" stroke="var(--ctaInk, #fff)" strokeWidth="1.4" />}
        <circle cx="5.5" cy="12.5" r="2.4" fill={tint} fillOpacity={0.18} />
        <circle cx="5.5" cy="18.5" r="2.4" fill={tint} fillOpacity={0.18} />
        <path d="M10.5 6.5h10M10.5 12.5h10M10.5 18.5h6.5" />
      </>}
      {name === 'notes' && <>
        <path d="M6 3.5h9l4.5 4.5v11.5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-14a2 2 0 0 1 2-2z" fill={tint} fillOpacity={0.18} />
        <path d="M15 3.5V8h4.5" />
        <path d="M7.5 13.2c1.2-1.5 2.4-1.5 3.6 0s2.4 1.5 3.6 0" stroke={cta} />
        <path d="M7.5 17h5" />
      </>}
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
