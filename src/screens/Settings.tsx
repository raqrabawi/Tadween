import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { supabase } from '../lib/supabase'
import { speak } from '../lib/voice'
import { I } from '../components/Icon'
import { Avatar, Sheet, Switch } from '../components/ui'

const PALETTES = [
  { id: 'marigold' as const, label: 'Marigold', meta: 'Sage & sun · new', d: ['#181A19', '#232625', '#F0A843', '#FAF8F5', '#FFFFFF', '#E08E26'] },
  { id: 'linen' as const, label: 'Linen', meta: 'Warm teal', d: ['#0F181D', '#16232A', '#5BE3BE', '#F5F2EC', '#FFFFFF', '#177A61'] },
  { id: 'classic' as const, label: 'Classic', meta: 'Cool · original', d: ['#0F181D', '#16232A', '#5BE3BE', '#E4EEF0', '#FFFFFF', '#2FBF98'] }
]

export default function Settings() {
  const { profile, family, members, session, updateProfile, theme, setTheme, palette, setPalette, joinFamily } = useStore()
  const [sheet, setSheet] = useState<null | 'invite' | 'email' | 'join'>(null)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const user = session?.user
  const name = profile?.name ?? 'You'
  const link = `${location.origin}${import.meta.env.BASE_URL}`

  const inviteText = `Join my family space on Nook: open ${link} , sign in, then Settings › Join a family with code ${family?.invite_code}`

  const saveEmail = async () => {
    setMsg(null)
    const { error } = await supabase.auth.updateUser({ email })
    setMsg(error ? error.message : `Check ${email} to confirm it.`)
  }

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
            <span className="sub">{family?.name ?? 'Family space'} · {members.length} {members.length === 1 ? 'person' : 'people'}</span>
          </span>
        </div>
        <div className="spread mt16" style={{ paddingTop: 14, borderTop: '1px solid rgba(228,238,240,.16)' }}>
          <span className="avs">{members.map((m) => <Avatar key={m.user_id} name={m.name} color={m.color} />)}</span>
          <span className="row" style={{ gap: 8 }}>
            <button className="tag" onClick={() => setSheet('join')}>Join</button>
            <button className="tag" style={{ background: 'var(--hotInk)', color: 'var(--sea)' }} onClick={() => setSheet('invite')}>Invite</button>
          </span>
        </div>
      </div>

      <div className="card tone-mint mt12">
        <div className="row" style={{ gap: 14 }}>
          <span className="vorb" style={{ width: 48, height: 48 }}><I n="mic" /></span>
          <span className="grow" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><span className="ttl">Nook Voice</span><span className="bi" style={{ alignSelf: 'flex-start' }}><b>EN</b><b>AR</b>Auto</span></span>
          <button className="ib plain" aria-label="Hear a sample" onClick={() => speak(`Hi ${name}, this is my ${profile?.voice_style?.toLowerCase()} voice.`, profile?.voice_style)}><I n="speaker" s={18} /></button>
        </div>
        <div className="spread mt16">
          <span style={{ display: 'flex', flexDirection: 'column' }}><span style={{ fontSize: 16, fontWeight: 600 }}>Speak replies</span><span className="sub" style={{ fontSize: 13 }}>{profile?.speak_replies ? 'Nook answers out loud' : 'Answers on screen only'}</span></span>
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
                <span style={{ background: p.d[0] }}><i style={{ background: p.d[1] }} /><i style={{ width: '70%', background: p.d[2] }} /></span>
                <span style={{ background: p.d[3] }}><i style={{ background: p.d[4] }} /><i style={{ width: '70%', background: p.d[5] }} /></span>
              </span>
              <span className="thm-name"><span>{p.label}<small>{p.meta}</small></span>{palette === p.id && <span className="thm-ck"><I n="check" s={12} w={3.4} /></span>}</span>
            </button>
          ))}
        </div>
        <div className="seg mt12" role="group" aria-label="Mode">
          {(['dark', 'light', 'system'] as const).map((m) => <button key={m} className={theme === m ? 'on' : ''} aria-pressed={theme === m} onClick={() => setTheme(m)}>{m === 'dark' ? 'Dark' : m === 'light' ? 'Light' : 'System'}</button>)}
        </div>
      </div>

      <div className="card flush mt24">
        {user?.phone && <div className="rw"><span className="ib sm"><I n="phone" s={18} /></span><span className="grow" style={{ display: 'flex', flexDirection: 'column' }}><span style={{ fontSize: 16, fontWeight: 600 }}>Phone</span><span className="sub num" style={{ fontSize: 13 }}>+{user.phone} · verified</span></span></div>}
        <button className="rw" onClick={() => setSheet('email')}>
          <span className="ib sm"><I n="mail" s={18} /></span>
          <span className="grow" style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}><span style={{ fontSize: 16, fontWeight: 600 }}>Email</span><span className="sub" style={{ fontSize: 13 }}>{user?.email ?? 'Optional · for receipts and backups'}</span></span>
          {!user?.email && <span className="tag sm acc">Add</span>}
        </button>
        <button className="rw" style={{ color: 'var(--red)' }} onClick={() => supabase.auth.signOut()}>
          <span className="ib sm"><I n="out" s={18} /></span><span className="grow" style={{ fontSize: 16, fontWeight: 600, textAlign: 'left' }}>Sign out</span>
        </button>
      </div>

      {sheet === 'invite' && (
        <Sheet label="Invite family" onClose={() => setSheet(null)}>
          <div className="hd3 mt12"><button className="ib" aria-label="Close" onClick={() => setSheet(null)}><I n="close" s={15} w={2.6} /></button><h1>Invite family</h1><span /></div>
          <div className="card hot mt20" style={{ textAlign: 'center' }}>
            <p className="cap">Your family code</p>
            <p className="num" style={{ fontSize: 44, fontWeight: 700, letterSpacing: 8, marginTop: 8 }}>{family?.invite_code}</p>
            <p className="sub mt8">They sign in to Nook, then Settings › Join and enter this code. Shared lists update live for everyone.</p>
          </div>
          <button className="btn pri mt20" onClick={() => (typeof navigator.share === 'function' ? navigator.share({ title: 'Join me on Nook', text: inviteText }).catch(() => undefined) : navigator.clipboard.writeText(inviteText).then(() => setMsg('Invite copied')))}>Share invite<I n="share" s={16} /></button>
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

      {sheet === 'email' && (
        <Sheet label="Email" onClose={() => setSheet(null)}>
          <div className="hd3 mt12"><button className="ib" aria-label="Close" onClick={() => setSheet(null)}><I n="close" s={15} w={2.6} /></button><h1>Email</h1><span /></div>
          <div className="form mt20"><label className="frow"><span className="fl">Email</span><input autoFocus type="email" className="inp" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} /></label></div>
          <p className="ffoot">Optional. Used for receipts, backups and signing in on a new device.</p>
          {msg && <p className="ffoot" role="status">{msg}</p>}
          <button className="btn pri mt20" disabled={!/.+@.+\..+/.test(email)} onClick={saveEmail}>Save email<I n="next" s={16} w={2.6} /></button>
        </Sheet>
      )}
    </main>
  )
}
