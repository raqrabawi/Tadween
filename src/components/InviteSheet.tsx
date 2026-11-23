import { useState } from 'react'
import { useStore } from '../lib/store'
import { t } from '../lib/i18n'
import { I } from './Icon'
import { Tabs } from './Tabs'
import { Sheet, announce } from './ui'

/** Invite someone to a list or note with a link. They can view it only, or edit it with you. */
export function InviteSheet({ kind, item, onClose }: { kind: 'list' | 'note'; item: { id: string; title: string }; onClose: () => void }) {
  const { createInvite, guest, setSavePrompt } = useStore()
  const [role, setRole] = useState<'view' | 'edit'>('edit')
  const [busy, setBusy] = useState(false)

  const send = async () => {
    if (guest) { onClose(); setSavePrompt(true); return }
    setBusy(true)
    const link = await createInvite(kind, item.id, role)
    setBusy(false)
    if (!link) { announce(t('Couldn’t make the invite. Check your connection and try again.')); return }
    const text = t(role === 'edit' ? 'Edit “{title}” with me on Tadween: {link}' : 'See “{title}” on Tadween: {link}', { title: item.title, link })
    try {
      if (typeof navigator.share === 'function') await navigator.share({ title: item.title, text })
      else { await navigator.clipboard.writeText(text); announce(t('Invite link copied — send it to anyone')) }
      onClose()
    } catch { /* closed the share sheet */ }
  }

  return (
    <Sheet label={t('Invite to {title}', { title: item.title })} onClose={onClose}>
      <div className="hd3 mt12"><button className="ib" aria-label={t('Close')} onClick={onClose}><I n="close" s={15} w={2.6} /></button><h1>{t('Invite')}</h1><span /></div>
      <p className="sub inv-what">{t('Invite people to “{title}”', { title: item.title })}</p>
      <Tabs active={role} className="mt16" role="radiogroup" aria-label={t('What they can do')}>
        {(['view', 'edit'] as const).map((r) => (
          <button key={r} role="radio" aria-checked={role === r} className={role === r ? 'on' : ''} onClick={() => setRole(r)}>
            <I n={r === 'view' ? 'book' : 'pen'} s={16} /><span>{t(r === 'view' ? 'Can view' : 'Can edit')}</span>
          </button>
        ))}
      </Tabs>
      <p className="ffoot">{t(role === 'view'
        ? 'They can open it and see your changes, but can’t change anything.'
        : kind === 'list' ? 'They can add and tick off items and rename the list. Changes show for everyone.' : 'They can change the note with you. Changes show for everyone.')}</p>
      <button className="btn pri mt24" onClick={send} disabled={busy}>{busy ? t('Making the link…') : t('Send invite link')}<I n="share" s={16} w={2.4} /></button>
      <p className="ffoot">{t('Whoever opens the link and signs in joins. Only you can delete it or invite more people.')}</p>
    </Sheet>
  )
}
