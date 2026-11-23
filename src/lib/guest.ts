import { db } from './db'
import type { Category, EventRow, Item, List, Note, Profile, Reminder } from './types'
import { t } from './i18n'

/* Guest mode: everything someone adds before signing in lives on this device.
   On sign-in it is copied into their account, then cleared here. */

export const GUEST_KEY = 'tadween-guest'
export const GUEST_FAMILY = 'guest-family'

export interface GuestData {
  profile: Partial<Profile>
  categories: Category[]
  lists: List[]
  items: Item[]
  events: EventRow[]
  reminders: Reminder[]
  notes: Note[]
}

export const newId = () =>
  (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`)
export const now = () => new Date().toISOString()

export function guestProfile(p: Partial<Profile> = {}): Profile {
  return {
    id: 'guest', name: null, phone: null, email: null, voice_style: 'Warm', speak_replies: true,
    morning_brief: true, close_day: true, theme: 'light', palette: 'marigold', onboarded: true, ...p
  }
}

function seed(): GuestData {
  const cat = (name: string, position: number): Category => ({ id: newId(), name, position } as Category)
  const groceries = cat('Groceries', 0), home = cat('Home', 1), personal = cat('Personal', 2)
  const list = (title: string, category_id: string, tone: List['tone'], verb: string, shared = false, staples: string[] = []): List => ({
    id: newId(), owner_id: 'guest', family_id: shared ? GUEST_FAMILY : null, category_id, title, tone, verb, staples, created_at: now()
  })
  const ncat = (name: string, position: number): Category => ({ id: newId(), name, position, scope: 'notes' })
  return {
    profile: {},
    categories: [groceries, home, personal, ncat('Personal', 0), ncat('Ideas', 1), ncat('Work', 2)],
    lists: [
      list('Family Groceries', groceries.id, 'mint', 'buy', true, [t('Rice'), t('Eggs'), t('Milk'), t('Bread')]),
      list('Home Fixes', home.id, 'sand', 'do'),
      list('My To-dos', personal.id, 'moss', 'do')
    ],
    items: [], events: [], reminders: [], notes: []
  }
}

export function loadGuest(): GuestData {
  try {
    const raw = localStorage.getItem(GUEST_KEY)
    if (raw) {
      const d = { ...seed(), ...(JSON.parse(raw) as GuestData) }
      d.notes = d.notes.map((n) => (n.id ? n : { ...n, id: newId() })) // repair notes saved without an id
      if (!d.categories.some((c) => c.scope === 'notes')) d.categories.push(...seed().categories.filter((c) => c.scope === 'notes'))
      return d
    }
  } catch { /* private mode or bad data: start fresh */ }
  return seed()
}

export function saveGuest(d: GuestData) {
  try { localStorage.setItem(GUEST_KEY, JSON.stringify(d)) } catch { /* storage full or private mode */ }
}

/** True when the guest added anything of their own (not just the starter lists). */
export function hasGuestContent(d: GuestData | null) {
  if (!d) return false
  return d.items.length + d.events.length + d.reminders.length + d.notes.length > 0 ||
    d.lists.length > 3 || d.categories.filter((c) => c.scope !== 'notes').length > 3
}

export function peekGuest(): GuestData | null {
  try {
    const raw = localStorage.getItem(GUEST_KEY)
    return raw ? (JSON.parse(raw) as GuestData) : null
  } catch { return null }
}

/**
 * Copies guest data into the signed-in account. Lists and categories with the same
 * name as ones the account already has are merged rather than duplicated.
 * Returns true when something was copied.
 */
export async function migrateGuest(familyId: string | null): Promise<boolean> {
  const g = peekGuest()
  if (!hasGuestContent(g) || !g) { try { localStorage.removeItem(GUEST_KEY) } catch { /* ignore */ } return false }

  const [{ data: rc, error: e1 }, { data: rl, error: e2 }] = await Promise.all([db.from('categories').select('*'), db.from('lists').select('*')])
  // Can't see what the account already has: try again later rather than create duplicates
  if (e1 || e2) return false
  const remoteCats = (rc ?? []) as Category[]
  const remoteLists = (rl ?? []) as List[]

  const catMap: Record<string, string> = {}
  for (const c of g.categories) {
    const scope = c.scope ?? 'lists'
    const hit = remoteCats.find((x) => x.name.toLowerCase() === c.name.toLowerCase() && (x.scope ?? 'lists') === scope)
    if (hit) { catMap[c.id] = hit.id; continue }
    const { data } = await db.from('categories').insert({ name: c.name, position: c.position, scope }).select().single()
    if (data) catMap[c.id] = (data as Category).id
  }

  const listMap: Record<string, string> = {}
  for (const l of g.lists) {
    const hit = remoteLists.find((x) => x.title.toLowerCase() === l.title.toLowerCase())
    if (hit) { listMap[l.id] = hit.id; continue }
    const { data } = await db.from('lists').insert({
      title: l.title, category_id: l.category_id ? catMap[l.category_id] ?? null : null, tone: l.tone, verb: l.verb,
      staples: l.staples, family_id: l.family_id ? familyId : null
    }).select().single()
    if (data) listMap[l.id] = (data as List).id
  }

  const items = g.items.filter((i) => listMap[i.list_id]).map((i) => ({
    list_id: listMap[i.list_id], name: i.name, qty: i.qty, aisle: i.aisle, done: i.done, done_at: i.done_at
  }))
  const events = g.events.map((e) => ({
    title: e.title, starts_at: e.starts_at, ends_at: e.ends_at, location: e.location, calendar: e.calendar,
    alert_minutes: e.alert_minutes, source: e.source
  }))
  const reminders = g.reminders.map((r) => ({ title: r.title, remind_at: r.remind_at, done: r.done, source: r.source }))
  const notes = g.notes.map((n) => ({ title: n.title, body: n.body, kind: n.kind, tags: n.tags, opens_at: n.opens_at, image: n.image ?? null, category_id: n.category_id ? catMap[n.category_id] ?? null : null }))

  await Promise.all([
    items.length ? db.from('list_items').insert(items) : null,
    events.length ? db.from('events').insert(events) : null,
    reminders.length ? db.from('reminders').insert(reminders) : null,
    notes.length ? db.from('notes').insert(notes) : null
  ])
  try { localStorage.removeItem(GUEST_KEY) } catch { /* ignore */ }
  return true
}
