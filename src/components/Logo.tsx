// Tadween logo, from the design system (assets/logos). Kept inline so the lockup's live text
// uses the app's loaded Noto Sans Arabic. Do not redraw or stretch.
const MARK = ['M15 25.5c4.8-5.9 10.4-8.8 17-8.8s12.2 2.9 17 8.8', 'M20.8 33c3.2-3.8 6.9-5.7 11.2-5.7s8 1.9 11.2 5.7', 'M26.5 40.5c1.6-1.8 3.4-2.7 5.5-2.7s3.9.9 5.5 2.7']

/** The listening-to-writing mark. `dark` uses the light-ink version for dark surfaces. */
export function LogoMark({ size = 32, dark = false }: { size?: number; dark?: boolean }) {
  const stroke = dark ? '#DCE8D9' : '#627A6B'
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      {MARK.map((d) => <path key={d} d={d} stroke={stroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />)}
      <circle cx="32" cy="48" r="3.8" fill={dark ? '#E99168' : '#DE7449'} />
      <path d="M36 48h13" stroke={stroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Stacked bilingual lockup: Arabic تدوين above bold Tadween, with the mark. */
export function LogoLockup({ width = 160, dark = false }: { width?: number; dark?: boolean }) {
  const ink = dark ? '#FFF8EE' : '#304440'
  const stroke = dark ? '#DCE8D9' : '#627A6B'
  return (
    <svg width={width} height={width * 236 / 320} viewBox="0 0 320 236" fill="none" role="img" aria-label="تدوين Tadween">
      <g transform="translate(128 12)" stroke={stroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        {MARK.map((d) => <path key={d} d={d} />)}
        <path d="M36 48h13" />
      </g>
      <circle cx="160" cy="60" r="3.8" fill={dark ? '#E99168' : '#DE7449'} />
      <text x="160" y="139" textAnchor="middle" direction="rtl" fontFamily="'Noto Sans Arabic', sans-serif" fontSize="47" fontWeight="700" fill={ink} lang="ar">تدوين</text>
      <text x="160" y="190" textAnchor="middle" direction="ltr" fontFamily="'Noto Sans Arabic', sans-serif" fontSize="42" fontWeight="700" letterSpacing="-1.4" fill={ink} lang="en">Tadween</text>
    </svg>
  )
}
