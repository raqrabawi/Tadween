import { useMemo, useRef, useState } from 'react'
import type React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import { addDays, hm, sameDay, startOfDay, weekStart } from '../lib/dates'
import { I } from '../components/Icon'
import { PageSkeleton } from '../components/Skeleton'
import { Fab } from '../components/Fab'
import type { EventRow } from '../lib/types'
import { isAr, LOC, t } from '../lib/i18n'
import { Tabs } from '../components/Tabs'

// Birthdays repeat every year on the same day
const onDay = (e: EventRow, d: Date) => {
  const s = new Date(e.starts_at)
  if (e.source !== 'birthday') return sameDay(s, d)
  return s.getMonth() === d.getMonth() && s.getDate() === d.getDate() && d.getFullYear() >= s.getFullYear()
}

type View = 'Day' | 'Week' | 'Month'
const VIEWS: View[] = ['Day', 'Week', 'Month']
// ISO week number (Monday-based), as shown under the month name
const isoWeek = (d: Date) => {
  const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dn = x.getUTCDay() || 7
  x.setUTCDate(x.getUTCDate() + 4 - dn)
  return Math.ceil(((x.getTime() - Date.UTC(x.getUTCFullYear(), 0, 1)) / 86400000 + 1) / 7)
}

const TONE: Record<string, string> = { Work: 'tone-sky', Personal: 'tone-mint', Family: 'tone-sand', Birthday: 'tone-lilac' }

