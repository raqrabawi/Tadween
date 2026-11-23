import { useEffect, useState } from 'react'
import { FONTS, applyFont, loadFont, storedFont, type Font } from '../lib/theme'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { db } from '../lib/db'
import { I } from '../components/Icon'
import { Avatar, Sheet } from '../components/ui'
import { lang, setLang, t } from '../lib/i18n'
import { loadA11y, saveA11y, SIZES, type A11y } from '../lib/a11y'

const PALETTES = [
  { id: 'marigold' as const, label: 'Marigold', meta: 'Sage & sun', light: ['#FAF8F5', '#3D6B5E', '#E08E26'], dark: ['#181A19', '#5C9484', '#F0A843'] },
  { id: 'linen' as const, label: 'Linen', meta: 'Teal & seafoam', light: ['#F5F2EC', '#075056', '#177A61'], dark: ['#0F181D', '#7CC6CA', '#5BE3BE'] },
  { id: 'classic' as const, label: 'Classic', meta: 'Paper & ink', light: ['#F3EDE2', '#5B4332', '#A3432C'], dark: ['#1D1915', '#D9C4A6', '#C65A3B'] }
]

export default function Settings() {
  const { profile, family, members, session, theme, setTheme, palette, setPalette, joinFamily, guest, setSavePrompt, updateProfile } = useStore()
  const [sheet, setSheet] = useState<null | 'invite' | 'join'>(null)
  const [font, setFont] = useState<Font>(storedFont)
  useEffect(() => { FONTS.forEach((f) => loadFont(f.id)) }, [])  // so each option previews in its own face
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const user = session?.user
  const name = profile?.name ?? t('You')
  const link = `${location.origin}${location.pathname}`

  const inviteText = t('Join my family space on Tadween: open {link} , sign in, then Settings › Join a family with code {code}', { link, code: family?.invite_code ?? '' })

  const [a11y, setA11y] = useState<A11y>(loadA11y)
  const sizeStep = Math.max(0, SIZES.indexOf(a11y.size))
  const setSize = (i: number) => { const n = { ...a11y, size: SIZES[Math.max(0, Math.min(SIZES.length - 1, i))] }; setA11y(n); saveA11y(n) }
  const resolved = theme === 'system' ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark') : theme
  const [langPick, setLangPick] = useState(lang)
  const pickLang = (l: 'en' | 'ar') => { if (l === lang) return; setLangPick(l); window.setTimeout(() => setLang(l), 380) }
  const speakOn = !!profile?.speak_replies

  return (
    <main className="screen notab st">
      <div className="hd">
        <Link to="/" className="ib" aria-label={t('Back to Today')}><I n="back" s={18} w={2.4} /></Link>
        <Link to="/ask" className="ib" aria-label={t('Search')}><I n="search" s={19} /></Link>
      </div>
      <h1 className="h1" style={{ margin: '14px 4px 0' }}>{t('Settings')}</h1>

      {/* Profile hero */}
      <section className="card hot st-hero mt16">
        <span className="st-orb a" aria-hidden="true" /><span className="st-orb b" aria-hidden="true" />
        <div className="row" style={{ gap: 16, position: 'relative' }}>
          <span className="st-av">{name.charAt(0).toUpperCase()}</span>
          <span className="grow" style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <span className="ell" style={{ fontSize: 24, lineHeight: '30px', fontWeight: 700, letterSpacing: -.5 }}>{name}</span>
            <span className="sub ell">{guest ? t('Saved on this phone only') : (user?.email ?? profile?.email ?? '')}</span>
          </span>
        </div>
        <div className="st-fam">
          <span className="row" style={{ gap: 10, minWidth: 0 }}>
            {members.length ? <span className="avs">{members.slice(0, 4).map((m) => <Avatar key={m.user_id} name={m.name} color={m.color} size={28} />)}</span> : <span className="st-fam-ic"><I n="people" s={16} /></span>}
            <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <span className="ell" style={{ fontSize: 14, fontWeight: 700 }}>{family?.name ?? t('Family space')}</span>
              <span className="ell" style={{ fontSize: 12, opacity: .8 }}>{guest ? t('Sign in to share lists') : t('People: {n}', { n: members.length })}</span>
            </span>
          </span>
          <span className="row" style={{ gap: 6 }}>
            <button className="tag" onClick={() => (guest ? setSavePrompt(true) : setSheet('join'))}>{t('Join')}</button>
            <button className="tag st-invite" onClick={() => (guest ? setSavePrompt(true) : setSheet('invite'))}><I n="plus" s={13} w={2.6} />{t('Invite')}</button>
          </span>
        </div>
      </section>

      {/* Language & look: every choice visible, with a sliding highlight */}
      <p className="cap st-cap">{t('Language & look')}</p>
      <section className={'st-look sky-' + resolved + (theme === 'system' ? ' sky-auto' : '')}>
        <span className="st-stars" aria-hidden="true" />
        <span className="st-sun" aria-hidden="true" />
        <div className="st-sw" role="radiogroup" aria-label={t('Language')} style={{ ['--n' as string]: 2, ['--i' as string]: langPick === 'ar' ? 1 : 0 }}>
          <span className="st-thumb" aria-hidden="true" />
          {([['en', 'Aa', 'English'], ['ar', 'ع', 'العربية']] as const).map(([code, glyph, label]) => (
            <button key={code} role="radio" aria-checked={langPick === code} lang={code} className={langPick === code ? 'on' : ''} onClick={() => pickLang(code)}>
              <span className="st-g">{glyph}</span><span>{label}</span>
            </button>
          ))}
        </div>
        <div className="st-sw st-mode" role="radiogroup" aria-label={t('Mode')} style={{ ['--n' as string]: 3, ['--i' as string]: ['light', 'dark', 'system'].indexOf(theme) }}>
          <span className="st-thumb" aria-hidden="true" />
          {(['light', 'dark', 'system'] as const).map((m) => (
            <button key={m} role="radio" aria-checked={theme === m} className={theme === m ? 'on' : ''} onClick={() => setTheme(m)}>
              <I n={m === 'light' ? 'sun' : m === 'dark' ? 'moon' : 'contrast'} s={18} />
              <span>{t(m === 'light' ? 'Light' : m === 'dark' ? 'Dark' : 'Auto')}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Quick controls */}
      <p className="cap st-cap">{t('Quick controls')}</p>
      <div className="st-tiles">
        <div className="st-tile" role="group" aria-label={t('Text size')}>
          <span className="st-ti st-glyph" style={{ fontSize: 13 + sizeStep * 2 }}>{t('Aa')}</span>
          <span className="st-tl">{t('Text size')}</span>
          <span className="st-step">
            <button aria-label={t('Smaller text')} disabled={sizeStep === 0} onClick={() => setSize(sizeStep - 1)}><I n="minus" s={13} w={3} /></button>
            <span className="num">{Math.round(a11y.size * 100)}%</span>
            <button aria-label={t('Larger text')} disabled={sizeStep === SIZES.length - 1} onClick={() => setSize(sizeStep + 1)}><I n="plus" s={13} w={3} /></button>
          </span>
        </div>
        <button className={speakOn ? 'st-tile on' : 'st-tile'} role="switch" aria-checked={speakOn} onClick={() => updateProfile({ speak_replies: !speakOn })}>
          <span className="st-ti"><I n="speaker" s={20} /></span>
          <span className="st-tl">{t('Speak replies')}</span>
          <span className="st-tv">{speakOn ? t('On') : t('Off')}</span>
        </button>
      </div>

      {/* Colour theme: mini phones */}
      <p className="cap st-cap">{t('Color theme')}</p>
      <div className="st-themes" role="radiogroup" aria-label={t('Color theme')}>
        {PALETTES.map((p) => {
          const c = resolved === 'dark' ? p.dark : p.light
          const on = palette === p.id
          return (
            <button key={p.id} role="radio" aria-checked={on} className={on ? 'st-theme on' : 'st-theme'} onClick={() => setPalette(p.id)}>
              <span className="st-phone" aria-hidden="true" style={{ background: c[0] }}>
                <i className="hero" style={{ background: c[1] }} />
                <i className="ln" style={{ background: c[1] }} /><i className="ln s" style={{ background: c[1] }} />
                <b style={{ background: c[2] }} />
                {on && <span className="st-ck"><I n="check" s={11} w={3.4} /></span>}
              </span>
              <span className="st-tn">{t(p.label)}</span>
              <span className="st-tm">{t(p.meta)}</span>
            </button>
          )
        })}
      </div>

      {/* Font strip */}
      <p className="cap st-cap">{t('Font')}</p>
      <div className="st-fonts" role="radiogroup" aria-label={t('Font')}>
        {FONTS.map((f) => (
          <button key={f.id} role="radio" aria-checked={font === f.id} className={font === f.id ? 'st-font on' : 'st-font'} style={{ fontFamily: f.stack }} onClick={() => { setFont(f.id); applyFont(f.id) }}>
            <span className="aa">{t('Aa')}</span>
            <span className="st-fn">{f.id}</span>
            <span className="st-fm">{t(f.meta)}</span>
          </button>
        ))}
      </div>

      {/* More */}
      <p className="cap st-cap">{t('More')}</p>
      <div className="card flush">
        <Link to="/settings/accessibility" className="rw">
          <span className="st-chip" style={{ background: '#7B6CF6' }}><I n="access" s={18} /></span>
          <span className="grow" style={{ display: 'flex', flexDirection: 'column' }}><span style={{ fontSize: 16, fontWeight: 600 }}>{t('Accessibility')}</span><span className="sub" style={{ fontSize: 13 }}>{t('Text size, contrast, motion and more')}</span></span>
          <I n="chev" s={15} w={2.4} />
        </Link>
        {!guest && (
          <button className="rw" onClick={() => setSheet('invite')}>
            <span className="st-chip" style={{ background: '#E0803A' }}><I n="people" s={18} /></span>
            <span className="grow" style={{ display: 'flex', flexDirection: 'column', textAlign: 'start' }}><span style={{ fontSize: 16, fontWeight: 600 }}>{t('Invite family')}</span><span className="sub" style={{ fontSize: 13 }}>{t('Share lists that update for everyone')}</span></span>
            <I n="chev" s={15} w={2.4} />
          </button>
        )}
        {guest ? (
          <Link to="/welcome" className="rw">
            <span className="st-chip" style={{ background: '#2F8F6B' }}><I n="mail" s={18} /></span>
            <span className="grow" style={{ display: 'flex', flexDirection: 'column' }}><span style={{ fontSize: 16, fontWeight: 600 }}>{t('Sign in to save')}</span><span className="sub" style={{ fontSize: 13 }}>{t('Keep your lists safe and share with family')}</span></span>
            <I n="chev" s={15} w={2.4} />
          </Link>
        ) : (
          <button className="rw" onClick={() => db.auth.signOut()}>
            <span className="st-chip" style={{ background: '#D2554A' }}><I n="out" s={18} /></span>
            <span className="grow" style={{ fontSize: 16, fontWeight: 600, textAlign: 'start', color: 'var(--red)' }}>{t('Sign out')}</span>
          </button>
        )}
      </div>

      <p className="st-foot"><b>{t('Tadween')}</b> · {t('your day, in your words')}</p>

      {sheet === 'invite' && (
        <Sheet label={t('Invite family')} onClose={() => setSheet(null)}>
          <div className="hd3 mt12"><button className="ib" aria-label={t('Close')} onClick={() => setSheet(null)}><I n="close" s={15} w={2.6} /></button><h1>{t('Invite family')}</h1><span /></div>
          <div className="card hot mt20" style={{ textAlign: 'center' }}>
            <p className="cap">{t('Your family code')}</p>
            <p className="num" style={{ fontSize: 44, fontWeight: 700, letterSpacing: 8, marginTop: 8 }}>{family?.invite_code}</p>
            <p className="sub mt8">{t('They sign in to Tadween, then Settings › Join and enter this code. Shared lists update live for everyone.')}</p>
          </div>
          <button className="btn pri mt20" onClick={() => (typeof navigator.share === 'function' ? navigator.share({ title: 'Join me on Tadween', text: inviteText }).catch(() => undefined) : navigator.clipboard.writeText(inviteText).then(() => setMsg('Invite copied')))}>{t('Share invite')}<I n="share" s={16} /></button>
          {msg && <p className="ffoot" role="status">{msg}</p>}
        </Sheet>
      )}

      {sheet === 'join' && (
        <Sheet label={t('Join a family')} onClose={() => setSheet(null)}>
          <div className="hd3 mt12"><button className="ib" aria-label={t('Close')} onClick={() => setSheet(null)}><I n="close" s={15} w={2.6} /></button><h1>{t('Join a family')}</h1><span /></div>
          <label className="fld focus mt20" style={{ minHeight: 64 }}><span className="sr">{t('Family code')}</span><input autoFocus className="inp num" maxLength={6} placeholder={t('CODE')} style={{ fontSize: 26, letterSpacing: 8, textAlign: 'center', textTransform: 'uppercase' }} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} /></label>
          {msg && <p className="ffoot" role="alert">{msg}</p>}
          <button className="btn pri mt20" disabled={code.length < 6} onClick={async () => { const err = await joinFamily(code); if (err) setMsg(err); else { setSheet(null); setCode('') } }}>{t('Join')}<I n="next" s={16} w={2.6} /></button>
        </Sheet>
      )}

    </main>
  )
}
