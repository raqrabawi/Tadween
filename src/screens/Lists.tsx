import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { useLongPress } from '../lib/longpress'
import type { List } from '../lib/types'
import { I } from '../components/Icon'
import { PageSkeleton } from '../components/Skeleton'
import { Tabs } from '../components/Tabs'
import { CategoryAdd } from '../components/CategoryAdd'
import { Avatar, Sheet, Switch, announce } from '../components/ui'
import { Fab } from '../components/Fab'
import { InviteSheet } from '../components/InviteSheet'
import { t } from '../lib/i18n'


function ListCard({ list, onActions, catName }: { list: List; onActions: (l: List) => void; catName?: string }) {
  const { items, members, addItem, toggleItem, resetDone, memberFor, roleFor } = useStore()
  // Lists someone shared with me as view only can't be changed
  const role = roleFor('list', list)
  const readOnly = role === 'view'
  const [open, setOpen] = useState(true)
  const [draft, setDraft] = useState('')
  const mine = items.filter((i) => i.list_id === list.id)
  const todo = mine.filter((i) => !i.done)
  const done = mine.length - todo.length
  const shared = !!list.family_id
  const others = members.filter((m) => m.family_id === list.family_id)
  const groups: Record<string, typeof todo> = {}
  for (const it of todo) (groups[shared && list.verb === 'buy' ? it.aisle ?? '' : ''] ??= []).push(it)

  const lp = useLongPress(() => onActions(list))
  const submit = async () => {
    const name = draft.trim()
    if (!name) return
    setDraft('')
    await addItem(list.id, name, null, list.verb === 'buy' ? 'Other' : null)
  }

  // Progress ring: how much of the list is ticked off
  const pct = mine.length ? done / mine.length : 0
  const R = 15, C = 2 * Math.PI * R

  return (
    <section className={`card lcard tone-${list.tone}`} aria-label={t(list.title)}>
      <div className="lc-head">
        <button className="lc-main lp" {...lp.handlers} onClick={() => { if (lp.fired.current) { lp.fired.current = false; return } setOpen(!open) }} aria-expanded={open} aria-description={t('Long press for more actions')}>
          <span className="lc-ring" aria-hidden="true">
            <svg viewBox="0 0 36 36" width="40" height="40"><circle cx="18" cy="18" r={R} className="lc-track" />{pct > 0 && <circle cx="18" cy="18" r={R} className="lc-fill" strokeDasharray={`${pct * C} ${C}`} />}</svg>
            <b className="num">{todo.length}</b>
          </span>
          <span className="lc-txt">
            <span className="lc-title">{t(list.title)}</span>
            <span className="lc-meta">
              {todo.length ? (list.verb === 'buy' ? t('To buy: {n}', { n: todo.length }) : t('To do: {n}', { n: todo.length })) : mine.length ? t('All done') : t('Empty')}
              {catName ? ` · ${catName}` : ''}
              {shared && <> · <I n="people" s={12} w={2.4} /> {others.length || ''}</>}
              {role !== 'owner' && !shared && <> · <I n="people" s={12} w={2.4} /> {t(readOnly ? 'View only' : 'Shared with you')}</>}
            </span>
          </span>
          <I n="down" s={14} w={2.6} className={'lc-fold' + (open ? ' on' : '')} />
        </button>
        <button className="lc-more" onClick={() => onActions(list)} aria-label={t('More actions for {title}', { title: list.title })}><I n="more" s={16} w={2.6} /></button>
      </div>

      {open && (
        <div className="lc-body">
          {Object.entries(groups).map(([aisle, its]) => (
            <div key={aisle || 'all'}>
              {aisle && <p className="lc-aisle">{t(aisle)}</p>}
              {its.map((it) => {
                const by = memberFor(it.added_by)
                return (
                  <div key={it.id} className="lc-item">
                    {readOnly ? <span className="ck" aria-hidden="true"><span /></span> : <button className="ck" onClick={() => toggleItem(it)} aria-label={t('Check off {name}', { name: it.name })}><span /></button>}
                    <span className="grow lc-name">{it.name}{it.qty && <small>{it.qty}</small>}</span>
                    {shared && by && <Avatar name={by.name} color={by.color} size={22} />}
                  </div>
                )
              })}
            </div>
          ))}

          {!readOnly && <form className="lc-add" onSubmit={(e) => { e.preventDefault(); submit() }}>
            <I n="plus" s={16} w={2.4} />
            <label className="sr" htmlFor={`add-${list.id}`}>{t('Add item to {title}', { title: list.title })}</label>
            <input id={`add-${list.id}`} className="inp" placeholder={t('Add item — type or say it')} value={draft} onChange={(e) => setDraft(e.target.value)} enterKeyHint="done" />
            {draft.trim() ? <button className="tag acc" type="submit">{t('Add')}</button>
              : <Link to="/listen?from=lists" onClick={() => { try { sessionStorage.setItem('tadween-list', list.title) } catch { /* ignore */ } }} className="lc-mic" aria-label={t('Add to {title} by voice', { title: list.title })}><I n="mic" s={15} /></Link>}
          </form>}

          {done > 0 && (
            <div className="lc-done">
              <span><I n="check" s={13} w={3} /> {done} {list.verb === 'buy' ? t('in the cart') : t('done')}</span>
              {!readOnly && <button onClick={() => resetDone(list.id)}>{t('Undo all')}</button>}
            </div>
          )}
        </div>
      )}
    </section>
  )
}

