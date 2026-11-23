import { useEffect, useState } from 'react'
import { useLongPress } from '../lib/longpress'
import type { Note } from '../lib/types'
import { Sheet, announce } from '../components/ui'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import { I } from '../components/Icon'
import { PageSkeleton } from '../components/Skeleton'
import { Tabs } from '../components/Tabs'
import { CategoryAdd } from '../components/CategoryAdd'
import { Fab } from '../components/Fab'
import { InviteSheet } from '../components/InviteSheet'
import { pickPhoto } from '../lib/photo'
import { LOC, t } from '../lib/i18n'

const TONES = ['mint', 'sky', 'sand', 'lilac', 'moss']

/** A note card: tap opens it, long press (or right-click) opens its options. */
function NoteCard({ note, className, onActions, children }: { note: Note; className: string; onActions: (n: Note) => void; children: React.ReactNode }) {
  const lp = useLongPress(() => onActions(note))
  return (
    <Link to={`/note/${note.id}`} className={className + ' lp'} style={{ display: 'flex', flexDirection: 'column', gap: 8 }} {...lp.handlers}
      onClick={(e) => { if (lp.fired.current) { e.preventDefault(); lp.fired.current = false } }} aria-description={t('Long press for more actions')}>
      {children}
    </Link>
  )
}

import { SHOW_ALL_TAB } from '../lib/flags'

