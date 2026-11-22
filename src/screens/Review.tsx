import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import { understandIn, describeWhen, type Scope } from '../lib/parse'
import { speak, stopSpeaking } from '../lib/voice'
import type { Draft } from '../lib/types'
import { I } from '../components/Icon'
import { Switch } from '../components/ui'

const meta = (d: Draft, listTitle?: string) => {
  switch (d.kind) {
    case 'event': return d.birthday
      ? { tone: 'lilac', icon: 'gift', kind: 'Birthday · every year', title: d.title, detail: d.start.toLocaleDateString([], { day: 'numeric', month: 'long' }) }
      : { tone: 'sky', icon: 'cal', kind: `Event · ${d.calendar}`, title: d.title, detail: describeWhen(d.start) + (d.location ? ` · ${d.location}` : '') }
    case 'reminder': return { tone: 'sand', icon: 'bell', kind: 'Reminder', title: d.title, detail: d.at ? describeWhen(d.at) : 'No time set' }
    case 'item': return { tone: 'mint', icon: 'bag', kind: listTitle ?? 'List', title: d.name, detail: d.qty ?? 'Added by voice' }
    case 'task': return { tone: 'moss', icon: 'check', kind: 'Task', title: d.title, detail: d.due ? describeWhen(d.due) : 'Anytime' }
    case 'note': return d.items
      ? { tone: 'lilac', icon: 'checklist', kind: 'Checklist note', title: d.title, detail: d.items.join(', ').slice(0, 60) }
      : { tone: 'lilac', icon: 'pen', kind: 'Note', title: d.title, detail: d.body.slice(0, 60) }
  }
}

export default function Review() {
  const loc = useLocation()
  const nav = useNavigate()
  const { saveDrafts, profile, lists, categories } = useStore()
  const st = (loc.state ?? {}) as { text?: string; scope?: Scope; listHint?: string; from?: Scope }
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

  const save = async () => {
    setBusy(true)
    const n = await saveDrafts(chosen)
    setBusy(false)
    if (profile?.speak_replies) speak(`Done. I saved ${n} ${n === 1 ? 'thing' : 'things'}.`, profile.voice_style)
    nav(back, { replace: true })
  }

  const readBack = () => {
    if (reading) { stopSpeaking(); setReading(false); return }
    const line = chosen.map((d) => { const m = meta(d, d.kind === 'item' ? listFor(d.listHint) : undefined); return `${m.kind}: ${m.title}, ${m.detail}` }).join('. ')
    setReading(true)
    speak(line || 'Nothing selected.', profile?.voice_style, () => setReading(false))
  }

  if (!text) {
    return (
      <main className="screen col">
        <div className="hd"><Link to="/" className="ib" aria-label="Close"><I n="close" s={15} w={2.6} /></Link></div>
        <div className="card empty mt24"><span className="ttl">Nothing to review</span><span className="sub">Tap the mic and say what you need.</span></div>
        <Link to="/listen" className="btn pri mtauto">Speak to Tadween<I n="mic" s={16} /></Link>
      </main>
    )
  }

  return (
    <main className="screen col">
      <div className="hd">
        <Link to={st.from && st.from !== 'all' ? `/listen?from=${st.from}` : '/listen'} className="ib wide"><I n="redo" s={17} w={2.2} />Say again</Link>
        <Link to={back} className="ib" aria-label="Cancel"><I n="close" s={15} w={2.6} /></Link>
      </div>

      <div className="spread" style={{ margin: '24px 4px 10px' }}>
        <span className="cap">You said</span>
        <button className={reading ? 'tag acc' : 'tag'} style={{ minHeight: 36 }} onClick={readBack} aria-label={reading ? 'Stop reading back' : 'Hear Tadween read this back'}><I n="speaker" s={15} w={2.2} />{reading ? 'Reading…' : 'Read back'}</button>
      </div>
      <p style={{ margin: '0 4px', fontSize: 22, lineHeight: '31px', fontWeight: 500, letterSpacing: -.4 }}>“{text}”</p>

      <div className="sec" style={{ marginTop: 24 }}><h2>{drafts.length ? (chosen.length === drafts.length ? `Tadween found ${drafts.length} ${drafts.length === 1 ? 'thing' : 'things'}` : `${chosen.length} of ${drafts.length} selected`) : 'Tadween didn’t catch anything'}</h2><span className="sub">Tap to include</span></div>

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
              <Switch on={on} onChange={() => setOff({ ...off, [i]: on })} label={`Include ${m.title}`} />
            </div>
          )
        })}
        {!drafts.length && <div className="card empty"><span className="sub">Try “dentist Monday at 5” or “add milk to groceries”.</span></div>}
      </div>

      <div className="stack mtauto" style={{ gap: 10, paddingTop: 24 }}>
        <button className="btn pri" disabled={!chosen.length || busy} onClick={save}>{busy ? 'Saving…' : chosen.length ? `Save ${chosen.length} ${chosen.length === 1 ? 'item' : 'items'}` : 'Nothing selected'}<I n="next" s={16} w={2.6} /></button>
        <Link to="/add" className="btn line"><I n="plus" s={15} w={2.4} />Add something else</Link>
      </div>
    </main>
  )
}
