import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import { understandIn, describeWhen, type Scope } from '../lib/parse'
import { speak, stopSpeaking } from '../lib/voice'
import type { Draft } from '../lib/types'
import { I } from '../components/Icon'
import { Switch, announce } from '../components/ui'
import { isAr, LOC, t } from '../lib/i18n'

const meta = (d: Draft, listTitle?: string) => {
  switch (d.kind) {
    case 'event': return d.birthday
      ? { tone: 'lilac', icon: 'gift', kind: t('Birthday · every year'), title: d.title, detail: d.start.toLocaleDateString(LOC, { day: 'numeric', month: 'long' }) }
      : { tone: 'sky', icon: 'cal', kind: t('Event') + ' · ' + t(d.calendar), title: d.title, detail: describeWhen(d.start) + (d.location ? ` · ${d.location}` : '') }
    case 'reminder': return { tone: 'sand', icon: 'bell', kind: t('Reminder'), title: d.title, detail: d.at ? describeWhen(d.at) : t('No time set') }
    case 'item': return { tone: 'mint', icon: 'bag', kind: listTitle ?? t('List'), title: d.name, detail: d.qty ?? t('Added by voice') }
    case 'task': return { tone: 'moss', icon: 'check', kind: t('Task'), title: d.title, detail: d.due ? describeWhen(d.due) : t('Any time') }
    case 'note': return d.items
      ? { tone: 'lilac', icon: 'checklist', kind: t('Checklist note'), title: d.title, detail: d.items.join(', ').slice(0, 60) }
      : { tone: 'lilac', icon: 'pen', kind: t('Note'), title: d.title, detail: d.body.slice(0, 60) }
  }
}

