import { isAr } from './i18n'
export type Mode = 'dark' | 'light' | 'system'
export type Palette = 'marigold' | 'linen' | 'classic'

const mq = () => window.matchMedia('(prefers-color-scheme: light)')
export const resolve = (m: Mode): 'dark' | 'light' => (m === 'system' ? (mq().matches ? 'light' : 'dark') : m)
export const storedMode = (): Mode => (localStorage.getItem('nook-theme') as Mode) || 'light'
export const storedPalette = (): Palette => (localStorage.getItem('nook-palette') as Palette) || 'marigold'

export function applyTheme(m: Mode, p: Palette) {
  const r = resolve(m)
  document.documentElement.className = `${r} ${p}`
  const bg = p === 'marigold' ? (r === 'dark' ? '#181A19' : '#FAF8F5') : p === 'classic' ? (r === 'dark' ? '#1D1915' : '#F3EDE2') : r === 'dark' ? '#0F181D' : '#F5F2EC'
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', bg)
  try { localStorage.setItem('nook-theme', m); localStorage.setItem('nook-palette', p) } catch { /* private mode */ }
}

export const watchSystem = (cb: () => void) => { const q = mq(); q.addEventListener('change', cb); return () => q.removeEventListener('change', cb) }

// Font choice (Settings › Font). English and Arabic each have their own list and remembered pick.
// Fonts ship with the app and load only when used.
export type Font = 'Inter' | 'Lora' | 'Merriweather' | 'Newsreader' | 'IBM Plex Sans Arabic' | 'Cairo' | 'Amiri' | 'Readex Pro'
const LOADERS: Record<Font, () => Promise<unknown>> = {
  Inter: () => Promise.all([import('@fontsource/inter/latin-300.css'), import('@fontsource/inter/latin-400.css'), import('@fontsource/inter/latin-500.css'), import('@fontsource/inter/latin-600.css'), import('@fontsource/inter/latin-700.css')]),
  Lora: () => Promise.all([import('@fontsource/lora/latin-400.css'), import('@fontsource/lora/latin-500.css'), import('@fontsource/lora/latin-600.css'), import('@fontsource/lora/latin-700.css')]),
  Merriweather: () => Promise.all([import('@fontsource/merriweather/latin-300.css'), import('@fontsource/merriweather/latin-400.css'), import('@fontsource/merriweather/latin-700.css')]),
  Newsreader: () => Promise.all([import('@fontsource/newsreader/latin-300.css'), import('@fontsource/newsreader/latin-400.css'), import('@fontsource/newsreader/latin-500.css'), import('@fontsource/newsreader/latin-600.css'), import('@fontsource/newsreader/latin-700.css')]),
  'IBM Plex Sans Arabic': () => Promise.all([import('@fontsource/ibm-plex-sans-arabic/arabic-300.css'), import('@fontsource/ibm-plex-sans-arabic/arabic-400.css'), import('@fontsource/ibm-plex-sans-arabic/arabic-500.css'), import('@fontsource/ibm-plex-sans-arabic/arabic-600.css'), import('@fontsource/ibm-plex-sans-arabic/arabic-700.css'), import('@fontsource/ibm-plex-sans-arabic/latin-400.css'), import('@fontsource/ibm-plex-sans-arabic/latin-600.css'), import('@fontsource/ibm-plex-sans-arabic/latin-700.css')]),
  Cairo: () => Promise.all([import('@fontsource/cairo/arabic-300.css'), import('@fontsource/cairo/arabic-400.css'), import('@fontsource/cairo/arabic-500.css'), import('@fontsource/cairo/arabic-600.css'), import('@fontsource/cairo/arabic-700.css'), import('@fontsource/cairo/latin-400.css'), import('@fontsource/cairo/latin-600.css'), import('@fontsource/cairo/latin-700.css')]),
  Amiri: () => Promise.all([import('@fontsource/amiri/arabic-400.css'), import('@fontsource/amiri/arabic-700.css'), import('@fontsource/amiri/latin-400.css'), import('@fontsource/amiri/latin-700.css')]),
  'Readex Pro': () => Promise.all([import('@fontsource/readex-pro/arabic-300.css'), import('@fontsource/readex-pro/arabic-400.css'), import('@fontsource/readex-pro/arabic-500.css'), import('@fontsource/readex-pro/arabic-600.css'), import('@fontsource/readex-pro/arabic-700.css'), import('@fontsource/readex-pro/latin-400.css'), import('@fontsource/readex-pro/latin-600.css'), import('@fontsource/readex-pro/latin-700.css')])
}
const EN_FONTS: { id: Font; meta: string; stack: string }[] = [
  { id: 'Inter', meta: 'Clean sans', stack: 'Inter,-apple-system,BlinkMacSystemFont,system-ui,sans-serif' },
  { id: 'Lora', meta: 'Warm serif', stack: 'Lora,Georgia,serif' },
  { id: 'Merriweather', meta: 'Sturdy serif', stack: 'Merriweather,Georgia,serif' },
  { id: 'Newsreader', meta: 'Book serif', stack: 'Newsreader,Georgia,serif' }
]
const AR_FONTS: { id: Font; meta: string; stack: string }[] = [
  { id: 'IBM Plex Sans Arabic', meta: 'Clear and modern', stack: '"IBM Plex Sans Arabic",system-ui,sans-serif' },
  { id: 'Cairo', meta: 'Rounded and friendly', stack: 'Cairo,system-ui,sans-serif' },
  { id: 'Amiri', meta: 'Classic Naskh, like a book', stack: 'Amiri,"Times New Roman",serif' },
  { id: 'Readex Pro', meta: 'Soft and easy to read', stack: '"Readex Pro",system-ui,sans-serif' }
]
export const FONTS = isAr ? AR_FONTS : EN_FONTS
const FONT_KEY = isAr ? 'tadween-font-ar' : 'tadween-font'
export const storedFont = (): Font => {
  const f = (() => { try { return localStorage.getItem(FONT_KEY) } catch { return null } })()
  return FONTS.some((x) => x.id === f) ? (f as Font) : FONTS[0].id
}
const loaded = new Set<Font>()
export function loadFont(f: Font) {
  const def = FONTS.find((x) => x.id === f) ?? FONTS[0]
  if (!loaded.has(def.id)) { loaded.add(def.id); LOADERS[def.id]().catch(() => loaded.delete(def.id)) }
  return def
}
export function applyFont(f: Font) {
  const def = loadFont(f)
  document.documentElement.style.setProperty('--font', def.stack)
  document.documentElement.dataset.font = def.id.toLowerCase().replace(/ /g, '-')
  try { localStorage.setItem(FONT_KEY, def.id) } catch { /* private mode */ }
}