export default function Calendar() {
  const { events, reminders, toggleReminder, firstLoad } = useStore()
  const nav = useNavigate()
  const [day, setDay] = useState(() => startOfDay(new Date()))
  const [view, setView] = useState<View>('Week')
  const week = weekStart(day)
  const now = new Date()
  const days = Array.from({ length: 7 }, (_, i) => addDays(week, i))

  const dayEvents = useMemo(() => events.filter((e) => onDay(e, day)), [events, day])
  const dayRems = reminders.filter((r) => r.remind_at && sameDay(new Date(r.remind_at), day))
  const weekCount = events.filter((e) => Array.from({ length: 7 }, (_, i) => addDays(week, i)).some((d) => onDay(e, d))).length

  // A free window of 2h+ between 09:00 and 18:00 on the selected day
  const free = useMemo(() => {
    const open = new Date(day); open.setHours(9, 0, 0, 0)
    const close = new Date(day); close.setHours(18, 0, 0, 0)
    let cursor = sameDay(day, now) && now > open ? new Date(Math.ceil(now.getTime() / 1800000) * 1800000) : open
    for (const e of dayEvents.filter((x) => x.source !== 'birthday')) {
      const s = new Date(e.starts_at)
      if (s.getTime() - cursor.getTime() >= 2 * 3600000 && s <= close) return { from: cursor, to: s }
      const en = new Date(e.ends_at ?? e.starts_at)
      if (en > cursor) cursor = en
    }
    return close.getTime() - cursor.getTime() >= 2 * 3600000 ? { from: cursor, to: close } : null
  }, [dayEvents, day]) // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (d: Date) => setDay(startOfDay(d))
  // Move by one day / week / month depending on the view
  const step = (n: number) => {
    if (view === 'Day') setDay(addDays(day, n))
    else if (view === 'Week') setDay(addDays(day, 7 * n))
    else { const d = new Date(day.getFullYear(), day.getMonth() + n, 1); setDay(startOfDay(d)) }
  }
  const swipe = useRef<{ x: number; y: number } | null>(null)
  const swipeStart = (e: React.PointerEvent) => { swipe.current = { x: e.clientX, y: e.clientY } }
  const swipeEnd = (e: React.PointerEvent) => {
    const s0 = swipe.current; swipe.current = null
    if (!s0) return
    const dx = e.clientX - s0.x, dy = e.clientY - s0.y
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return
    step((dx < 0 ? 1 : -1) * (isAr ? -1 : 1))
  }
  const isToday = sameDay(day, now)
  // Month grid: always 6 full weeks, days from the neighbouring months shown faintly
  const first = new Date(day.getFullYear(), day.getMonth(), 1)
  const gridStart = weekStart(first)
  const monthDays = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))
  const evOn = (d: Date) => events.filter((e) => onDay(e, d))
  const goToday = () => setDay(startOfDay(new Date()))
  const onPeriod = view === 'Day' ? isToday : view === 'Week' ? sameDay(weekStart(day), weekStart(now)) : (day.getMonth() === now.getMonth() && day.getFullYear() === now.getFullYear())
  const navLabel = view === 'Day'
    ? (isToday ? t('Today') + ', ' : '') + day.toLocaleDateString(LOC, { weekday: isToday ? undefined : 'long', day: 'numeric', month: 'short' })
    : view === 'Week'
      ? `${days[0].toLocaleDateString(LOC, { day: 'numeric', month: 'short' })} – ${days[6].toLocaleDateString(LOC, { day: 'numeric', month: 'short' })}`
      : day.toLocaleDateString(LOC, { month: 'long', year: 'numeric' })

  // Day view: an hour-by-hour timeline. Today starts at the current hour; other days at 7:00.
  const HOUR = 64
  const startH = isToday ? Math.max(0, Math.min(now.getHours(), 20)) : 7
  const hours = Array.from({ length: 24 - startH }, (_, i) => startH + i)
  const topFor = (d: Date) => ((d.getHours() + d.getMinutes() / 60) - startH) * HOUR

  // First load after signing in on a new device: show the page's shape while data arrives
  if (firstLoad) return <PageSkeleton />

  return (
    <main className="screen">
      <div className="hd" style={{ minHeight: 60 }}>
        <div style={{ display: 'flex', flexDirection: 'column', marginInlineStart: 4 }}>
          <span className="cap">{day.getFullYear()} · {t('Week {n}', { n: isoWeek(day) })}</span>
          <h1 className="h1">{day.toLocaleDateString(LOC, { month: 'long' })}</h1>
        </div>
        <Link to="/settings" className="ib" aria-label={t('Settings')}><I n="gear" s={19} /></Link>
      </div>

      <div className="spread mt20">
        <Tabs active={view} role="radiogroup" aria-label={t('View')} className="cal-views">
          {VIEWS.map((v) => <button key={v} role="radio" aria-checked={view === v} className={view === v ? 'on' : ''} onClick={() => setView(v)}>{t(v)}</button>)}
        </Tabs>
        <span className="sub" style={{ display: 'flex', alignItems: 'center', gap: 8, marginInlineEnd: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: 4, background: 'var(--mint, var(--acc))' }} />
          {t('{n} this week', { n: weekCount })}
        </span>
      </div>

      {/* Period navigator: arrows move by a day, week or month; tap the label to come back to today */}
      <div className="cal-nav mt16">
        <button className="ib sm" aria-label={t(view === 'Day' ? 'Previous day' : view === 'Week' ? 'Previous week' : 'Previous month')} onClick={() => step(-1)}><I n="back" s={16} w={2.4} /></button>
        <button className="cal-nav-lbl" onClick={goToday} aria-label={onPeriod ? navLabel : t('Back to today')}>
          <span key={navLabel} className="cal-nav-txt">{navLabel}</span>
          {!onPeriod && <span className="cal-today-chip">{t('Today')}</span>}
        </button>
        <button className="ib sm" aria-label={t(view === 'Day' ? 'Next day' : view === 'Week' ? 'Next week' : 'Next month')} onClick={() => step(1)}><I n="chev" s={16} w={2.4} /></button>
      </div>

      <div className="cal-swipe mt12" onPointerDown={swipeStart} onPointerUp={swipeEnd} onPointerCancel={() => { swipe.current = null }}>
        {view === 'Week' && (
          <div key={days[0].toDateString()} className="cal-week">
            {days.map((d) => {
              const on = sameDay(d, day)
              const n = evOn(d).length
              return (
                <button key={d.toISOString()} onClick={() => pick(d)} aria-pressed={on} aria-label={d.toLocaleDateString(LOC, { weekday: 'long', day: 'numeric', month: 'long' })} className={'card cal-day' + (on ? ' on' : '') + (sameDay(d, now) ? ' today' : '')}>
                  <span className="cal-dw">{d.toLocaleDateString(LOC, { weekday: 'short' })}</span>
                  <span className="num cal-dn">{d.getDate()}</span>
                  <span className="cal-dots">{Array.from({ length: Math.min(n, 3) }, (_, i) => <i key={i} />)}</span>
                </button>
              )
            })}
          </div>
        )}
        {view === 'Month' && (
          <div key={first.toDateString()} className="cal-month">
            <div className="cal-mhead">{days.map((d) => <span key={'h' + d.getDay()}>{d.toLocaleDateString(LOC, { weekday: 'short' })}</span>)}</div>
            <div className="cal-mgrid">
              {monthDays.map((d) => {
                const on = sameDay(d, day)
                const out = d.getMonth() !== day.getMonth()
                const evs = evOn(d)
                return (
                  <button key={d.toISOString()} onClick={() => pick(d)} aria-pressed={on} aria-label={d.toLocaleDateString(LOC, { weekday: 'long', day: 'numeric', month: 'long' })}
                    className={'cal-md' + (on ? ' on' : '') + (out ? ' out' : '') + (sameDay(d, now) ? ' today' : '')}>
                    <span className="num">{d.getDate()}</span>
                    <span className="cal-dots">{evs.slice(0, 3).map((e) => <i key={e.id} className={TONE[e.calendar] ?? 'tone-lilac'} />)}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
        {view === 'Day' && !dayEvents.length && !dayRems.length && (
          <div className="card empty"><span className="ttl">{t('Nothing here')}</span><span className="sub">{t('Tap the mic and say what’s coming up.')}</span></div>
        )}
        {view === 'Day' && (dayEvents.length > 0 || dayRems.length > 0) && (
          <div key={day.toDateString()} className="cal-tl card" style={{ height: hours.length * HOUR }}>
            {hours.map((h) => (
              <div key={h} className="cal-hr" style={{ top: (h - startH) * HOUR }}>
                {!(isToday && Math.abs((h - startH) * HOUR + 12 - topFor(now)) < 16) && <span className="num">{String(h).padStart(2, '0')}:00</span>}
              </div>
            ))}
            {isToday && <div className="cal-now" style={{ top: topFor(now) }}><span className="num">{hm(now)}</span></div>}
            {dayEvents.filter((e) => e.source !== 'birthday').map((e) => {
              const s0 = new Date(e.starts_at), en = e.ends_at ? new Date(e.ends_at) : new Date(s0.getTime() + 3600000)
              const top = Math.max(0, topFor(s0)), h = Math.max(36, topFor(en) - topFor(s0) - 4)
              if (topFor(en) < 0) return null
              return (
                <div key={e.id} className={'cal-ev ' + (TONE[e.calendar] ?? 'tone-lilac')} style={{ top, height: h }}>
                  <b>{e.title}</b><small className="num">{hm(s0)} – {hm(en)}{e.location ? ' · ' + e.location : ''}</small>
                </div>
              )
            })}
            {dayRems.filter((r) => topFor(new Date(r.remind_at!)) >= 0).map((r) => (
              <button key={r.id} className={'cal-rem tone-sand' + (r.done ? ' done' : '')} style={{ top: topFor(new Date(r.remind_at!)) }} onClick={() => toggleReminder(r)} aria-label={t('Mark {title} done', { title: r.title })}>
                <I n={r.done ? 'check' : 'bell'} s={12} w={2.4} />{r.title}
              </button>
            ))}
            {dayEvents.filter((e) => e.source === 'birthday').map((e) => (
              <div key={e.id} className="cal-allday"><I n="gift" s={14} />{e.title}</div>
            ))}
          </div>
        )}
      </div>

      {view !== 'Day' && <>
      <div className="sec"><h2>{isToday ? t('Today') : day.toLocaleDateString(LOC, { weekday: 'long' })}, {day.getDate()} {day.toLocaleDateString(LOC, { month: 'short' })}</h2><span className="sub">{dayEvents.length ? t('Events: {n}', { n: dayEvents.length }) : t('Free day')}</span></div>

      <div className="stack" style={{ gap: 10 }}>
        {dayEvents.map((e) => {
          const s = new Date(e.starts_at)
          const en = e.ends_at ? new Date(e.ends_at) : null
          const live = e.source !== 'birthday' && s <= now && (en ?? s) >= now
          return (
            <div key={e.id} className="row" style={{ alignItems: 'stretch' }}>
              <div style={{ width: 46, flexShrink: 0, paddingTop: 18, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                {e.source === 'birthday' ? <I n="gift" s={18} /> : <span className="num" style={{ fontSize: 15, fontWeight: 600 }}>{hm(s)}</span>}
                {en && e.source !== 'birthday' && <span className="sub num" style={{ fontSize: 12, lineHeight: '16px' }}>{hm(en)}</span>}
              </div>
              {live ? (
                <div className="card hot tight grow" style={{ paddingInlineStart: 20 }}>
                  <div className="spread" style={{ alignItems: 'flex-start' }}>
                    <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><span className="ttl">{e.title}</span><span className="sub">{[e.location, e.calendar].filter(Boolean).join(' · ')}</span></span>
                    <span className="arr"><I n="arrow" s={16} /></span>
                  </div>
                  <div className="row mt12" style={{ gap: 10 }}>
                    <div className="bar grow" style={{ height: 6 }}><span style={{ width: `${en ? Math.min(100, Math.round(((now.getTime() - s.getTime()) / (en.getTime() - s.getTime())) * 100)) : 50}%` }} /></div>
                    <span className="sub" style={{ fontWeight: 700, fontSize: 13 }}>{t('Now')}</span>
                  </div>
                </div>
              ) : (
                <div className={`card tight grow ${TONE[e.calendar] ?? 'tone-lilac'}`} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span className="rail" />
                  <span className="grow" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><span className="ttl" style={{ fontSize: 17 }}>{e.title}</span><span className="sub">{e.source === 'birthday' ? (() => { const age = day.getFullYear() - s.getFullYear(); return age > 0 && age < 120 ? t('Turns {n}', { n: age }) : t('All day') })() : [e.location, e.source === 'voice' ? t('Added by voice') : null].filter(Boolean).join(' · ') || t(e.calendar)}</span></span>
                  <span className="tag sm">{e.calendar}</span>
                </div>
              )}
            </div>
          )
        })}

        {free && (
          <div className="row" style={{ alignItems: 'stretch' }}>
            <div style={{ width: 46, flexShrink: 0, paddingTop: 18, textAlign: 'end' }}><span className="num" style={{ fontSize: 15, fontWeight: 600 }}>{hm(free.from)}</span></div>
            <div className="dash grow" style={{ padding: '12px 12px 12px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="grow" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><span className="ttl" style={{ fontSize: 17, fontWeight: 500 }}>{t('Free for {n} hours', { n: Math.round((free.to.getTime() - free.from.getTime()) / 3600000) })}</span><span className="sub">{t('Good for focus work')}</span></span>
              <Link to="/add?type=Event" className="tag"><I n="plus" s={14} w={2.6} />{t('Plan')}</Link>
            </div>
          </div>
        )}

        {dayRems.map((r) => (
          <div key={r.id} className="row" style={{ alignItems: 'stretch' }}>
            <div style={{ width: 46, flexShrink: 0, paddingTop: 18, textAlign: 'end' }}><span className="num" style={{ fontSize: 15, fontWeight: 600 }}>{hm(r.remind_at!)}</span></div>
            <div className="card tight grow tone-sand" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button className={r.done ? 'ck on' : 'ck'} onClick={() => toggleReminder(r)} aria-label={t('Mark {title} done', { title: r.title })}><span>{r.done && <I n="check" s={14} w={3} />}</span></button>
              <span className="grow" style={{ display: 'flex', flexDirection: 'column' }}><span className="ttl" style={{ fontSize: 17, textDecoration: r.done ? 'line-through' : undefined }}>{r.title}</span><span className="sub">{t('Reminder')}</span></span>
            </div>
          </div>
        ))}

        {!dayEvents.length && !dayRems.length && !free && <div className="card empty"><span className="ttl">{t('Nothing here')}</span><span className="sub">{t('Tap the mic and say what’s coming up.')}</span></div>}
      </div>
      </>}
      <Fab label={t('Add to calendar')} actions={[
        { icon: 'cal', label: t('Event'), hint: t('Meeting, appointment'), onSelect: () => nav(`/add?type=Event&date=${dkey(day)}`) },
        { icon: 'bell', label: t('Task or reminder'), onSelect: () => nav(`/add?type=Reminder&date=${dkey(day)}`) },
        { icon: 'gift', label: t('Birthday'), hint: t('Repeats every year'), onSelect: () => nav(`/add?type=Birthday&date=${dkey(day)}`) }
      ]} />
    </main>
  )
}

const dkey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