export default function Review() {
  const loc = useLocation()
  const nav = useNavigate()
  const { saveDrafts, profile, lists, categories } = useStore()
  const st = (loc.state ?? {}) as { text?: string; scope?: Scope; listHint?: string; from?: Scope; noteCategory?: string | null; auto?: boolean }
  const text = st.text ?? ''
  const back = st.from && st.from !== 'all' ? `/${st.from}` : '/'
  const drafts = useMemo(() => understandIn(text, st.scope ?? 'all', { listHint: st.listHint }), [text, st.scope, st.listHint])
  const [off, setOff] = useState<Record<number, boolean>>({})
  const [busy, setBusy] = useState(false)
  const [reading, setReading] = useState(false)
  const chosen = drafts.filter((_, i) => !off[i])
  // Which list a spoken item will go to (same rule the store uses when saving)
  const listFor = (hint?: string) => {
    const h = (hint ?? '').toLowerCase()
    const cat = categories.find((c) => h && c.name.toLowerCase() === h)
    return (lists.find((l) => h && l.title.toLowerCase().includes(h)) ?? (cat && lists.find((l) => l.category_id === cat.id)) ?? lists.find((l) => l.verb === 'buy') ?? lists[0])?.title
  }

  const save = async (quiet = false) => {
    setBusy(true)
    const n = await saveDrafts(chosen, { noteCategory: st.noteCategory })
    setBusy(false)
    if (!quiet && profile?.speak_replies) speak(t('Done. Saved: {n}.', { n }), profile.voice_style)
    announce(n ? t('Added: {n}', { n }) : t('Nothing was added'))
    nav(back, { replace: true })
  }

  // After Stop or release: say what will happen, then do it. "Change" pauses it into the normal review.
  const [auto, setAuto] = useState(!!st.auto && drafts.length > 0)
  const [left, setLeft] = useState(1)
  const spoken = useRef(false)
  const summary = useMemo(() => {
    const parts = drafts.map((d) => {
      const m = meta(d, d.kind === 'item' ? listFor(d.listHint) : undefined)
      return d.kind === 'item' ? t('{item} to {list}', { item: m.title, list: listFor(d.listHint) ?? t('your list') })
        : d.kind === 'event' ? (d.birthday ? '' : t('an event, ')) + `${m.title}, ${m.detail}`
        : d.kind === 'reminder' ? t('a reminder to {what}', { what: isAr ? m.title : m.title.toLowerCase() }) + (d.at ? `, ${m.detail}` : '')
        : d.kind === 'task' ? t('a task, {title}', { title: m.title }) : t('a note, {title}', { title: m.title })
    })
    return parts.length > 1 ? `${parts.slice(0, -1).join('; ')}; ${t('and')} ${parts[parts.length - 1]}` : parts[0] ?? ''
  }, [drafts]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!auto) { stopSpeaking(); return }
    let talking = !!profile?.speak_replies
    let timeUp = false
    const go = () => { if (!talking && timeUp) save(true) }
    if (talking && !spoken.current) { spoken.current = true; speak(t('Adding {what}.', { what: summary.replace(/ · /g, isAr ? ' ' : ' at ') }), profile?.voice_style, () => { talking = false; go() }) } else talking = false
    const start = Date.now(), ms = 3000
    const tick = setInterval(() => {
      const p = Math.max(0, 1 - (Date.now() - start) / ms)
      setLeft(p)
      if (p === 0) { clearInterval(tick); timeUp = true; go() }
    }, 50)
    // Never wait forever on speech
    const guard = setTimeout(() => { talking = false; go() }, 12000)
    return () => { clearInterval(tick); clearTimeout(guard) }
  }, [auto]) // eslint-disable-line react-hooks/exhaustive-deps

  const readBack = () => {
    if (reading) { stopSpeaking(); setReading(false); return }
    const line = chosen.map((d) => { const m = meta(d, d.kind === 'item' ? listFor(d.listHint) : undefined); return `${m.kind}: ${m.title}, ${m.detail}` }).join('. ')
    setReading(true)
    speak(line || t('Nothing selected.'), profile?.voice_style, () => setReading(false))
  }

  if (!text) {
    return (
      <main className="screen col">
        <div className="hd"><Link to="/" className="ib" aria-label={t('Close')}><I n="close" s={15} w={2.6} /></Link></div>
        <div className="card empty mt24"><span className="ttl">{t('Nothing to review')}</span><span className="sub">{t('Tap the mic and say what you need.')}</span></div>
        <Link to="/listen" className="btn pri mtauto">{t('Speak to Tadween')}<I n="mic" s={16} /></Link>
      </main>
    )
  }

  return (
    <main className="screen col">
      <div className="hd">
        <Link to={st.from && st.from !== 'all' ? `/listen?from=${st.from}` : '/listen'} className="ib wide"><I n="redo" s={17} w={2.2} />{t('Say again')}</Link>
        <Link to={back} className="ib" aria-label={t('Cancel')}><I n="close" s={15} w={2.6} /></Link>
      </div>

      {auto && (
        <div className="card hot mt16 autobar" role="status" aria-live="polite">
          <div className="row" style={{ gap: 10 }}>
            <I n="spark" s={16} />
            <span className="grow" style={{ fontSize: 15, fontWeight: 600 }}>{drafts.length === 1 ? t('Adding this now') : t('Adding these {n} now', { n: drafts.length })}</span>
            <button className="autobtn" onClick={() => setAuto(false)}>{t('Change')}</button>
            <button className="autobtn" aria-label={t('Cancel, don’t save')} onClick={() => { setAuto(false); stopSpeaking(); nav(back, { replace: true }) }}><I n="close" s={12} w={2.8} /></button>
          </div>
          <span aria-hidden="true" className="autoprog"><span style={{ width: `${(1 - left) * 100}%` }} /></span>
        </div>
      )}

      <div className="spread" style={{ margin: '24px 4px 10px' }}>
        <span className="cap">{t('You said')}</span>
        <button className={reading ? 'tag acc' : 'tag'} style={{ minHeight: 36 }} onClick={readBack} aria-label={reading ? t('Stop reading back') : t('Hear Tadween read this back')}><I n="speaker" s={15} w={2.2} />{reading ? t('Reading…') : t('Read back')}</button>
      </div>
      <p style={{ margin: '0 4px', fontSize: 22, lineHeight: '31px', fontWeight: 500, letterSpacing: -.4 }}>“{text}”</p>

      <div className="sec" style={{ marginTop: 24 }}><h2>{drafts.length ? (chosen.length === drafts.length ? `Tadween found ${drafts.length} ${drafts.length === 1 ? 'thing' : 'things'}` : `${chosen.length} of ${drafts.length} selected`) : 'Tadween didn’t catch anything'}</h2><span className="sub">{t('Tap to include')}</span></div>

      <div className="stack" style={{ gap: 10 }}>
        {drafts.map((d, i) => {
          const m = meta(d, d.kind === 'item' ? listFor(d.listHint) : undefined)
          const on = !off[i]
          return (
            <div key={i} className={`card tight tone-${m.tone}`} style={{ display: 'flex', alignItems: 'center', gap: 14, opacity: on ? 1 : .45, transition: 'opacity .2s' }}>
              <span className="ib" style={{ width: 52, height: 52, borderRadius: 18 }}><I n={m.icon} s={22} /></span>
              <span className="grow" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span className="cap">{m.kind}</span>
                <span className="ttl" style={{ fontSize: 17, lineHeight: '22px' }}>{m.title}</span>
                <span className="sub" style={{ fontSize: 13, lineHeight: '18px' }}>{m.detail}</span>
              </span>
              <Switch on={on} onChange={() => { setAuto(false); setOff({ ...off, [i]: on }) }} label={t('Include {title}', { title: m.title })} />
            </div>
          )
        })}
        {!drafts.length && <div className="card empty"><span className="sub">{t('Try “dentist Monday at 5” or “add milk to groceries”.')}</span></div>}
      </div>

      <div className="stack mtauto" style={{ gap: 10, paddingTop: 24, visibility: auto ? 'hidden' : undefined }}>
        <button className="btn pri" disabled={!chosen.length || busy} onClick={() => save()}>{busy ? t('Saving…') : chosen.length ? t('Save {n}', { n: chosen.length }) : t('Nothing selected')}<I n="next" s={16} w={2.6} /></button>
        <Link to="/add" className="btn line"><I n="plus" s={15} w={2.4} />{t('Add something else')}</Link>
      </div>
    </main>
  )
}
