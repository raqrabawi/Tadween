import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { haptic } from '../lib/a11y'
import type { List } from '../lib/types'
import { I } from '../components/Icon'
import { Tabs } from '../components/Tabs'
import { CategoryAdd } from '../components/CategoryAdd'
import { Avatar, Sheet, Switch, announce } from '../components/ui'
import { Fab } from '../components/Fab'
import { t } from '../lib/i18n'

/** Long press (or right-click) opens the list's quick actions; a normal tap still works. */
function useLongPress(onLong: () => void, ms = 480) {
  const timer = useRef<number | undefined>(undefined)
  const fired = useRef(false)
  const at = useRef({ x: 0, y: 0 })
  const clear = () => { window.clearTimeout(timer.current) }
  return {
    fired,
    handlers: {
      onPointerDown: (e: React.PointerEvent) => {
        fired.current = false; at.current = { x: e.clientX, y: e.clientY }
        timer.current = window.setTimeout(() => { fired.current = true; haptic(15); onLong() }, ms)
      },
      onPointerMove: (e: React.PointerEvent) => { if (Math.hypot(e.clientX - at.current.x, e.clientY - at.current.y) > 10) clear() },
      onPointerUp: clear, onPointerLeave: clear, onPointerCancel: clear,
      onContextMenu: (e: React.MouseEvent) => { e.preventDefault(); clear(); fired.current = true; onLong() }
    }
  }
}

