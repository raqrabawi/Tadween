import { applyTheme, DS_FLAG, storedMode, storedPalette, watchSystem, type Mode, type Palette } from './theme'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { t } from './i18n'
type Session = { user: { id: string; email?: string | null; phone?: string | null } }
import { db } from './db'
import { GUEST_FAMILY, guestProfile, loadGuest, migrateGuest, newId, now, saveGuest } from './guest'
import type { Category, Draft, EventRow, Family, Item, List, Member, Note, Profile, Reminder, Tone } from './types'

interface Store {
  ready: boolean
  /** Showing the last synced copy because the server can't be reached */
  offline: boolean
  guest: boolean
  savePrompt: boolean
  setSavePrompt: (v: boolean) => void
  authError: string | null
  session: Session | null
  profile: Profile | null
  family: Family | null
  members: Member[]
  categories: Category[]
  noteCategories: Category[]
  lists: List[]
  items: Item[]
  events: EventRow[]
  reminders: Reminder[]
  notes: Note[]
  loading: boolean
  theme: Mode
  palette: Palette
  setTheme: (t: Mode) => void
  setPalette: (p: Palette) => void
  updateProfile: (p: Partial<Profile>) => Promise<void>
  reload: () => Promise<void>
  addCategory: (name: string, scope?: 'lists' | 'notes') => Promise<Category | null>
  deleteCategory: (id: string) => Promise<void>
  renameCategory: (id: string, name: string) => Promise<void>
  updateList: (id: string, patch: Partial<Pick<List, 'category_id' | 'family_id' | 'title'>>) => Promise<void>
  addList: (categoryId: string | null, title: string, opts?: { shared?: boolean; tone?: Tone; verb?: string }) => Promise<void>
  deleteList: (id: string) => Promise<void>
  addItem: (listId: string, name: string, qty?: string | null, aisle?: string | null) => Promise<void>
  toggleItem: (item: Item) => Promise<void>
  resetDone: (listId: string) => Promise<void>
  addEvent: (e: Partial<EventRow> & { title: string; starts_at: string }) => Promise<void>
  addReminder: (r: { title: string; remind_at: string | null; source?: string }) => Promise<void>
  toggleReminder: (r: Reminder) => Promise<void>
  saveNote: (n: Partial<Note> & { title: string }) => Promise<Note | null>
  deleteNote: (id: string) => Promise<void>
  saveDrafts: (drafts: Draft[], opts?: { noteCategory?: string | null }) => Promise<number>
  joinFamily: (code: string) => Promise<string | null>
  memberFor: (userId: string | null) => Member | undefined
}

const Ctx = createContext<Store | null>(null)
export const useStore = () => {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore outside provider')
  return s
}

const TONES: Tone[] = ['mint', 'sky', 'sand', 'lilac', 'moss']

/* Last synced account data, kept on the device so the app opens instantly and still shows
   your things when the network is down. Cleared on sign-out. */
