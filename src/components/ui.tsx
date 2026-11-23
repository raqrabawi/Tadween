import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { I } from './Icon'
import { t } from '../lib/i18n'

export function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} className={on ? 'pw on' : 'pw'} onClick={() => onChange(!on)}>
      <span />
    </button>
  )
}

export { TabBar } from './TabBar'

export function Toast({ text, action, onAction, onDone, ms = 3500 }: { text: string; action?: string; onAction?: () => void; onDone: () => void; ms?: number }) {
  useEffect(() => { const t = setTimeout(onDone, ms); return () => clearTimeout(t) }, [text, ms, onDone])
  return (
    <div role="status" className="toast gl">
      <span>{text}</span>
      {action && <button className="tag acc" style={{ minHeight: 44, borderRadius: 22, padding: '0 18px' }} onClick={() => { onAction?.(); onDone() }}>{action}</button>}
    </div>
  )
}

export function Avatar({ name, color, size = 28 }: { name?: string | null; color?: string; size?: number }) {
  const letter = (name ?? '?').trim().charAt(0).toUpperCase() || '?'
  return <span className="av" style={{ background: color ?? '#0B6B72', width: size, height: size, borderRadius: size / 2, fontSize: size * 0.43 }}>{letter}</span>
}

export function Back({ to = -1 as string | number, label = 'Back' }: { to?: string | number; label?: string }) {
  if (typeof to === 'string') return <Link to={to} className="ib" aria-label={t(label)}><I n="back" s={18} w={2.4} /></Link>
  return <button className="ib" aria-label={t(label)} onClick={() => history.back()}><I n="back" s={18} w={2.4} /></button>
}

export function Spinner() {
  return <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spin" aria-label={t('Loading')} /></div>
}

export function Sheet({ children, onClose, label }: { children: ReactNode; onClose: () => void; label: string }) {
  return (
    <div className="sheet-wrap" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={label} onClick={(e) => e.stopPropagation()}>
        <span className="grab" aria-hidden="true" />
        {children}
      </div>
    </div>
  )
}

/** Shows a short message from anywhere, e.g. after saving and leaving a screen. */
export const announce = (text: string) => window.dispatchEvent(new CustomEvent('tadween-toast', { detail: text }))

export function GlobalToast() {
  const [text, setText] = useState<string | null>(null)
  useEffect(() => {
    const on = (e: Event) => setText((e as CustomEvent<string>).detail)
    window.addEventListener('tadween-toast', on)
    return () => window.removeEventListener('tadween-toast', on)
  }, [])
  return text ? <Toast text={text} onDone={() => setText(null)} ms={2600} /> : null
}
