import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { speak, stopSpeaking } from '../lib/voice'
import { daysAgo, hm, sameDay, addDays, startOfDay } from '../lib/dates'
import { I } from '../components/Icon'
import { isAr, LOC, t } from '../lib/i18n'

type Hit = { kind: string; title: string; meta: string; to: string; icon: string; tone: string }

export default function Ask() {
  const { items, lists, notes, events, reminders, addItem, profile } = useStore()
  const [q, setQ] = useState('')
  const [asked, setAsked] = useState('')
  const [speaking, setSpeaking] = useState(false)
  const [added, setAdded] = useState(false)

  const answer = useMemo(() => {
    const s = asked.trim().toLowerCase()
    if (!s) return null
    let m = s.match(/when did i (?:last )?(?:buy|get|order) (.+?)\??$/) ?? s.match(/متى (?:آخر مرة |اخر مرة )?(?:اشتريت|جبت|طلبت) (.+?)[؟?]?$/)
    if (m) {
      const term = m[1].replace(/^(the|some)\s+/, '').replace(/^ال(?=\S{3,})/, '')
      const bought = items.filter((i) => i.done && i.done_at && i.name.toLowerCase().includes(term)).sort((a, b) => b.done_at!.localeCompare(a.done_at!))
      if (!bought.length) return { big: '—', unit: t('not yet'), text: t('I can’t find {term} checked off on any list yet.', { term }), offer: term }
      const d = daysAgo(bought[0].done_at!)
      return { big: String(d), unit: d === 1 ? t('day ago') : t('days ago'), text: `${new Date(bought[0].done_at!).toLocaleDateString(LOC, { weekday: 'long', day: 'numeric', month: 'long' })}.`, offer: term }
    }
    m = s.match(/what(?:'s| is) (?:on |free )?(today|tomorrow|this week)/)
    const arTomorrow = /بكر[اة]|غدا|غداً/.test(s)
    if (m || /my (day|week)|summari[sz]e/.test(s) || /شو عندي|ماذا لدي|ايش عندي|لخص|ملخص|أسبوعي|اسبوعي|اليوم|بكر[اة]|غدا/.test(s)) {
      const span = m?.[1] === 'tomorrow' || arTomorrow ? [addDays(startOfDay(new Date()), 1), addDays(startOfDay(new Date()), 2)] : /week|أسبوع|اسبوع/.test(s) ? [startOfDay(new Date()), addDays(startOfDay(new Date()), 7)] : [startOfDay(new Date()), addDays(startOfDay(new Date()), 1)]
      const evs = events.filter((e) => new Date(e.starts_at) >= span[0] && new Date(e.starts_at) < span[1])
      const open = reminders.filter((r) => !r.done).length
      return { big: String(evs.length), unit: evs.length === 1 ? t('event') : t('events'), text: (evs.length ? evs.slice(0, 4).map((e) => t('{title} at {time}', { title: e.title, time: hm(e.starts_at) }) + (sameDay(new Date(e.starts_at), new Date()) ? '' : ' ' + t('on {day}', { day: new Date(e.starts_at).toLocaleDateString(LOC, { weekday: 'long' }) }))).join(isAr ? '، ' : ', ') + '. ' : t('Nothing scheduled.') + ' ') + t('Open tasks: {n}.', { n: open }) }
    }
    return null
  }, [asked, items, events, reminders])

  const hits: Hit[] = useMemo(() => {
    const term = (asked || q).trim().toLowerCase().replace(/^(when did i (last )?(buy|get)|find|where is|where's|search)\s+/, '').replace(/[?.!]/g, '').replace(/^(the|my)\s+/, '')
    if (term.length < 2) return []
    const out: Hit[] = []
    for (const it of items) if (it.name.toLowerCase().includes(term)) {
      const l = lists.find((x) => x.id === it.list_id)
      out.push({ kind: 'item', title: it.name + (it.qty ? `, ${it.qty}` : ''), meta: `${l?.title ?? t('List')} · ${it.done ? t('checked {date}', { date: new Date(it.done_at ?? it.created_at).toLocaleDateString(LOC, { day: 'numeric', month: 'short' }) }) : t('to buy')}`, to: '/lists', icon: 'bag', tone: 'var(--k-item)' })
    }
    for (const n of notes) if ((n.title + ' ' + n.body).toLowerCase().includes(term)) out.push({ kind: 'note', title: n.title, meta: t('Notes') + ' · ' + new Date(n.updated_at).toLocaleDateString(LOC, { day: 'numeric', month: 'short' }), to: `/note/${n.id}`, icon: 'pen', tone: 'var(--k-note)' })
    for (const e of events) if (e.title.toLowerCase().includes(term)) out.push({ kind: 'event', title: e.title, meta: new Date(e.starts_at).toLocaleDateString(LOC, { weekday: 'short', day: 'numeric', month: 'short' }) + ' · ' + hm(e.starts_at), to: '/calendar', icon: 'cal', tone: 'var(--k-event)' })
    for (const r of reminders) if (r.title.toLowerCase().includes(term)) out.push({ kind: 'reminder', title: r.title, meta: r.done ? t('Done') : t('Open'), to: '/', icon: 'bell', tone: 'var(--k-reminder)' })
    return out.slice(0, 8)
  }, [asked, q, items, lists, notes, events, reminders])

  const shopping = lists.find((l) => l.verb === 'buy')
  const listen = () => {
    if (!answer) return
    if (speaking) { stopSpeaking(); setSpeaking(false); return }
    setSpeaking(true)
    speak(`${answer.big} ${answer.unit}. ${answer.text}`, profile?.voice_style, () => setSpeaking(false))
  }

  return (
    <main className="screen col">
      <form className="row" onSubmit={(e) => { e.preventDefault(); setAsked(q); setAdded(false) }}>
        <label className="search grow">
          <span className="sr">{t('Search or ask')}</span>
          <I n="search" s={17} w={2.2} />
          <input autoFocus className="inp" placeholder={t('Ask or search everything')} value={q} onChange={(e) => setQ(e.target.value)} enterKeyHint="search" />
          <Link to="/listen" className="vorb" style={{ width: 32, height: 32, boxShadow: 'none' }} aria-label={t('Ask by voice')}><I n="mic" s={14} w={2.4} /></Link>
        </label>
        <Link to="/" className="lnk" style={{ fontWeight: 400, fontSize: 17, padding: '12px 0' }}>{t('Cancel')}</Link>
      </form>

      {asked && <div className="gl mt24" style={{ alignSelf: 'flex-end', maxWidth: '80%', borderRadius: '24px 24px 8px 24px', padding: '12px 16px', fontSize: 17, lineHeight: '23px' }}>{asked}</div>}

      {answer && (
        <div className="card mt12">
          <div className="spread">
            <span className="row" style={{ gap: 10 }}><span className="vorb" style={{ width: 32, height: 32, boxShadow: 'none' }} /><span style={{ fontSize: 15, fontWeight: 700 }}>{t('Tadween')}</span></span>
            <button className={speaking ? 'tag acc' : 'tag'} style={{ minHeight: 36 }} onClick={listen} aria-label={speaking ? t('Stop') : t('Read the answer out loud')}><I n="speaker" s={15} w={2.2} />{speaking ? t('Speaking…') : t('Listen')}</button>
          </div>
          <div className="row mt16" style={{ alignItems: 'baseline', gap: 10 }}>
            <span className="num" style={{ fontSize: 54, lineHeight: '56px', fontWeight: 300, letterSpacing: -2, color: 'var(--acc)' }}>{answer.big}</span>
            <span className="ttl">{answer.unit}</span>
          </div>
          <p className="sub mt8" style={{ fontSize: 16, lineHeight: '24px' }}>{answer.text}</p>
          {'offer' in answer && answer.offer && shopping && (added
            ? <div role="status" className="btn mt16" style={{ background: 'var(--s2)', fontSize: 15 }}><I n="check" s={16} w={3} />{t('Added to {list}', { list: shopping.title })}</div>
            : <button className="btn pri mt16" onClick={async () => { await addItem(shopping.id, answer.offer!.charAt(0).toUpperCase() + answer.offer!.slice(1), null, null); setAdded(true) }}>{t('Add to {list}', { list: shopping.title })}</button>)}
        </div>
      )}

      {hits.length > 0 && <>
        <p className="cap" style={{ margin: '24px 8px 10px' }}>{answer ? t('Found in') : t('Results')}</p>
        <div className="card flush">
          {hits.map((h, i) => (
            <Link key={i} to={h.to} className="rw">
              <span className="ib sm" style={{ background: h.tone, color: '#16232A', boxShadow: 'none' }}><I n={h.icon} s={17} /></span>
              <span className="grow" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><span style={{ fontSize: 16, fontWeight: 600 }}>{h.title}</span><span className="sub" style={{ fontSize: 13, lineHeight: '18px' }}>{h.meta}</span></span>
              <I n="arrow" s={14} w={2.2} />
            </Link>
          ))}
        </div>
      </>}

      {asked && !answer && !hits.length && <div className="card empty mt16"><span className="ttl">{t('No matches')}</span><span className="sub">{t('Try another word, or ask “what’s on today?”')}</span></div>}

      <div className="mtauto" style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 24 }}>
        <p className="cap" style={{ margin: '0 8px' }}>{t('Try asking')}</p>
        <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
          {(isAr ? ['شو عندي اليوم؟', 'متى آخر مرة اشتريت رز؟', 'لخص أسبوعي'] : ['What’s on today?', 'When did I last buy rice?', 'Summarize my week']).map((s) => <button key={s} className="chip" onClick={() => { setQ(s); setAsked(s); setAdded(false) }}>{s}</button>)}
        </div>
      </div>
    </main>
  )
}
