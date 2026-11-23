import { isAr } from './i18n'
export type Mode = 'dark' | 'light' | 'system'
export type Palette = 'tadween' | 'marigold' | 'linen' | 'classic'

const mq = () => window.matchMedia('(prefers-color-scheme: light)')
export const resolve = (m: Mode): 'dark' | 'light' => (m === 'system' ? (mq().matches ? 'light' : 'dark') : m)
export const storedMode = (): Mode => (localStorage.getItem('nook-theme') as Mode) || 'light'
// The Tadween design system (Nov 2026) is the default look. Switch everyone to it once;
// the older themes stay available in Settings.
export const DS_FLAG = 'tadween-ds-v1'
export const storedPalette = (): Palette => {
  try {
    if (!localStorage.getItem(DS_FLAG)) { localStorage.setItem(DS_FLAG, 'pending'); localStorage.setItem('nook-palette', 'tadween') }
    return (localStorage.getItem('nook-palette') as Palette) || 'tadween'
  } catch { return 'tadween' }
}

export function applyTheme(m: Mode, p: Palette) {
  const r = resolve(m)
  const cl = document.documentElement.classList
  cl.remove('dark', 'light', 'tadween', 'marigold', 'linen', 'classic')
  cl.add(r, p)
  const bg = p === 'tadween' ? (r === 'dark' ? '#181A19' : '#F5F4ED') : p === 'marigold' ? (r === 'dark' ? '#181A19' : '#FAF8F5') : p === 'classic' ? (r === 'dark' ? '#1D1915' : '#F3EDE2') : r === 'dark' ? '#0F181D' : '#F5F2EC'
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', bg)
  try { localStorage.setItem('nook-theme', m); localStorage.setItem('nook-palette', p) } catch { /* private mode */ }
}

export const watchSystem = (cb: () => void) => { const q = mq(); q.addEventListener('change', cb); return () => q.removeEventListener('change', cb) }

