import { applyTheme, storedMode, storedPalette, watchSystem, type Mode, type Palette } from './theme'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
type Session = { user: { id: string; email?: string | null; phone?: string | null } }
import { db } from './db'
import type { Category, Draft, EventRow, Family, Item, List, Member, Note, Profile, Reminder, Tone } from './types'

interface Store {
  ready: boolean
  session: Session | null
  profile: Profile | null
  family: Family | null
  members: Member[]
  categories: Category[]
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
  addCategory: (name: string) => Promise<Category | null>
  deleteCategory: (id: string) => Promise<void>
  addList: (categoryId: string, title: string, opts?: { shared?: boolean; tone?: Tone; verb?: string }) => Promise<void>
  deleteList: (id: string) => Promise<void>
  addItem: (listId: string, name: string, qty?: string | null, aisle?: string | null) => Promise<void>
  toggleItem: (item: Item) => Promise<void>
  resetDone: (listId: string) => Promise<void>
  addEvent: (e: Partial<EventRow> & { title: string; starts_at: string }) => Promise<void>
  addReminder: (r: { title: string; remind_at: string | null; source?: string }) => Promise<void>
  toggleReminder: (r: Reminder) => Promise<void>
  saveNote: (n: Partial<Note> & { title: string }) => Promise<Note | null>
  deleteNote: (id: string) => Promise<void>
  saveDrafts: (drafts: Draft[]) => Promise<number>
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
const iso = (d: Date) => d.toISOString()

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [family, setFamily] = useState<Family | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [lists, setLists] = useState<List[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [events, setEvents] = useState<EventRow[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(false)
  const [theme, setThemeState] = useState<Mode>(storedMode)
  const [palette, setPaletteState] = useState<Palette>(storedPalette)
  const seeded = useRef(false)

  useEffect(() => {
    applyTheme(theme, palette)
    if (theme === 'system') return watchSystem(() => applyTheme(theme, palette))
  }, [theme, palette])

  useEffect(() => {
    db.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true) })
    const { data } = db.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  const uid = session?.user.id ?? null

  const loadAll = useCallback(async () => {
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
      if ((p.data as Profile).palette) setPaletteState((p.data as Profile).palette)
    }
    const mine = (fm.data ?? []) as Member[]
    const fid = mine.find((m) => m.user_id === uid && m.role === 'owner')?.family_id ?? mine.find((m) => m.user_id === uid)?.family_id
    if (fid) {
      const f = await db.from('families').select('*').eq('id', fid).single()
      setFamily(f.data as Family)
      const famMembers = mine.filter((m) => m.family_id === fid)
      const prof = await db.from('profiles').select('id, name').in('id', famMembers.map((m) => m.user_id))
      setMembers(famMembers.map((m) => ({ ...m, name: prof.data?.find((x) => x.id === m.user_id)?.name })))
    }
    setCategories((cats.data ?? []) as Category[])
    setLists((ls.data ?? []) as List[])
    setItems((its.data ?? []) as Item[])
    setEvents((evs.data ?? []) as EventRow[])
    setReminders((rems.data ?? []) as Reminder[])
    setNotes((ns.data ?? []) as Note[])
    setLoading(false)

    // First run: starter categories and lists so the app is useful immediately.
    if (!seeded.current && (cats.data ?? []).length === 0 && (ls.data ?? []).length === 0 && fid) {
      seeded.current = true
      const { data: made } = await db.from('categories').insert([
        { name: 'Groceries', position: 0 }, { name: 'Home', position: 1 }, { name: 'Personal', position: 2 }
      ]).select()
      const byName = (n: string) => (made ?? []).find((c) => c.name === n)?.id
      await db.from('lists').insert([
        { title: 'Family Groceries', category_id: byName('Groceries'), family_id: fid, tone: 'mint', verb: 'buy', staples: ['Rice', 'Eggs', 'Milk', 'Bread'] },
        { title: 'Home Fixes', category_id: byName('Home'), tone: 'sand', verb: 'do' },
        { title: 'My To-dos', category_id: byName('Personal'), tone: 'moss', verb: 'do' }
      ])
      await loadAll()
    }
  }, [uid])

