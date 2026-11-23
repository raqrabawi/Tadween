import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import type { List } from '../lib/types'
import { I } from '../components/Icon'
import { Avatar, Sheet, Switch, announce } from '../components/ui'
import { Fab } from '../components/Fab'

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
        timer.current = window.setTimeout(() => { fired.current = true; navigator.vibrate?.(15); onLong() }, ms)
      },
      onPointerMove: (e: React.PointerEvent) => { if (Math.hypot(e.clientX - at.current.x, e.clientY - at.current.y) > 10) clear() },
      onPointerUp: clear, onPointerLeave: clear, onPointerCancel: clear,
      onContextMenu: (e: React.MouseEvent) => { e.preventDefault(); clear(); fired.current = true; onLong() }
    }
  }
}

function ListCard({ list, editing, onActions, catName }: { list: List; editing: boolean; onActions: (l: List) => void; catName?: string }) {
  const { items, members, addItem, toggleItem, resetDone, deleteList, memberFor } = useStore()
  const [open, setOpen] = useState(true)
  const [draft, setDraft] = useState('')
  const mine = items.filter((i) => i.list_id === list.id)
  const todo = mine.filter((i) => !i.done)
  const done = mine.length - todo.length
  const shared = !!list.family_id
  const others = members.filter((m) => m.family_id === list.family_id)
  const groups: Record<string, typeof todo> = {}
  for (const it of todo) (groups[shared && list.verb === 'buy' ? it.aisle ?? '' : ''] ??= []).push(it)
  const have = new Set(mine.filter((i) => !i.done).map((i) => i.name.toLowerCase()))
  const staples = (list.staples ?? []).filter((s) => !have.has(s.toLowerCase()))

  const lp = useLongPress(() => onActions(list))
  const submit = async () => {
    const name = draft.trim()
    if (!name) return
    setDraft('')
    await addItem(list.id, name, null, list.verb === 'buy' ? 'Other' : null)
  }

  return (
    <section className={`card tone-${list.tone}`} style={{ padding: 0 }} aria-label={list.title}>
      <div className="row" style={{ padding: '16px 14px 14px 16px' }}>
        <button className="row grow lp" style={{ gap: 14, textAlign: 'left' }} {...lp.handlers} onClick={() => { if (lp.fired.current) { lp.fired.current = false; return } setOpen(!open) }} aria-expanded={open} aria-description="Long press for more actions">
          <span className="ib"><I n={shared ? 'people' : 'list'} s={19} w={2.2} /></span>
          <span className="grow" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span className="ttl">{list.title}</span>
            <span className="sub">{todo.length ? `${todo.length} to ${list.verb}` : 'All done'}{shared ? ' · shared with family' : ''}{catName ? ` · ${catName}` : ''}</span>
          </span>
        </button>
        {shared && <span className="avs">{others.slice(0, 3).map((m) => <Avatar key={m.user_id} name={m.name} color={m.color} size={26} />)}</span>}
        {editing
          ? <button className="arr" style={{ color: 'var(--red)', boxShadow: 'inset 0 0 0 1px var(--red)' }} onClick={() => confirm(`Delete “${list.title}” and its items?`) && deleteList(list.id)} aria-label={`Delete ${list.title}`}><I n="trash" s={18} /></button>
          : <>
              <button className="arr" style={{ marginRight: 6 }} onClick={() => onActions(list)} aria-label={`More actions for ${list.title}`}><I n="more" s={16} w={2.6} /></button>
              <button className="arr" onClick={() => setOpen(!open)} aria-label={open ? 'Fold list' : 'Unfold list'}><I n="down" s={14} w={2.6} className="" /></button>
            </>}
      </div>

      {done > 0 && (
        <div className="row" style={{ margin: '0 20px 8px', gap: 12 }}>
          <div className="bar grow" style={{ height: 10, borderRadius: 5 }}><span style={{ width: `${Math.round((done / mine.length) * 100)}%` }} /></div>
          <span className="sub num" style={{ fontSize: 13, fontWeight: 700 }}>{done}/{mine.length}</span>
        </div>
      )}

      {open && (
        <div>
          {Object.entries(groups).map(([aisle, its]) => (
            <div key={aisle || 'all'}>
              {aisle && <p className="cap" style={{ padding: '10px 20px 2px 66px', fontSize: 11 }}>{aisle}</p>}
              {its.map((it) => {
                const by = memberFor(it.added_by)
                return (
                  <div key={it.id} className="row" style={{ minHeight: 52, padding: '0 20px 0 10px', gap: 8 }}>
                    <button className="ck" onClick={() => toggleItem(it)} aria-label={`Check off ${it.name}`}><span /></button>
                    <span className="grow" style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: 17, lineHeight: '22px' }}>{it.name}</span>
                      {it.qty && <span className="sub" style={{ fontSize: 13, lineHeight: '18px' }}>{it.qty}</span>}
                    </span>
                    {shared && by && <Avatar name={by.name} color={by.color} size={26} />}
                  </div>
                )
              })}
            </div>
          ))}

          {staples.length > 0 && (
            <div className="row" style={{ padding: '10px 20px 2px 66px', gap: 6, flexWrap: 'wrap' }}>
              <span className="sub muted" style={{ fontSize: 13 }}>Usually</span>
              {staples.map((s) => <button key={s} className="tag sm" style={{ background: 'transparent', boxShadow: 'inset 0 0 0 1px var(--line)' }} onClick={() => addItem(list.id, s, 'Usual amount', 'Pantry')}>+ {s}</button>)}
            </div>
          )}

          <form className="row" style={{ margin: '8px 12px 12px', minHeight: 52, borderRadius: 26, background: 'var(--s2)', padding: '0 6px 0 16px', gap: 10, color: 'var(--ink3)' }} onSubmit={(e) => { e.preventDefault(); submit() }}>
            <I n="plus" s={18} w={2.2} />
            <label className="sr" htmlFor={`add-${list.id}`}>Add item to {list.title}</label>
            <input id={`add-${list.id}`} className="inp" style={{ fontSize: 16 }} placeholder="Add item — type or say it" value={draft} onChange={(e) => setDraft(e.target.value)} enterKeyHint="done" />
            {draft.trim() ? <button className="tag acc" type="submit">Add</button>
              : <Link to="/listen?from=lists" onClick={() => { try { sessionStorage.setItem('tadween-list', list.title) } catch { /* ignore */ } }} className="vorb" style={{ width: 40, height: 40, boxShadow: 'none' }} aria-label={`Add to ${list.title} by voice`}><I n="mic" s={16} w={2.2} /></Link>}
          </form>

          {done > 0 && (
            <div className="spread" style={{ margin: '0 12px 12px', padding: '0 6px 0 18px', minHeight: 44 }}>
              <span className="row" style={{ gap: 10 }}><I n="check" s={16} w={3} className="" /><span className="sub">{done} {list.verb === 'buy' ? 'in the cart' : 'done'}</span></span>
              <button className="btn line" style={{ height: 36, width: 'auto', padding: '0 14px', fontSize: 14 }} onClick={() => resetDone(list.id)}>Undo all</button>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

export default function Lists() {
  const { categories, lists, items, addCategory, deleteCategory, addList, addItem, updateList, deleteList, family, guest, setSavePrompt } = useStore()
  // 'all' shows every list, including ones with no category
  const [cat, setCat] = useState<string>('all')
  const [act, setAct] = useState<List | null>(null)
  const [moving, setMoving] = useState(false)
  const [listCat, setListCat] = useState<string>('')
  const [editing, setEditing] = useState(false)
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
  const catOf = (l: List) => categories.find((c) => c.id === l.category_id)?.name
  const openCount = (cid: string) => items.filter((i) => !i.done && lists.some((l) => l.id === i.list_id && l.category_id === cid)).length
  const totalOpen = items.filter((i) => !i.done).length

  const saveCat = async () => {
    const name = catName.trim() || 'New category'
    const c = await addCategory(name)
    setAdding(false); setCatName('')
    if (c) setCat(c.id)
  }
  const openNewList = () => { setListCat(current?.id ?? ''); setNewList(true) }
  const saveList = async () => {
    const c = categories.find((x) => x.id === listCat)
    await addList(c?.id ?? null, listName.trim() || (c ? `${c.name} list` : 'New list'), { shared: listShared, verb: /grocer|shop|buy|market/i.test((c?.name ?? '') + listName) ? 'buy' : 'do' })
    setNewList(false); setListName(''); setListShared(false)
  }

  // Quick actions from a long press
  const shareList = async (l: List) => {
    const todo = items.filter((i) => i.list_id === l.id && !i.done).map((i) => `• ${i.qty ? `${i.qty} ` : ''}${i.name}`)
    const text = `${l.title}\n${todo.length ? todo.join('\n') : '(nothing left)'}\n\nFrom Tadween`
    try {
      if (typeof navigator.share === 'function') await navigator.share({ title: l.title, text })
      else { await navigator.clipboard.writeText(text); announce('List copied — paste it anywhere') }
    } catch { /* closed the share sheet */ }
  }
  const inviteTo = async (l: List) => {
    if (guest) { setSavePrompt(true); return }
    if (!family) return
    if (!l.family_id) await updateList(l.id, { family_id: family.id })
    const link = window.location.origin + window.location.pathname
    const text = `Join my “${l.title}” list on Tadween: open ${link} , sign in, then Settings › Join a family with code ${family.invite_code}`
    try {
      if (typeof navigator.share === 'function') await navigator.share({ title: `Join ${l.title}`, text })
      else { await navigator.clipboard.writeText(text); announce('Invite copied — send it to family') }
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
          <span className="cap">{lists.length} lists · {totalOpen} open</span>
          <h1 className="h1">Lists</h1>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <button className={editing ? 'ib wide acc' : 'ib wide'} aria-pressed={editing} onClick={() => setEditing(!editing)}>{editing ? 'Done' : 'Edit'}</button>
        </div>
      </div>

      <div className="rowhead">
        <span className="cap" id="cats-label">Categories</span>
        {!adding && <button className="addmini" onClick={() => setAdding(true)}><I n="plus" s={13} w={2.6} />Add category</button>}
      </div>
      <div className="chips" role="tablist" aria-labelledby="cats-label">
        {!editing && <button role="tab" aria-selected={!current} className={!current ? 'chip on' : 'chip'} onClick={() => setCat('all')}>All<span className="n">{lists.length}</span></button>}
        {categories.map((c) => editing ? (
          <span key={c.id} className={c.id === current?.id ? 'chip on' : 'chip'} style={{ paddingRight: 10 }}>{c.name}
            <button aria-label={`Delete category ${c.name}`} onClick={() => confirm(`Delete “${c.name}” and its lists?`) && deleteCategory(c.id)} style={{ width: 24, height: 24, borderRadius: 12, background: 'var(--red)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="10" height="10" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14" stroke="currentColor" strokeWidth="4" strokeLinecap="round" /></svg></button>
          </span>
        ) : (
          <button key={c.id} role="tab" aria-selected={c.id === current?.id} className={c.id === current?.id ? 'chip on' : 'chip'} onClick={() => setCat(c.id)}>{c.name}<span className="n">{openCount(c.id)}</span></button>
        ))}
        {adding && (
          <form className="chip" style={{ width: 210, padding: '0 4px 0 18px', boxShadow: 'var(--edge), 0 0 0 2px var(--acc)' }} onSubmit={(e) => { e.preventDefault(); saveCat() }}>
            <label className="sr" htmlFor="catname">Category name</label>
            <input id="catname" autoFocus className="inp" style={{ fontSize: 15 }} placeholder="Category name" value={catName} onChange={(e) => setCatName(e.target.value)} />
            <button type="submit" className="ib sm acc" aria-label="Save category"><I n="check" s={15} w={3} /></button>
          </form>
        )}
      </div>

      <div className="stack mt16" role="tabpanel">
        {shown.map((l) => <ListCard key={l.id} list={l} editing={editing} onActions={(x) => { setMoving(false); setAct(x) }} catName={current ? undefined : catOf(l) ?? 'No category'} />)}
        {!shown.length && <div className="card empty"><span className="ttl">{current ? `No lists in ${current.name} yet` : 'No lists yet'}</span><span className="sub">Make one, or just say “add milk to groceries”.</span></div>}
        {lists.length > 0 && <p className="sub" style={{ textAlign: 'center', fontSize: 13 }}>Tip: press and hold a list for more actions.</p>}
        <button className="btn dash" style={{ height: 56, color: 'var(--ink2)', fontSize: 16 }} onClick={openNewList}><I n="plus" s={18} w={2.4} />New list{current ? ` in ${current.name}` : ''}</button>
      </div>

      {newItem && (
        <Sheet label={current ? `New item in ${current.name}` : 'New item'} onClose={() => setNewItem(false)}>
          <div className="hd3 mt12"><button className="ib" aria-label="Cancel" onClick={() => setNewItem(false)}><I n="close" s={15} w={2.6} /></button><h1>New item</h1><span /></div>
          <form onSubmit={(e) => { e.preventDefault(); saveItem() }}>
            <div className="form mt20">
              <label className="frow"><span className="fl">Item</span><input autoFocus className="inp" placeholder={/grocer|shop/i.test(current?.name ?? '') ? 'e.g. Tomatoes' : 'e.g. Milk'} value={itemName} onChange={(e) => setItemName(e.target.value)} /></label>
              <label className="frow"><span className="fl">Amount</span><input className="inp" placeholder="Optional" value={itemQty} onChange={(e) => setItemQty(e.target.value)} /></label>
              {shown.length > 1 && <label className="frow"><span className="fl">List</span><select className="inp" style={{ background: 'transparent' }} value={itemList} onChange={(e) => setItemList(e.target.value)}>{shown.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}</select></label>}
            </div>
            <p className="ffoot">Adds to {shown.length > 1 ? 'the list you pick' : shown[0]?.title}{current ? ` in ${current.name}` : ''}.</p>
            <button className="btn pri mt24" type="submit" disabled={!itemName.trim()}>Add item<I n="next" s={16} w={2.6} /></button>
          </form>
        </Sheet>
      )}

      {newList && (
        <Sheet label="New list" onClose={() => setNewList(false)}>
          <div className="hd3 mt12"><button className="ib" aria-label="Cancel" onClick={() => setNewList(false)}><I n="close" s={15} w={2.6} /></button><h1>New list</h1><span /></div>
          <div className="form mt20">
            <label className="frow"><span className="fl">Name</span><input autoFocus className="inp" placeholder="e.g. Weekend BBQ" value={listName} onChange={(e) => setListName(e.target.value)} /></label>
            <label className="frow"><span className="fl">Category</span><select className="inp" style={{ background: 'transparent' }} value={listCat} onChange={(e) => setListCat(e.target.value)}><option value="">No category</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
            <div className="frow"><span className="grow" style={{ fontSize: 17 }}>Share with family</span><Switch on={listShared} onChange={setListShared} label="Share with family" /></div>
          </div>
          <p className="ffoot">Category is optional — you can move the list later. Shared lists update for everyone in your family space.</p>
          <button className="btn pri mt24" onClick={saveList}>Create list<I n="next" s={16} w={2.6} /></button>
        </Sheet>
      )}
      {act && (
        <Sheet label={`${act.title} actions`} onClose={() => setAct(null)}>
          <div className="hd3 mt12"><button className="ib" aria-label="Close" onClick={() => (moving ? setMoving(false) : setAct(null))}><I n={moving ? 'back' : 'close'} s={15} w={2.6} /></button><h1>{moving ? 'Move to category' : act.title}</h1><span /></div>
          {!moving ? (
            <div className="qa mt20" role="menu" aria-label={`${act.title} actions`}>
              <button role="menuitem" className="qa-b" onClick={() => setMoving(true)}><span className="qa-i"><I n="folder" s={22} /></span>Move</button>
              <button role="menuitem" className="qa-b" onClick={() => { const l = act; setAct(null); shareList(l) }}><span className="qa-i"><I n="share" s={22} /></span>Share</button>
              <button role="menuitem" className="qa-b" onClick={() => { const l = act; setAct(null); inviteTo(l) }}><span className="qa-i"><I n="people" s={22} /></span>Invite</button>
              <button role="menuitem" className="qa-b danger" onClick={() => { const l = act; if (confirm(`Delete “${l.title}” and its items?`)) { deleteList(l.id); setAct(null); announce('List deleted') } }}><span className="qa-i"><I n="trash" s={22} /></span>Delete</button>
            </div>
          ) : (
            <div className="form mt20" role="radiogroup" aria-label="Category">
              {[{ id: '', name: 'No category' }, ...categories].map((c) => {
                const on = (act.category_id ?? '') === c.id
                return (
                  <button key={c.id || 'none'} role="radio" aria-checked={on} className="frow" style={{ width: '100%', textAlign: 'left' }}
                    onClick={async () => { await updateList(act.id, { category_id: c.id || null }); announce(c.id ? `Moved to ${c.name}` : 'Moved out of categories'); setAct(null); setMoving(false) }}>
                    <span className="grow" style={{ fontSize: 17 }}>{c.name}</span>{on && <I n="check" s={18} w={2.6} />}
                  </button>
                )
              })}
            </div>
          )}
          <p className="ffoot">{moving ? 'Lists with no category show under All.' : act.family_id ? 'This list is shared with your family.' : 'Invite shares this list with your family space.'}</p>
        </Sheet>
      )}
      <Fab label="Add to lists" actions={[
        { icon: 'plus', label: current ? `Item in ${current.name}` : 'New item', onSelect: openItem },
        { icon: 'list', label: current ? `New list in ${current.name}` : 'New list', onSelect: openNewList },
        { icon: 'folder', label: 'New category', onSelect: () => { setAdding(true); window.scrollTo({ top: 0, behavior: 'smooth' }) } }
      ]} />
    </main>
  )
}
