import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { speak, stopSpeaking } from '../lib/voice'
import { greeting, hm, relTime, sameDay } from '../lib/dates'
import { I } from '../components/Icon'
import { Avatar, Switch } from '../components/ui'

export default function Today() {
  const { profile, events, reminders, lists, items, members, toggleReminder, addEvent } = useStore()
  const [briefing, setBriefing] = useState(false)
  const [focus, setFocus] = useState(false)
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

  const [remind, setRemind] = useState(true)

  return (
    <main className="screen">
      <div className="hd">
        <Link to="/settings" className="row" aria-label="Settings">
          <span style={{ width: 48, height: 48, borderRadius: 24, background: 'linear-gradient(140deg,#0B6B72,#075056)', color: '#E4EEF0', fontSize: 19, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 2px var(--bg), 0 0 0 3.5px var(--acc)' }}>{first.charAt(0).toUpperCase()}</span>
          <span style={{ display: 'flex', flexDirection: 'column' }}><span className="sub">{greeting()}</span><span className="ttl">{first}</span></span>
        </Link>
        <div className="row" style={{ gap: 8 }}>
          <Link to="/ask" className="ib" aria-label="Search or ask"><I n="search" /></Link>
          <Link to="/add" className="ib" aria-label="Add manually"><I n="plus" w={2.2} /></Link>
        </div>
      </div>

      <p className="cap" style={{ margin: '24px 4px 6px' }}>{dateCap}</p>
      <h1 className="h1" style={{ margin: '0 4px' }}>{left === 0 ? 'All clear today.' : `${left} ${left === 1 ? 'thing' : 'things'} left today`}</h1>

      {upcoming ? (
        <Link to="/calendar" className="card hot mt20" style={{ display: 'block' }}>
          <div className="spread" style={{ alignItems: 'flex-start' }}>
            <span className="ib"><I n="cal" /></span>
            <span className="arr"><I n="arrow" s={16} /></span>
          </div>
          <div className="row mt12" style={{ alignItems: 'baseline', gap: 10 }}>
            <span className="num" style={{ fontSize: 44, lineHeight: '46px', fontWeight: 300, letterSpacing: -1.6 }}>{hm(upcoming.starts_at)}</span>
            <span className="sub" style={{ fontWeight: 700 }}>{sameDay(new Date(upcoming.starts_at), now) ? 'Up next' : new Date(upcoming.starts_at).toLocaleDateString([], { weekday: 'long' })}</span>
          </div>
          <p className="ttl" style={{ marginTop: 4 }}>{upcoming.title}</p>
          <p className="sub">{[upcoming.location, upcoming.calendar, upcoming.ends_at ? `${Math.round((new Date(upcoming.ends_at).getTime() - new Date(upcoming.starts_at).getTime()) / 60000)} min` : null].filter(Boolean).join(' · ')}</p>
          <div className="spread mt16">
            <span className="tag"><I n="clock" s={15} w={2.2} />{relTime(upcoming.starts_at)}</span>
            <span className="row" style={{ gap: 10 }} onClick={(e) => e.preventDefault()}>
              <span className="sub" style={{ fontWeight: 700 }}>Remind</span>
              <Switch on={remind} onChange={setRemind} label={`Remind me before ${upcoming.title}`} />
            </span>
          </div>
        </Link>
      ) : (
        <div className="card hot mt20">
          <span className="ib"><I n="cal" /></span>
          <p className="ttl mt16">Nothing coming up</p>
          <p className="sub">Say “lunch with Sara Friday at 1” or add it yourself.</p>
          <button className="tag mt16" onClick={() => { const d = new Date(); d.setHours(d.getHours() + 1, 0, 0, 0); addEvent({ title: 'Focus time', starts_at: d.toISOString(), ends_at: new Date(d.getTime() + 3600000).toISOString() }) }}><I n="plus" s={14} w={2.6} />Block an hour for focus</button>
        </div>
      )}

      <div className="card tone-sky mt12" style={{ padding: '16px 6px' }} aria-label="Quick moments">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0,1fr))' }}>
          <button className={briefing ? 'orb on' : 'orb'} aria-pressed={briefing} onClick={brief}><span className="ib plain"><I n={briefing ? 'pause' : 'speaker'} /></span>Hear brief</button>
          <Link to="/note/new" className="orb"><span className="ib plain"><I n="pen" /></span>Note</Link>
          <Link to="/add?type=Reminder" className="orb"><span className="ib plain"><I n="bell" /></span>Remind</Link>
          <Link to="/lists" className="orb"><span className="ib plain"><I n="bag" /></span>Shop</Link>
          <button className={focus ? 'orb on' : 'orb'} aria-pressed={focus} onClick={() => setFocus(!focus)}><span className="ib plain"><I n="target" /></span>Focus</button>
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
