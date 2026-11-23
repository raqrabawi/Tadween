import { useId } from 'react'

/* Tadween logo: a "T" built from calendar days. The top row is the week (today in terracotta);
   the top-middle day is a microphone head, so the stem below reads as its handle — a ticked list
   item, then a note with its corner turned. Source files: public/brand/. Do not redraw or stretch. */

const GRILLE = Array.from({ length: 9 }, (_, k) => -24 + k * 8).flatMap((i) => [`M${66 + i} 36l30 30`, `M${114 - i} 36l-30 30`])

/** The mark on its own. `dark` uses light ink for dark surfaces. `animate` pops the days in one by one (splash). */
export function LogoMark({ size = 32, dark = false, animate = false }: { size?: number; dark?: boolean; animate?: boolean }) {
  const id = useId().replace(/:/g, '')
  const ink = dark ? '#F5F4ED' : '#16232A'
  const cut = dark ? '#16232A' : '#F5F4ED'
  const a = (n: number) => (animate ? { className: 'lp-pop', style: { animationDelay: `${n * 0.09}s`, transformBox: 'fill-box' as const, transformOrigin: 'center' } } : {})
  return (
    <svg width={size} height={size} viewBox="32 34 116 116" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={`h${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F08C62" /><stop offset="1" stop-color="#CF5F36" /></linearGradient>
        <clipPath id={`m${id}`}><path d="M90 40.5a13.5 13.5 0 0 1 13.5 13.5v4.5h-27V54A13.5 13.5 0 0 1 90 40.5z" /></clipPath>
      </defs>
      <rect {...a(0)} x="36" y="38" width="32" height="32" rx="9" fill={ink} />
      <g {...a(1)}>
        <path d="M74 54a16 16 0 0 1 32 0v6H74z" fill={ink} />
        <path d="M74 63h32a9 7 0 0 1-9 7H83a9 7 0 0 1-9-7z" fill={ink} />
        <g clipPath={`url(#m${id})`} stroke={cut} strokeWidth="2.4" strokeLinecap="round" opacity=".7">{GRILLE.map((d) => <path key={d} d={d} />)}</g>
      </g>
      <rect {...a(2)} x="112" y="38" width="32" height="32" rx="9" fill={`url(#h${id})`} />
      <g {...a(3)}>
        <rect x="74" y="76" width="32" height="32" rx="9" fill={ink} />
        <path d="M82 92l5 5 9-10" stroke={cut} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <g {...a(4)}>
        <path d="M83 114h14a9 9 0 0 1 9 9v5l-18 18h-5a9 9 0 0 1-9-9v-14a9 9 0 0 1 9-9z" fill={ink} />
        <path d="M106 128L88 146v-12a6 6 0 0 1 6-6z" fill={`url(#h${id})`} />
      </g>
    </svg>
  )
}

/** Mark with the bilingual name: bold Tadween, تدوين in terracotta underneath. */
export function LogoLockup({ width = 160, dark = false }: { width?: number; dark?: boolean }) {
  const ink = dark ? '#FFF8EE' : '#16232A'
  const h = Math.round(width * 0.36)
  return (
    <span role="img" aria-label="Tadween تدوين" style={{ display: 'inline-flex', alignItems: 'center', gap: width * 0.07 }}>
      <LogoMark size={h} dark={dark} />
      <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05 }}>
        <b lang="en" dir="ltr" style={{ fontSize: h * 0.42, letterSpacing: '-.03em', color: ink }}>Tadween</b>
        <b lang="ar" dir="rtl" style={{ fontFamily: "'Noto Sans Arabic', sans-serif", fontSize: h * 0.36, color: dark ? '#E99168' : '#DE7449', textAlign: 'end' }}>تدوين</b>
      </span>
    </span>
  )
}