// Font choice (Settings › Font). English and Arabic each have their own list and remembered pick.
// Fonts ship with the app and load only when used.
export type Font = 'Noto Sans Arabic' | 'Inter' | 'Lora' | 'Merriweather' | 'Newsreader' | 'IBM Plex Sans Arabic' | 'Cairo' | 'Amiri' | 'Readex Pro'
const LOADERS: Record<Font, () => Promise<unknown>> = {
  'Noto Sans Arabic': () => Promise.all([import('@fontsource/noto-sans-arabic/latin-300.css'), import('@fontsource/noto-sans-arabic/latin-400.css'), import('@fontsource/noto-sans-arabic/latin-500.css'), import('@fontsource/noto-sans-arabic/latin-600.css'), import('@fontsource/noto-sans-arabic/latin-700.css'), import('@fontsource/noto-sans-arabic/arabic-300.css'), import('@fontsource/noto-sans-arabic/arabic-400.css'), import('@fontsource/noto-sans-arabic/arabic-500.css'), import('@fontsource/noto-sans-arabic/arabic-600.css'), import('@fontsource/noto-sans-arabic/arabic-700.css')]),
  Inter: () => Promise.all([import('@fontsource/inter/latin-300.css'), import('@fontsource/inter/latin-400.css'), import('@fontsource/inter/latin-500.css'), import('@fontsource/inter/latin-600.css'), import('@fontsource/inter/latin-700.css')]),
  Lora: () => Promise.all([import('@fontsource/lora/latin-400.css'), import('@fontsource/lora/latin-500.css'), import('@fontsource/lora/latin-600.css'), import('@fontsource/lora/latin-700.css')]),
  Merriweather: () => Promise.all([import('@fontsource/merriweather/latin-300.css'), import('@fontsource/merriweather/latin-400.css'), import('@fontsource/merriweather/latin-700.css')]),
  Newsreader: () => Promise.all([import('@fontsource/newsreader/latin-300.css'), import('@fontsource/newsreader/latin-400.css'), import('@fontsource/newsreader/latin-500.css'), import('@fontsource/newsreader/latin-600.css'), import('@fontsource/newsreader/latin-700.css')]),
  'IBM Plex Sans Arabic': () => Promise.all([import('@fontsource/ibm-plex-sans-arabic/arabic-300.css'), import('@fontsource/ibm-plex-sans-arabic/arabic-400.css'), import('@fontsource/ibm-plex-sans-arabic/arabic-500.css'), import('@fontsource/ibm-plex-sans-arabic/arabic-600.css'), import('@fontsource/ibm-plex-sans-arabic/arabic-700.css'), import('@fontsource/ibm-plex-sans-arabic/latin-400.css'), import('@fontsource/ibm-plex-sans-arabic/latin-600.css'), import('@fontsource/ibm-plex-sans-arabic/latin-700.css')]),
  Cairo: () => Promise.all([import('@fontsource/cairo/arabic-300.css'), import('@fontsource/cairo/arabic-400.css'), import('@fontsource/cairo/arabic-500.css'), import('@fontsource/cairo/arabic-600.css'), import('@fontsource/cairo/arabic-700.css'), import('@fontsource/cairo/latin-400.css'), import('@fontsource/cairo/latin-600.css'), import('@fontsource/cairo/latin-700.css')]),
  Amiri: () => Promise.all([import('@fontsource/amiri/arabic-400.css'), import('@fontsource/amiri/arabic-700.css'), import('@fontsource/amiri/latin-400.css'), import('@fontsource/amiri/latin-700.css')]),
  'Readex Pro': () => Promise.all([import('@fontsource/readex-pro/arabic-300.css'), import('@fontsource/readex-pro/arabic-400.css'), import('@fontsource/readex-pro/arabic-500.css'), import('@fontsource/readex-pro/arabic-600.css'), import('@fontsource/readex-pro/arabic-700.css'), import('@fontsource/readex-pro/latin-400.css'), import('@fontsource/readex-pro/latin-600.css'), import('@fontsource/readex-pro/latin-700.css')])
}
const NOTO = { id: 'Noto Sans Arabic' as Font, meta: 'Design system font', stack: '"Noto Sans Arabic",system-ui,sans-serif' }
const EN_FONTS: { id: Font; meta: string; stack: string }[] = [
  { id: 'Merriweather', meta: 'Default · sturdy serif', stack: 'Merriweather,"IBM Plex Sans Arabic",Georgia,serif' },
  { id: 'Inter', meta: 'Clean sans', stack: 'Inter,-apple-system,BlinkMacSystemFont,system-ui,sans-serif' },
  { id: 'Lora', meta: 'Warm serif', stack: 'Lora,Georgia,serif' },
  NOTO,
  { id: 'Newsreader', meta: 'Book serif', stack: 'Newsreader,Georgia,serif' }
]
const AR_FONTS: { id: Font; meta: string; stack: string }[] = [
  { id: 'IBM Plex Sans Arabic', meta: 'Default · clear and modern', stack: '"IBM Plex Sans Arabic",system-ui,sans-serif' },
  { id: 'Cairo', meta: 'Rounded and friendly', stack: 'Cairo,system-ui,sans-serif' },
  { id: 'Amiri', meta: 'Classic Naskh, like a book', stack: 'Amiri,"Times New Roman",serif' },
  { id: 'Readex Pro', meta: 'Soft and easy to read', stack: '"Readex Pro",system-ui,sans-serif' },
  NOTO
]
export const FONTS = isAr ? AR_FONTS : EN_FONTS
const DEFAULT_FONT: Font = isAr ? 'IBM Plex Sans Arabic' : 'Merriweather'
const FONT_KEY = isAr ? 'tadween-font-ar' : 'tadween-font'
export const storedFont = (): Font => {
  const f = (() => {
    try {
      // Design system: Noto Sans Arabic is the shared default, applied once
      // Defaults: Merriweather (English), IBM Plex Sans Arabic (Arabic). Applied once to everyone.
      if (localStorage.getItem('tadween-font-defaults') !== '2') { localStorage.setItem('tadween-font-defaults', '2'); localStorage.removeItem('tadween-font'); localStorage.removeItem('tadween-font-ar') }
      return localStorage.getItem(FONT_KEY)
    } catch { return null }
  })()
  return FONTS.some((x) => x.id === f) ? (f as Font) : DEFAULT_FONT
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
