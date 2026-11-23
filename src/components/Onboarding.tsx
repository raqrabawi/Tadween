import { useRef, useState } from 'react'
import { I } from './Icon'
import { LogoMark } from './Logo'
import { signInWithGoogle } from './SignIn'
import { isAr, LOC, t } from '../lib/i18n'
import { haptic } from '../lib/a11y'

export const ONBOARD_KEY = 'tadween-onboarded'
export const needsOnboarding = () => { try { return !localStorage.getItem(ONBOARD_KEY) } catch { return false } }

/* ── Illustrations (pure CSS/SVG, animated when their slide is in view) ── */
function Voice() {
  return (
    <div className="ob-ill ob-voice">
      <span className="ob-ring r1" /><span className="ob-ring r2" /><span className="ob-ring r3" />
      <span className="vorb ob-orb"><I n="mic" s={34} /></span>
      <div className="ob-bubble">{t('“Dentist Monday at 5, remind me the day before”')}</div>
      <div className="ob-chip c1"><span className="ob-dot" style={{ background: 'var(--k-event)' }}><I n="cal" s={14} /></span><b>{t('Dentist')}</b><small>{t('Mon · 17:00')}</small></div>
      <div className="ob-chip c2"><span className="ob-dot" style={{ background: 'var(--k-reminder)' }}><I n="bell" s={14} /></span><b>{t('Reminder')}</b><small>{t('Sun · 17:00')}</small></div>
    </div>
  )
}
function AllInOne() {
  return (
    <div className="ob-ill ob-bento">
      <div className="ob-tile t1"><span className="ob-dot" style={{ background: 'var(--k-event)' }}><I n="cal" s={15} /></span>
        <div className="ob-week">{[1, 2, 3, 4, 5].map((n, i) => <span key={n} className={i === 2 ? 'on' : ''}>{new Date(2026, 10, 22 + n).toLocaleDateString(LOC, { weekday: 'narrow' })}</span>)}</div>
        <b>{t('Lunch with Sara')}</b><small>13:00</small></div>
      <div className="ob-tile t2"><span className="ob-dot" style={{ background: 'var(--k-item)' }}><I n="list" s={15} /></span>
        {[t('Milk'), t('Bread'), t('Eggs')].map((x, i) => <span key={x} className={i === 0 ? 'ob-li done' : 'ob-li'}><i />{x}</span>)}</div>
      <div className="ob-tile t3"><span className="ob-dot" style={{ background: 'var(--k-note)' }}><I n="pen" s={15} /></span><b>{t('Trip ideas')}</b><small>{t('Beach, then dinner out')}</small></div>
      <div className="ob-tile t4"><span className="ob-dot" style={{ background: 'var(--k-reminder)' }}><I n="bell" s={15} /></span><b>{t('Pay the rent')}</b><small>{t('on the 1st')}</small></div>
    </div>
  )
}
function Family() {
  return (
    <div className="ob-ill ob-family">
      <div className="ob-list">
        <div className="ob-lh"><b>{t('Family Groceries')}</b><span className="avs"><span className="av" style={{ background: '#304440' }}>M</span><span className="av" style={{ background: '#B95333' }}>S</span><span className="av" style={{ background: '#627A6B' }}>R</span></span></div>
        {[[t('Rice'), 'M', '#304440'], [t('Olive oil'), 'S', '#B95333'], [t('Tomatoes'), 'R', '#627A6B']].map(([x, a, c], i) => (
          <div key={x} className={'ob-row r' + i}><span className="ob-ck" /><span className="grow">{x}</span><span className="av" style={{ background: c, width: 22, height: 22, fontSize: 10 }}>{a}</span></div>
        ))}
      </div>
      <div className="ob-toast"><span className="av" style={{ background: '#B95333', width: 24, height: 24, fontSize: 11 }}>S</span>{t('Sara added Olive oil')}</div>
    </div>
  )
}
function Private() {
  return (
    <div className="ob-ill ob-private">
      <div className="ob-shield"><I n="lock" s={40} /></div>
      <div className="ob-pill p1" lang="en">Aa English</div>
      <div className="ob-pill p2" lang="ar">ع العربية</div>
      <div className="ob-pill p3"><I n="download" s={14} />{t('Backup file')}</div>
      <div className="ob-pill p4"><I n="cloud" s={14} />{t('Sync when you want')}</div>
    </div>
  )
}

