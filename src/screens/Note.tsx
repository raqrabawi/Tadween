import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { understand } from '../lib/parse'
import { speak, stopSpeaking, useListener, canListen } from '../lib/voice'
import { I } from '../components/Icon'
import { Toast } from '../components/ui'

export default function NoteScreen() {
  const { id } = useParams()
  const nav = useNavigate()
  const { notes, saveNote, deleteNote, saveDrafts, profile } = useStore()
  const existing = notes.find((n) => n.id === id)
  const [sp] = useSearchParams()
  const kind = existing?.kind ?? (sp.get('kind') === 'list' ? 'list' : 'note')
  const isList = kind === 'list'
  const [image, setImage] = useState<string | null>(existing?.image ?? null)
  const [newItem, setNewItem] = useState('')
  const [noteId, setNoteId] = useState<string | undefined>(existing?.id)
  const [title, setTitle] = useState(existing?.title ?? '')
  const [body, setBody] = useState(existing?.body ?? '')
  const [toast, setToast] = useState<string | null>(null)
  const [reading, setReading] = useState(false)
  const [capsule, setCapsule] = useState<string>(existing?.opens_at?.slice(0, 10) ?? '')
  const dirty = useRef(false)
  const dictate = useListener()

  useEffect(() => { if (existing && !dirty.current) { setTitle(existing.title); setBody(existing.body); setNoteId(existing.id); setImage(existing.image ?? null) } }, [existing])

  // Append dictated text to the body as it finalises
  const lastFinal = useRef('')
  useEffect(() => {
    if (dictate.finalText && dictate.finalText !== lastFinal.current) {
      const add = dictate.finalText.slice(lastFinal.current.length).trim()
      lastFinal.current = dictate.finalText
      if (add) { dirty.current = true; setBody((b) => (isList ? (b ? b + '\n' : '') + '[ ] ' + add : (b ? b.trimEnd() + ' ' : '') + add)) }
    }
  }, [dictate.finalText])

  // Autosave
  useEffect(() => {
    if (!dirty.current) return
    const t = setTimeout(async () => {
      const saved = await saveNote({ id: noteId, title: title.trim() || (isList ? 'List' : body.trim().split(/[.!?\n]/)[0].slice(0, 60)) || 'Untitled', body, kind, image, opens_at: capsule ? new Date(capsule).toISOString() : null })
      if (saved && !noteId) { setNoteId(saved.id); history.replaceState(null, '', `#/note/${saved.id}`) }
    }, 700)
    return () => clearTimeout(t)
  }, [title, body, capsule, image]) // eslint-disable-line react-hooks/exhaustive-deps

  const actions = useMemo(() => isList ? [] : understand(body).filter((d) => d.kind !== 'note'), [body])
  const summary = useMemo(() => {
    const s = body.split(/(?<=[.!?])\s+/).filter(Boolean)
    return !isList && s.length > 1 ? s[0] : ''
  }, [body]) // eslint-disable-line react-hooks/exhaustive-deps

  const lines = body ? body.split('\n') : []
  const setLines = (ls: string[]) => { dirty.current = true; setBody(ls.join('\n')) }
  const toggleLine = (i: number) => setLines(lines.map((l, j) => (j === i ? (l.startsWith('[x] ') ? '[ ] ' + l.slice(4) : '[x] ' + l.replace(/^\[ \] /, '')) : l)))
  const editLine = (i: number, v: string) => setLines(lines.map((l, j) => (j === i ? l.slice(0, 4) + v : l)))
  const dropLine = (i: number) => setLines(lines.filter((_, j) => j !== i))
  const addLine = () => { const v = newItem.trim(); if (!v) return; setLines([...lines, '[ ] ' + v]); setNewItem('') }

  const created = existing ? new Date(existing.created_at) : new Date()
  const locked = existing?.opens_at && new Date(existing.opens_at) > new Date()

  if (locked) {
    return (
      <main className="screen notab">
        <div className="hd"><Link to="/notes" className="ib" aria-label="Back to Notes"><I n="back" s={18} w={2.4} /></Link></div>
        <div className="card tone-lilac mt24 empty"><span className="ib"><I n="lock" /></span><span className="ttl">{existing.title}</span><span className="sub">This time capsule opens on {new Date(existing.opens_at!).toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' })}.</span></div>
      </main>
    )
  }

  return (
    <main className="screen notab" style={{ paddingBottom: 140 }}>
      <div className="hd">
        <Link to="/notes" className="ib" aria-label="Back to Notes"><I n="back" s={18} w={2.4} /></Link>
        <div className="row" style={{ gap: 8 }}>
          <button className={reading ? 'ib acc' : 'ib'} aria-label={reading ? 'Stop reading' : 'Read this note aloud'} onClick={() => { if (reading) { stopSpeaking(); setReading(false) } else { setReading(true); speak(`${title}. ${body}`, profile?.voice_style, () => setReading(false)) } }}><I n="speaker" s={18} /></button>
          {noteId && <button className="ib" aria-label="Delete note" onClick={async () => { if (confirm('Delete this note?')) { await deleteNote(noteId); nav('/notes') } }}><I n="trash" s={18} /></button>}
          {'share' in navigator && <button className="ib" aria-label="Share" onClick={() => navigator.share({ title, text: body }).catch(() => undefined)}><I n="share" s={18} /></button>}
        </div>
      </div>

      <p className="cap" style={{ margin: '24px 4px 6px' }}>{created.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })} · {created.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
      <label className="sr" htmlFor="ntitle">Title</label>
      <input id="ntitle" className="inp h1" style={{ fontSize: 30, lineHeight: '38px', margin: '0 4px', fontWeight: 700 }} placeholder="Title" value={title} onChange={(e) => { dirty.current = true; setTitle(e.target.value) }} />

      {(summary || actions.length > 0) && (
        <div className="card hot mt16">
          <div className="row" style={{ gap: 10 }}><span className="ib sm"><I n="spark" s={16} /></span><span style={{ fontSize: 15, fontWeight: 700 }}>Tadween summary</span>{actions.length > 0 && <span className="sub" style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700 }}>{actions.length} action{actions.length > 1 ? 's' : ''} found</span>}</div>
          {summary && <p className="mt12" style={{ fontSize: 16, lineHeight: '23px', fontWeight: 500 }}>{summary}</p>}
          {actions.length > 0 && <button className="tag mt12" onClick={async () => { const n = await saveDrafts(actions); setToast(`${n} ${n === 1 ? 'item' : 'items'} added from this note`) }}><I n="plus" s={14} w={2.6} />Add {actions.length} to calendar & lists</button>}
        </div>
      )}

      {image && (
        <div className="mt16" style={{ position: 'relative', margin: '16px 4px 0' }}>
          <img className="nimg" src={image} alt={title || 'Photo'} />
          <button className="ib sm" style={{ position: 'absolute', top: 10, right: 10 }} aria-label="Remove photo" onClick={() => { dirty.current = true; setImage(null) }}><I n="close" s={14} w={2.6} /></button>
        </div>
      )}

      {isList ? (
        <div className="mt16" style={{ margin: '16px 4px 0' }} role="list" aria-label="List items">
          {lines.map((l, i) => {
            const done = l.startsWith('[x] ')
            return (
              <div key={i} className="ckrow" role="listitem">
                <button className={done ? 'ck on' : 'ck'} onClick={() => toggleLine(i)} aria-label={`${done ? 'Untick' : 'Tick'} ${l.slice(4)}`}><span>{done && <I n="check" s={14} w={3} />}</span></button>
                <input className="inp" style={{ fontSize: 17, textDecoration: done ? 'line-through' : undefined, color: done ? 'var(--ink3)' : undefined }} value={l.replace(/^\[[ x]\] /, '')} onChange={(e) => editLine(i, e.target.value)} aria-label="Item" />
                <button className="ib sm" style={{ background: 'transparent' }} aria-label={`Remove ${l.slice(4)}`} onClick={() => dropLine(i)}><I n="close" s={13} w={2.4} /></button>
              </div>
            )
          })}
          <form className="ckrow" onSubmit={(e) => { e.preventDefault(); addLine() }}>
            <span className="ck" aria-hidden="true" style={{ opacity: .5 }}><I n="plus" s={14} w={2.6} /></span>
            <label className="sr" htmlFor="nitem">New item</label>
            <input id="nitem" autoFocus={!lines.length} className="inp" style={{ fontSize: 17 }} placeholder="Add item" value={newItem} onChange={(e) => setNewItem(e.target.value)} onBlur={addLine} enterKeyHint="next" />
          </form>
        </div>
      ) : (
        <>
          <label className="sr" htmlFor="nbody">Note</label>
          <textarea id="nbody" className="inp mt16" rows={image ? 5 : 12} style={{ fontSize: 18, lineHeight: '28px', margin: '0 4px', width: 'calc(100% - 8px)' }} placeholder={image ? 'Add a caption or a thought…' : 'Start writing, or tap the mic and talk…'} value={body} onChange={(e) => { dirty.current = true; setBody(e.target.value) }} />
        </>
      )}

      <div className="form mt16"><label className="frow"><span className="fl" style={{ width: 'auto' }}>Time capsule</span><input type="date" className="inp" style={{ textAlign: 'right' }} value={capsule} onChange={(e) => { dirty.current = true; setCapsule(e.target.value) }} /></label></div>
      <p className="ffoot">Lock this note until a date. It stays hidden until then.</p>

      {toast && <Toast text={toast} onDone={() => setToast(null)} />}

      <div style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: 'calc(env(safe-area-inset-bottom,0px) + 18px)', width: 'min(448px, calc(100% - 32px))', display: 'flex', gap: 10, alignItems: 'center' }}>
        <div className="gl" style={{ flex: 1, height: 68, borderRadius: 34, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px 0 16px' }}>
          <span className="sub" style={{ fontSize: 13 }}>{dictate.listening ? 'Listening… keep talking' : noteId ? 'Saved' : 'Not saved yet'}</span>
          <Link to="/notes" className="tag acc" style={{ minHeight: 48, borderRadius: 24, padding: '0 20px', fontSize: 15, fontWeight: 700 }}>Done</Link>
        </div>
        {canListen() && (
          <button className="vorb" style={{ width: 68, height: 68, position: 'relative' }} aria-label={dictate.listening ? 'Stop dictation' : 'Dictate'} onClick={() => (dictate.listening ? dictate.stop() : dictate.start())}>
            {dictate.listening && <span className="ring" />}<I n={dictate.listening ? 'stop' : 'mic'} s={dictate.listening ? 18 : 24} />
          </button>
        )}
      </div>
    </main>
  )
}
