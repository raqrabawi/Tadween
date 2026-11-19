import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import type { List } from '../lib/types'
import { I } from '../components/Icon'
import { Avatar, Sheet, Switch } from '../components/ui'

function ListCard({ list, editing }: { list: List; editing: boolean }) {
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
  const staples = list.staples.filter((s) => !have.has(s.toLowerCase()))

  const submit = async () => {
    const name = draft.trim()
    if (!name) return
    setDraft('')
    await addItem(list.id, name, null, list.verb === 'buy' ? 'Other' : null)
  }

  return (
    <section className={`card tone-${list.tone}`} style={{ padding: 0 }} aria-label={list.title}>
      <div className="row" style={{ padding: '16px 14px 14px 16px' }}>
        <button className="row grow" style={{ gap: 14, textAlign: 'left' }} onClick={() => setOpen(!open)} aria-expanded={open}>
          <span className="ib"><I n={shared ? 'people' : 'list'} s={19} w={2.2} /></span>
          <span className="grow" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span className="ttl">{list.title}</span>
            <span className="sub">{todo.length ? `${todo.length} to ${list.verb}` : 'All done'}{shared ? ' · shared with family' : ''}</span>
          </span>
        </button>
        {shared && <span className="avs">{others.slice(0, 3).map((m) => <Avatar key={m.user_id} name={m.name} color={m.color} size={26} />)}</span>}
        {editing
          ? <button className="arr" style={{ color: 'var(--red)', boxShadow: 'inset 0 0 0 1px var(--red)' }} onClick={() => confirm(`Delete “${list.title}” and its items?`) && deleteList(list.id)} aria-label={`Delete ${list.title}`}><I n="trash" s={18} /></button>
          : <button className="arr" onClick={() => setOpen(!open)} aria-label={open ? 'Fold list' : 'Unfold list'}><I n="down" s={14} w={2.6} className="" /></button>}
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
              : <Link to="/listen" className="vorb" style={{ width: 40, height: 40, boxShadow: 'none' }} aria-label="Add by voice"><I n="mic" s={16} w={2.2} /></Link>}
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
  const { categories, lists, items, addCategory, deleteCategory, addList } = useStore()
  const [cat, setCat] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [adding, setAdding] = useState(false)
  const [catName, setCatName] = useState('')
  const [newList, setNewList] = useState(false)
  const [listName, setListName] = useState('')
  const [listShared, setListShared] = useState(false)

  useEffect(() => { if (!cat && categories[0]) setCat(categories[0].id) }, [categories, cat])
  const current = categories.find((c) => c.id === cat) ?? categories[0]
  const shown = lists.filter((l) => l.category_id === current?.id)
  const openCount = (cid: string) => items.filter((i) => !i.done && lists.some((l) => l.id === i.list_id && l.category_id === cid)).length
  const totalOpen = items.filter((i) => !i.done).length

  const saveCat = async () => {
    const name = catName.trim() || 'New category'
    const c = await addCategory(name)
    setAdding(false); setCatName('')
    if (c) setCat(c.id)
  }
  const saveList = async () => {
    if (!current) return
    await addList(current.id, listName.trim() || `${current.name} list`, { shared: listShared, verb: /grocer|shop|buy|market/i.test(current.name + listName) ? 'buy' : 'do' })
    setNewList(false); setListName(''); setListShared(false)
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
          <button className="ib" aria-label="New list" onClick={() => setNewList(true)}><I n="plus" w={2.2} /></button>
        </div>
      </div>

      <div className="chips mt20" role="tablist" aria-label="Categories">
        {categories.map((c) => editing ? (
          <span key={c.id} className={c.id === current?.id ? 'chip on' : 'chip'} style={{ paddingRight: 10 }}>{c.name}
            <button aria-label={`Delete category ${c.name}`} onClick={() => confirm(`Delete “${c.name}” and its lists?`) && deleteCategory(c.id)} style={{ width: 24, height: 24, borderRadius: 12, background: 'var(--red)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="10" height="10" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14" stroke="currentColor" strokeWidth="4" strokeLinecap="round" /></svg></button>
          </span>
        ) : (
          <button key={c.id} role="tab" aria-selected={c.id === current?.id} className={c.id === current?.id ? 'chip on' : 'chip'} onClick={() => setCat(c.id)}>{c.name}<span className="n">{openCount(c.id)}</span></button>
        ))}
        {adding ? (
          <form className="chip" style={{ width: 210, padding: '0 4px 0 18px', boxShadow: 'var(--edge), 0 0 0 2px var(--acc)' }} onSubmit={(e) => { e.preventDefault(); saveCat() }}>
            <label className="sr" htmlFor="catname">Category name</label>
            <input id="catname" autoFocus className="inp" style={{ fontSize: 15 }} placeholder="Category name" value={catName} onChange={(e) => setCatName(e.target.value)} />
            <button type="submit" className="ib sm acc" aria-label="Save category"><I n="check" s={15} w={3} /></button>
          </form>
        ) : (
          <button className="chip" style={{ width: 44, padding: 0, background: 'transparent', boxShadow: 'inset 0 0 0 1.5px var(--line)' }} aria-label="Add category" onClick={() => setAdding(true)}><I n="plus" s={18} w={2.2} /></button>
        )}
      </div>

      <div className="stack mt16" role="tabpanel">
        {shown.map((l) => <ListCard key={l.id} list={l} editing={editing} />)}
        {!shown.length && current && <div className="card empty"><span className="ttl">No lists in {current.name} yet</span><span className="sub">Make one, or just say “add milk to groceries”.</span></div>}
        <button className="btn dash" style={{ height: 56, color: 'var(--ink2)', fontSize: 16 }} onClick={() => setNewList(true)}><I n="plus" s={18} w={2.4} />New list{current ? ` in ${current.name}` : ''}</button>
      </div>

      {newList && (
        <Sheet label="New list" onClose={() => setNewList(false)}>
          <div className="hd3 mt12"><button className="ib" aria-label="Cancel" onClick={() => setNewList(false)}><I n="close" s={15} w={2.6} /></button><h1>New list</h1><span /></div>
          <div className="form mt20">
            <label className="frow"><span className="fl">Name</span><input autoFocus className="inp" placeholder="e.g. Weekend BBQ" value={listName} onChange={(e) => setListName(e.target.value)} /></label>
            <div className="frow"><span className="grow" style={{ fontSize: 17 }}>Share with family</span><Switch on={listShared} onChange={setListShared} label="Share with family" /></div>
          </div>
          <p className="ffoot">Shared lists update live for everyone in your family space.</p>
          <button className="btn pri mt24" onClick={saveList}>Create list<I n="next" s={16} w={2.6} /></button>
        </Sheet>
      )}
    </main>
  )
}
