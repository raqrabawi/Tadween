import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import { speak } from '../lib/voice'
import { I } from '../components/Icon'

export default function Setup() {
  const { profile, updateProfile, session } = useStore()
  const nav = useNavigate()
  const [name, setName] = useState(() => {
    const u = (session?.user ?? {}) as { name?: string; user_metadata?: { name?: string; full_name?: string } }
    let pending = ''
    try { pending = sessionStorage.getItem('tadween-pending-name') ?? '' } catch { /* ignore */ }
    return profile?.name || pending || u.name || u.user_metadata?.full_name || u.user_metadata?.name || ''
  })
  const [mic, setMic] = useState<'idle' | 'ok' | 'denied'>('idle')
  const [notif, setNotif] = useState<'idle' | 'ok' | 'denied'>(() => ('Notification' in window && Notification.permission === 'granted' ? 'ok' : 'idle'))
  const [playing, setPlaying] = useState(false)

  const askMic = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true })
      s.getTracks().forEach((t) => t.stop())
      setMic('ok')
    } catch { setMic('denied') }
  }
  const askNotif = async () => {
    if (!('Notification' in window)) { setNotif('denied'); return }
    const p = await Notification.requestPermission()
    setNotif(p === 'granted' ? 'ok' : 'denied')
  }
  const sample = () => {
    setPlaying(true)
    speak(`Good ${new Date().getHours() < 12 ? 'morning' : 'evening'}, ${name || 'there'}. I'm Tadween. Just tell me what's on your mind.`, profile?.voice_style, () => setPlaying(false))
  }
  const finish = async () => {
    await updateProfile({ name: name.trim() || profile?.name || 'Friend', onboarded: true })
    try { sessionStorage.removeItem('tadween-pending-name') } catch { /* ignore */ }
    nav('/', { replace: true })
  }

  const perm = (label: string, meta: string, icon: string, state: string, onClick: () => void) => (
    <button className={state === 'ok' ? 'orb on' : 'orb'} onClick={onClick} aria-pressed={state === 'ok'}>
      <span className="ib plain"><I n={icon} s={22} w={1.9} /></span>
      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>{label}<span style={{ fontSize: 11, fontWeight: 500, color: state === 'denied' ? 'var(--red)' : 'var(--ink3)' }}>{state === 'denied' ? 'Blocked in settings' : state === 'ok' ? 'Allowed' : meta}</span></span>
    </button>
  )

  return (
    <main className="screen col">
      <div className="hd"><span className="cap">Last step</span><button className="ib wide" onClick={finish}>Skip</button></div>
      <h1 className="h1 mt20" style={{ fontSize: 34, lineHeight: '40px' }}>Set up<br /><em>Tadween.</em></h1>

      <div className="form mt20"><label className="frow"><span className="fl">Name</span><input className="inp" value={name} onChange={(e) => setName(e.target.value)} placeholder="What should Tadween call you?" autoComplete="given-name" /></label></div>

      <div className="card hot mt16">
        <div className="spread">
          <span className="vorb" style={{ width: 52, height: 52, boxShadow: 'none' }}><I n="mic" s={22} /></span>
          <button className="ib" onClick={sample} aria-label="Hear Tadween speak"><I n={playing ? 'pause' : 'speaker'} s={18} /></button>
        </div>
        <p className="ttl mt16" style={{ fontSize: 20 }}>Talk the way you talk.</p>
        <p className="sub mt8">Tadween understands English and Arabic and answers you out loud. Tap the speaker to hear it.</p>
      </div>

      <div className="card tone-sky mt12" style={{ padding: '20px 8px 18px' }}>
        <p className="cap" style={{ margin: '0 12px 16px' }}>Allow</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))' }}>
          {perm('Microphone', 'to hear you', 'mic', mic, askMic)}
          {perm('Notifications', 'for reminders', 'bell', notif, askNotif)}
        </div>
      </div>

      <button className="btn pri mtauto" onClick={finish} style={{ marginTop: 24 }}>Start using Tadween<I n="next" s={16} w={2.6} /></button>
    </main>
  )
}
