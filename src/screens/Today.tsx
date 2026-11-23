import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { speak, stopSpeaking } from '../lib/voice'
import { greeting, hm, relTime, sameDay } from '../lib/dates'
import { I } from '../components/Icon'
import { Avatar } from '../components/ui'

export default function Today() {
  const { profile, events, reminders, lists, items, members, toggleReminder } = useStore()
  const [briefing, setBriefing] = useState(false)
  const now = new Date()

  const todays = useMemo(() => events.filter((e) => sameDay(new Date(e.starts_at), now)), [events]) // eslint-disable-line react-hooks/exhaustive-deps
  const upcoming = useMemo(() => events.find((e) => new Date(e.ends_at ?? e.starts_at) >= now), [events]) // eslint-disable-line react-hooks/exhaustive-deps
  const tasks = reminders.filter((r) => !r.remind_at || sameDay(new Date(r.remind_at), now) || new Date(r.remind_at) < now)
  const openTasks = tasks.filter((t) => !t.done)
  const doneTasks = tasks.length - openTasks.length
  const leftEvents = todays.filter((e) => new Date(e.starts_at) > now).length
  const left = leftEvents + openTasks.length

  const shopping = lists.find((l) => l.family_id) ?? lists.find((l) => l.verb === 'buy')
  const shopOpen = shopping ? items.filter((i) => i.list_id === shopping.id && !i.done).length : 0
  const shopAll = shopping ? items.filter((i) => i.list_id === shopping.id).length : 0

  const first = (profile?.name ?? '').split(' ')[0] || 'there'
  const dateCap = now.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })

  const brief = () => {
    if (briefing) { stopSpeaking(); setBriefing(false); return }
    const parts = [`${greeting().replace(',', '')} ${first}.`]
    parts.push(todays.length ? `You have ${todays.length} ${todays.length === 1 ? 'event' : 'events'} today` + (upcoming ? `, next is ${upcoming.title} at ${hm(upcoming.starts_at)}.` : '.') : 'Your calendar is clear today.')
    if (openTasks.length) parts.push(`${openTasks.length} ${openTasks.length === 1 ? 'task is' : 'tasks are'} open, starting with ${openTasks[0].title}.`)
    if (shopOpen) parts.push(`And ${shopOpen} ${shopOpen === 1 ? 'thing' : 'things'} on ${shopping?.title}.`)
    setBriefing(true)
    speak(parts.join(' '), profile?.voice_style, () => setBriefing(false))
  }

  // Up next: the nearest events, reminders and tasks — swipe through up to five
  type Up = { key: string; kind: 'event' | 'reminder' | 'task'; at: Date | null; title: string; detail: string; reminder?: typeof reminders[number] }
  const upNext = useMemo<Up[]>(() => {
    const evs: Up[] = events.filter((e) => new Date(e.ends_at ?? e.starts_at) >= now).map((e) => ({
      key: 'e' + e.id, kind: 'event', at: new Date(e.starts_at), title: e.title,
      detail: [e.location, e.source === 'birthday' ? 'Birthday' : e.calendar, e.ends_at ? `${Math.round((new Date(e.ends_at).getTime() - new Date(e.starts_at).getTime()) / 60000)} min` : null].filter(Boolean).join(' · ')
    }))
    const rem: Up[] = reminders.filter((r) => !r.done).map((r) => ({
      key: 'r' + r.id, kind: r.remind_at ? 'reminder' : 'task', at: r.remind_at ? new Date(r.remind_at) : null, title: r.title,
      detail: r.remind_at ? (new Date(r.remind_at) < now ? 'Overdue reminder' : 'Reminder') : 'Task · no time set', reminder: r
    }))
    const dated = [...evs, ...rem.filter((r) => r.at)].sort((a, b) => a.at!.getTime() - b.at!.getTime())
    return [...dated, ...rem.filter((r) => !r.at)].slice(0, 5)
  }, [events, reminders]) // eslint-disable-line react-hooks/exhaustive-deps
  // Card deck: the top card can be flicked away; it shuffles to the back of the pile
  const [top, setTop] = useState(0)
  const [drag, setDrag] = useState(0)
  const [fling, setFling] = useState<0 | 1 | -1>(0)
  const start = useRef<{ x: number; y: number; id: number; lock?: 'x' | 'y' } | null>(null)
  const n = upNext.length
  useEffect(() => { if (top >= n) setTop(0) }, [n, top])
  const shuffle = (dir: 1 | -1) => {
    if (n < 2 || fling) return
    setFling(dir)
    try { navigator.vibrate?.(8) } catch { /* ignore */ }
    window.setTimeout(() => { setTop((t) => (dir === 1 ? (t + 1) % n : (t - 1 + n) % n)); setFling(0); setDrag(0) }, 320)
  }
  const onDown = (e: React.PointerEvent) => {
    if (n < 2 || (e.target as HTMLElement).closest('a,button')) return
    start.current = { x: e.clientX, y: e.clientY, id: e.pointerId }
  }
  const onMove = (e: React.PointerEvent) => {
    const st = start.current
    if (!st || st.id !== e.pointerId) return
    const dx = e.clientX - st.x, dy = e.clientY - st.y
    if (!st.lock) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return
      st.lock = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
      if (st.lock === 'x') (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    }
    if (st.lock === 'x') setDrag(dx)
  }
  const onUp = () => {
    const st = start.current
    start.current = null
    if (!st || st.lock !== 'x') return
    if (Math.abs(drag) > 80) shuffle(drag < 0 ? 1 : -1)
    else setDrag(0)
  }
  const lift = Math.min(Math.abs(drag) / 140, 1)

  return (
    <main className="screen">
      <div className="hd">
        <Link to="/settings" className="row" aria-label="Settings">
          <span style={{ width: 48, height: 48, borderRadius: 24, background: 'var(--hot)', color: 'var(--hotInk)', fontSize: 19, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 2px var(--bg), 0 0 0 3.5px var(--acc)' }}>{first.charAt(0).toUpperCase()}</span>
          <span style={{ display: 'flex', flexDirection: 'column' }}><span className="sub">{greeting()}</span><span className="ttl">{first}</span></span>
        </Link>
        <div className="row" style={{ gap: 8 }}>
          <Link to="/ask" className="ib" aria-label="Search or ask"><I n="search" /></Link>
          <Link to="/add" className="ib" aria-label="Add manually"><I n="plus" w={2.2} /></Link>
          <Link to="/settings" className="ib" aria-label="Settings"><I n="gear" s={19} /></Link>
        </div>
      </div>

      <p className="cap" style={{ margin: '24px 4px 6px' }}>{dateCap}</p>
      <h1 className="h1" style={{ margin: '0 4px' }}>{left === 0 ? 'All clear today.' : `${left} ${left === 1 ? 'thing' : 'things'} left today`}</h1>

      {upNext.length ? (
        <section className="upnext mt20" aria-label="Up next" aria-roledescription="carousel">
          <div className={drag ? 'up-deck dragging' : 'up-deck'} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
            tabIndex={0} onKeyDown={(e) => { if (e.key === 'ArrowRight') shuffle(1); if (e.key === 'ArrowLeft') shuffle(-1) }}>
            {upNext.map((u, i) => {
              const d = (i - top + n) % n
              if (d > 3) return null
              const isTop = d === 0
              const eff = isTop ? 0 : Math.max(d - lift, 0)
              const side = d % 2 ? -1 : 1
              const style: React.CSSProperties = isTop
                ? { zIndex: 10, transform: fling ? `translateX(${fling * -130}%) rotate(${fling * -16}deg)` : `translateX(${drag}px) rotate(${drag / 18}deg)`, opacity: fling ? 0 : 1 }
                : { zIndex: 10 - d, transform: `translateY(${eff * 14}px) scale(${1 - eff * 0.05}) rotate(${side * eff * 2.2}deg)` }
              return (
              <article key={u.key} className={isTop ? 'card hot up-card' : 'card hot up-card behind'} style={style} aria-hidden={!isTop} aria-roledescription="slide" aria-label={`${i + 1} of ${n}: ${u.title}`}>
                <div className="spread" style={{ alignItems: 'flex-start' }}>
                  <span className="ib"><I n={u.kind === 'event' ? (u.detail.startsWith('Birthday') ? 'gift' : 'cal') : u.kind === 'reminder' ? 'bell' : 'check'} /></span>
                  <span className="tag" style={{ minHeight: 30, fontSize: 12 }}>{u.kind === 'event' ? 'Event' : u.kind === 'reminder' ? 'Reminder' : 'Task'}</span>
                </div>
                <div className="row mt12" style={{ alignItems: 'baseline', gap: 10 }}>
                  <span className="num" style={{ fontSize: 40, lineHeight: '44px', fontWeight: 300, letterSpacing: -1.4 }}>{u.at ? hm(u.at) : 'Any time'}</span>
                  <span className="sub" style={{ fontWeight: 700 }}>{!u.at ? '' : i === 0 && sameDay(u.at, now) ? 'Up next' : sameDay(u.at, now) ? 'Today' : u.at.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'short' })}</span>
                </div>
                <p className="ttl" style={{ marginTop: 4 }}>{u.title}</p>
                <p className="sub">{u.detail}</p>
                <div className="spread mt16">
                  {u.at ? <span className="tag"><I n="clock" s={15} w={2.2} />{relTime(u.at)}</span> : <span />}
                  {u.kind === 'event'
                    ? <Link to="/calendar" className="tag">Open<I n="arrow" s={13} w={2.4} /></Link>
                    : <button className="tag" onClick={() => u.reminder && toggleReminder(u.reminder)}><I n="check" s={14} w={2.6} />Done</button>}
                </div>
              </article>
            )})}
          </div>
          {upNext.length > 1 && (
            <div className="up-dots" role="tablist" aria-label="Choose card">
              {upNext.map((u, i) => <button key={u.key} role="tab" aria-selected={i === top} aria-label={`Show ${u.title}`} className={i === top ? 'on' : ''} onClick={() => setTop(i)} />)}
            </div>
          )}
        </section>
      ) : (
        <div className="card hot mt20">
          <span className="ib"><I n="cal" /></span>
          <p className="ttl mt16">Nothing coming up</p>
          <p className="sub">Hold the mic and say “lunch with Sara Friday at 1”, or add it yourself.</p>
          <Link to="/add" className="tag mt16"><I n="plus" s={14} w={2.6} />Add something</Link>
        </div>
      )}

      <div className="card tone-sky mt12" style={{ padding: '16px 6px' }} aria-label="Quick moments">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))' }}>
          <button className={briefing ? 'orb on' : 'orb'} aria-pressed={briefing} onClick={brief}><span className="ib plain"><I n={briefing ? 'pause' : 'speaker'} /></span>Hear brief</button>
          <Link to="/note/new" className="orb"><span className="ib plain"><I n="pen" /></span>Note</Link>
          <Link to="/add?type=Reminder" className="orb"><span className="ib plain"><I n="bell" /></span>Remind</Link>
          <Link to="/lists" className="orb"><span className="ib plain"><I n="bag" /></span>Shop</Link>
        </div>
      </div>

      <div className="grid2 mt12">
        <div className="card tight tone-mint">
          <div className="spread"><span className="ib"><I n="check" w={2.2} /></span><Link to="/lists" className="arr" aria-label="Open tasks"><I n="arrow" s={16} /></Link></div>
          <p className="ttl mt16">Tasks</p>
          <p className="sub">{tasks.length ? `${doneTasks} of ${tasks.length} done` : 'Nothing due'}</p>
          <div className="bar mt12"><span style={{ width: `${tasks.length ? Math.round((doneTasks / tasks.length) * 100) : 0}%` }} /></div>
          {openTasks[0] && <button className="tag sm mt12" style={{ width: '100%' }} onClick={() => toggleReminder(openTasks[0])}><I n="check" s={13} w={2.6} />{openTasks[0].title}</button>}
        </div>
        <Link to="/lists" className="card tight tone-sand" style={{ display: 'block' }}>
          <div className="spread"><span className="ib"><I n="bag" /></span><span className="arr"><I n="arrow" s={16} /></span></div>
          <p className="ttl mt16">{shopping?.title ?? 'Groceries'}</p>
          <p className="sub">{shopOpen ? `${shopOpen} to buy` : 'All bought'}{shopAll ? ` · ${shopAll - shopOpen}/${shopAll}` : ''}</p>
          <div className="avs mt12">{members.slice(0, 4).map((m) => <Avatar key={m.user_id} name={m.name} color={m.color} />)}</div>
        </Link>
      </div>
    </main>
  )
}