const SLIDES = [
  { k: 'Voice first', title: 'Just say it.', body: 'Talk the way you talk, in Arabic or English. Tadween turns it into events, reminders and list items.', Ill: Voice, tone: 'terra' },
  { k: 'All in one', title: 'Your whole day, one place.', body: 'Calendar, reminders, lists and notes live together, so you stop jumping between apps.', Ill: AllInOne, tone: 'sky' },
  { k: 'Family', title: 'Shop together, live.', body: 'Shared lists update for everyone instantly, and you can see who added what.', Ill: Family, tone: 'sage' },
  { k: 'Private & bilingual', title: 'Yours, in your language.', body: 'No account needed: everything stays on your phone. Back it up to a file, or sign in to sync.', Ill: Private, tone: 'sand' }
]

export function Onboarding({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0)
  const [drag, setDrag] = useState(0)
  const [busy, setBusy] = useState(false)
  const start = useRef<{ x: number; y: number; lock?: 'x' | 'y' } | null>(null)
  const w = useRef(390)
  const last = i === SLIDES.length - 1
  const dir = isAr ? -1 : 1
  const go = (n: number) => { const c = Math.max(0, Math.min(SLIDES.length - 1, n)); if (c !== i) haptic(6); setI(c); setDrag(0) }
  const finish = () => { try { localStorage.setItem(ONBOARD_KEY, '1') } catch { /* private mode */ } onDone() }

  return (
    <div className={'ob tone-' + SLIDES[i].tone} role="dialog" aria-label={t('Welcome to Tadween')}>
      <div className="ob-top">
        <span className="row" style={{ gap: 8 }}><LogoMark size={30} dark={document.documentElement.classList.contains('dark')} /><b style={{ fontSize: 17 }}>{t('Tadween')}</b></span>
        {!last && <button className="lnk" onClick={finish}>{t('Skip')}</button>}
      </div>

      <div className="ob-track"
        onPointerDown={(e) => { w.current = (e.currentTarget as HTMLElement).clientWidth; start.current = { x: e.clientX, y: e.clientY } }}
        onPointerMove={(e) => {
          const s = start.current; if (!s) return
          const dx = e.clientX - s.x, dy = e.clientY - s.y
          if (!s.lock) { if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return; s.lock = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'; if (s.lock === 'x') (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId) }
          if (s.lock === 'x') setDrag(dx)
        }}
        onPointerUp={() => { const s = start.current; start.current = null; if (s?.lock === 'x') { const d = drag * dir; go(d < -60 ? i + 1 : d > 60 ? i - 1 : i) } }}
        onPointerCancel={() => { start.current = null; setDrag(0) }}>
        <div className={drag ? 'ob-rail dragging' : 'ob-rail'} style={{ transform: `translateX(calc(${-i * 100 * dir}% + ${drag}px))` }}>
          {SLIDES.map((s, n) => (
            <section key={s.k} className={n === i ? 'ob-slide on' : 'ob-slide'} aria-hidden={n !== i} aria-roledescription="slide" aria-label={`${n + 1} / ${SLIDES.length}`}>
              <s.Ill />
              <div className="ob-copy">
                <span className="ob-k">{t(s.k)}</span>
                <h1 className="ob-h">{t(s.title)}</h1>
                <p className="ob-p">{t(s.body)}</p>
              </div>
            </section>
          ))}
        </div>
      </div>

      <div className="ob-foot">
        <div className="ob-dots" role="tablist">{SLIDES.map((s, n) => <button key={s.k} role="tab" aria-selected={n === i} aria-label={t(s.k)} className={n === i ? 'on' : ''} onClick={() => go(n)} />)}</div>
        {last ? (
          <div className="stack" style={{ gap: 10, width: '100%' }}>
            <button className="btn pri" onClick={finish}>{t('Start using Tadween')}<I n="next" s={16} w={2.6} /></button>
            <button className="btn line" disabled={busy} onClick={async () => { setBusy(true); try { localStorage.setItem(ONBOARD_KEY, '1') } catch { /* */ } const e = await signInWithGoogle(); if (e) { setBusy(false); finish() } }}>
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width={18} height={18} alt="" />{busy ? t('Opening…') : t('Sign in with Google')}
            </button>
          </div>
        ) : (
          <button className="ob-next" aria-label={t('Next')} onClick={() => go(i + 1)}>
            <svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true"><circle cx="32" cy="32" r="30" className="ob-prog-bg" /><circle cx="32" cy="32" r="30" className="ob-prog" style={{ strokeDashoffset: 188.5 * (1 - (i + 1) / SLIDES.length) }} /></svg>
            <span className="vorb"><I n="next" s={20} w={2.6} /></span>
          </button>
        )}
      </div>
    </div>
  )
}
