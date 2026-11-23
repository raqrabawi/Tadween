import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { I } from '../components/Icon'
import { LogoLockup } from '../components/Logo'
import { AuthButtons } from '../components/SignIn'
import { t } from '../lib/i18n'

export default function Welcome() {
  const { authError } = useStore()

  return (
    <main className="screen col">
      <div className="hd">
        <LogoLockup width={92} dark={document.documentElement.classList.contains('dark')} />
        <span className="bi"><b>{t('EN')}</b><b>{t('AR')}</b>{t('Bilingual')}</span>
      </div>

      <div style={{ position: 'relative', height: 300, marginTop: 12 }} aria-hidden="true">
        <div style={{ position: 'absolute', left: '50%', top: '50%', width: 280, height: 280, margin: '-140px 0 0 -140px', borderRadius: '50%', border: '1px dashed var(--line)' }} />
        <div style={{ position: 'absolute', left: '50%', top: '50%', width: 190, height: 190, margin: '-95px 0 0 -95px', borderRadius: '50%', border: '1px solid var(--line)' }} />
        <span className="vorb" style={{ position: 'absolute', left: '50%', top: '50%', width: 104, height: 104, margin: '-52px 0 0 -52px' }}><I n="mic" s={34} w={1.8} /></span>
        <div className="gl" style={{ position: 'absolute', left: -4, top: 20, transform: 'rotate(-5deg)', borderRadius: 22, padding: '10px 16px 10px 10px', display: 'flex', gap: 10, alignItems: 'center', fontSize: 14, fontWeight: 600 }}>
          <span className="ib sm" style={{ background: 'var(--k-event)', color: '#16232A' }}><I n="cal" s={16} /></span>
          <span style={{ display: 'flex', flexDirection: 'column' }}>{t('Design review')}<span className="sub" style={{ fontSize: 12 }}>{t('Today · 09:30')}</span></span>
        </div>
        <div className="gl" style={{ position: 'absolute', right: -4, top: 116, transform: 'rotate(4deg)', borderRadius: 22, padding: '10px 16px 10px 10px', display: 'flex', gap: 10, alignItems: 'center', fontSize: 14, fontWeight: 600 }}>
          <span className="ib sm" style={{ background: 'var(--k-item)', color: '#16232A' }}><I n="bag" s={16} /></span>
          <span style={{ display: 'flex', flexDirection: 'column' }}>{t('Bread, milk')}<span className="sub" style={{ fontSize: 12 }}>{t('Family · added by Mama')}</span></span>
        </div>
      </div>

      <h1 className="h1 mtauto" style={{ fontSize: 38, lineHeight: '44px', letterSpacing: -1.2 }}>{t('Just say it.')}<br /><em>{t('Tadween keeps it.')}</em></h1>
      <p className="sub mt12" style={{ fontSize: 16, lineHeight: '23px' }}>{t('Your calendar, lists, family groceries and notes — by voice, in English or Arabic.')}</p>

      <div className="mt24"><AuthButtons /></div>
      <p className="sub mt16" style={{ textAlign: 'center', fontSize: 15 }}>{t('Have an account?')} <Link to="/auth/login" style={{ color: 'var(--acc)', fontWeight: 700 }}>{t('Sign in')}</Link></p>
      <Link to="/" className="btn" style={{ marginTop: 4, background: 'transparent', color: 'var(--ink2)', height: 44 }}>{t('Look around first')}<I n="next" s={15} w={2.4} /></Link>
      {authError && <p role="alert" className="sub mt12" style={{ textAlign: 'center', color: 'var(--red)' }}>{t('Can’t reach sign-in right now ({error}). Check your connection and try again.', { error: authError })}</p>}
    </main>
  )
}
