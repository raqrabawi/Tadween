import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { addDays, hm, sameDay, startOfDay, weekStart } from '../lib/dates'
import { I } from '../components/Icon'

const TONE: Record<string, string> = { Work: 'tone-sky', Personal: 'tone-mint', Family: 'tone-sand' }

export default function Calendar() {
  const { events, reminders, toggleReminder } = useStore()
  const [day, setDay] = useState(() => startOfDay(new Date()))
  const [week, setWeek] = useState(() => weekStart(new Date()))
  const now = new Date()
  const days = Array.from({ length: 7 }, (_, i) => addDays(week, i))

  const dayEvents = useMemo(() => events.filter((e) => sameDay(new Date(e.starts_at), day)), [events, day])
  const dayRems = reminders.filter((r) => r.remind_at && sameDay(new Date(r.remind_at), day))
  const weekCount = events.filter((e) => { const d = new Date(e.starts_at); return d >= week && d < addDays(week, 7) }).length

  // A free window of 2h+ between 09:00 and 18:00 on the selected day
  const free = useMemo(() => {
    const open = new Date(day); open.setHours(9, 0, 0, 0)
    const close = new Date(day); close.setHours(18, 0, 0, 0)
    let cursor = sameDay(day, now) && now > open ? new Date(Math.ceil(now.getTime() / 1800000) * 1800000) : open
    for (const e of dayEvents) {
      const s = new Date(e.starts_at)
      if (s.getTime() - cursor.getTime() >= 2 * 3600000 && s <= close) return { from: cursor, to: s }
      const en = new Date(e.ends_at ?? e.starts_at)
      if (en > cursor) cursor = en
    }
    return close.getTime() - cursor.getTime() >= 2 * 3600000 ? { from: cursor, to: close } : null
  }, [dayEvents, day]) // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (d: Date) => setDay(startOfDay(d))
  const shiftWeek = (n: number) => { const w = addDays(week, 7 * n); setWeek(w); setDay(w) }
  const isToday = sameDay(day, now)

  return (
    <main className="screen">
      <div className="hd" style={{ minHeight: 60 }}>
        <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 4 }}>
          <span className="cap">{week.getFullYear()} · {weekCount} this week</span>
          <h1 className="h1">{day.toLocaleDateString([], { month: 'long' })}</h1>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <button className="ib" aria-label="Jump to today" onClick={() => { setWeek(weekStart(now)); pick(now) }}><I n="target" /></button>
          <Link to="/add?type=Event" className="ib" aria-label="New event"><I n="plus" w={2.2} /></Link>
        </div>
      </div>

      <div className="spread mt20">
        <button className="ib sm" aria-label="Previous week" onClick={() => shiftWeek(-1)}><I n="back" s={16} w={2.4} /></button>
        <span className="sub" style={{ fontWeight: 600 }}>{days[0].toLocaleDateString([], { day: 'numeric', month: 'short' })} – {days[6].toLocaleDateString([], { day: 'numeric', month: 'short' })}</span>
        <button className="ib sm" aria-label="Next week" onClick={() => shiftWeek(1)}><I n="chev" s={16} w={2.4} /></button>
      </div>

      <div className="mt12" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0,1fr))', gap: 6 }}>
        {days.map((d) => {
          const on = sameDay(d, day)
          const n = events.filter((e) => sameDay(new Date(e.starts_at), d)).length
          return (
            <button key={d.toISOString()} onClick={() => pick(d)} aria-pressed={on} aria-label={d.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })}
              className={on ? 'card' : 'card'} style={{ height: 84, borderRadius: 24, padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, ...(on ? { background: 'var(--hot)', color: 'var(--hotInk)', backdropFilter: 'none' } : {}) }}>
              <span style={{ fontSize: 12, fontWeight: 700, opacity: .7 }}>{d.toLocaleDateString([], { weekday: 'short' })}</span>
              <span className="num" style={{ fontSize: 19, fontWeight: 600, color: !on && sameDay(d, now) ? 'var(--acc)' : undefined }}>{d.getDate()}</span>
              <span style={{ display: 'flex', gap: 3, height: 5 }}>{Array.from({ length: Math.min(n, 3) }, (_, i) => <span key={i} style={{ width: 5, height: 5, borderRadius: 3, background: 'currentColor', opacity: .6 }} />)}</span>
            </button>
          )
        })}
      </div>

      <div className="sec"><h2>{isToday ? 'Today' : day.toLocaleDateString([], { weekday: 'long' })}, {day.getDate()} {day.toLocaleDateString([], { month: 'short' })}</h2><span className="sub">{dayEvents.length ? `${dayEvents.length} ${dayEvents.length === 1 ? 'event' : 'events'}` : 'Free day'}</span></div>

      <div className="stack" style={{ gap: 10 }}>
        {dayEvents.map((e) => {
          const s = new Date(e.starts_at)
          const en = e.ends_at ? new Date(e.ends_at) : null
          const live = s <= now && (en ?? s) >= now
          return (
            <div key={e.id} className="row" style={{ alignItems: 'stretch' }}>
              <div style={{ width: 46, flexShrink: 0, paddingTop: 18, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span className="num" style={{ fontSize: 15, fontWeight: 600 }}>{hm(s)}</span>
                {en && <span className="sub num" style={{ fontSize: 12, lineHeight: '16px' }}>{hm(en)}</span>}
              </div>
              {live ? (
                <div className="card hot tight grow" style={{ paddingLeft: 20 }}>
                  <span className="ttl">{e.title}</span><p className="sub">{[e.location, e.calendar].filter(Boolean).join(' · ')}</p>
                  <div className="row mt12" style={{ gap: 10 }}>
                    <div className="bar grow" style={{ height: 6 }}><span style={{ width: `${en ? Math.min(100, Math.round(((now.getTime() - s.getTime()) / (en.getTime() - s.getTime())) * 100)) : 50}%` }} /></div>
                    <span className="sub" style={{ fontWeight: 700, fontSize: 13 }}>Now</span>
                  </div>
                </div>
              ) : (
                <div className={`card tight grow ${TONE[e.calendar] ?? 'tone-lilac'}`} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span className="rail" />
                  <span className="grow" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><span className="ttl" style={{ fontSize: 17 }}>{e.title}</span><span className="sub">{[e.location, e.source === 'voice' ? 'Added by voice' : null].filter(Boolean).join(' · ') || e.calendar}</span></span>
                  <span className="tag sm">{e.calendar}</span>
                </div>
              )}
            </div>
          )
        })}

        {free && (
          <div className="row" style={{ alignItems: 'stretch' }}>
            <div style={{ width: 46, flexShrink: 0, paddingTop: 18, textAlign: 'right' }}><span className="num" style={{ fontSize: 15, fontWeight: 600 }}>{hm(free.from)}</span></div>
            <div className="dash grow" style={{ padding: '12px 12px 12px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="grow" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><span className="ttl" style={{ fontSize: 17, fontWeight: 500 }}>Free for {Math.round((free.to.getTime() - free.from.getTime()) / 3600000)} hours</span><span className="sub">Good for focus work</span></span>
              <Link to="/add?type=Event" className="tag"><I n="plus" s={14} w={2.6} />Plan</Link>
            </div>
          </div>
        )}

        {dayRems.map((r) => (
          <div key={r.id} className="row" style={{ alignItems: 'stretch' }}>
            <div style={{ width: 46, flexShrink: 0, paddingTop: 18, textAlign: 'right' }}><span className="num" style={{ fontSize: 15, fontWeight: 600 }}>{hm(r.remind_at!)}</span></div>
            <div className="card tight grow tone-sand" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button className={r.done ? 'ck on' : 'ck'} onClick={() => toggleReminder(r)} aria-label={`Mark ${r.title} done`}><span>{r.done && <I n="check" s={14} w={3} />}</span></button>
              <span className="grow" style={{ display: 'flex', flexDirection: 'column' }}><span className="ttl" style={{ fontSize: 17, textDecoration: r.done ? 'line-through' : undefined }}>{r.title}</span><span className="sub">Reminder</span></span>
            </div>
          </div>
        ))}

        {!dayEvents.length && !dayRems.length && !free && <div className="card empty"><span className="ttl">Nothing here</span><span className="sub">Tap the mic and say what’s coming up.</span></div>}
      </div>
    </main>
  )
}
