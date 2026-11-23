import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../lib/store'
import { t } from '../lib/i18n'
import { I } from '../components/Icon'
import { announce } from '../components/ui'

export const PENDING_INVITE = 'tadween-pending-invite'

/** Opened from an invite link: join the shared list or note, signing in first if needed. */
export default function Join() {
  const { token = '' } = useParams()
  const { session, acceptInvite } = useStore()
  const nav = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const tried = useRef(false)

  // Remember the invite so it still works after signing in
  useEffect(() => { try { localStorage.setItem(PENDING_INVITE, token) } catch { /* private mode */ } }, [token])

  useEffect(() => {
    if (!session || tried.current) return
    tried.current = true
    void acceptInvite(token).then((r) => {
      try { localStorage.removeItem(PENDING_INVITE) } catch { /* ignore */ }
      if (typeof r === 'string') { setError(r); return }
      announce(t(r.role === 'edit' ? 'You can now edit it together.' : 'You can now view it.'))
      nav(r.kind === 'note' ? `/note/${r.item_id}` : '/lists', { replace: true })
    })
  }, [session, token, acceptInvite, nav])

  const forget = () => { try { localStorage.removeItem(PENDING_INVITE) } catch { /* ignore */ } nav('/', { replace: true }) }

  return (
    <main className="screen notab">
      <div className="card empty mt24" style={{ gap: 10 }}>
        <span className="ib"><I n="people" s={20} /></span>
        {error ? <>
          <span className="ttl">{t('This invite doesn’t work')}</span>
          <span className="sub">{t('It may have been removed. Ask for a new link.')}</span>
          <button className="btn pri mt16" onClick={forget}>{t('OK')}</button>
        </> : session ? <>
          <span className="ttl">{t('Opening what was shared with you…')}</span>
        </> : <>
          <span className="ttl">{t('You’ve been invited')}</span>
          <span className="sub">{t('Sign in to open the shared list or note. It will open right after.')}</span>
          <Link to="/welcome" className="btn pri mt16">{t('Sign in')}<I n="next" s={16} w={2.6} /></Link>
          <button className="tag mt12" onClick={forget}>{t('Not now')}</button>
        </>}
      </div>
    </main>
  )
}
