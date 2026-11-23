// Tadween · natural "AI" voice for spoken replies (Azure neural text-to-speech).
// Arabic uses a Jordanian voice (ar-JO); English uses a natural US voice.
// The app calls this with the signed-in person's token; only signed-in people can use it.
// Settings (Neon function environment):
//   NEON_AUTH_JWKS       Neon Auth JWKS URL (to check the person's sign-in token)
//   AZURE_SPEECH_KEY     Azure Speech resource key   ← add in the Neon console, never in code
//   AZURE_SPEECH_REGION  Azure region of that resource, e.g. westeurope
//   AR_VOICE / EN_VOICE  optional voice overrides (defaults: ar-JO-SanaNeural, en-US-AvaNeural)
import crypto from 'node:crypto'

const env = process.env
const ORIGINS = ['https://raqrabawi.github.io', 'http://localhost:5173', 'http://localhost:4173']
let jwksCache = null

const cors = (req) => {
  const o = req.headers.get('origin') ?? ''
  return {
    'access-control-allow-origin': ORIGINS.includes(o) ? o : ORIGINS[0],
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': 'authorization, content-type',
    'access-control-max-age': '86400',
    vary: 'origin'
  }
}

async function keys(refresh = false) {
  if (!jwksCache || refresh) jwksCache = (await (await fetch(env.NEON_AUTH_JWKS)).json()).keys
  return jwksCache
}

// Check the Neon Auth JWT (EdDSA, RS256 or ES256) and return its subject
async function who(auth) {
  const tok = (auth ?? '').replace(/^Bearer\s+/i, '')
  const [h, p, s] = tok.split('.')
  if (!h || !p || !s) throw new Error('no token')
  const head = JSON.parse(Buffer.from(h, 'base64url').toString())
  let jwk = (await keys()).find((k) => k.kid === head.kid)
  if (!jwk) jwk = (await keys(true)).find((k) => k.kid === head.kid)
  if (!jwk) throw new Error('unknown key')
  const key = crypto.createPublicKey({ key: jwk, format: 'jwk' })
  const data = Buffer.from(`${h}.${p}`), sig = Buffer.from(s, 'base64url')
  const ok = head.alg === 'EdDSA' ? crypto.verify(null, data, key, sig)
    : head.alg === 'RS256' ? crypto.verify('sha256', data, key, sig)
      : head.alg === 'ES256' ? crypto.verify('sha256', data, { key, dsaEncoding: 'ieee-p1363' }, sig)
        : false
  if (!ok) throw new Error('bad signature')
  const claims = JSON.parse(Buffer.from(p, 'base64url').toString())
  if (claims.exp && claims.exp * 1000 < Date.now()) throw new Error('expired')
  return claims.sub
}

const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export default {
  async fetch(request) {
    const h = cors(request)
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: h })
    const ready = !!(env.AZURE_SPEECH_KEY && env.AZURE_SPEECH_REGION)
    if (request.method === 'GET') return Response.json({ ready }, { headers: h })
    if (request.method !== 'POST') return new Response('method', { status: 405, headers: h })
    try { await who(request.headers.get('authorization')) } catch { return new Response('unauthorized', { status: 401, headers: h }) }
    if (!ready) return new Response('not configured', { status: 503, headers: h })

    let body
    try { body = await request.json() } catch { return new Response('bad json', { status: 400, headers: h }) }
    const text = String(body.text ?? '').trim().slice(0, 1500)
    if (!text) return new Response('empty', { status: 400, headers: h })
    const ar = body.lang === 'ar'
    const voice = ar ? (env.AR_VOICE || 'ar-JO-SanaNeural') : (env.EN_VOICE || 'en-US-AvaNeural')
    const rate = body.tone === 'formal' ? '-6%' : '0%'
    const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${ar ? 'ar-JO' : 'en-US'}"><voice name="${voice}"><prosody rate="${rate}">${esc(text)}</prosody></voice></speak>`

    const r = await fetch(`https://${env.AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': env.AZURE_SPEECH_KEY,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
        'User-Agent': 'tadween'
      },
      body: ssml
    })
    if (!r.ok) { console.warn('azure tts failed', r.status, await r.text().catch(() => '')); return new Response('tts failed', { status: 502, headers: h }) }
    return new Response(await r.arrayBuffer(), { headers: { ...h, 'content-type': 'audio/mpeg', 'cache-control': 'private, max-age=86400' } })
  }
}