  useEffect(() => {
    if (!uid) {
      setProfile(null); setFamily(null); setMembers([]); setCategories([]); setLists([]); setItems([]); setEvents([]); setReminders([]); setNotes([])
      return
    }
    loadAll()
    // Family sync for shared lists: refresh every 15 s and whenever the app comes back into view
    const refresh = async () => {
      const [ls, its] = await Promise.all([db.from('lists').select('*').order('created_at'), db.from('list_items').select('*').order('created_at')])
      if (ls.data) setLists(ls.data as List[])
      if (its.data) setItems(its.data as Item[])
    }
    const t = setInterval(() => { if (document.visibilityState === 'visible') refresh() }, 15000)
    const onFocus = () => refresh()
    window.addEventListener('focus', onFocus)
    return () => { clearInterval(t); window.removeEventListener('focus', onFocus) }
  }, [uid, loadAll])

  const setPalette = useCallback((pl: Palette) => {
    setPaletteState(pl)
    if (uid) db.from('profiles').update({ palette: pl }).eq('id', uid).then(() => undefined)
  }, [uid])

  const setTheme = useCallback((t: Mode) => {
    setThemeState(t)
    if (uid) db.from('profiles').update({ theme: t }).eq('id', uid).then(() => undefined)
  }, [uid])

  const updateProfile = useCallback(async (p: Partial<Profile>) => {
    if (!uid) return
    setProfile((cur) => (cur ? { ...cur, ...p } : cur))
    await db.from('profiles').update(p).eq('id', uid)
  }, [uid])

  const addCategory = useCallback(async (name: string) => {
    const { data } = await db.from('categories').insert({ name, position: categories.length }).select().single()
    if (data) setCategories((c) => [...c, data as Category])
    return (data as Category) ?? null
  }, [categories.length])

  const deleteCategory = useCallback(async (id: string) => {
    setCategories((c) => c.filter((x) => x.id !== id))
    setLists((l) => l.filter((x) => x.category_id !== id))
    await db.from('categories').delete().eq('id', id)
  }, [])

  const addList = useCallback(async (categoryId: string, title: string, opts?: { shared?: boolean; tone?: Tone; verb?: string }) => {
    const tone = opts?.tone ?? TONES[lists.length % TONES.length]
    const { data } = await db.from('lists').insert({
      title, category_id: categoryId, tone, verb: opts?.verb ?? 'do', family_id: opts?.shared ? family?.id ?? null : null
    }).select().single()
    if (data) setLists((l) => (l.some((x) => x.id === data.id) ? l : [...l, data as List]))
  }, [lists.length, family])

  const deleteList = useCallback(async (id: string) => {
    setLists((l) => l.filter((x) => x.id !== id))
    await db.from('lists').delete().eq('id', id)
  }, [])

  const addItem = useCallback(async (listId: string, name: string, qty?: string | null, aisle?: string | null) => {
    const { data } = await db.from('list_items').insert({ list_id: listId, name, qty: qty ?? null, aisle: aisle ?? null }).select().single()
    if (data) setItems((xs) => (xs.some((x) => x.id === data.id) ? xs : [...xs, data as Item]))
  }, [])

  const toggleItem = useCallback(async (item: Item) => {
    const done = !item.done
    const done_at = done ? new Date().toISOString() : null
    setItems((xs) => xs.map((x) => (x.id === item.id ? { ...x, done, done_at } : x)))
    await db.from('list_items').update({ done, done_at }).eq('id', item.id)
  }, [])

  const resetDone = useCallback(async (listId: string) => {
    setItems((xs) => xs.map((x) => (x.list_id === listId ? { ...x, done: false, done_at: null } : x)))
    await db.from('list_items').update({ done: false, done_at: null }).eq('list_id', listId).eq('done', true)
  }, [])

