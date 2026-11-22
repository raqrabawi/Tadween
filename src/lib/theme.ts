export type Mode = 'dark' | 'light' | 'system'
export type Palette = 'marigold' | 'linen' | 'classic'

const mq = () => window.matchMedia('(prefers-color-scheme: light)')
export const resolve = (m: Mode): 'dark' | 'light' => (m === 'system' ? (mq().matches ? 'light' : 'dark') : m)
export const storedMode = (): Mode => (localStorage.getItem('nook-theme') as Mode) || 'light'
export const storedPalette = (): Palette => (localStorage.getItem('nook-palette') as Palette) || 'marigold'

export function applyTheme(m: Mode, p: Palette) {
  const r = resolve(m)
  document.documentElement.className = `${r} ${p}`
  const bg = p === 'marigold' ? (r === 'dark' ? '#181A19' : '#FAF8F5') : r === 'dark' ? '#0F181D' : p === 'classic' ? '#E4EEF0' : '#F5F2EC'
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', bg)
  try { localStorage.setItem('nook-theme', m); localStorage.setItem('nook-palette', p) } catch { /* private mode */ }
}

export const watchSystem = (cb: () => void) => { const q = mq(); q.addEventListener('change', cb); return () => q.removeEventListener('change', cb) }
