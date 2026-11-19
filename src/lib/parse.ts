import type { Draft } from './types'

/* Nook's on-device understanding: turns one spoken or typed sentence into drafts
   (events, reminders, list items, tasks, notes). English first, common Arabic words too.
   It runs instantly with no network; the person always reviews before anything is saved. */

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
const AR: Record<string, string> = {
  'ذكرني': 'remind me', 'ذكّرني': 'remind me', 'اضف': 'add', 'أضف': 'add', 'ضيف': 'add', 'بكرا': 'tomorrow', 'بكرة': 'tomorrow',
  'اليوم': 'today', 'الساعة': 'at', 'موعد': 'appointment', 'اشتري': 'buy', 'لازم': 'i need to', 'و': 'and'
}

const pad = (n: number) => String(n).padStart(2, '0')

interface When { date: Date | null; hasTime: boolean; dayBefore: boolean; rest: string }

function stripWhen(raw: string, now: Date): When {
  let s = ' ' + raw + ' '
  let date: Date | null = null
  let hasTime = false
  let dayBefore = false
  const base = new Date(now)
  base.setSeconds(0, 0)

  const take = (re: RegExp, fn: (m: RegExpMatchArray) => void) => {
    const m = s.match(re)
    if (m) { fn(m); s = s.replace(m[0], ' ') }
  }

  take(/\bthe day before\b/i, () => { dayBefore = true })
  take(/\b(day after tomorrow)\b/i, () => { date = new Date(base); date.setDate(date.getDate() + 2) })
  take(/\b(tomorrow|tmrw)\b/i, () => { date = new Date(base); date.setDate(date.getDate() + 1) })
  take(/\b(today|tonight)\b/i, (m) => { date = new Date(base); if (/tonight/i.test(m[1])) { date.setHours(20, 0); hasTime = true } })
  take(new RegExp(`\\b(?:on\\s+)?(next|this)?\\s*(${DAYS.join('|')})\\b`, 'i'), (m) => {
    const target = DAYS.indexOf(m[2].toLowerCase())
    const d = new Date(base)
    let diff = (target - d.getDay() + 7) % 7
    if (diff === 0) diff = 7
    if (m[1] && m[1].toLowerCase() === 'next' && diff < 7 && (target - d.getDay() + 7) % 7 !== 0) { /* "next monday" = upcoming monday */ }
    d.setDate(d.getDate() + diff)
    date = d
  })
  take(new RegExp(`\\b(?:on\\s+)?(\\d{1,2})(?:st|nd|rd|th)?\\s+(${MONTHS.join('|')})[a-z]*\\b`, 'i'), (m) => {
    const d = new Date(base); d.setMonth(MONTHS.indexOf(m[2].slice(0, 3).toLowerCase()), parseInt(m[1], 10))
    if (d < base) d.setFullYear(d.getFullYear() + 1)
    date = d
  })
  take(/\bin (\d+) (minutes?|mins?|hours?)\b/i, (m) => {
    const d = new Date(base); const n = parseInt(m[1], 10)
    if (/h/i.test(m[2])) d.setHours(d.getHours() + n); else d.setMinutes(d.getMinutes() + n)
    date = d; hasTime = true
  })

  let hh: number | null = null
  let mm = 0
  take(/\b(?:at\s+)?(\d{1,2})(?::|\.)(\d{2})\s*(am|pm|a\.m\.|p\.m\.)?\b/i, (m) => {
    hh = parseInt(m[1], 10); mm = parseInt(m[2], 10)
    if (m[3] && /p/i.test(m[3]) && hh < 12) hh += 12
    if (m[3] && /a/i.test(m[3]) && hh === 12) hh = 0
  })
  if (hh === null) take(/\b(?:at\s+)?(\d{1,2})\s*(am|pm|a\.m\.|p\.m\.)\b/i, (m) => {
    hh = parseInt(m[1], 10)
    if (/p/i.test(m[2]) && hh < 12) hh += 12
    if (/a/i.test(m[2]) && hh === 12) hh = 0
  })
  if (hh === null) take(/\bat\s+(\d{1,2})\b/i, (m) => {
    hh = parseInt(m[1], 10)
    if (hh >= 1 && hh <= 7) hh += 12 // "at 5" means 5 PM in everyday speech
  })
  if (hh === null) take(/\b(noon|midday)\b/i, () => { hh = 12 })
  if (hh === null) take(/\bin the (morning|afternoon|evening)\b|\b(this) (morning|afternoon|evening)\b/i, (m) => {
    const part = (m[1] || m[3] || '').toLowerCase()
    hh = part === 'morning' ? 9 : part === 'afternoon' ? 15 : 19
  })

  if (hh !== null) {
    hasTime = true
    const d: Date = date ?? new Date(base)
    d.setHours(hh, mm, 0, 0)
    if (!date && d < base) d.setDate(d.getDate() + 1)
    date = d
  }
  return { date, hasTime, dayBefore, rest: s.replace(/\s+/g, ' ').trim() }
}

