import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { I } from '../components/Icon'

const TONES = ['mint', 'sky', 'sand', 'lilac', 'moss']
const FILTERS = ['All', 'Notes', 'Voice', 'Capsules'] as const

export default function Journal() {
  const { notes } = useStore()
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All')
  const now = new Date()
  const shown = notes.filter((n) => filter === 'All' || (filter === 'Notes' && n.kind === 'note' && !n.opens_at) || (filter === 'Voice' && n.kind === 'voice') || (filter === 'Capsules' && !!n.opens_at))
  const voiceCount = notes.filter((n) => n.kind === 'voice').length
  const cols: (typeof shown)[] = [[], []]
  shown.forEach((n, i) => cols[i % 2].push(n))

  return (
    <main className="screen">
      <div className="hd" style={{ minHeight: 60 }}>
        <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 4 }}>
          <span className="cap">{notes.length} notes · {voiceCount} voice</span>
          <h1 className="h1">Journal</h1>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <Link to="/ask" className="ib" aria-label="Search journal"><I n="search" /></Link>
          <Link to="/note/new" className="ib" aria-label="New note"><I n="pen" /></Link>
        </div>
      </div>

      <div className="chips mt20" role="group" aria-label="Filter notes">
        {FILTERS.map((f) => <button key={f} className={f === filter ? 'chip on' : 'chip'} aria-pressed={f === filter} onClick={() => setFilter(f)}>{f}</button>)}
      </div>

      <Link to="/listen" className="card hot mt16" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span className="vorb" style={{ width: 52, height: 52, boxShadow: 'none' }}><I n="mic" s={22} /></span>
        <span className="grow" style={{ display: 'flex', flexDirection: 'column' }}><span className="ttl">Say what’s on your mind</span><span className="sub">Start with “note that…” and Tadween files it here.</span></span>
        <span className="arr"><I n="arrow" s={16} /></span>
      </Link>

      {shown.length === 0 ? (
        <div className="card empty mt12"><span className="ttl">{filter === 'All' ? 'Your journal is empty' : `No ${filter.toLowerCase()} yet`}</span><span className="sub">Write or speak your first note.</span></div>
      ) : (
        <div className="grid2 mt12" style={{ alignItems: 'start' }}>
          {cols.map((col, ci) => (
            <div key={ci} className="stack">
              {col.map((n, i) => {
                const locked = n.opens_at && new Date(n.opens_at) > now
                const tone = TONES[(ci + i * 2) % TONES.length]
                return (
                  <Link key={n.id} to={`/note/${n.id}`} className={`card tight tone-${locked ? 'lilac' : tone}`} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span className="spread"><span className="cap">{locked ? 'Time capsule' : n.kind === 'voice' ? 'Voice' : 'Note'}</span>{locked ? <I n="lock" s={15} /> : n.kind === 'voice' ? <I n="mic" s={15} /> : null}</span>
                    <span className="ttl" style={{ fontSize: 17, lineHeight: '22px' }}>{n.title}</span>
                    {!locked && n.body && <span className="sub" style={{ fontSize: 13, lineHeight: '19px', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{n.body}</span>}
                    <span className="cap" style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 500 }}>{locked ? `Opens ${new Date(n.opens_at!).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}` : new Date(n.updated_at).toLocaleDateString([], { day: 'numeric', month: 'short' })}</span>
                  </Link>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
