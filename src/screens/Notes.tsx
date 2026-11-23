import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import { I } from '../components/Icon'
import { Tabs } from '../components/Tabs'
import { Fab } from '../components/Fab'
import { pickPhoto } from '../lib/photo'
import { LOC, t } from '../lib/i18n'

const TONES = ['mint', 'sky', 'sand', 'lilac', 'moss']

export default function Notes() {
  const { notes, saveNote, noteCategories, addCategory, deleteCategory } = useStore()
  const nav = useNavigate()
  // null = All
  const [cat, setCat] = useState<string | null>(() => { try { return sessionStorage.getItem('tadween-notecat') || null } catch { return null } })
  const [editing, setEditing] = useState(false)
  const [adding, setAdding] = useState(false)
  const [catName, setCatName] = useState('')
  const current = noteCategories.find((c) => c.id === cat) ?? null
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
  const now = new Date()
  const shown = notes.filter((n) => !current || n.category_id === current.id)
  const countIn = (id: string) => notes.filter((n) => n.category_id === id).length
  const voiceCount = notes.filter((n) => n.kind === 'voice').length
  const cols: (typeof shown)[] = [[], []]
  shown.forEach((n, i) => cols[i % 2].push(n))

  return (
    <main className="screen">
      <div className="hd" style={{ minHeight: 60 }}>
        <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 4 }}>
          <span className="cap">{t('Notes: {n}', { n: notes.length })} · {t('Voice: {n}', { n: voiceCount })}</span>
          <h1 className="h1">{t('Notes')}</h1>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <button className={editing ? 'ib wide acc' : 'ib wide'} aria-pressed={editing} onClick={() => setEditing(!editing)}>{editing ? t('Done') : t('Edit')}</button>
          <Link to="/settings" className="ib" aria-label={t('Settings')}><I n="gear" s={19} /></Link>
        </div>
      </div>

      <div className="rowhead">
        <span className="cap" id="ncats-label">{t('Categories')}</span>
        {!adding && <button className="addmini" onClick={() => setAdding(true)}><I n="plus" s={13} w={2.6} />{t('Add category')}</button>}
      </div>
      <Tabs active={`${current?.id ?? ''}|${editing}|${adding}`} className="scroll" role="tablist" aria-labelledby="ncats-label">
        {!editing && <button role="tab" aria-selected={!current} className={!current ? 'chip on' : 'chip'} onClick={() => setCat(null)}>{t('All')}<span className="n">{notes.length}</span></button>}
        {noteCategories.map((c) => editing ? (
          <span key={c.id} className="chip" style={{ paddingRight: 10 }}>{t(c.name)}
            <button aria-label={t('Delete category {name}', { name: c.name })} onClick={() => { if (confirm(t('Delete “{name}”? Its notes stay, under All.', { name: c.name }))) { deleteCategory(c.id); if (cat === c.id) setCat(null) } }} style={{ width: 24, height: 24, borderRadius: 12, background: 'var(--red)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="10" height="10" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14" stroke="currentColor" strokeWidth="4" strokeLinecap="round" /></svg></button>
          </span>
        ) : (
          <button key={c.id} role="tab" aria-selected={c.id === current?.id} className={c.id === current?.id ? 'chip on' : 'chip'} onClick={() => setCat(c.id)}>{t(c.name)}<span className="n">{countIn(c.id)}</span></button>
        ))}
        {adding && (
          <form className="chip" style={{ width: 210, padding: '0 4px 0 18px', boxShadow: 'var(--edge), 0 0 0 2px var(--acc)' }} onSubmit={(e) => { e.preventDefault(); saveCat() }}>
            <label className="sr" htmlFor="ncatname">{t('Category name')}</label>
            <input id="ncatname" autoFocus className="inp" style={{ fontSize: 15 }} placeholder={t('Category name')} value={catName} onChange={(e) => setCatName(e.target.value)} />
            <button type="submit" className="ib sm acc" aria-label={t('Save category')}><I n="check" s={15} w={3} /></button>
          </form>
        )}
      </Tabs>

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
                  <Link key={n.id} to={`/note/${n.id}`} className={`card tight tone-${locked ? 'lilac' : tone}`} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span className="spread"><span className="cap">{locked ? t('Time capsule') : n.kind === 'voice' ? t('Voice') : n.kind === 'list' ? t('List') : n.kind === 'photo' ? t('Photo') : t('Note')}{!current && n.category_id && noteCategories.find((c) => c.id === n.category_id) ? ` · ${noteCategories.find((c) => c.id === n.category_id)!.name}` : ''}</span>{locked ? <I n="lock" s={15} /> : n.kind === 'voice' ? <I n="mic" s={15} /> : n.kind === 'list' ? <I n="checklist" s={15} /> : null}</span>
                    {!locked && n.image && <img className="nimg" src={n.image} alt="" style={{ maxHeight: 180 }} />}
                    <span className="ttl" style={{ fontSize: 17, lineHeight: '22px' }}>{n.title}</span>
                    {!locked && n.kind === 'list' && n.body && <span className="sub" style={{ fontSize: 13, lineHeight: '20px', whiteSpace: 'pre-line' }}>{n.body.split('\n').slice(0, 5).map((l) => l.replace(/^\[x\] /, '☑ ').replace(/^\[ \] /, '☐ ')).join('\n')}</span>}
                    {!locked && n.kind !== 'list' && n.body && <span className="sub" style={{ fontSize: 13, lineHeight: '19px', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{n.body}</span>}
                    <span className="cap" style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 500 }}>{locked ? t('Opens {date}', { date: new Date(n.opens_at!).toLocaleDateString(LOC, { day: 'numeric', month: 'short', year: 'numeric' }) }) : new Date(n.updated_at).toLocaleDateString(LOC, { day: 'numeric', month: 'short' })}</span>
                  </Link>
                )
              })}
            </div>
          ))}
        </div>
      )}
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
