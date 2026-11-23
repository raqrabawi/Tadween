import { useEffect, useState } from 'react'
import { I } from './Icon'
import { t } from '../lib/i18n'

export interface FabAction { icon: string; label: string; hint?: string; onSelect: () => void }

/** Floating add button. Tapping it opens a short menu of what can be added on this page. */
export function Fab({ actions, label = 'Add' }: { actions: FabAction[]; label?: string }) {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (!open) return
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [open])

  return (
    <>
      {open && <div className="fab-scrim" onClick={() => setOpen(false)} aria-hidden="true" />}
      <div className={open ? 'fab-wrap open' : 'fab-wrap'}>
        {open && (
          <ul className="fab-menu" role="menu" aria-label={label}>
            {actions.map((a, i) => (
              <li key={a.label} role="none" style={{ animationDelay: `${(actions.length - 1 - i) * 30}ms` }}>
                <button role="menuitem" className="fab-item" onClick={() => { setOpen(false); a.onSelect() }}>
                  <span className="fab-lbl"><b>{a.label}</b>{a.hint && <span>{a.hint}</span>}</span>
                  <span className="fab-ic"><I n={a.icon} s={20} w={2} /></span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <button className="fab" aria-label={open ? t('Close') : t(label)} aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen(!open)}>
          <I n="plus" s={26} w={2.4} />
        </button>
      </div>
    </>
  )
}
