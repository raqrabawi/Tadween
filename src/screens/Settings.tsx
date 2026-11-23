import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { db } from '../lib/db'
import { speak } from '../lib/voice'
import { I } from '../components/Icon'
import { Avatar, Sheet, Switch } from '../components/ui'

const PALETTES = [
  { id: 'marigold' as const, label: 'Marigold', meta: 'Sage & sun', light: ['#FAF8F5', '#3D6B5E', '#E08E26'], dark: ['#181A19', '#5C9484', '#F0A843'] },
  { id: 'linen' as const, label: 'Linen', meta: 'Teal & seafoam', light: ['#F5F2EC', '#075056', '#177A61'], dark: ['#0F181D', '#7CC6CA', '#5BE3BE'] },
  { id: 'classic' as const, label: 'Classic', meta: 'Paper & ink', light: ['#F3EDE2', '#5B4332', '#A3432C'], dark: ['#1D1915', '#D9C4A6', '#C65A3B'] }
]

export default function Settings() {
  const { profile, family, members, session, updateProfile, theme, setTheme, palette, setPalette, joinFamily, guest, setSavePrompt } = useStore()
  const [sheet, setSheet] = useState<null | 'invite' | 'join'>(null)
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const user = session?.user
  const name = profile?.name ?? 'You'
  const link = `${location.origin}${location.pathname}`

  const inviteText = `Join my family space on Tadween: open ${link} , sign in, then Settings › Join a family with code ${family?.invite_code}`

  return (
    <main className="screen notab">
      <div className="hd3">
        <Link to="/" className="ib" aria-label="Back to Today"><I n="back" s={18} w={2.4} /></Link>
        <h1>Settings</h1>
        <Link to="/ask" className="ib" aria-label="Search"><I n="search" s={19} /></Link>
      </div>

      <div className="card hot mt20">
        <div className="row" style={{ gap: 14 }}>
          <span className="ib lg" style={{ fontSize: 22, fontWeight: 700 }}>{name.charAt(0).toUpperCase()}</span>
          <span className="grow" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 21, lineHeight: '26px', fontWeight: 700, letterSpacing: -.4 }}>{name}</span>
            <span className="sub">{guest ? 'Saved on this phone only' : `${family?.name ?? 'Family space'} · ${members.length} ${members.length === 1 ? 'person' : 'people'}`}</span>
          </span>
        </div>
        <div className="spread mt16" style={{ paddingTop: 14, borderTop: '1px solid rgba(228,238,240,.16)' }}>
          <span className="avs">{members.map((m) => <Avatar key={m.user_id} name={m.name} color={m.color} />)}</span>
          <span className="row" style={{ gap: 8 }}>
            <button className="tag" onClick={() => (guest ? setSavePrompt(true) : setSheet('join'))}>Join</button>
            <button className="tag" style={{ background: 'var(--hotInk)', color: 'var(--sea)' }} onClick={() => (guest ? setSavePrompt(true) : setSheet('invite'))}>Invite</button>
          </span>
        </div>
      </div>

      <div className="card tone-mint mt12">
        <div className="row" style={{ gap: 14 }}>
          <span className="vorb" style={{ width: 48, height: 48 }}><I n="mic" /></span>
          <span className="grow" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><span className="ttl">Tadween Voice</span><span className="bi" style={{ alignSelf: 'flex-start' }}><b>EN</b><b>AR</b>Auto</span></span>
          <button className="ib plain" aria-label="Hear a sample" onClick={() => speak(`Hi ${name}, this is my ${profile?.voice_style?.toLowerCase()} voice.`, profile?.voice_style)}><I n="speaker" s={18} /></button>
        </div>
        <div className="spread mt16">
          <span style={{ display: 'flex', flexDirection: 'column' }}><span style={{ fontSize: 16, fontWeight: 600 }}>Speak replies</span><span className="sub" style={{ fontSize: 13 }}>{profile?.speak_replies ? 'Tadween answers out loud' : 'Answers on screen only'}</span></span>
          <Switch on={!!profile?.speak_replies} onChange={(v) => updateProfile({ speak_replies: v })} label="Speak replies" />
        </div>
        <div className="seg mt16" role="group" aria-label="Voice style">
          {['Warm', 'Calm', 'Bright'].map((v) => <button key={v} className={profile?.voice_style === v ? 'on' : ''} aria-pressed={profile?.voice_style === v} onClick={() => { updateProfile({ voice_style: v }); speak(`This is ${v.toLowerCase()}.`, v) }}>{v}</button>)}
        </div>
      </div>

      <div className="card tone-sky mt12" style={{ padding: '16px 6px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))' }}>
          <button className={profile?.morning_brief ? 'orb on' : 'orb'} aria-pressed={!!profile?.morning_brief} onClick={() => updateProfile({ morning_brief: !profile?.morning_brief })}><span className="ib plain"><I n="sun" s={21} /></span>Morning brief</button>
          <button className={profile?.close_day ? 'orb on' : 'orb'} aria-pressed={!!profile?.close_day} onClick={() => updateProfile({ close_day: !profile?.close_day })}><span className="ib plain"><I n="moon" s={21} /></span>Close the day</button>
        </div>
      </div>

      <p className="cap" style={{ margin: '24px 8px 10px' }}>Appearance</p>
      <div className="card" style={{ padding: 14 }}>
        <div role="radiogroup" aria-label="Color theme" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 8 }}>
          {PALETTES.map((p) => (
            <button key={p.id} role="radio" aria-checked={palette === p.id} className="thm-opt" onClick={() => setPalette(p.id)}>
              <span className="thm-prev" aria-hidden="true">
                {[p.light, p.dark].map((c) => <span key={c[0]} style={{ background: c[0], ['--ring' as string]: c[0] }}><b style={{ background: c[1] }} /><b style={{ background: c[2] }} /></span>)}
              </span>
              <span className="thm-name"><span>{p.label}<small>{p.meta}</small></span>{palette === p.id && <span className="thm-ck"><I n="check" s={12} w={3.4} /></span>}</span>
            </button>
          ))}
        </div>
        <div className="seg mt12" role="group" aria-label="Mode">
          {(['dark', 'light', 'system'] as const).map((m) => <button key={m} className={theme === m ? 'on' : ''} aria-pressed={theme === m} onClick={() => setTheme(m)}>{m === 'dark' ? 'Dark' : m === 'light' ? 'Light' : 'System'}</button>)}
        </div>
      </div>

      {guest ? (
        <div className="card flush mt24">
          <Link to="/welcome" className="rw">
            <span className="ib sm"><I n="mail" s={18} /></span>
            <span className="grow" style={{ display: 'flex', flexDirection: 'column' }}><span style={{ fontSize: 16, fontWeight: 600 }}>Sign in to save</span><span className="sub" style={{ fontSize: 13 }}>Keep your lists safe and share with family</span></span>
            <I n="next" s={15} w={2.4} />
          </Link>
        </div>
      ) : (
      <div className="card flush mt24">
          <div className="rw">
            <span className="ib sm"><I n="mail" s={18} /></span>
            <span className="grow" style={{ display: 'flex', flexDirection: 'column' }}><span style={{ fontSize: 16, fontWeight: 600 }}>Signed in as</span><span className="sub" style={{ fontSize: 13 }}>{user?.email ?? profile?.email ?? '—'}</span></span>
          </div>
          <button className="rw" style={{ color: 'var(--red)' }} onClick={() => db.auth.signOut()}>
            <span className="ib sm"><I n="out" s={18} /></span><span className="grow" style={{ fontSize: 16, fontWeight: 600, textAlign: 'left' }}>Sign out</span>
          </button>
        </div>
      )}

      {sheet === 'invite' && (
        <Sheet label="Invite family" onClose={() => setSheet(null)}>
          <div className="hd3 mt12"><button className="ib" aria-label="Close" onClick={() => setSheet(null)}><I n="close" s={15} w={2.6} /></button><h1>Invite family</h1><span /></div>
          <div className="card hot mt20" style={{ textAlign: 'center' }}>
            <p className="cap">Your family code</p>
            <p className="num" style={{ fontSize: 44, fontWeight: 700, letterSpacing: 8, marginTop: 8 }}>{family?.invite_code}</p>
            <p className="sub mt8">They sign in to Tadween, then Settings › Join and enter this code. Shared lists update live for everyone.</p>
          </div>
          <button className="btn pri mt20" onClick={() => (typeof navigator.share === 'function' ? navigator.share({ title: 'Join me on Tadween', text: inviteText }).catch(() => undefined) : navigator.clipboard.writeText(inviteText).then(() => setMsg('Invite copied')))}>Share invite<I n="share" s={16} /></button>
          {msg && <p className="ffoot" role="status">{msg}</p>}
        </Sheet>
      )}

      {sheet === 'join' && (
        <Sheet label="Join a family" onClose={() => setSheet(null)}>
          <div className="hd3 mt12"><button className="ib" aria-label="Close" onClick={() => setSheet(null)}><I n="close" s={15} w={2.6} /></button><h1>Join a family</h1><span /></div>
          <label className="fld focus mt20" style={{ minHeight: 64 }}><span className="sr">Family code</span><input autoFocus className="inp num" maxLength={6} placeholder="CODE" style={{ fontSize: 26, letterSpacing: 8, textAlign: 'center', textTransform: 'uppercase' }} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} /></label>
          {msg && <p className="ffoot" role="alert">{msg}</p>}
          <button className="btn pri mt20" disabled={code.length < 6} onClick={async () => { const err = await joinFamily(code); if (err) setMsg(err); else { setSheet(null); setCode('') } }}>Join<I n="next" s={16} w={2.6} /></button>
        </Sheet>
      )}

    </main>
  )
}