function ListCard({ list, onActions, catName }: { list: List; onActions: (l: List) => void; catName?: string }) {
  const { items, members, addItem, toggleItem, resetDone, memberFor } = useStore()
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
            <svg viewBox="0 0 36 36" width="40" height="40"><circle cx="18" cy="18" r={R} className="lc-track" /><circle cx="18" cy="18" r={R} className="lc-fill" strokeDasharray={`${pct * C} ${C}`} /></svg>
            <b className="num">{todo.length || <I n="check" s={13} w={3} />}</b>
          </span>
          <span className="lc-txt">
            <span className="lc-title">{t(list.title)}</span>
            <span className="lc-meta">
              {todo.length ? (list.verb === 'buy' ? t('To buy: {n}', { n: todo.length }) : t('To do: {n}', { n: todo.length })) : t('All done')}
              {catName ? ` · ${catName}` : ''}
              {shared && <> · <I n="people" s={12} w={2.4} /> {others.length || ''}</>}
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
                    <button className="ck" onClick={() => toggleItem(it)} aria-label={t('Check off {name}', { name: it.name })}><span /></button>
                    <span className="grow lc-name">{it.name}{it.qty && <small>{it.qty}</small>}</span>
                    {shared && by && <Avatar name={by.name} color={by.color} size={22} />}
                  </div>
                )
              })}
            </div>
          ))}

          <form className="lc-add" onSubmit={(e) => { e.preventDefault(); submit() }}>
            <I n="plus" s={16} w={2.4} />
            <label className="sr" htmlFor={`add-${list.id}`}>{t('Add item to {title}', { title: list.title })}</label>
            <input id={`add-${list.id}`} className="inp" placeholder={t('Add item — type or say it')} value={draft} onChange={(e) => setDraft(e.target.value)} enterKeyHint="done" />
            {draft.trim() ? <button className="tag acc" type="submit">{t('Add')}</button>
              : <Link to="/listen?from=lists" onClick={() => { try { sessionStorage.setItem('tadween-list', list.title) } catch { /* ignore */ } }} className="lc-mic" aria-label={t('Add to {title} by voice', { title: list.title })}><I n="mic" s={15} /></Link>}
          </form>

          {done > 0 && (
            <div className="lc-done">
              <span><I n="check" s={13} w={3} /> {done} {list.verb === 'buy' ? t('in the cart') : t('done')}</span>
              <button onClick={() => resetDone(list.id)}>{t('Undo all')}</button>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

export default function Lists() {
  const { categories, lists, items, addCategory, deleteCategory, renameCategory, addList, addItem, updateList, deleteList, family, guest, setSavePrompt } = useStore()
  // 'all' shows every list, including ones with no category
  const [cat, setCat] = useState<string>('all')
  const [act, setAct] = useState<List | null>(null)
  const [moving, setMoving] = useState(false)
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
  useEffect(() => { if (cat !== 'all' && !current) setCat('all') }, [cat, current])
  // The mic uses this to put spoken items in the category you're looking at
  useEffect(() => { try { if (current) sessionStorage.setItem('tadween-cat', current.name); else sessionStorage.removeItem('tadween-cat') } catch { /* ignore */ } }, [current])
  const shown = current ? lists.filter((l) => l.category_id === current.id) : lists
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
  const inviteTo = async (l: List) => {
    if (guest) { setSavePrompt(true); return }
    if (!family) return
    if (!l.family_id) await updateList(l.id, { family_id: family.id })
    const link = window.location.origin + window.location.pathname
    const text = t('Join my “{title}” list on Tadween: open {link} , sign in, then Settings › Join a family with code {code}', { title: l.title, link, code: family.invite_code })
    try {
      if (typeof navigator.share === 'function') await navigator.share({ title: t('Join {title}', { title: l.title }), text })
      else { await navigator.clipboard.writeText(text); announce(t('Invite copied — send it to family')) }
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
        <Tabs active={`${current?.id ?? 'all'}|${adding}|${renaming}`} className="scroll" role="tablist" aria-labelledby="cats-label">
          <button role="tab" aria-selected={!current} className={!current ? 'chip on' : 'chip'} onClick={() => setCat('all')}>{t('All')}<span className="n">{lists.length}</span></button>
          {categories.map((c) => (
            <button key={c.id} role="tab" aria-selected={c.id === current?.id} className={c.id === current?.id ? 'chip on' : 'chip'} onClick={() => setCat(c.id)}>{t(c.name)}<span className="n">{openCount(c.id)}</span></button>
          ))}
        </Tabs>
        {adding && <CategoryAdd id="catname" value={catName} onChange={setCatName} onDone={saveCat} onCancel={() => { setAdding(false); setCatName('') }} />}
        {renaming && current && <CategoryAdd id="cat-rename" rename value={catName} onChange={setCatName} onDone={saveRename} onCancel={() => { setRenaming(false); setCatName('') }} />}
      </div>

      <div className="stack lc-stack mt16" role="tabpanel">
        {shown.map((l) => <ListCard key={l.id} list={l} onActions={(x) => { setMoving(false); setAct(x) }} catName={current ? undefined : catOf(l) ?? t('No category')} />)}
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
      {act && (
        <Sheet label={t('{title} actions', { title: act.title })} onClose={() => setAct(null)}>
          <div className="hd3 mt12"><button className="ib" aria-label={t('Close')} onClick={() => (moving ? setMoving(false) : setAct(null))}><I n={moving ? 'back' : 'close'} s={15} w={2.6} /></button><h1>{moving ? t('Move to category') : act.title}</h1><span /></div>
          {!moving ? (
            <div className="qa mt20" role="menu" aria-label={t('{title} actions', { title: act.title })}>
              <button role="menuitem" className="qa-b" onClick={() => setMoving(true)}><span className="qa-i"><I n="folder" s={22} /></span>{t('Move')}</button>
              <button role="menuitem" className="qa-b" onClick={() => { const l = act; setAct(null); shareList(l) }}><span className="qa-i"><I n="share" s={22} /></span>{t('Share')}</button>
              <button role="menuitem" className="qa-b" onClick={() => { const l = act; setAct(null); inviteTo(l) }}><span className="qa-i"><I n="people" s={22} /></span>{t('Invite')}</button>
              <button role="menuitem" className="qa-b danger" onClick={() => { const l = act; if (confirm(t('Delete “{title}” and its items?', { title: l.title }))) { deleteList(l.id); setAct(null); announce(t('List deleted')) } }}><span className="qa-i"><I n="trash" s={22} /></span>{t('Delete')}</button>
            </div>
          ) : (
            <div className="form mt20" role="radiogroup" aria-label={t('Category')}>
              {[{ id: '', name: t('No category') }, ...categories].map((c) => {
                const on = (act.category_id ?? '') === c.id
                return (
                  <button key={c.id || 'none'} role="radio" aria-checked={on} className="frow" style={{ width: '100%', textAlign: 'start' }}
                    onClick={async () => { await updateList(act.id, { category_id: c.id || null }); announce(c.id ? t('Moved to {name}', { name: c.name }) : t('Moved out of categories')); setAct(null); setMoving(false) }}>
                    <span className="grow" style={{ fontSize: 17 }}>{t(c.name)}</span>{on && <I n="check" s={18} w={2.6} />}
                  </button>
                )
              })}
            </div>
          )}
          <p className="ffoot">{moving ? t('Lists with no category show under All.') : act.family_id ? t('This list is shared with your family.') : t('Invite shares this list with your family space.')}</p>
        </Sheet>
      )}
      <Fab label={t('Add to lists')} actions={[
        { icon: 'plus', label: current ? t('Item in {name}', { name: current.name }) : t('New item'), onSelect: openItem },
        { icon: 'list', label: current ? t('New list in {name}', { name: current.name }) : t('New list'), onSelect: openNewList },
        { icon: 'folder', label: t('New category'), onSelect: () => { setAdding(true); window.scrollTo({ top: 0, behavior: 'smooth' }) } }
      ]} />
    </main>
  )
}