import { SHOW_ALL_TAB } from '../lib/flags'

export default function Lists() {
  const { categories, lists, items, addCategory, deleteCategory, renameCategory, addList, addItem, updateList, deleteList, firstLoad, roleFor } = useStore()
  const [invite, setInvite] = useState<List | null>(null)
  // 'all' shows every list; 'none' the lists with no category (used while the All tab is hidden)
  const [cat, setCat] = useState<string>('all')
  const [act, setAct] = useState<List | null>(null)
  // List options sheet: 'menu' shows the actions, 'edit' renames the list and sets its category
  const [actMode, setActMode] = useState<'menu' | 'edit'>('menu')
  const [editName, setEditName] = useState('')
  const [editCat, setEditCat] = useState('')
  const [listCat, setListCat] = useState<string>('')
  const [renaming, setRenaming] = useState(false)
  const [adding, setAdding] = useState(false)
  const [catName, setCatName] = useState('')
  const [newList, setNewList] = useState(false)
  const [listName, setListName] = useState('')
  const [listShared, setListShared] = useState(false)
  const [newItem, setNewItem] = useState(false)
  const [itemName, setItemName] = useState('')
  const [itemQty, setItemQty] = useState('')
  const [itemList, setItemList] = useState('')

  const current = categories.find((c) => c.id === cat) ?? null
  // Lists whose category is missing or deleted
  const loose = lists.filter((l) => !categories.some((c) => c.id === l.category_id))
  const ok = cat === 'all' ? SHOW_ALL_TAB : cat === 'none' ? !SHOW_ALL_TAB && loose.length > 0 : !!current
  // With the All tab hidden, fall back to the first category (or the loose lists)
  useEffect(() => { if (!ok) setCat(SHOW_ALL_TAB ? 'all' : categories[0]?.id ?? (loose.length ? 'none' : 'all')) }, [ok, categories, loose.length])
  // The mic uses this to put spoken items in the category you're looking at
  useEffect(() => { try { if (current) sessionStorage.setItem('tadween-cat', current.name); else sessionStorage.removeItem('tadween-cat') } catch { /* ignore */ } }, [current])
  const shown = cat === 'none' ? loose : current ? lists.filter((l) => l.category_id === current.id) : lists
  const catOf = (l: List) => { const n = categories.find((c) => c.id === l.category_id)?.name; return n ? t(n) : undefined }
  const openCount = (cid: string) => items.filter((i) => !i.done && lists.some((l) => l.id === i.list_id && l.category_id === cid)).length
  const totalOpen = items.filter((i) => !i.done).length

  const saveCat = async () => {
    const name = catName.trim() || t('New category')
    const c = await addCategory(name)
    setAdding(false); setCatName('')
    if (c) setCat(c.id)
  }
  const saveRename = async () => {
    const name = catName.trim()
    if (current && name && name !== t(current.name)) await renameCategory(current.id, name)
    setRenaming(false); setCatName('')
  }
  const removeCat = () => {
    if (!current || !confirm(t('Delete “{name}” and its lists?', { name: t(current.name) }))) return
    void deleteCategory(current.id); setCat('all')
  }
  const openNewList = () => { setListCat(current?.id ?? ''); setNewList(true) }
  const saveList = async () => {
    const c = categories.find((x) => x.id === listCat)
    await addList(c?.id ?? null, listName.trim() || (c ? t('{name} list', { name: c.name }) : t('New list')), { shared: listShared, verb: /grocer|shop|buy|market/i.test((c?.name ?? '') + listName) ? 'buy' : 'do' })
    setNewList(false); setListName(''); setListShared(false)
  }

  // Quick actions from a long press
  const shareList = async (l: List) => {
    const todo = items.filter((i) => i.list_id === l.id && !i.done).map((i) => `• ${i.qty ? `${i.qty} ` : ''}${i.name}`)
    const text = `${l.title}\n${todo.length ? todo.join('\n') : t('(nothing left)')}\n\n${t('From Tadween')}`
    try {
      if (typeof navigator.share === 'function') await navigator.share({ title: l.title, text })
      else { await navigator.clipboard.writeText(text); announce(t('List copied — paste it anywhere')) }
    } catch { /* closed the share sheet */ }
  }

  const openItem = () => {
    if (!shown.length) { setNewList(true); return }
    setItemList(shown[0].id); setNewItem(true)
  }
  const saveItem = async () => {
    const name = itemName.trim()
    const l = shown.find((x) => x.id === itemList) ?? shown[0]
    if (!name || !l) return
    await addItem(l.id, name, itemQty.trim() || null, l.verb === 'buy' ? 'Other' : null)
    setItemName(''); setItemQty('')
    setNewItem(false)
  }

  // First load after signing in on a new device: show the page's shape while data arrives
  if (firstLoad) return <PageSkeleton />

  return (
    <main className="screen">
      <div className="hd" style={{ minHeight: 60 }}>
        <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 4 }}>
          <span className="cap">{t('Lists: {n}', { n: lists.length })} · {t('Open: {n}', { n: totalOpen })}</span>
          <h1 className="h1">{t('Lists')}</h1>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <Link to="/settings" className="ib" aria-label={t('Settings')}><I n="gear" s={19} /></Link>
        </div>
      </div>

      <div className="rowhead">
        <span className="cap" id="cats-label">{t('Categories')}</span>
        <div className="cat-tools">
          <button className="ib sm" aria-label={t('Add category')} onClick={() => { setRenaming(false); setAdding(true) }}><I n="plus" s={15} w={2.4} /></button>
          <button className="ib sm" aria-label={current ? t('Rename category {name}', { name: current.name }) : t('Pick a category to rename')} disabled={!current} onClick={() => { if (!current) return; setAdding(false); setCatName(t(current.name)); setRenaming(true) }}><I n="pen" s={15} w={2.2} /></button>
          <button className="ib sm danger" aria-label={current ? t('Delete category {name}', { name: current.name }) : t('Pick a category to delete')} disabled={!current} onClick={removeCat}><I n="trash" s={15} w={2.2} /></button>
        </div>
      </div>
      <div className="tabs-wrap">
        <Tabs active={`${cat}|${adding}|${renaming}`} className="scroll" role="tablist" aria-labelledby="cats-label">
          {SHOW_ALL_TAB && <button role="tab" aria-selected={cat === 'all'} className={cat === 'all' ? 'chip on' : 'chip'} onClick={() => setCat('all')}>{t('All')}<span className="n">{lists.length}</span></button>}
          {categories.map((c) => (
            <button key={c.id} role="tab" aria-selected={c.id === current?.id} className={c.id === current?.id ? 'chip on' : 'chip'} onClick={() => setCat(c.id)}>{t(c.name)}<span className="n">{openCount(c.id)}</span></button>
          ))}
          {!SHOW_ALL_TAB && loose.length > 0 && <button role="tab" aria-selected={cat === 'none'} className={cat === 'none' ? 'chip on' : 'chip'} onClick={() => setCat('none')}>{t('No category')}<span className="n">{items.filter((i) => !i.done && loose.some((l) => l.id === i.list_id)).length}</span></button>}
        </Tabs>
        {adding && <CategoryAdd id="catname" value={catName} onChange={setCatName} onDone={saveCat} onCancel={() => { setAdding(false); setCatName('') }} />}
        {renaming && current && <CategoryAdd id="cat-rename" rename value={catName} onChange={setCatName} onDone={saveRename} onCancel={() => { setRenaming(false); setCatName('') }} />}
      </div>

      <div className="stack lc-stack mt16" role="tabpanel">
        {shown.map((l) => <ListCard key={l.id} list={l} onActions={(x) => { setActMode('menu'); setAct(x) }} catName={current || cat === 'none' ? undefined : catOf(l) ?? t('No category')} />)}
        {!shown.length && <div className="card empty"><span className="ttl">{current ? t('No lists in {name} yet', { name: current.name }) : t('No lists yet')}</span><span className="sub">{t('Make one, or just say “add milk to groceries”.')}</span></div>}
        {lists.length > 0 && <p className="sub" style={{ textAlign: 'center', fontSize: 13 }}>{t('Tip: press and hold a list for more actions.')}</p>}
        <button className="btn dash" style={{ height: 56, color: 'var(--ink2)', fontSize: 16 }} onClick={openNewList}><I n="plus" s={18} w={2.4} />{current ? t('New list in {name}', { name: current.name }) : t('New list')}</button>
      </div>

      {newItem && (
        <Sheet label={current ? t('New item in {name}', { name: current.name }) : t('New item')} onClose={() => setNewItem(false)}>
          <div className="hd3 mt12"><button className="ib" aria-label={t('Cancel')} onClick={() => setNewItem(false)}><I n="close" s={15} w={2.6} /></button><h1>{t('New item')}</h1><span /></div>
          <form onSubmit={(e) => { e.preventDefault(); saveItem() }}>
            <div className="form mt20">
              <label className="frow"><span className="fl">{t('Item')}</span><input autoFocus className="inp" placeholder={/grocer|shop/i.test(current?.name ?? '') ? t('e.g. Tomatoes') : t('e.g. Milk')} value={itemName} onChange={(e) => setItemName(e.target.value)} /></label>
              <label className="frow"><span className="fl">{t('Amount')}</span><input className="inp" placeholder={t('Optional')} value={itemQty} onChange={(e) => setItemQty(e.target.value)} /></label>
              {shown.length > 1 && <label className="frow"><span className="fl">{t('List')}</span><select className="inp" style={{ background: 'transparent' }} value={itemList} onChange={(e) => setItemList(e.target.value)}>{shown.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}</select></label>}
            </div>
            <p className="ffoot">{shown.length > 1 ? t('Adds to the list you pick.') : t('Adds to {title}.', { title: shown[0]?.title ?? '' })}</p>
            <button className="btn pri mt24" type="submit" disabled={!itemName.trim()}>{t('Add item')}<I n="next" s={16} w={2.6} /></button>
          </form>
        </Sheet>
      )}

      {newList && (
        <Sheet label={t('New list')} onClose={() => setNewList(false)}>
          <div className="hd3 mt12"><button className="ib" aria-label={t('Cancel')} onClick={() => setNewList(false)}><I n="close" s={15} w={2.6} /></button><h1>{t('New list')}</h1><span /></div>
          <div className="form mt20">
            <label className="frow"><span className="fl">{t('Name')}</span><input autoFocus className="inp" placeholder={t('e.g. Weekend BBQ')} value={listName} onChange={(e) => setListName(e.target.value)} /></label>
            <label className="frow"><span className="fl">{t('Category')}</span><select className="inp" style={{ background: 'transparent' }} value={listCat} onChange={(e) => setListCat(e.target.value)}><option value="">{t('No category')}</option>{categories.map((c) => <option key={c.id} value={c.id}>{t(c.name)}</option>)}</select></label>
            <div className="frow"><span className="grow" style={{ fontSize: 17 }}>{t('Share with family')}</span><Switch on={listShared} onChange={setListShared} label={t('Share with family')} /></div>
          </div>
          <p className="ffoot">{t('Category is optional — you can move the list later. Shared lists update for everyone in your family space.')}</p>
          <button className="btn pri mt24" onClick={saveList}>{t('Create list')}<I n="next" s={16} w={2.6} /></button>
        </Sheet>
      )}
      {act && (() => { const mineAct = roleFor('list', act) === 'owner'; return (
        <Sheet label={t('{title} actions', { title: act.title })} onClose={() => setAct(null)}>
          <div className="hd3 mt12"><button className="ib" aria-label={actMode === 'edit' ? t('Back') : t('Close')} onClick={() => (actMode === 'edit' ? setActMode('menu') : setAct(null))}><I n={actMode === 'edit' ? 'back' : 'close'} s={15} w={2.6} /></button><h1>{actMode === 'edit' ? t('Edit list') : act.title}</h1><span /></div>
          {actMode === 'menu' ? (
            <div className="qa mt20" role="menu" aria-label={t('{title} actions', { title: act.title })}>
              {mineAct && <button role="menuitem" className="qa-b" onClick={() => { setEditName(act.title); setEditCat(act.category_id ?? ''); setActMode('edit') }}><span className="qa-i"><I n="pen" s={22} /></span>{t('Edit')}</button>}
              <button role="menuitem" className="qa-b" onClick={() => { const l = act; setAct(null); shareList(l) }}><span className="qa-i"><I n="share" s={22} /></span>{t('Share')}</button>
              {mineAct && <button role="menuitem" className="qa-b" onClick={() => { const l = act; setAct(null); setInvite(l) }}><span className="qa-i"><I n="people" s={22} /></span>{t('Invite')}</button>}
              {mineAct && <button role="menuitem" className="qa-b danger" onClick={() => { const l = act; if (confirm(t('Delete “{title}” and its items?', { title: l.title }))) { deleteList(l.id); setAct(null); announce(t('List deleted')) } }}><span className="qa-i"><I n="trash" s={22} /></span>{t('Delete')}</button>}
            </div>
          ) : (
            <form onSubmit={async (e) => { e.preventDefault(); const title = editName.trim(); if (!title) return; await updateList(act.id, { title, category_id: editCat || null }); setAct(null); announce(t('List updated')) }}>
              <div className="form mt20">
                <label className="frow"><span className="fl">{t('Name')}</span><input autoFocus className="inp" value={editName} onChange={(e) => setEditName(e.target.value)} /></label>
                <label className="frow"><span className="fl">{t('Category')}</span><select className="inp" style={{ background: 'transparent' }} value={editCat} onChange={(e) => setEditCat(e.target.value)}><option value="">{t('No category')}</option>{categories.map((c) => <option key={c.id} value={c.id}>{t(c.name)}</option>)}</select></label>
              </div>
              <button className="btn pri mt24" type="submit" disabled={!editName.trim()}>{t('Save')}<I n="check" s={16} w={2.6} /></button>
            </form>
          )}
          {actMode === 'menu' && <p className="ffoot">{!mineAct ? t(roleFor('list', act) === 'view' ? 'Shared with you · view only.' : 'Shared with you · you can edit it.') : act.family_id ? t('This list is shared with your family.') : t('Invite people to view it or edit it with you.')}</p>}
        </Sheet>
      ) })()}
      {invite && <InviteSheet kind="list" item={invite} onClose={() => setInvite(null)} />}
      <Fab label={t('Add to lists')} actions={[
        { icon: 'plus', label: current ? t('Item in {name}', { name: current.name }) : t('New item'), onSelect: openItem },
        { icon: 'list', label: current ? t('New list in {name}', { name: current.name }) : t('New list'), onSelect: openNewList },
        { icon: 'folder', label: t('New category'), onSelect: () => { setAdding(true); window.scrollTo({ top: 0, behavior: 'smooth' }) } }
      ]} />
    </main>
  )
}
