import { InviteSheet } from '../components/InviteSheet'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { understand } from '../lib/parse'
import { speak, stopSpeaking, useListener, canListen } from '../lib/voice'
import { I } from '../components/Icon'
import { Toast } from '../components/ui'
import { LOC, t } from '../lib/i18n'

export default function NoteScreen() {
  const { id } = useParams()
  const nav = useNavigate()
  const { notes, saveNote, deleteNote, saveDrafts, profile, noteCategories, roleFor } = useStore()
  const existing = notes.find((n) => n.id === id)
  // Notes shared with me: 'view' is read only, 'edit' can change the text but not its category or capsule
  const role = existing ? roleFor('note', existing) : 'owner'
  const ro = role === 'view', owner = role === 'owner'
  const [inviting, setInviting] = useState(false)
  const [sp] = useSearchParams()
  const kind = existing?.kind ?? (sp.get('kind') === 'list' ? 'list' : 'note')
  const isList = kind === 'list'
  const [image, setImage] = useState<string | null>(existing?.image ?? null)
  const [catId, setCatId] = useState<string>(existing?.category_id ?? sp.get('cat') ?? '')
  const [newItem, setNewItem] = useState('')
  const [noteId, setNoteId] = useState<string | undefined>(existing?.id)
  const [title, setTitle] = useState(existing?.title ?? '')
  const [body, setBody] = useState(existing?.body ?? '')
  const [toast, setToast] = useState<string | null>(null)
  const [reading, setReading] = useState(false)
  const [capsule, setCapsule] = useState<string>(existing?.opens_at?.slice(0, 10) ?? '')
  const dirty = useRef(false)
  const dictate = useListener()

  useEffect(() => { if (existing && !dirty.current) { setTitle(existing.title); setBody(existing.body); setNoteId(existing.id); setImage(existing.image ?? null); setCatId(existing.category_id ?? '') } }, [existing])

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
    const tm = setTimeout(async () => {
      if (ro) return
      const base = { id: noteId, title: title.trim() || (isList ? t('List') : body.trim().split(/[.!?\n]/)[0].slice(0, 60)) || t('Untitled'), body, kind, image }
      const saved = await saveNote(owner ? { ...base, category_id: catId || null, opens_at: capsule ? new Date(capsule).toISOString() : null } : base)
      if (saved && !noteId) { setNoteId(saved.id); history.replaceState(null, '', `#/note/${saved.id}`) }
    }, 700)
    return () => clearTimeout(tm)
  }, [title, body, capsule, image, catId]) // eslint-disable-line react-hooks/exhaustive-deps

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
        <div className="hd"><Link to="/notes" className="ib" aria-label={t('Back to Notes')}><I n="back" s={18} w={2.4} /></Link></div>
        <div className="card tone-lilac mt24 empty"><span className="ib"><I n="lock" /></span><span className="ttl">{existing.title}</span><span className="sub">{t('This time capsule opens on {date}.', { date: new Date(existing.opens_at!).toLocaleDateString(LOC, { day: 'numeric', month: 'long', year: 'numeric' }) })}</span></div>
      </main>
    )
  }

  return (
    <main className="screen notab" style={{ paddingBottom: 140 }}>
      <div className="hd">
        <Link to="/notes" className="ib" aria-label={t('Back to Notes')}><I n="back" s={18} w={2.4} /></Link>
        <div className="row" style={{ gap: 8 }}>
          <button className={reading ? 'ib acc' : 'ib'} aria-label={reading ? t('Stop reading') : t('Read this note aloud')} onClick={() => { if (reading) { stopSpeaking(); setReading(false) } else { setReading(true); speak(`${title}. ${body}`, profile?.voice_style, () => setReading(false)) } }}><I n="speaker" s={18} /></button>
          {noteId && owner && <button className="ib" aria-label={t('Invite people')} onClick={() => setInviting(true)}><I n="people" s={18} /></button>}
          {noteId && owner && <button className="ib" aria-label={t('Delete note')} onClick={async () => { if (confirm(t('Delete this note?'))) { await deleteNote(noteId); nav('/notes') } }}><I n="trash" s={18} /></button>}
          {'share' in navigator && <button className="ib" aria-label={t('Share')} onClick={() => navigator.share({ title, text: body }).catch(() => undefined)}><I n="share" s={18} /></button>}
        </div>
      </div>

      <div className="row" style={{ margin: '20px 4px 0', gap: 8 }}>
        {!owner && <span className="tag"><I n="people" s={14} w={2.4} />{t(ro ? 'Shared with you · view only' : 'Shared with you · can edit')}</span>}
        {owner && <><label className="sr" htmlFor="ncat">{t('Category')}</label>
        <select id="ncat" className="tag" style={{ appearance: 'none', border: 0, height: 36, fontFamily: 'inherit', color: 'inherit' }} value={catId} onChange={(e) => { dirty.current = true; setCatId(e.target.value) }}>
          <option value="">{t('No category')}</option>
          {noteCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select></>}
      </div>
      <p className="cap" style={{ margin: '14px 4px 6px' }}>{created.toLocaleDateString(LOC, { weekday: 'short', day: 'numeric', month: 'short' })} · {created.toLocaleTimeString(LOC, { hour: '2-digit', minute: '2-digit' })}</p>
      <label className="sr" htmlFor="ntitle">{t('Title')}</label>
      <input id="ntitle" className="inp h1" style={{ fontSize: 30, lineHeight: '38px', margin: '0 4px', fontWeight: 700 }} placeholder={t('Title')} readOnly={ro} value={title} onChange={(e) => { dirty.current = true; setTitle(e.target.value) }} />

      {(summary || actions.length > 0) && (
        <div className="card hot mt16">
          <div className="row" style={{ gap: 10 }}><span className="ib sm"><I n="spark" s={16} /></span><span style={{ fontSize: 15, fontWeight: 700 }}>{t('Tadween summary')}</span>{actions.length > 0 && <span className="sub" style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700 }}>{t('Actions found: {n}', { n: actions.length })}</span>}</div>
          {summary && <p className="mt12" style={{ fontSize: 16, lineHeight: '23px', fontWeight: 500 }}>{summary}</p>}
          {actions.length > 0 && <button className="tag mt12" onClick={async () => { const n = await saveDrafts(actions); setToast(t('Added from this note: {n}', { n })) }}><I n="plus" s={14} w={2.6} />{t('Add {n} to calendar & lists', { n: actions.length })}</button>}
        </div>
      )}

      {image && (
        <div className="mt16" style={{ position: 'relative', margin: '16px 4px 0' }}>
          <img className="nimg" src={image} alt={title || t('Photo')} />
          {!ro && <button className="ib sm" style={{ position: 'absolute', top: 10, right: 10 }} aria-label={t('Remove photo')} onClick={() => { dirty.current = true; setImage(null) }}><I n="close" s={14} w={2.6} /></button>}
        </div>
      )}

      {isList ? (
        <div className="mt16" style={{ margin: '16px 4px 0' }} role="list" aria-label={t('List items')}>
          {lines.map((l, i) => {
            const done = l.startsWith('[x] ')
            return (
              <div key={i} className="ckrow" role="listitem">
                <button className={done ? 'ck on' : 'ck'} disabled={ro} onClick={() => toggleLine(i)} aria-label={t(done ? 'Untick {item}' : 'Tick {item}', { item: l.slice(4) })}><span>{done && <I n="check" s={14} w={3} />}</span></button>
                <input className="inp" style={{ fontSize: 17, textDecoration: done ? 'line-through' : undefined, color: done ? 'var(--ink3)' : undefined }} readOnly={ro} value={l.replace(/^\[[ x]\] /, '')} onChange={(e) => editLine(i, e.target.value)} aria-label={t('Item')} />
                {!ro && <button className="ib sm" style={{ background: 'transparent' }} aria-label={t('Remove {item}', { item: l.slice(4) })} onClick={() => dropLine(i)}><I n="close" s={13} w={2.4} /></button>}
              </div>
            )
          })}
          {!ro && <form className="ckrow" onSubmit={(e) => { e.preventDefault(); addLine() }}>
            <span className="ck" aria-hidden="true" style={{ opacity: .5 }}><I n="plus" s={14} w={2.6} /></span>
            <label className="sr" htmlFor="nitem">{t('New item')}</label>
            <input id="nitem" autoFocus={!lines.length} className="inp" style={{ fontSize: 17 }} placeholder={t('Add item')} value={newItem} onChange={(e) => setNewItem(e.target.value)} onBlur={addLine} enterKeyHint="next" />
          </form>}
        </div>
      ) : (
        <>
          <label className="sr" htmlFor="nbody">{t('Note')}</label>
          <textarea id="nbody" className="inp mt16" rows={image ? 5 : 12} style={{ fontSize: 18, lineHeight: '28px', margin: '0 4px', width: 'calc(100% - 8px)' }} placeholder={image ? t('Add a caption or a thought…') : t('Start writing, or tap the mic and talk…')} readOnly={ro} value={body} onChange={(e) => { dirty.current = true; setBody(e.target.value) }} />
        </>
      )}

      {owner && <><div className="form mt16"><label className="frow"><span className="fl" style={{ width: 'auto' }}>{t('Time capsule')}</span><input type="date" className="inp" style={{ textAlign: 'end' }} value={capsule} onChange={(e) => { dirty.current = true; setCapsule(e.target.value) }} /></label></div>
      <p className="ffoot">{t('Lock this note until a date. It stays hidden until then.')}</p></>}
      {inviting && existing && <InviteSheet kind="note" item={existing} onClose={() => setInviting(false)} />}

      {toast && <Toast text={toast} onDone={() => setToast(null)} />}

      <div style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: 'calc(env(safe-area-inset-bottom,0px) + 18px)', width: 'min(448px, calc(100% - 32px))', display: 'flex', gap: 10, alignItems: 'center' }}>
        <div className="gl" style={{ flex: 1, height: 68, borderRadius: 34, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px 0 16px' }}>
          <span className="sub" style={{ fontSize: 13 }}>{ro ? t('View only') : dictate.listening ? t('Listening… keep talking') : noteId ? t('Saved') : t('Not saved yet')}</span>
          <Link to="/notes" className="tag acc" style={{ minHeight: 48, borderRadius: 24, padding: '0 20px', fontSize: 15, fontWeight: 700 }}>{t('Done')}</Link>
        </div>
        {canListen() && !ro && (
          <button className="vorb" style={{ width: 68, height: 68, position: 'relative' }} aria-label={dictate.listening ? t('Stop dictation') : t('Dictate')} onClick={() => (dictate.listening ? dictate.stop() : dictate.start())}>
            {dictate.listening && <span className="ring" />}<I n={dictate.listening ? 'stop' : 'mic'} s={dictate.listening ? 18 : 24} />
          </button>
        )}
      </div>
    </main>
  )
}
