import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useStore } from '../lib/store'
import { understand } from '../lib/parse'
import { I } from '../components/Icon'

type T = 'Event' | 'Reminder' | 'Task' | 'Birthday' | 'Shopping' | 'Note'
const TYPES: { t: T; icon: string }[] = [{ t: 'Event', icon: 'cal' }, { t: 'Reminder', icon: 'bell' }, { t: 'Task', icon: 'check' }, { t: 'Birthday', icon: 'gift' }, { t: 'Shopping', icon: 'bag' }, { t: 'Note', icon: 'pen' }]
const pad = (n: number) => String(n).padStart(2, '0')
const dstr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const tstr = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`

export default function Add() {
  const [sp] = useSearchParams()
  const nav = useNavigate()
  const { lists, addEvent, addReminder, addItem, saveNote } = useStore()
  const [type, setType] = useState<T>((sp.get('type') as T) || 'Event')
  const [smart, setSmart] = useState('')
  const soon = new Date(); soon.setHours(soon.getHours() + 1, 0, 0, 0)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(sp.get('date') ?? dstr(soon))
  const [time, setTime] = useState(tstr(soon))
  const [endTime, setEndTime] = useState(tstr(new Date(soon.getTime() + 3600000)))
  const [calendar, setCalendar] = useState('Personal')
  const [where, setWhere] = useState('')
  const [qty, setQty] = useState('')
  const [listId, setListId] = useState('')
  const [body, setBody] = useState('')
  const [hasTime, setHasTime] = useState(type !== 'Task')
  const [busy, setBusy] = useState(false)

  useEffect(() => { if (!listId) setListId(lists.find((l) => l.verb === 'buy')?.id ?? lists[0]?.id ?? '') }, [lists, listId])

  // Natural-language field fills the structured fields as you type
  useEffect(() => {
    const d = understand(smart)[0]
    if (!d) return
    if (d.kind === 'event') { setType('Event'); setTitle(d.title); setDate(dstr(d.start)); setTime(tstr(d.start)); setEndTime(tstr(d.end)); setCalendar(d.calendar); if (d.location) setWhere(d.location) }
    else if (d.kind === 'reminder') { setType('Reminder'); setTitle(d.title); if (d.at) { setDate(dstr(d.at)); setTime(tstr(d.at)) } }
    else if (d.kind === 'item') { setType('Shopping'); setTitle(d.name); setQty(d.qty ?? '') }
    else if (d.kind === 'task') { setType('Task'); setTitle(d.title); setHasTime(!!d.due); if (d.due) setDate(dstr(d.due)) }
    else if (d.kind === 'note') { setType('Note'); setTitle(d.title); setBody(d.body) }
  }, [smart])

  const at = () => new Date(`${date}T${time || '09:00'}`)
  const save = async () => {
    if (!title.trim()) return
    setBusy(true)
    if (type === 'Event') {
      const s = at(); const e = new Date(`${date}T${endTime || time}`)
      await addEvent({ title: title.trim(), starts_at: s.toISOString(), ends_at: (e > s ? e : new Date(s.getTime() + 3600000)).toISOString(), calendar, location: where || null })
    } else if (type === 'Reminder') await addReminder({ title: title.trim(), remind_at: at().toISOString() })
    else if (type === 'Task') await addReminder({ title: title.trim(), remind_at: hasTime ? at().toISOString() : null })
    else if (type === 'Birthday') await addEvent({ title: `${title.trim()}’s birthday`, starts_at: new Date(`${date}T09:00`).toISOString(), ends_at: null, calendar: 'Birthday', source: 'birthday' })
    else if (type === 'Shopping' && listId) await addItem(listId, title.trim(), qty || null, null)
    else if (type === 'Note') await saveNote({ title: title.trim(), body })
    setBusy(false)
    nav(-1)
  }

  const row = (label: string, el: React.ReactNode) => <label className="frow"><span className="fl">{label}</span>{el}</label>

  return (
    <main className="screen col">
      <div className="hd3">
        <Link to="/" className="ib" aria-label="Cancel"><I n="close" s={15} w={2.6} /></Link>
        <h1>New {type === 'Shopping' ? 'item' : type.toLowerCase()}</h1>
        <button className="ib acc" aria-label="Save" onClick={save} disabled={!title.trim() || busy}><I n="check" s={18} w={2.8} /></button>
      </div>

      <div role="group" aria-label="Type" className="mt20" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0,1fr))' }}>
        {TYPES.map(({ t, icon }) => <button key={t} className={t === type ? 'orb on' : 'orb'} aria-pressed={t === type} onClick={() => setType(t)}><span className="ib"><I n={icon} s={21} /></span>{t}</button>)}
      </div>

      <label className="fld focus mt20" style={{ paddingRight: 8 }}>
        <span className="sr">Describe it</span>
        <I n="spark" s={18} className="" />
        <input className="inp" placeholder="Type it the way you’d say it…" value={smart} onChange={(e) => setSmart(e.target.value)} />
        <Link to="/listen" className="vorb" style={{ width: 36, height: 36, boxShadow: 'none' }} aria-label="Say it instead"><I n="mic" s={16} w={2.2} /></Link>
      </label>
      <p className="ffoot">e.g. “Dentist Monday at 5 at Smile Clinic” — the details below fill in.</p>

      <p className="fhead mt24">Details</p>
      <div className="form">
        {row(type === 'Shopping' ? 'Item' : type === 'Birthday' ? 'Whose' : 'Title', <input className="inp" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={type === 'Shopping' ? 'Rice' : type === 'Birthday' ? 'Name, e.g. Mama' : 'Title'} />)}
        {type === 'Event' && <>
          {row('Date', <input type="date" className="inp" value={date} onChange={(e) => setDate(e.target.value)} />)}
          {row('Starts', <input type="time" className="inp" value={time} onChange={(e) => setTime(e.target.value)} />)}
          {row('Ends', <input type="time" className="inp" value={endTime} onChange={(e) => setEndTime(e.target.value)} />)}
          {row('Where', <input className="inp" value={where} onChange={(e) => setWhere(e.target.value)} placeholder="Optional" />)}
        </>}
        {type === 'Birthday' && row('Date', <input type="date" className="inp" value={date} onChange={(e) => setDate(e.target.value)} />)}
        {type === 'Reminder' && <>
          {row('Date', <input type="date" className="inp" value={date} onChange={(e) => setDate(e.target.value)} />)}
          {row('Time', <input type="time" className="inp" value={time} onChange={(e) => setTime(e.target.value)} />)}
        </>}
        {type === 'Task' && <>
          <div className="frow"><span className="grow" style={{ fontSize: 17 }}>Due date</span><button type="button" role="switch" aria-checked={hasTime} aria-label="Has a due date" className={hasTime ? 'pw on' : 'pw'} onClick={() => setHasTime(!hasTime)}><span /></button></div>
          {hasTime && row('Due', <input type="date" className="inp" value={date} onChange={(e) => setDate(e.target.value)} />)}
        </>}
        {type === 'Shopping' && <>
          {row('Amount', <input className="inp" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="2 kg" />)}
          {row('List', <select className="inp" value={listId} onChange={(e) => setListId(e.target.value)} style={{ background: 'transparent' }}>{lists.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}</select>)}
        </>}
        {type === 'Note' && <label className="frow" style={{ alignItems: 'flex-start', paddingTop: 14, paddingBottom: 14 }}><span className="sr">Note</span><textarea className="inp" rows={5} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write it down…" /></label>}
      </div>

      {type === 'Birthday' && <p className="ffoot">Shows on your calendar every year.</p>}
      {type === 'Event' && (
        <div className="seg mt16" role="group" aria-label="Calendar">
          {['Personal', 'Work', 'Family'].map((c) => <button key={c} className={c === calendar ? 'on' : ''} aria-pressed={c === calendar} onClick={() => setCalendar(c)}>{c}</button>)}
        </div>
      )}

      <button className="btn pri mtauto" style={{ marginTop: 24 }} disabled={!title.trim() || busy} onClick={save}>{busy ? 'Saving…' : `Add ${type === 'Shopping' ? 'item' : type.toLowerCase()}`}<I n="next" s={16} w={2.6} /></button>
    </main>
  )
}
