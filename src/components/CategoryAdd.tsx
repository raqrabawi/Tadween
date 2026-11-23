import { useEffect, useRef } from 'react'
import { I } from './Icon'
import { t } from '../lib/i18n'

/**
 * "New category" bar that slides over the category tabs (same size and place),
 * with Cancel and Done. Enter saves, Escape cancels.
 */
export function CategoryAdd({ id, value, onChange, onDone, onCancel }: {
  id: string; value: string; onChange: (v: string) => void; onDone: () => void; onCancel: () => void
}) {
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => { input.current?.focus() }, [])
  return (
    <form className="tabs-cover" onSubmit={(e) => { e.preventDefault(); onDone() }} onKeyDown={(e) => { if (e.key === 'Escape') onCancel() }}>
      <label className="sr" htmlFor={id}>{t('Category name')}</label>
      <I n="plus" s={16} w={2.4} className="tc-ic" />
      <input ref={input} id={id} className="inp" placeholder={t('Category name')} value={value} onChange={(e) => onChange(e.target.value)} enterKeyHint="done" />
      <button type="button" className="ib sm" aria-label={t('Cancel')} onClick={onCancel}><I n="close" s={13} w={2.6} /></button>
      <button type="submit" className="tc-done">{t('Done')}</button>
    </form>
  )
}
