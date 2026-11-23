import { PhoneFlow } from '../components/PhoneFlow'
import { Back } from '../components/ui'
import { t } from '../lib/i18n'

/** Sign in with phone + SMS code (for accounts that already added a phone in Settings). */
export default function PhoneSignIn() {
  return (
    <main className="screen col notab">
      <div className="hd"><Back to="/welcome" /></div>
      <h1 className="h1 mt20" style={{ margin: '20px 4px 0' }}>{t('Sign in with phone')}</h1>
      <p className="sub mt8" style={{ margin: '8px 4px 0', fontSize: 16, lineHeight: '23px' }}>{t('Use the number you added in Settings.')}</p>
      <PhoneFlow onDone={() => { location.hash = '#/'; location.reload() }} />
    </main>
  )
}