export default function Notes() {
  const { notes, saveNote, deleteNote, noteCategories, addCategory, deleteCategory, renameCategory, firstLoad, roleFor } = useStore()
  const [invite, setInvite] = useState<Note | null>(null)
  // Note options sheet: 'menu' shows the actions, 'edit' renames the note and sets its category
  const [act, setAct] = useState<Note | null>(null)
  const [actMode, setActMode] = useState<'menu' | 'edit'>('menu')
  const [editName, setEditName] = useState('')
  const [editCat, setEditCat] = useState('')
  const shareNote = async (n: Note) => {
    const text = `${n.title}\n${n.body ?? ''}\n\n${t('From Tadween')}`
    try {
      if (typeof navigator.share === 'function') await navigator.share({ title: n.title, text })
      else { await navigator.clipboard.writeText(text); announce(t('Note copied — paste it anywhere')) }
    } catch { /* closed the share sheet */ }
  }
  const nav = useNavigate()
  // null = All; 'none' = notes with no category (used while the All tab is hidden)
  const [cat, setCat] = useState<string | null>(() => { try { return sessionStorage.getItem('tadween-notecat') || null } catch { return null } })
  const [renaming, setRenaming] = useState(false)
  const [adding, setAdding] = useState(false)
  const [catName, setCatName] = useState('')
  const current = noteCategories.find((c) => c.id === cat) ?? null
  // Notes whose category is missing or deleted
  const loose = notes.filter((n) => !noteCategories.some((c) => c.id === n.category_id))
  const ok = cat === null ? SHOW_ALL_TAB : cat === 'none' ? !SHOW_ALL_TAB && loose.length > 0 : !!current
  // With the All tab hidden, fall back to the first category (or the loose notes)
  useEffect(() => { if (!ok) setCat(SHOW_ALL_TAB ? null : noteCategories[0]?.id ?? (loose.length ? 'none' : null)) }, [ok, noteCategories, loose.length])
  // Voice and new notes go into the category on screen
  useEffect(() => { try { if (current) sessionStorage.setItem('tadween-notecat', current.id); else sessionStorage.removeItem('tadween-notecat') } catch { /* ignore */ } }, [current])
  const q = current ? `cat=${current.id}` : ''

  const addPhoto = async (source: 'camera' | 'gallery') => {
    const image = await pickPhoto(source)
    if (!image) return
    const n = await saveNote({ title: t('Photo'), kind: 'photo', image, category_id: current?.id ?? null })
    if (n) nav(`/note/${n.id}`)
  }
  const saveCat = async () => {
    const c = await addCategory(catName.trim() || t('New category'), 'notes')
    setAdding(false); setCatName('')
    if (c) setCat(c.id)
  }
  const saveRename = async () => {
    const name = catName.trim()
    if (current && name && name !== t(current.name)) await renameCategory(current.id, name)
    setRenaming(false); setCatName('')
  }
  const removeCat = () => {
    if (!current || !confirm(t(SHOW_ALL_TAB ? 'Delete “{name}”? Its notes stay, under All.' : 'Delete “{name}”? Its notes move to No category.', { name: t(current.name) }))) return
    void deleteCategory(current.id); setCat(null)
  }
  const now = new Date()
  const shown = cat === 'none' ? loose : notes.filter((n) => !current || n.category_id === current.id)
  const countIn = (id: string) => notes.filter((n) => n.category_id === id).length
  const voiceCount = notes.filter((n) => n.kind === 'voice').length
  const cols: (typeof shown)[] = [[], []]
  shown.forEach((n, i) => cols[i % 2].push(n))

  // First load after signing in on a new device: show the page's shape while data arrives
  if (firstLoad) return <PageSkeleton />

  return (
    <main className="screen">
      <div className="hd" style={{ minHeight: 60 }}>
        <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 4 }}>
          <span className="cap">{t('Notes: {n}', { n: notes.length })} · {t('Voice: {n}', { n: voiceCount })}</span>
          <h1 className="h1">{t('Notes')}</h1>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <Link to="/settings" className="ib" aria-label={t('Settings')}><I n="gear" s={19} /></Link>
        </div>
      </div>

      <div className="rowhead">
        <span className="cap" id="ncats-label">{t('Categories')}</span>
        <div className="cat-tools">
          <button className="ib sm" aria-label={t('Add category')} onClick={() => { setRenaming(false); setAdding(true) }}><I n="plus" s={15} w={2.4} /></button>
          <button className="ib sm" aria-label={current ? t('Rename category {name}', { name: current.name }) : t('Pick a category to rename')} disabled={!current} onClick={() => { if (!current) return; setAdding(false); setCatName(t(current.name)); setRenaming(true) }}><I n="pen" s={15} w={2.2} /></button>
          <button className="ib sm danger" aria-label={current ? t('Delete category {name}', { name: current.name }) : t('Pick a category to delete')} disabled={!current} onClick={removeCat}><I n="trash" s={15} w={2.2} /></button>
        </div>
      </div>
      <div className="tabs-wrap">
        <Tabs active={`${cat ?? ''}|${adding}|${renaming}`} className="scroll" role="tablist" aria-labelledby="ncats-label">
          {SHOW_ALL_TAB && <button role="tab" aria-selected={cat === null} className={cat === null ? 'chip on' : 'chip'} onClick={() => setCat(null)}>{t('All')}<span className="n">{notes.length}</span></button>}
          {noteCategories.map((c) => (
            <button key={c.id} role="tab" aria-selected={c.id === current?.id} className={c.id === current?.id ? 'chip on' : 'chip'} onClick={() => setCat(c.id)}>{t(c.name)}<span className="n">{countIn(c.id)}</span></button>
          ))}
          {!SHOW_ALL_TAB && loose.length > 0 && <button role="tab" aria-selected={cat === 'none'} className={cat === 'none' ? 'chip on' : 'chip'} onClick={() => setCat('none')}>{t('No category')}<span className="n">{loose.length}</span></button>}
        </Tabs>
        {adding && <CategoryAdd id="ncatname" value={catName} onChange={setCatName} onDone={saveCat} onCancel={() => { setAdding(false); setCatName('') }} />}
        {renaming && current && <CategoryAdd id="ncat-rename" rename value={catName} onChange={setCatName} onDone={saveRename} onCancel={() => { setRenaming(false); setCatName('') }} />}
      </div>

      {shown.length === 0 ? (
        <div className="card empty mt16"><span className="ttl">{current ? t('No notes in {name} yet', { name: t(current.name) }) : t('No notes yet')}</span><span className="sub">{t('Write or speak your first note.')}</span></div>
      ) : (
        <div className="grid2 mt16" style={{ alignItems: 'start' }}>
          {cols.map((col, ci) => (
            <div key={ci} className="stack">
              {col.map((n, i) => {
                const locked = n.opens_at && new Date(n.opens_at) > now
                const tone = TONES[(ci + i * 2) % TONES.length]
                return (
                  <NoteCard key={n.id} note={n} className={`card tight tone-${locked ? 'lilac' : tone}`} onActions={(x) => { setActMode('menu'); setAct(x) }}>
                    <span className="spread"><span className="cap">{locked ? t('Time capsule') : n.kind === 'voice' ? t('Voice') : n.kind === 'list' ? t('List') : n.kind === 'photo' ? t('Photo') : t('Note')}{!current && cat !== 'none' && n.category_id && noteCategories.find((c) => c.id === n.category_id) ? ` · ${noteCategories.find((c) => c.id === n.category_id)!.name}` : ''}{roleFor('note', n) !== 'owner' ? ` · ${t('Shared with you')}` : ''}</span>{locked ? <I n="lock" s={15} /> : n.kind === 'voice' ? <I n="mic" s={15} /> : n.kind === 'list' ? <I n="checklist" s={15} /> : null}</span>
                    {!locked && n.image && <img className="nimg" src={n.image} alt="" style={{ maxHeight: 180 }} />}
                    <span className="ttl" style={{ fontSize: 17, lineHeight: '22px' }}>{n.title}</span>
                    {!locked && n.kind === 'list' && n.body && <span className="sub" style={{ fontSize: 13, lineHeight: '20px', whiteSpace: 'pre-line' }}>{n.body.split('\n').slice(0, 5).map((l) => l.replace(/^\[x\] /, '☑ ').replace(/^\[ \] /, '☐ ')).join('\n')}</span>}
                    {!locked && n.kind !== 'list' && n.body && <span className="sub" style={{ fontSize: 13, lineHeight: '19px', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{n.body}</span>}
                    <span className="cap" style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 500 }}>{locked ? t('Opens {date}', { date: new Date(n.opens_at!).toLocaleDateString(LOC, { day: 'numeric', month: 'short', year: 'numeric' }) }) : new Date(n.updated_at).toLocaleDateString(LOC, { day: 'numeric', month: 'short' })}</span>
                  </NoteCard>
                )
              })}
            </div>
          ))}
        </div>
      )}
      {act && (() => { const mineAct = roleFor('note', act) === 'owner'; return (
        <Sheet label={t('{title} actions', { title: act.title })} onClose={() => setAct(null)}>
          <div className="hd3 mt12"><button className="ib" aria-label={actMode === 'edit' ? t('Back') : t('Close')} onClick={() => (actMode === 'edit' ? setActMode('menu') : setAct(null))}><I n={actMode === 'edit' ? 'back' : 'close'} s={15} w={2.6} /></button><h1>{actMode === 'edit' ? t('Edit note') : act.title}</h1><span /></div>
          {actMode === 'menu' ? (
            <div className="qa mt20" role="menu" aria-label={t('{title} actions', { title: act.title })}>
              {mineAct && <button role="menuitem" className="qa-b" onClick={() => { setEditName(act.title); setEditCat(act.category_id ?? ''); setActMode('edit') }}><span className="qa-i"><I n="pen" s={22} /></span>{t('Edit')}</button>}
              <button role="menuitem" className="qa-b" onClick={() => { const n = act; setAct(null); shareNote(n) }}><span className="qa-i"><I n="share" s={22} /></span>{t('Share')}</button>
              {mineAct && <button role="menuitem" className="qa-b" onClick={() => { const n = act; setAct(null); setInvite(n) }}><span className="qa-i"><I n="people" s={22} /></span>{t('Invite')}</button>}
              {mineAct && <button role="menuitem" className="qa-b danger" onClick={() => { const n = act; if (confirm(t('Delete “{title}”?', { title: n.title }))) { void deleteNote(n.id); setAct(null); announce(t('Note deleted')) } }}><span className="qa-i"><I n="trash" s={22} /></span>{t('Delete')}</button>}
            </div>
          ) : (
            <form onSubmit={async (e) => { e.preventDefault(); const title = editName.trim(); if (!title) return; await saveNote({ id: act.id, title, category_id: editCat || null }); setAct(null); announce(t('Note updated')) }}>
              <div className="form mt20">
                <label className="frow"><span className="fl">{t('Name')}</span><input autoFocus className="inp" value={editName} onChange={(e) => setEditName(e.target.value)} /></label>
                <label className="frow"><span className="fl">{t('Category')}</span><select className="inp" style={{ background: 'transparent' }} value={editCat} onChange={(e) => setEditCat(e.target.value)}><option value="">{t('No category')}</option>{noteCategories.map((c) => <option key={c.id} value={c.id}>{t(c.name)}</option>)}</select></label>
              </div>
              <button className="btn pri mt24" type="submit" disabled={!editName.trim()}>{t('Save')}<I n="check" s={16} w={2.6} /></button>
            </form>
          )}
          {actMode === 'menu' && <p className="ffoot">{mineAct ? t('Invite people to view it or edit it with you.') : t(roleFor('note', act) === 'view' ? 'Shared with you · view only.' : 'Shared with you · you can edit it.')}</p>}
        </Sheet>
      ) })()}
      {invite && <InviteSheet kind="note" item={invite} onClose={() => setInvite(null)} />}
      <Fab label={t('Add to notes')} actions={[
        { icon: 'text', label: t('Text note'), hint: current ? t('In {name}', { name: current.name }) : undefined, onSelect: () => nav(`/note/new?${q}`) },
        { icon: 'checklist', label: t('List'), hint: t('Tick items off'), onSelect: () => nav(`/note/new?kind=list&${q}`) },
        { icon: 'camera', label: t('Take a photo'), onSelect: () => addPhoto('camera') },
        { icon: 'image', label: t('From gallery'), onSelect: () => addPhoto('gallery') },
        { icon: 'folder', label: t('New category'), onSelect: () => { setAdding(true); window.scrollTo({ top: 0, behavior: 'smooth' }) } }
      ]} />
    </main>
  )
}
