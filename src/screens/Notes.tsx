import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import { I } from '../components/Icon'
import { PageSkeleton } from '../components/Skeleton'
import { Tabs } from '../components/Tabs'
import { CategoryAdd } from '../components/CategoryAdd'
import { Fab } from '../components/Fab'
import { pickPhoto } from '../lib/photo'
import { LOC, t } from '../lib/i18n'

const TONES = ['mint', 'sky', 'sand', 'lilac', 'moss']

export default function Notes() {
  const { notes, saveNote, noteCategories, addCategory, deleteCategory, renameCategory, firstLoad } = useStore()
  const nav = useNavigate()
  // null = All
  const [cat, setCat] = useState<string | null>(() => { try { return sessionStorage.getItem('tadween-notecat') || null } catch { return null } })
  const [renaming, setRenaming] = useState(false)
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
  const saveRename = async () => {
    const name = catName.trim()
    if (current && name && name !== t(current.name)) await renameCategory(current.id, name)
    setRenaming(false); setCatName('')
  }
  const removeCat = () => {
    if (!current || !confirm(t('Delete “{name}”? Its notes stay, under All.', { name: t(current.name) }))) return
    void deleteCategory(current.id); setCat(null)
  }
  const now = new Date()
  const shown = notes.filter((n) => !current || n.category_id === current.id)
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
        <Tabs active={`${current?.id ?? ''}|${adding}|${renaming}`} className="scroll" role="tablist" aria-labelledby="ncats-label">
          <button role="tab" aria-selected={!current} className={!current ? 'chip on' : 'chip'} onClick={() => setCat(null)}>{t('All')}<span className="n">{notes.length}</span></button>
          {noteCategories.map((c) => (
            <button key={c.id} role="tab" aria-selected={c.id === current?.id} className={c.id === current?.id ? 'chip on' : 'chip'} onClick={() => setCat(c.id)}>{t(c.name)}<span className="n">{countIn(c.id)}</span></button>
          ))}
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
