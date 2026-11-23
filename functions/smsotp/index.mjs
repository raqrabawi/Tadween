// Tadween · sends phone sign-in codes by SMS.
// Neon Auth calls this (send.otp webhook) with a 6-digit code; we text it through the SMS provider.
// Settings (Neon function environment):
//   NEON_AUTH_URL        Neon Auth base URL (for verifying that requests really come from Neon)
//   SMS_PROVIDER         "twilio" or "unifonic"
//   Twilio:   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM (a number or Messaging Service SID "MG…")
//   Unifonic: UNIFONIC_APP_SID, UNIFONIC_SENDER_ID
import crypto from 'node:crypto'

const env = process.env
let jwksCache = null

async function jwks(refresh = false) {
  if (!jwksCache || refresh) {
    const r = await fetch(`${env.NEON_AUTH_URL}/.well-known/jwks.json`)
    jwksCache = await r.json()
  }
  return jwksCache
}

async function verify(raw, h) {
  const sig = h.get('x-neon-signature'), kid = h.get('x-neon-signature-kid'), ts = h.get('x-neon-timestamp')
  if (!sig || !kid || !ts) throw new Error('missing signature headers')
  if (Math.abs(Date.now() - Number(ts)) > 5 * 60 * 1000) throw new Error('stale request')
  let jwk = (await jwks()).keys.find((k) => k.kid === kid)
  if (!jwk) jwk = (await jwks(true)).keys.find((k) => k.kid === kid)
  if (!jwk) throw new Error('unknown key')
  const [head, empty, s] = sig.split('.')
  if (empty !== '') throw new Error('bad signature format')
  const payloadB64 = Buffer.from(raw, 'utf8').toString('base64url')
  const signingInput = `${head}.${Buffer.from(`${ts}.${payloadB64}`, 'utf8').toString('base64url')}`
  const ok = crypto.verify(null, Buffer.from(signingInput), crypto.createPublicKey({ key: jwk, format: 'jwk' }), Buffer.from(s, 'base64url'))
  if (!ok) throw new Error('invalid signature')
}

function message(code) {
  // Bilingual so it reads right whatever the phone's language
  return `Tadween code: ${code}\nرمز تدوين: ${code}\nIt expires in 5 minutes. Don't share it.`
}

async function sendTwilio(to, body) {
  const auth = Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString('base64')
  const form = new URLSearchParams({ To: to, Body: body })
  if ((env.TWILIO_FROM || '').startsWith('MG')) form.set('MessagingServiceSid', env.TWILIO_FROM)
  else form.set('From', env.TWILIO_FROM || '')
  const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`, {
    method: 'POST', headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: form
  })
  if (!r.ok) throw new Error(`twilio ${r.status}`)
}

async function sendUnifonic(to, body) {
  const form = new URLSearchParams({ AppSid: env.UNIFONIC_APP_SID || '', SenderID: env.UNIFONIC_SENDER_ID || '', Body: body, Recipient: to.replace(/^\+/, '') })
  const r = await fetch('https://el.cloud.unifonic.com/rest/SMS/messages', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form })
  const j = await r.json().catch(() => ({}))
  if (!r.ok || j.success === false || j.success === 'false') throw new Error(`unifonic ${r.status}`)
}

export default {
  async fetch(request) {
    if (request.method !== 'POST') return new Response('Tadween SMS sender', { status: 200 })
    const raw = await request.text()
    try { await verify(raw, request.headers) } catch (e) { console.warn('rejected:', e.message); return new Response('unauthorized', { status: 401 }) }
    const evt = JSON.parse(raw)
    if (evt.event_type !== 'send.otp') return Response.json({ ok: true })
    const to = evt.user?.phone_number
    // Email codes are not used by Tadween (email sign-in is off); only SMS is delivered here.
    if (evt.event_data?.delivery_preference !== 'sms' || !to) return Response.json({ ok: true, skipped: true })
    const body = message(evt.event_data.otp_code)
    try {
      if (env.SMS_PROVIDER === 'twilio') await sendTwilio(to, body)
      else if (env.SMS_PROVIDER === 'unifonic') await sendUnifonic(to, body)
      else throw new Error('SMS_PROVIDER not set')
      return Response.json({ ok: true })
    } catch (e) {
      console.error('sms failed:', e.message) // never log the code itself
      return new Response('sms failed', { status: 502 })
    }
  }
}