const tidy = (t: string) => {
  const s = t
    .replace(/^(?:and|also|then|please|ok|okay|so)\s+/i, '')
    .replace(/^(?:i have|i've got|there is|there's|we have|book|schedule|set up|put|add an?|create an?)\s+/i, '')
    .replace(/^(?:an?|the|my)\s+/i, '')
    .replace(/\s+(?:on|at|for)$/i, '')
    .replace(/[.,!?]+$/, '')
    .trim()
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function splitItems(text: string) {
  return text
    .split(/\s*,\s*|\s+and\s+|\s*،\s*/i)
    .map((x) => x.trim())
    .filter(Boolean)
    .map((x) => {
      const m = x.match(/^((?:\d+(?:\.\d+)?\s*(?:kg|g|l|ml|pieces?|packs?|bags?|bottles?|boxes?|dozen)?)|a (?:bag|pack|box|bottle|dozen) of|some|two|three|four|five|six)\s+(?:of\s+)?(.+)$/i)
      const name = (m ? m[2] : x).replace(/^(?:some|the|a|an)\s+/i, '')
      return { qty: m ? m[1] : undefined, name: name.charAt(0).toUpperCase() + name.slice(1) }
    })
}

const fmtTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`

export function understand(input: string, now = new Date()): Draft[] {
  let text = input.trim()
  if (!text) return []
  for (const [ar, en] of Object.entries(AR)) text = text.replace(new RegExp(`(^|\\s)${ar}(?=\\s|$)`, 'g'), `$1${en}`)

  const clauses = text
    .split(/\s*[,;]\s*(?:and\s+)?(?=(?:remind|add|buy|put|also|then|book|schedule|note|i need|we need|don'?t forget|get)\b)|\s+and\s+(?=(?:remind|add|buy|put|also|then|book|schedule|note|i need|we need|don'?t forget|get)\b)|\.\s+/i)
    .map((c) => c.trim())
    .filter(Boolean)

  const drafts: Draft[] = []
  let lastEvent: Extract<Draft, { kind: 'event' }> | null = null

  for (const clause of clauses) {
    const c = clause.replace(/^(?:and|also|then)\s+/i, '')

    // Shopping / list items
    let m = c.match(/^(?:add|put|get|buy|we need|i need to buy|pick up)\s+(.+?)(?:\s+(?:to|on|in)\s+(?:the\s+|my\s+|our\s+)?(.+?)\s*(?:list)?)?$/i)
    if (m && (/(list|groceries|grocery|shopping|cart)/i.test(m[2] ?? '') || /^(buy|get|we need|i need to buy|pick up)/i.test(c))) {
      const hint = m[2]?.replace(/\blist\b/i, '').trim()
      for (const it of splitItems(m[1])) drafts.push({ kind: 'item', name: it.name, qty: it.qty, listHint: hint || 'groceries' })
      continue
    }

    // Notes
    m = c.match(/^(?:note(?: that)?|write down|journal|remember that)\s*[:,-]?\s*(.+)$/i)
    if (m) {
      const body = m[1].trim()
      drafts.push({ kind: 'note', title: tidy(body.split(/[.!?]/)[0]).slice(0, 60), body })
      continue
    }

    const when = stripWhen(c, now)

    // Reminders
    m = when.rest.match(/^(?:remind me|reminder|don'?t let me forget)\s*(?:to|about|of)?\s*(.*)$/i)
    if (m) {
      let title = tidy(m[1] || '')
      let at = when.date
      if (when.dayBefore && lastEvent) {
        at = new Date(lastEvent.start); at.setDate(at.getDate() - 1); at.setHours(18, 0, 0, 0)
        if (!title) title = `${lastEvent.title} tomorrow at ${fmtTime(lastEvent.start)}`
      }
      if (at && !when.hasTime && !when.dayBefore) at.setHours(9, 0, 0, 0)
      drafts.push({ kind: 'reminder', title: title || 'Reminder', at })
      continue
    }

    // Tasks
    m = when.rest.match(/^(?:i need to|i have to|i must|need to|todo|to do|don'?t forget to|task)\s*[:,-]?\s*(.+)$/i)
    if (m) {
      drafts.push({ kind: 'task', title: tidy(m[1]), due: when.date })
      continue
    }

    // Events: anything with a time or date
    if (when.date) {
      const start = when.date
      if (!when.hasTime) start.setHours(9, 0, 0, 0)
      const end = new Date(start.getTime() + 60 * 60 * 1000)
      const loc = when.rest.match(/\s(?:at|in)\s+((?:the\s+)?[A-Za-z][\w' ]+)$/)
      const title = tidy(loc ? when.rest.slice(0, loc.index) : when.rest) || 'Event'
      const all = `${title} ${loc?.[1] ?? ''}`
      const calendar = /\b(mama|mom|mum|dad|baba|family|kids?|son|daughter|wife|husband|birthday|grandma|grandpa)\b/i.test(all) ? 'Family'
        : /\b(work|meeting|review|client|stand-?up|office|interview|presentation|sync)\b/i.test(all) ? 'Work' : 'Personal'
      const place = loc?.[1].replace(/^the\s+/i, '')
      const ev: Extract<Draft, { kind: 'event' }> = { kind: 'event', title, start, end, calendar, location: place ? place.charAt(0).toUpperCase() + place.slice(1) : undefined }
      drafts.push(ev)
      lastEvent = ev
      continue
    }

    // Fallback: a short phrase becomes a task, a long one a note
    if (when.rest.split(' ').length <= 8) drafts.push({ kind: 'task', title: tidy(when.rest), due: null })
    else drafts.push({ kind: 'note', title: tidy(when.rest.split(/[.!?]/)[0]).slice(0, 60), body: when.rest })
  }
  return drafts
}

export const describeWhen = (d: Date) => {
  const now = new Date()
  const day = new Date(d); day.setHours(0, 0, 0, 0)
  const today = new Date(now); today.setHours(0, 0, 0, 0)
  const diff = Math.round((day.getTime() - today.getTime()) / 86400000)
  const t = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  if (diff === 0) return `Today · ${t}`
  if (diff === 1) return `Tomorrow · ${t}`
  return `${d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })} · ${t}`
}
