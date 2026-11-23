import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useStore } from '../lib/store'
import { understand } from '../lib/parse'
import { I } from '../components/Icon'
import { t } from '../lib/i18n'

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
    else if (type === 'Birthday') await addEvent({ title: t('{name}’s birthday', { name: title.trim() }), starts_at: new Date(`${date}T09:00`).toISOString(), ends_at: null, calendar: 'Birthday', source: 'birthday' })
    else if (type === 'Shopping' && listId) await addItem(listId, title.trim(), qty || null, null)
    else if (type === 'Note') await saveNote({ title: title.trim(), body })
    setBusy(false)
    nav(-1)
  }

  // Each detail is a tile: label on top, the value editable in place (first two are highlighted, as in the design)
  const tile = (label: string, el: React.ReactNode, cls = '') => <label className={'tile card ' + cls}><span className="cap">{t(label)}</span>{el}</label>
  const name = type === 'Shopping' ? 'item' : type.toLowerCase()
  const EXAMPLE: Record<T, string> = {
    Event: 'Dentist Monday 5pm', Reminder: 'Call plumber tomorrow 9am', Task: 'Renew license by Friday',
    Birthday: 'Mama, 14 March', Shopping: '2 kg rice', Note: 'Gift idea for Mama: scarf'
  }

  return (
    <div className="add-bg" onClick={(e) => { if (e.target === e.currentTarget) nav(-1) }}>
      <main className="add-sheet col" role="dialog" aria-label={t('New ' + name)}>
        <span className="grab" aria-hidden="true" />
        <div className="hd3" style={{ marginTop: 12 }}>
          <Link to="/" className="ib" aria-label={t('Cancel')}><I n="close" s={15} w={2.6} /></Link>
          <h1>{t('New ' + name)}</h1>
          <button className="ib acc" aria-label={t('Save')} onClick={save} disabled={!title.trim() || busy}><I n="check" s={18} w={2.8} /></button>
        </div>

        <div role="group" aria-label={t('Type')} className="add-types">
          {TYPES.map(({ t: k, icon }) => <button key={k} className={k === type ? 'orb on' : 'orb'} aria-pressed={k === type} onClick={() => setType(k)}><span className="ib"><I n={icon} s={21} /></span>{t(k)}</button>)}
        </div>

        <label className="fld focus mt20" style={{ paddingInlineEnd: 8 }}>
          <span className="sr">{t('Describe it')}</span>
          <I n="spark" s={18} className="add-spark" />
          <input className="inp" placeholder={t(EXAMPLE[type])} value={smart} onChange={(e) => { setSmart(e.target.value); if (!understand(e.target.value)[0]) setTitle(e.target.value) }} />
          <Link to="/listen" className="vorb" style={{ width: 36, height: 36, boxShadow: 'none' }} aria-label={t('Say it instead')}><I n="mic" s={16} w={2.2} /></Link>
        </label>
        <p className="sub" style={{ margin: '10px 12px 0', fontSize: 13, lineHeight: '18px' }}>{t('Type it the way you’d say it. Tadween fills in the details.')}</p>

        <div className="grid2 add-tiles">
          {(type === 'Shopping' || type === 'Note' || type === 'Birthday') && tile(type === 'Shopping' ? 'Item' : type === 'Birthday' ? 'Whose' : 'Title',
            <input className="val" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={type === 'Shopping' ? t('Rice') : type === 'Birthday' ? t('Name, e.g. Mama') : t('Title')} />, 'hot' + (type === 'Shopping' ? '' : ' wide'))}
          {type === 'Event' && <>
            {tile('Date', <input type="date" className="val" value={date} onChange={(e) => setDate(e.target.value)} />, 'hot')}
            {tile('Starts', <input type="time" className="val" value={time} onChange={(e) => setTime(e.target.value)} />, 'hot')}
            {tile('Ends', <input type="time" className="val" value={endTime} onChange={(e) => setEndTime(e.target.value)} />)}
            {tile('Calendar', <select className="val" value={calendar} onChange={(e) => setCalendar(e.target.value)}>{['Personal', 'Work', 'Family'].map((c) => <option key={c} value={c}>{t(c)}</option>)}</select>)}
            {tile('Where', <input className="val" value={where} onChange={(e) => setWhere(e.target.value)} placeholder={t('Optional')} />, 'wide row')}
          </>}
          {type === 'Reminder' && <>
            {tile('Date', <input type="date" className="val" value={date} onChange={(e) => setDate(e.target.value)} />, 'hot')}
            {tile('Time', <input type="time" className="val" value={time} onChange={(e) => setTime(e.target.value)} />, 'hot')}
          </>}
          {type === 'Task' && <>
            {tile('Due', <input type="date" className="val" value={hasTime ? date : ''} onChange={(e) => { setHasTime(!!e.target.value); if (e.target.value) setDate(e.target.value) }} />, 'hot')}
            <button type="button" className={'tile card' + (hasTime ? '' : ' hot')} aria-pressed={!hasTime} onClick={() => setHasTime(!hasTime)}><span className="cap">{t('Due date')}</span><span className="val">{hasTime ? t('On') : t('None')}</span></button>
          </>}
          {type === 'Birthday' && tile('Date', <input type="date" className="val" value={date} onChange={(e) => setDate(e.target.value)} />, 'wide row')}
          {type === 'Shopping' && <>
            {tile('Amount', <input className="val" value={qty} onChange={(e) => setQty(e.target.value)} placeholder={t('2 kg')} />, 'hot')}
            {tile('List', <select className="val" value={listId} onChange={(e) => setListId(e.target.value)}>{lists.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}</select>, 'wide row')}
          </>}
          {type === 'Note' && tile('Note', <textarea className="val" rows={4} value={body} onChange={(e) => setBody(e.target.value)} placeholder={t('Write it down…')} />, 'wide')}
        </div>
        {type === 'Birthday' && <p className="ffoot">{t('Shows on your calendar every year.')}</p>}

        <button className="btn pri" style={{ marginTop: 'auto' }} disabled={!title.trim() || busy} onClick={save}>{busy ? t('Saving…') : t('Add ' + name)}<I n="next" s={16} w={2.6} /></button>
      </main>
    </div>
  )
}