  const addEvent = useCallback(async (e: Partial<EventRow> & { title: string; starts_at: string }) => {
    const { data } = await db.from('events').insert(e).select().single()
    if (data) setEvents((xs) => [...xs, data as EventRow].sort((a, b) => a.starts_at.localeCompare(b.starts_at)))
  }, [])

  const addReminder = useCallback(async (r: { title: string; remind_at: string | null; source?: string }) => {
    const { data } = await db.from('reminders').insert(r).select().single()
    if (data) setReminders((xs) => [...xs, data as Reminder])
  }, [])

  const toggleReminder = useCallback(async (r: Reminder) => {
    setReminders((xs) => xs.map((x) => (x.id === r.id ? { ...x, done: !r.done } : x)))
    await db.from('reminders').update({ done: !r.done }).eq('id', r.id)
  }, [])

  const saveNote = useCallback(async (n: Partial<Note> & { title: string }) => {
    if (n.id) {
      const patch = { ...n, updated_at: new Date().toISOString() }
      setNotes((xs) => xs.map((x) => (x.id === n.id ? { ...x, ...patch } as Note : x)))
      const { data } = await db.from('notes').update(patch).eq('id', n.id).select().single()
      return (data as Note) ?? null
    }
    const { data } = await db.from('notes').insert(n).select().single()
    if (data) setNotes((xs) => [data as Note, ...xs])
    return (data as Note) ?? null
  }, [])

  const deleteNote = useCallback(async (id: string) => {
    setNotes((xs) => xs.filter((x) => x.id !== id))
    await db.from('notes').delete().eq('id', id)
  }, [])

  const findList = useCallback((hint?: string) => {
    const h = (hint ?? '').toLowerCase()
    const byTitle = lists.find((l) => h && l.title.toLowerCase().includes(h))
    if (byTitle) return byTitle
    if (/grocer|shop|cart|market|food|family/.test(h) || !h) return lists.find((l) => l.verb === 'buy') ?? lists[0]
    return lists[0]
  }, [lists])

  const saveDrafts = useCallback(async (drafts: Draft[]) => {
    let n = 0
    for (const d of drafts) {
      if (d.kind === 'event') {
        await addEvent({ title: d.title, starts_at: iso(d.start), ends_at: iso(d.end), calendar: d.calendar, location: d.location ?? null, source: 'voice' }); n++
      } else if (d.kind === 'reminder') {
        await addReminder({ title: d.title, remind_at: d.at ? iso(d.at) : null, source: 'voice' }); n++
      } else if (d.kind === 'task') {
        await addReminder({ title: d.title, remind_at: d.due ? iso(d.due) : null, source: 'voice' }); n++
      } else if (d.kind === 'item') {
        const l = findList(d.listHint)
        if (l) { await addItem(l.id, d.name, d.qty ?? 'Added by voice'); n++ }
      } else if (d.kind === 'note') {
        await saveNote({ title: d.title, body: d.body, kind: 'voice' }); n++
      }
    }
    return n
  }, [addEvent, addReminder, addItem, saveNote, findList])

  const joinFamily = useCallback(async (code: string) => {
    const { error } = await db.rpc('join_family', { code })
    if (error) return error.message
    await loadAll()
    return null
  }, [loadAll])

  const memberFor = useCallback((userId: string | null) => members.find((m) => m.user_id === userId), [members])

  const value = useMemo<Store>(() => ({
    ready, session, profile, family, members, categories, lists, items, events, reminders, notes, loading, theme, palette,
    setTheme, setPalette, updateProfile, reload: loadAll, addCategory, deleteCategory, addList, deleteList, addItem, toggleItem, resetDone,
    addEvent, addReminder, toggleReminder, saveNote, deleteNote, saveDrafts, joinFamily, memberFor
  }), [ready, session, profile, family, members, categories, lists, items, events, reminders, notes, loading, theme, palette,
    setTheme, setPalette, updateProfile, loadAll, addCategory, deleteCategory, addList, deleteList, addItem, toggleItem, resetDone,
    addEvent, addReminder, toggleReminder, saveNote, deleteNote, saveDrafts, joinFamily, memberFor])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
