import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { loadA11y, resetA11y, saveA11y, SIZES, type A11y } from '../lib/a11y'
import { t } from '../lib/i18n'
import { I } from '../components/Icon'
import { Switch, announce } from '../components/ui'

type Opt = { key: keyof A11y; icon: string; title: string; sub: string }

const GROUPS: { cap: string; opts: Opt[] }[] = [
  { cap: 'Reading', opts: [
    { key: 'bold', icon: 'bold', title: 'Bold text', sub: 'Heavier letters that are easier to see' },
    { key: 'spacing', icon: 'spacing', title: 'Easier reading', sub: 'More space between letters, words and lines' },
    { key: 'links', icon: 'underline', title: 'Underline links and buttons', sub: 'Shows what you can tap without relying on colour' }
  ] },
  { cap: 'Vision', opts: [
    { key: 'contrast', icon: 'contrast', title: 'Higher contrast', sub: 'Darker text and stronger borders' },
    { key: 'solid', icon: 'layers', title: 'Reduce transparency', sub: 'Solid backgrounds instead of see-through ones' }
  ] },
  { cap: 'Motion and touch', opts: [
    { key: 'motion', icon: 'motion', title: 'Reduce motion', sub: 'Turns off animations and sliding effects' },
    { key: 'bigTargets', icon: 'hand', title: 'Larger touch targets', sub: 'Bigger buttons and more space to tap' },
    { key: 'haptics', icon: 'vibrate', title: 'Vibration', sub: 'A small buzz when you switch tabs or hold the mic' }
  ] }
]

export default function Accessibility() {
  const { profile, updateProfile, guest } = useStore()
  const [a, setA] = useState<A11y>(loadA11y)
  const set = (patch: Partial<A11y>) => { const n = { ...a, ...patch }; setA(n); saveA11y(n) }
  const step = SIZES.indexOf(a.size) === -1 ? 1 : SIZES.indexOf(a.size)
  const pct = Math.round(a.size * 100)

  return (
    <main className="screen notab">
      <div className="hd3">
        <Link to="/settings" className="ib" aria-label={t('Back to Settings')}><I n="back" s={18} w={2.4} /></Link>
        <h1>{t('Accessibility')}</h1>
        <span />
      </div>

      <p className="cap" style={{ margin: '20px 8px 10px' }}>{t('Text size')}</p>
      <div className="card" style={{ padding: 16 }}>
        <p style={{ fontSize: 17, lineHeight: '24px', margin: '0 4px' }}>{t('This is how your text will look. Drag or tap to make it bigger or smaller.')}</p>
        <div className="row mt16" style={{ gap: 12 }}>
          <button className="ib" aria-label={t('Smaller text')} disabled={step === 0} onClick={() => set({ size: SIZES[Math.max(0, step - 1)] })}><span style={{ fontSize: 14, fontWeight: 700 }}>A</span><I n="minus" s={11} w={3} /></button>
          <input className="a11y-range grow" type="range" min={0} max={SIZES.length - 1} step={1} value={step}
            aria-label={t('Text size')} aria-valuetext={`${pct}%`} onChange={(e) => set({ size: SIZES[Number(e.target.value)] })} />
          <button className="ib" aria-label={t('Larger text')} disabled={step === SIZES.length - 1} onClick={() => set({ size: SIZES[Math.min(SIZES.length - 1, step + 1)] })}><span style={{ fontSize: 20, fontWeight: 700 }}>A</span><I n="plus" s={11} w={3} /></button>
        </div>
        <div className="spread mt12" style={{ padding: '0 4px' }}>
          <span className="sub num">{pct}%</span>
          {a.size !== 1 && <button className="lnk" style={{ fontSize: 14 }} onClick={() => set({ size: 1 })}>{t('Default size')}</button>}
        </div>
      </div>

      {GROUPS.map((g) => (
        <div key={g.cap}>
          <p className="cap" style={{ margin: '24px 8px 10px' }}>{t(g.cap)}</p>
          <div className="card flush">
            {g.opts.map((o) => (
              <div key={o.key} className="rw">
                <span className="ib sm"><I n={o.icon} s={18} /></span>
                <span className="grow" style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 16, fontWeight: 600 }}>{t(o.title)}</span>
                  <span className="sub" style={{ fontSize: 13, lineHeight: '18px' }}>{t(o.sub)}</span>
                </span>
                <Switch on={!!a[o.key]} onChange={(v) => set({ [o.key]: v } as Partial<A11y>)} label={t(o.title)} />
              </div>
            ))}
          </div>
        </div>
      ))}

      <p className="cap" style={{ margin: '24px 8px 10px' }}>{t('Hearing and voice')}</p>
      <div className="card flush">
        <div className="rw">
          <span className="ib sm"><I n="speaker" s={18} /></span>
          <span className="grow" style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 16, fontWeight: 600 }}>{t('Speak replies')}</span>
            <span className="sub" style={{ fontSize: 13, lineHeight: '18px' }}>{t('Tadween reads what it saved and found out loud')}</span>
          </span>
          <Switch on={!!profile?.speak_replies} onChange={(v) => updateProfile({ speak_replies: v })} label={t('Speak replies')} />
        </div>
      </div>
      {guest && <p className="ffoot">{t('These settings are saved on this phone.')}</p>}

      <button className="btn line mt24" onClick={() => { resetA11y(); setA(loadA11y()); announce(t('Accessibility settings reset')) }}><I n="reset" s={16} />{t('Reset to default')}</button>
    </main>
  )
}
