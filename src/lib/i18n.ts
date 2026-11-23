// Language: English (default) or Arabic. The choice is read once at start-up;
// switching reloads the app so every screen, date and module-level label follows it.
import { AR } from './ar'

export type Lang = 'en' | 'ar'

export const storedLang = (): Lang => {
  try {
    const l = localStorage.getItem('tadween-lang')
    if (l === 'ar' || l === 'en') return l
  } catch { /* private mode */ }
  return 'en'
}

export const lang: Lang = storedLang()
export const isAr = lang === 'ar'
/** Locale for dates and times. Arabic keeps Western digits (0–9), which read easier in a busy UI. */
export const LOC: string | string[] = isAr ? 'ar-JO-u-nu-latn' : []

/** Translate an English UI string. `{name}` placeholders are filled from vars. */
export function t(en: string, vars?: Record<string, string | number>): string {
  let s = isAr ? (AR[en] ?? en) : en
  if (vars) for (const k in vars) s = s.split(`{${k}}`).join(String(vars[k]))
  return s
}

/** Pick singular or plural text. Arabic uses its own forms for 1, 2, 3–10 and 11+. */
export function plural(n: number, one: string, many: string, ar?: { one: string; two: string; few: string; many: string }): string {
  if (isAr && ar) {
    const f = n === 1 ? ar.one : n === 2 ? ar.two : n >= 3 && n <= 10 ? ar.few : ar.many
    return f.split('{n}').join(String(n))
  }
  return (n === 1 ? one : many).split('{n}').join(String(n))
}

export function applyLang() {
  const el = document.documentElement
  el.lang = lang
  el.dir = isAr ? 'rtl' : 'ltr'
}

export function setLang(l: Lang) {
  if (l === lang) return
  try { localStorage.setItem('tadween-lang', l) } catch { /* private mode */ }
  location.reload()
}
