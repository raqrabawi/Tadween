import type { CSSProperties } from 'react'
import { useLocation } from 'react-router-dom'
import { t } from '../lib/i18n'

/** A shimmering placeholder block shown while real content loads */
export const Sk = ({ w = '100%', h = 16, r = 10, style }: { w?: number | string; h?: number; r?: number; style?: CSSProperties }) =>
  <span className="sk" style={{ width: w, height: h, borderRadius: r, ...style }} />

const Head = ({ avatar = false }: { avatar?: boolean }) => (
  <div className="hd" style={{ minHeight: 60 }}>
    <div className="row" style={{ gap: 12 }}>
      {avatar && <Sk w={56} h={56} r={28} />}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}><Sk w={90} h={11} /><Sk w={150} h={26} r={8} /></div>
    </div>
    <Sk w={46} h={46} r={23} />
  </div>
)
const TabsRow = () => <Sk h={52} r={26} style={{ marginTop: 20 }} />

export function TodaySkeleton() {
  return (
    <>
      <Head avatar />
      <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 10 }}><Sk w={170} h={12} /><Sk w={230} h={34} r={10} /></div>
      <Sk h={220} r={28} style={{ marginTop: 20 }} />
      <Sk h={108} r={28} style={{ marginTop: 12 }} />
      <div className="grid2" style={{ marginTop: 12 }}><Sk h={170} r={28} /><Sk h={170} r={28} /></div>
    </>
  )
}

export function CalendarSkeleton() {
  return (
    <>
      <Head />
      <TabsRow />
      <Sk h={48} r={24} style={{ marginTop: 16 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,minmax(0,1fr))', gap: 6, marginTop: 12 }}>{Array.from({ length: 7 }, (_, i) => <Sk key={i} h={84} r={24} />)}</div>
      <Sk w={160} h={20} r={8} style={{ marginTop: 28 }} />
      {[0, 1, 2].map((i) => <div key={i} className="row" style={{ gap: 12, marginTop: 14 }}><Sk w={44} h={14} /><Sk w="calc(100% - 56px)" h={72} r={22} /></div>)}
    </>
  )
}

export function ListsSkeleton() {
  return (
    <>
      <Head />
      <div className="spread" style={{ marginTop: 20 }}><Sk w={100} h={12} /><div className="row" style={{ gap: 8 }}><Sk w={42} h={42} r={21} /><Sk w={42} h={42} r={21} /><Sk w={42} h={42} r={21} /></div></div>
      <TabsRow />
      <div className="stack" style={{ gap: 20, marginTop: 16 }}>
        {[3, 2, 1].map((rows, i) => (
          <div key={i} className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="row" style={{ gap: 14 }}><Sk w={40} h={40} r={20} /><div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}><Sk w="55%" h={16} r={6} /><Sk w="35%" h={11} /></div></div>
            {Array.from({ length: rows }, (_, j) => <div key={j} className="row" style={{ gap: 12 }}><Sk w={24} h={24} r={12} /><Sk w={`${60 - j * 12}%`} h={14} /></div>)}
          </div>
        ))}
      </div>
    </>
  )
}

export function NotesSkeleton() {
  return (
    <>
      <Head />
      <div className="spread" style={{ marginTop: 20 }}><Sk w={100} h={12} /><div className="row" style={{ gap: 8 }}><Sk w={42} h={42} r={21} /><Sk w={42} h={42} r={21} /><Sk w={42} h={42} r={21} /></div></div>
      <TabsRow />
      <div className="grid2" style={{ marginTop: 16, alignItems: 'start' }}>
        {[150, 110, 120, 160].map((h, i) => <Sk key={i} h={h} r={24} />)}
      </div>
    </>
  )
}

/** Picks the right skeleton for the current page (used while the app or a screen is loading) */
export function PageSkeleton() {
  const { pathname } = useLocation()
  const body = pathname.startsWith('/calendar') ? <CalendarSkeleton />
    : pathname.startsWith('/lists') ? <ListsSkeleton />
      : pathname.startsWith('/notes') ? <NotesSkeleton />
        : pathname === '/' ? <TodaySkeleton />
          : <><Head /><Sk h={160} r={28} style={{ marginTop: 24 }} /><Sk h={120} r={28} style={{ marginTop: 12 }} /><Sk h={120} r={28} style={{ marginTop: 12 }} /></>
  return <main className="screen sk-page" aria-busy="true" aria-label={t('Loading')}>{body}</main>
}
