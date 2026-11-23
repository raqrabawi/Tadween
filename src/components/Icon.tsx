const P: Record<string, string> = {
  search: 'M11 4.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM20 20l-4-4',
  plus: 'M12 5v14M5 12h14',
  back: 'M15 5l-7 7 7 7',
  close: 'M6 6l12 12M18 6L6 18',
  arrow: 'M7 17L17 7M8 7h9v9',
  next: 'M5 12h14M13 6l6 6-6 6',
  chev: 'M9 5l7 7-7 7',
  down: 'M6 9l6 6 6-6',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  cal: 'M3.5 5h17v15.5h-17zM3.5 10h17M8 3v4M16 3v4',
  bell: 'M6 9a6 6 0 0 1 12 0v4.5l1.5 2.5h-15L6 13.5zM10 19a2 2 0 0 0 4 0',
  bag: 'M5 8h14l-1.2 10.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8zM9 8V6.5a3 3 0 0 1 6 0V8',
  pen: 'M12 20h8M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z',
  mic: 'M12 2.5a3.5 3.5 0 0 1 3.5 3.5v6a3.5 3.5 0 0 1-7 0V6A3.5 3.5 0 0 1 12 2.5zM5 11a1 1 0 0 1 2 0 5 5 0 0 0 10 0 1 1 0 0 1 2 0 7 7 0 0 1-6 6.93V20h2.5a1 1 0 0 1 0 2h-7a1 1 0 0 1 0-2H11v-2.07A7 7 0 0 1 5 11z',
  speaker: 'M4 9.5v5h3.5L12 18.5v-13L7.5 9.5zM15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11',
  target: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  clock: 'M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17zM12 7.5V12l3 2',
  home: 'M4 11.2L12 4.5l8 6.7V19a1.5 1.5 0 0 1-1.5 1.5H15v-5.5H9v5.5H5.5A1.5 1.5 0 0 1 4 19z',
  list: 'M10 7h10M10 12h10M10 17h10M5.5 7h.01M5.5 12h.01M5.5 17h.01',
  book: 'M6.5 3.5h11a1.5 1.5 0 0 1 1.5 1.5v15l-3.5-2-3.5 2-3.5-2-3.5 2V5a1.5 1.5 0 0 1 1.5-1.5zM9 9h6M9 13h4',
  lock: 'M5 11h14v10H5zM8 11V8a4 4 0 0 1 8 0v3',
  share: 'M12 3v13M7.5 7.5L12 3l4.5 4.5M5 13v6.5h14V13',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 12.5a1.5 1.5 0 0 0 1.5 1.5h7a1.5 1.5 0 0 0 1.5-1.5L18 7M9 7V4.5h6V7',
  sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4',
  moon: 'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z',
  phone: 'M7 2.5h10v19H7zM11 18.5h2',
  mail: 'M3 5h18v14H3zM3.5 7l8.5 6 8.5-6',
  out: 'M14 4h5v16h-5M10 8l-4 4 4 4M6 12h10',
  people: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M16 4.5a3.5 3.5 0 0 1 0 7M18 14c2 .6 3.5 2.8 3.5 6',
  pin: 'M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  keyboard: 'M2.5 6h19v12h-19zM6.5 10h.01M10 10h.01M14 10h.01M17.5 10h.01M8 14h8',
  redo: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5',
  spark: 'M12 2.5l2 6 6 2-6 2-2 6-2-6-6-2 6-2z',
  play: 'M7 4.5v15l13-7.5z',
  pause: 'M6 5h4v14H6zM14 5h4v14h-4z',
  stop: 'M6 6h12v12H6z',
  gift: 'M4 11h16v9.5H4zM3 7.5h18V11H3zM12 7.5v13M12 7.5C10.5 4.5 7 4 7 6s3 1.5 5 1.5c2 0 5 .5 5-1.5s-3.5-1.5-5 1.5',
  camera: 'M3.5 8h4l2-2.5h5L16.5 8h4v11.5h-17zM12 10.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z',
  image: 'M3.5 4.5h17v15h-17zM3.5 16l5-5 4 4 2.5-2.5 5.5 5.5M15.5 8.5h.01',
  text: 'M5 6h14M5 11h14M5 16h9',
  checklist: 'M4 6.5l1.5 1.5L8 5.5M4 12.5l1.5 1.5L8 11.5M4 18.5l1.5 1.5L8 17.5M11 7h9M11 13h9M11 19h9',
  folder: 'M3 6h6.5l2 2.5H21v10.5H3z',
  more: 'M5.5 12h.01M12 12h.01M18.5 12h.01',
  access: 'M12 3a1.75 1.75 0 1 0 0 3.5 1.75 1.75 0 0 0 0-3.5zM5 8.5l7 1.5 7-1.5M12 10v4.5M12 14.5l-3 6M12 14.5l3 6',
  textsize: 'M3.5 18l5-12 5 12M5.3 14h6.4M15 18l3-7.5 3 7.5M15.9 16h4.2',
  bold: 'M7.5 4.5h5.5a3.5 3.5 0 0 1 0 7H7.5zM7.5 11.5h6.5a3.75 3.75 0 0 1 0 7.5H7.5z',
  contrast: 'M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17zM12 3.5v17M12 8h5M12 12h7.5M12 16h5',
  motion: 'M3.5 12h3.5l2.5-6 5 12 2.5-6h3.5',
  layers: 'M12 4l8.5 4.5L12 13 3.5 8.5zM3.5 12.5L12 17l8.5-4.5M3.5 16.5L12 21l8.5-4.5',
  spacing: 'M7 6l-3 6 3 6M17 6l3 6-3 6M9.5 12h5',
  underline: 'M7 4v7a5 5 0 0 0 10 0V4M5 20h14',
  hand: 'M9 11V5.5a1.5 1.5 0 0 1 3 0V11M12 10V4.5a1.5 1.5 0 0 1 3 0V11M15 10.5V6.5a1.5 1.5 0 0 1 3 0v7.5a7 7 0 0 1-7 7h-.5a6 6 0 0 1-5-2.7L3.5 14a1.6 1.6 0 0 1 2.6-1.8L9 15',
  vibrate: 'M8.5 4h7v16h-7zM4.5 8.5v7M19.5 8.5v7',
  reset: 'M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4.5v3.7h3.7',
  minus: 'M5 12h14',
  gear: 'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  // Filled versions for the selected tab
  micF: 'M12 2.5a3.5 3.5 0 0 1 3.5 3.5v6a3.5 3.5 0 0 1-7 0V6A3.5 3.5 0 0 1 12 2.5zM5 11a1 1 0 0 1 2 0 5 5 0 0 0 10 0 1 1 0 0 1 2 0 7 7 0 0 1-6 6.93V20h2.5a1 1 0 0 1 0 2h-7a1 1 0 0 1 0-2H11v-2.07A7 7 0 0 1 5 11z',
  homeF: 'M12 3.6l8.6 7.1c.3.3.4.6.4 1v7.8a1.5 1.5 0 0 1-1.5 1.5H15v-6H9v6H4.5A1.5 1.5 0 0 1 3 19.5v-7.8c0-.4.2-.7.4-1z',
  calF: 'M5 4.5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-12a2 2 0 0 1 2-2zM3 9h18v1.2H3zM7 12.5h2.5V15H7zM11 12.5h2.5V15H11zM15 12.5h2.5V15H15zM7 16.5h2.5v2H7zM11 16.5h2.5v2H11zM7 2.5h2v1.6H7zM15 2.5h2v1.6h-2z',
  listF: 'M4 5.5h3v3H4zM4 10.5h3v3H4zM4 15.5h3v3H4zM9.5 5.75H20v2.5H9.5zM9.5 10.75H20v2.5H9.5zM9.5 15.75H20v2.5H9.5z',
  bookF: 'M6.5 3h11a2 2 0 0 1 2 2v16l-3.75-2.1L12 21l-3.75-2.1L4.5 21V5a2 2 0 0 1 2-2zM8.5 8.5h7v1.6h-7zM8.5 12.5H13v1.6H8.5z',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20.5c0-4 3.4-6.5 7.5-6.5s7.5 2.5 7.5 6.5'
}

const FILLED = new Set(['spark', 'play', 'pause', 'stop', 'homeF', 'calF', 'listF', 'bookF', 'micF', 'mic'])

// Direction icons point the other way in right-to-left (Arabic)
const DIRECTIONAL = new Set(['back', 'chev', 'next', 'arrow'])

export function I({ n, s = 20, w = 2, className }: { n: keyof typeof P | string; s?: number; w?: number; className?: string }) {
  const filled = FILLED.has(n)
  const cls = DIRECTIONAL.has(n) ? ((className ? className + ' ' : '') + 'dir-ic') : className
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden="true" className={cls}
      fill={filled ? 'currentColor' : 'none'} stroke={filled ? 'none' : 'currentColor'} fillRule={filled ? 'evenodd' : undefined}
      strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <path d={P[n] ?? ''} />
    </svg>
  )
}

export function Logo({ s = 22 }: { s?: number }) {
  // Placeholder mark — swap in the official Apple / Google marks per their brand guidelines.
  return <span aria-hidden="true" style={{ width: s, height: s, borderRadius: 6, border: '1.5px dashed currentColor', opacity: .7, display: 'inline-block' }} />
}