const CACHE = 'tadween-cache'
type Snapshot = { uid: string; profile: Profile | null; family: Family | null; members: Member[]; categories: Category[]; lists: List[]; items: Item[]; events: EventRow[]; reminders: Reminder[]; notes: Note[] }
const readCache = (): Snapshot | null => { try { const r = localStorage.getItem(CACHE); return r ? (JSON.parse(r) as Snapshot) : null } catch { return null } }
export const clearCache = () => { try { localStorage.removeItem(CACHE) } catch { /* private mode */ } }
// Only replace state when the data really changed, so background syncs don't re-render every screen
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
const iso = (d: Date) => d.toISOString()

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  // Signed in on this device before, with data saved locally: open straight away from that copy
  const [cachedUid, setCachedUid] = useState<string | null>(() => {
    try { return localStorage.getItem('tadween-signed-in') === '1' ? readCache()?.uid ?? null : null } catch { return null }
  })
  const [offline, setOffline] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [family, setFamily] = useState<Family | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [allCats, setCategories] = useState<Category[]>([])
  // Lists and Notes each have their own categories
  const categories = useMemo(() => allCats.filter((c) => c.scope !== 'notes'), [allCats])
  const noteCategories = useMemo(() => allCats.filter((c) => c.scope === 'notes'), [allCats])
  const [lists, setLists] = useState<List[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [events, setEvents] = useState<EventRow[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(false)
  const [theme, setThemeState] = useState<Mode>(storedMode)
  const [palette, setPaletteState] = useState<Palette>(storedPalette)
  const seeded = useRef(false)
  const loading_ = useRef(false)
  const reloadAgain = useRef(false)
  const retryIn = useRef(0)
  const [savePrompt, setSavePromptState] = useState(false)
  const promptDismissed = useRef(false)
  const setSavePrompt = useCallback((v: boolean) => { if (!v) promptDismissed.current = true; setSavePromptState(v) }, [])

  useEffect(() => {
    applyTheme(theme, palette)
    if (theme === 'system') return watchSystem(() => applyTheme(theme, palette))
  }, [theme, palette])

  useEffect(() => {
    // Show Welcome straight away for people who aren't signed in; returning users wait (at most 10 s) for their session
    const known = (() => { try { return localStorage.getItem('tadween-signed-in') === '1' } catch { return false } })()
    if (!known || cachedUid) setReady(true)
    const giveUp = setTimeout(() => setReady(true), 10000)
    db.auth.getSession()
      .then(({ data, error }: { data: { session: Session | null }; error: { message: string } | null }) => {
        if (error) { setAuthError(error.message); if (known) setOffline(true); return }
        setSession(data.session)
        if (!data.session) { setCachedUid(null); clearCache() }
        try { if (data.session) localStorage.setItem('tadween-signed-in', '1'); else localStorage.removeItem('tadween-signed-in') } catch { /* private mode */ }
      })
      // Network trouble: keep showing the last synced copy rather than an empty guest app
      .catch((e: unknown) => { setAuthError(e instanceof Error ? e.message : String(e)); if (known) setOffline(true) })
      .finally(() => { clearTimeout(giveUp); setReady(true) })
    const { data } = db.auth.onAuthStateChange((e: string, s: Session | null) => {
      setSession(s)
      if (s) { setReady(true); setOffline(false) }
      if (e === 'SIGNED_OUT') { setCachedUid(null); clearCache() }
      try { if (s) localStorage.setItem('tadween-signed-in', '1'); else if (e === 'SIGNED_OUT') localStorage.removeItem('tadween-signed-in') } catch { /* private mode */ }
    })
    return () => data.subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const uid = session?.user.id ?? null

  const loadAll = useCallback(async (): Promise<void> => {
    if (!uid) return
    // One load at a time: overlapping loads used to seed starter data twice
    if (loading_.current) { reloadAgain.current = true; return }
    loading_.current = true
    try { await loadOnce() } finally {
      loading_.current = false
      if (reloadAgain.current) { reloadAgain.current = false; void loadAll() }
    }
  }, [uid]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadOnce = async (): Promise<void> => {
    if (!uid) return
    setLoading(true)
    // Creates the profile and family on first sign-in, then returns the profile
    const p = await db.rpc('ensure_me')
    const [fm, cats, ls, its, evs, rems, ns] = await Promise.all([
      db.from('family_members').select('family_id, user_id, role, color, joined_at'),
      db.from('categories').select('*').order('position'),
      db.from('lists').select('*').order('created_at'),
      db.from('list_items').select('*').order('created_at'),
      db.from('events').select('*').order('starts_at'),
      db.from('reminders').select('*').order('created_at'),
      db.from('notes').select('*').order('created_at', { ascending: false })
    ])
    if (p.data) {
      setProfile(p.data as Profile)
      if ((p.data as Profile).theme) setThemeState((p.data as Profile).theme)
      const migrating = (() => { try { return localStorage.getItem(DS_FLAG) === 'pending' } catch { return false } })()
      if (migrating) {
        // First run with the design system: move the saved account theme to Tadween once
        try { localStorage.setItem(DS_FLAG, 'done') } catch { /* private mode */ }
        setPaletteState('tadween')
        if ((p.data as Profile).palette !== 'tadween') db.from('profiles').update({ palette: 'tadween' }).eq('id', uid).then(() => undefined)
      } else if ((p.data as Profile).palette) setPaletteState((p.data as Profile).palette)
    }
    const mine = (fm.data ?? []) as Member[]
    const fid = mine.find((m) => m.user_id === uid && m.role === 'owner')?.family_id ?? mine.find((m) => m.user_id === uid)?.family_id
    // Bring over anything added as a guest on this device, then reload
    // If anything failed to load, don't seed or copy guest data — that would duplicate what's already there
    const failed = [p, fm, cats, ls, its, evs, rems, ns].some((r) => r.error)
    if (failed) {
      // Back off gently (3 s, 6 s … up to a minute) instead of hammering the server while offline
      setLoading(false); setOffline(true)
      retryIn.current = Math.min(60000, retryIn.current ? retryIn.current * 2 : 3000)
      setTimeout(() => void loadAll(), retryIn.current)
      return
    }
    retryIn.current = 0; setOffline(false)
    if (await migrateGuest(fid ?? null)) { seeded.current = true; return loadOnce() }
    if (fid) {
      const f = await db.from('families').select('*').eq('id', fid).single()
      setFamily(f.data as Family)
      const famMembers = mine.filter((m) => m.family_id === fid)
      const prof = await db.from('profiles').select('id, name').in('id', famMembers.map((m) => m.user_id))
      setMembers(famMembers.map((m) => ({ ...m, name: prof.data?.find((x) => x.id === m.user_id)?.name })))
    }
    setCategories((cats.data ?? []) as Category[])
    setLists(((ls.data ?? []) as List[]).map((l) => ({ ...l, staples: l.staples ?? [] })))
    setItems((its.data ?? []) as Item[])
    setEvents((evs.data ?? []) as EventRow[])
    setReminders((rems.data ?? []) as Reminder[])
    setNotes((ns.data ?? []) as Note[])
    setLoading(false)

    // First run: starter categories and lists so the app is useful immediately.
    // Starter note categories, once, for anyone who has none yet
    if (!(cats.data ?? []).some((c) => c.scope === 'notes')) {
      const { data: nc } = await db.from('categories').insert([
        { name: t('Personal'), position: 0, scope: 'notes' }, { name: t('Ideas'), position: 1, scope: 'notes' }, { name: t('Work'), position: 2, scope: 'notes' }
      ]).select()
      if (nc) setCategories((c) => [...c, ...(nc as Category[])])
    }

    if (!seeded.current && !(cats.data ?? []).some((c) => c.scope !== 'notes') && (ls.data ?? []).length === 0 && fid) {
      seeded.current = true
      const { data: made } = await db.from('categories').insert([
        { name: t('Groceries'), position: 0 }, { name: t('Home'), position: 1 }, { name: t('Personal'), position: 2 }
      ]).select()
      const byName = (n: string) => (made ?? []).find((c) => c.name === n)?.id
      await db.from('lists').insert([
        { title: t('Family Groceries'), category_id: byName('Groceries'), family_id: fid, tone: 'mint', verb: 'buy', staples: [t('Rice'), t('Eggs'), t('Milk'), t('Bread')] },
        { title: t('Home Fixes'), category_id: byName('Home'), tone: 'sand', verb: 'do' },
        { title: t('My To-dos'), category_id: byName('Personal'), tone: 'moss', verb: 'do' }
      ])
      await loadOnce()
    }
  }

  useEffect(() => {
    if (!uid) {
      if (!ready) return
      if (cachedUid) {
        const c = readCache()
        if (c && c.uid === cachedUid) {
          setProfile(c.profile); setFamily(c.family); setMembers(c.members); setCategories(c.categories)
          setLists(c.lists); setItems(c.items); setEvents(c.events); setReminders(c.reminders); setNotes(c.notes)
          return
        }
      }
      // Guest mode: work from this device until the person signs in
      const g = loadGuest()
      setProfile(guestProfile({ ...g.profile, theme, palette })); setFamily(null); setMembers([])
      setCategories(g.categories); setLists(g.lists); setItems(g.items); setEvents(g.events); setReminders(g.reminders); setNotes(g.notes)
      return
    }
    loadAll()
    // Family sync for shared lists: refresh every 15 s and whenever the app comes back into view
    const refresh = async () => {
      const [ls, its] = await Promise.all([db.from('lists').select('*').order('created_at'), db.from('list_items').select('*').order('created_at')])
      if (ls.data) { const next = (ls.data as List[]).map((l) => ({ ...l, staples: l.staples ?? [] })); setLists((cur) => (same(cur, next) ? cur : next)) }
      if (its.data) { const next = its.data as Item[]; setItems((cur) => (same(cur, next) ? cur : next)) }
    }
    const t = setInterval(() => { if (document.visibilityState === 'visible' && navigator.onLine) refresh() }, 15000)
    // Phones fire visibilitychange (not focus) when you come back to the app
    const onBack = () => { if (document.visibilityState === 'visible') refresh() }
    const onOnline = () => { retryIn.current = 0; void loadAll() }
    window.addEventListener('focus', onBack)
    document.addEventListener('visibilitychange', onBack)
    window.addEventListener('online', onOnline)
    return () => { clearInterval(t); window.removeEventListener('focus', onBack); document.removeEventListener('visibilitychange', onBack); window.removeEventListener('online', onOnline) }
  }, [uid, loadAll, ready, cachedUid]) // eslint-disable-line react-hooks/exhaustive-deps

  // Save the signed-in copy on the device (debounced) once it has loaded
  useEffect(() => {
    if (!uid || loading || !profile) return
    const tm = setTimeout(() => {
      try { localStorage.setItem(CACHE, JSON.stringify({ uid, profile, family, members, categories: allCats, lists, items, events, reminders, notes } satisfies Snapshot)); setCachedUid(uid) } catch { /* storage full */ }
    }, 800)
    return () => clearTimeout(tm)
  }, [uid, loading, profile, family, members, allCats, lists, items, events, reminders, notes])

  // Keep guest data on the device as it changes
  const guest = ready && !uid && !cachedUid

  // Tell people once when they're looking at the saved copy, so they know edits won't sync yet
  const told = useRef(false)
  useEffect(() => {
    if (!offline || told.current) return
    told.current = true
    window.dispatchEvent(new CustomEvent('tadween-toast', { detail: t('You’re offline. Showing what was last synced.') }))
  }, [offline])
  useEffect(() => {
    if (!guest || !profile) return
    saveGuest({ profile: { name: profile.name, voice_style: profile.voice_style, speak_replies: profile.speak_replies, morning_brief: profile.morning_brief, close_day: profile.close_day }, categories: allCats, lists, items, events, reminders, notes })
  }, [guest, profile, allCats, lists, items, events, reminders, notes])

  // After a guest adds something, offer sign-in once per visit so it isn't lost
  const nudge = useCallback(() => { if (!promptDismissed.current) setSavePromptState(true) }, [])

  const setPalette = useCallback((pl: Palette) => {
    setPaletteState(pl)
    if (uid) db.from('profiles').update({ palette: pl }).eq('id', uid).then(() => undefined)
  }, [uid])

  const setTheme = useCallback((t: Mode) => {
    setThemeState(t)
    if (uid) db.from('profiles').update({ theme: t }).eq('id', uid).then(() => undefined)
  }, [uid])

  const updateProfile = useCallback(async (p: Partial<Profile>) => {
    if (!uid) { setProfile((cur) => (cur ? { ...cur, ...p } : cur)); return }
    setProfile((cur) => (cur ? { ...cur, ...p } : cur))
    await db.from('profiles').update(p).eq('id', uid)
  }, [uid])

  const addCategory = useCallback(async (name: string, scope: 'lists' | 'notes' = 'lists') => {
    const position = allCats.filter((c) => (c.scope ?? 'lists') === scope).length
    if (!uid) { const c = { id: newId(), name, position, scope } as Category; setCategories((x) => [...x, c]); nudge(); return c }
    const { data } = await db.from('categories').insert({ name, position, scope }).select().single()
    if (data) setCategories((c) => [...c, data as Category])
    return (data as Category) ?? null
  }, [allCats, uid, nudge])

  const deleteCategory = useCallback(async (id: string) => {
    setCategories((c) => c.filter((x) => x.id !== id))
    setLists((l) => l.filter((x) => x.category_id !== id))
    setNotes((ns) => ns.map((n) => (n.category_id === id ? { ...n, category_id: null } : n)))
    if (!uid) return
    await db.from('categories').delete().eq('id', id)
  }, [uid, nudge])

  const renameCategory = useCallback(async (id: string, name: string) => {
    setCategories((c) => c.map((x) => (x.id === id ? { ...x, name } : x)))
    if (!uid) { nudge(); return }
    await db.from('categories').update({ name }).eq('id', id)
  }, [uid, nudge])

  const addList = useCallback(async (categoryId: string | null, title: string, opts?: { shared?: boolean; tone?: Tone; verb?: string }) => {
    const tone = opts?.tone ?? TONES[lists.length % TONES.length]
    if (!uid) {
      setLists((l) => [...l, { id: newId(), owner_id: 'guest', family_id: opts?.shared ? GUEST_FAMILY : null, category_id: categoryId, title, tone, verb: opts?.verb ?? 'do', staples: [], created_at: now() }])
      nudge(); return
    }
    const { data } = await db.from('lists').insert({
      title, category_id: categoryId, tone, verb: opts?.verb ?? 'do', family_id: opts?.shared ? family?.id ?? null : null
    }).select().single()
    if (data) setLists((l) => (l.some((x) => x.id === data.id) ? l : [...l, data as List]))
  }, [lists.length, family, uid, nudge])

  const updateList = useCallback(async (id: string, patch: Partial<Pick<List, 'category_id' | 'family_id' | 'title'>>) => {
    setLists((l) => l.map((x) => (x.id === id ? { ...x, ...patch } : x)))
    if (!uid) return
    await db.from('lists').update(patch).eq('id', id)
  }, [uid])

  const deleteList = useCallback(async (id: string) => {
    setLists((l) => l.filter((x) => x.id !== id))
    if (!uid) { setItems((xs) => xs.filter((x) => x.list_id !== id)); return }
    await db.from('lists').delete().eq('id', id)
  }, [uid, nudge])

  const addItem = useCallback(async (listId: string, name: string, qty?: string | null, aisle?: string | null) => {
    if (!uid) {
      setItems((xs) => [...xs, { id: newId(), list_id: listId, name, qty: qty ?? null, aisle: aisle ?? null, done: false, done_at: null, added_by: null, created_at: now() }])
      nudge(); return
    }
    const { data } = await db.from('list_items').insert({ list_id: listId, name, qty: qty ?? null, aisle: aisle ?? null }).select().single()
    if (data) setItems((xs) => (xs.some((x) => x.id === data.id) ? xs : [...xs, data as Item]))
  }, [uid, nudge])

  const toggleItem = useCallback(async (item: Item) => {
    const done = !item.done
    const done_at = done ? new Date().toISOString() : null
    setItems((xs) => xs.map((x) => (x.id === item.id ? { ...x, done, done_at } : x)))
    if (!uid) return
    await db.from('list_items').update({ done, done_at }).eq('id', item.id)
  }, [uid, nudge])

  const resetDone = useCallback(async (listId: string) => {
    setItems((xs) => xs.map((x) => (x.list_id === listId ? { ...x, done: false, done_at: null } : x)))
    if (!uid) return
    await db.from('list_items').update({ done: false, done_at: null }).eq('list_id', listId).eq('done', true)
  }, [uid, nudge])

  const addEvent = useCallback(async (e: Partial<EventRow> & { title: string; starts_at: string }) => {
    if (!uid) {
      const row = { id: newId(), owner_id: 'guest', family_id: null, ends_at: null, location: null, calendar: t('Personal'), alert_minutes: null, source: 'manual', ...e } as EventRow
      setEvents((xs) => [...xs, row].sort((a, b) => a.starts_at.localeCompare(b.starts_at))); nudge(); return
    }
    const { data } = await db.from('events').insert(e).select().single()
    if (data) setEvents((xs) => [...xs, data as EventRow].sort((a, b) => a.starts_at.localeCompare(b.starts_at)))
  }, [uid, nudge])

  const addReminder = useCallback(async (r: { title: string; remind_at: string | null; source?: string }) => {
    if (!uid) { setReminders((xs) => [...xs, { id: newId(), done: false, source: 'manual', ...r }]); nudge(); return }
    const { data } = await db.from('reminders').insert(r).select().single()
    if (data) setReminders((xs) => [...xs, data as Reminder])
  }, [uid, nudge])

  const toggleReminder = useCallback(async (r: Reminder) => {
    setReminders((xs) => xs.map((x) => (x.id === r.id ? { ...x, done: !r.done } : x)))
    if (!uid) return
    await db.from('reminders').update({ done: !r.done }).eq('id', r.id)
  }, [uid, nudge])

  const saveNote = useCallback(async (n: Partial<Note> & { title: string }) => {
    if (!uid) {
      if (n.id) { const patch = { ...n, updated_at: now() }; setNotes((xs) => xs.map((x) => (x.id === n.id ? { ...x, ...patch } as Note : x))); return { ...patch } as Note }
      const row = { body: '', kind: 'note', tags: [], opens_at: null, created_at: now(), updated_at: now(), ...n, id: newId() } as Note
      setNotes((xs) => [row, ...xs]); nudge(); return row
    }
    if (n.id) {
      const patch = { ...n, updated_at: new Date().toISOString() }
      setNotes((xs) => xs.map((x) => (x.id === n.id ? { ...x, ...patch } as Note : x)))
      const { data } = await db.from('notes').update(patch).eq('id', n.id).select().single()
      return (data as Note) ?? null
    }
    const { data } = await db.from('notes').insert(n).select().single()
    if (data) setNotes((xs) => [data as Note, ...xs])
    return (data as Note) ?? null
  }, [uid, nudge])

  const deleteNote = useCallback(async (id: string) => {
    setNotes((xs) => xs.filter((x) => x.id !== id))
    if (!uid) return
    await db.from('notes').delete().eq('id', id)
  }, [uid, nudge])

  const findList = useCallback((hint?: string) => {
    const h = (hint ?? '').toLowerCase()
    const byTitle = lists.find((l) => h && l.title.toLowerCase().includes(h))
    if (byTitle) return byTitle
    const cat = categories.find((c) => h && c.name.toLowerCase() === h)
    const inCat = cat && lists.find((l) => l.category_id === cat.id)
    if (inCat) return inCat
    if (/grocer|shop|cart|market|food|family/.test(h) || !h) return lists.find((l) => l.verb === 'buy') ?? lists[0]
    return lists[0]
  }, [lists, categories])

  const saveDrafts = useCallback(async (drafts: Draft[], opts?: { noteCategory?: string | null }) => {
    let n = 0
    for (const d of drafts) {
      if (d.kind === 'event') {
        await addEvent({ title: d.title, starts_at: iso(d.start), ends_at: d.birthday ? null : iso(d.end), calendar: d.calendar, location: d.location ?? null, source: d.birthday ? 'birthday' : 'voice' }); n++
      } else if (d.kind === 'reminder') {
        await addReminder({ title: d.title, remind_at: d.at ? iso(d.at) : null, source: 'voice' }); n++
      } else if (d.kind === 'task') {
        await addReminder({ title: d.title, remind_at: d.due ? iso(d.due) : null, source: 'voice' }); n++
      } else if (d.kind === 'item') {
        const l = findList(d.listHint)
        if (l) { await addItem(l.id, d.name, d.qty ?? t('Added by voice')); n++ }
      } else if (d.kind === 'note') {
        const category_id = opts?.noteCategory ?? null
        if (d.items) await saveNote({ title: d.title, body: d.items.map((i) => `[ ] ${i}`).join('\n'), kind: 'list', category_id })
        else await saveNote({ title: d.title, body: d.body, kind: 'voice', category_id })
        n++
      }
    }
    return n
  }, [addEvent, addReminder, addItem, saveNote, findList])

  const joinFamily = useCallback(async (code: string) => {
    if (!uid) { setSavePromptState(true); return t('Sign in first to join a family space.') }
    const { error } = await db.rpc('join_family', { code })
    if (error) return error.message
    await loadAll()
    return null
  }, [loadAll, uid])

  const memberFor = useCallback((userId: string | null) => members.find((m) => m.user_id === userId), [members])

  const value = useMemo<Store>(() => ({
    ready, offline, guest, savePrompt, setSavePrompt, authError, session, profile, family, members, categories, noteCategories, lists, items, events, reminders, notes, loading, theme, palette,
    setTheme, setPalette, updateProfile, reload: loadAll, addCategory, deleteCategory, renameCategory, addList, updateList, deleteList, addItem, toggleItem, resetDone,
    addEvent, addReminder, toggleReminder, saveNote, deleteNote, saveDrafts, joinFamily, memberFor
  }), [ready, offline, guest, savePrompt, setSavePrompt, authError, session, profile, family, members, categories, noteCategories, lists, items, events, reminders, notes, loading, theme, palette,
    setTheme, setPalette, updateProfile, loadAll, addCategory, deleteCategory, renameCategory, addList, updateList, deleteList, addItem, toggleItem, resetDone,
    addEvent, addReminder, toggleReminder, saveNote, deleteNote, saveDrafts, joinFamily, memberFor])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
