import { useState } from 'react'
import { useStore } from '../lib/store'
import { t } from '../lib/i18n'
import { I } from './Icon'
import { Tabs } from './Tabs'
import { Sheet, Switch, announce } from './ui'

/** Invite someone to a list or note with a link. They can view it only, or edit it with you. */
export function InviteSheet({ kind, item, onClose }: { kind: 'list' | 'note'; item: { id: string; title: string; family_id?: string | null }; onClose: () => void }) {
  const { createInvite, updateList, family, guest, setSavePrompt } = useStore()
  const [role, setRole] = useState<'view' | 'edit'>('edit')
  const [busy, setBusy] = useState(false)
  const [inFamily, setInFamily] = useState(!!item.family_id)

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
  const flipFamily = async (on: boolean) => {
    if (!family) return
    setInFamily(on)
    await updateList(item.id, { family_id: on ? family.id : null })
    announce(on ? t('Shared with your family space') : t('No longer shared with your family space'))
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
      {kind === 'list' && family && (
        <div className="form mt16">
          <div className="frow"><span className="grow" style={{ fontSize: 17 }}>{t('Share with my family space')}</span><Switch on={inFamily} onChange={flipFamily} label={t('Share with my family space')} /></div>
        </div>
      )}
      <button className="btn pri mt24" onClick={send} disabled={busy}>{busy ? t('Making the link…') : t('Send invite link')}<I n="share" s={16} w={2.4} /></button>
      <p className="ffoot">{t('Whoever opens the link and signs in joins. Only you can delete it or invite more people.')}</p>
    </Sheet>
  )
}
