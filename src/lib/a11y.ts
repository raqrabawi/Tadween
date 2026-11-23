// Accessibility preferences (Settings › Accessibility). Stored on this device and applied at start-up.

export type A11y = {
  size: number          // text & layout scale: 0.9 … 1.5
  bold: boolean         // heavier body text
  contrast: boolean     // stronger text, borders and outlines
  motion: boolean       // reduce motion: no animations or transitions
  solid: boolean        // reduce transparency: no blur or see-through surfaces
  spacing: boolean      // easier reading: wider letter, word and line spacing
  links: boolean        // underline links and outline buttons
  haptics: boolean      // vibration feedback
  bigTargets: boolean   // larger touch targets
}

export const SIZES = [0.9, 1, 1.1, 1.2, 1.35, 1.5]

const DEFAULTS: A11y = { size: 1, bold: false, contrast: false, motion: false, solid: false, spacing: false, links: false, haptics: true, bigTargets: false }
const KEY = 'tadween-a11y'

export function loadA11y(): A11y {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch { /* private mode or bad data */ }
  // Respect the phone's own reduce-motion setting the first time
  return { ...DEFAULTS, motion: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false }
}

let current: A11y = DEFAULTS

export function applyA11y(a: A11y) {
  current = a
  const el = document.documentElement
  el.style.setProperty('--zoom', String(a.size))
  const flags: [keyof A11y, string][] = [['bold', 'a-bold'], ['contrast', 'a-contrast'], ['motion', 'a-still'], ['solid', 'a-solid'], ['spacing', 'a-spacing'], ['links', 'a-links'], ['bigTargets', 'a-big']]
  for (const [k, cls] of flags) el.classList.toggle(cls, !!a[k])
}

export function saveA11y(a: A11y) {
  applyA11y(a)
  try { localStorage.setItem(KEY, JSON.stringify(a)) } catch { /* private mode */ }
}

export const resetA11y = () => saveA11y({ ...DEFAULTS })

/** Vibration that follows the Haptics setting. */
export function haptic(ms: number) {
  if (!current.haptics) return
  try { navigator.vibrate?.(ms) } catch { /* not supported */ }
}
