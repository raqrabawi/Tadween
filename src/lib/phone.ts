import { db } from './db'

/**
 * Phone sign-in (SMS codes) through Neon Auth's Phone Number plugin.
 * Neon only allows phone sign-in for people who already have an account with a verified phone,
 * so the flow is: sign up with Google → add your phone in Settings → next time, sign in with phone.
 *
 * Switch PHONE_READY on once the SMS provider keys are set on the `smsotp` Neon function
 * and the phone plugin + send.otp webhook are enabled. Until then the entry points stay hidden.
 */
export const PHONE_READY = false

type BA = { phoneNumber: {
  sendOtp: (a: { phoneNumber: string }) => Promise<{ error?: { message?: string; status?: number } | null }>
  verify: (a: { phoneNumber: string; code: string; updatePhoneNumber?: boolean }) => Promise<{ data?: unknown; error?: { message?: string; status?: number } | null }>
} }
// The Supabase-style wrapper doesn't expose phone codes, but its Better Auth client does.
const ba = () => (db.auth as unknown as { _betterAuth?: BA })._betterAuth

export const COUNTRIES = [
  { code: '+962', name: 'Jordan', ar: 'الأردن', flag: '🇯🇴' },
  { code: '+966', name: 'Saudi Arabia', ar: 'السعودية', flag: '🇸🇦' },
  { code: '+971', name: 'UAE', ar: 'الإمارات', flag: '🇦🇪' },
  { code: '+970', name: 'Palestine', ar: 'فلسطين', flag: '🇵🇸' },
  { code: '+974', name: 'Qatar', ar: 'قطر', flag: '🇶🇦' },
  { code: '+965', name: 'Kuwait', ar: 'الكويت', flag: '🇰🇼' },
  { code: '+973', name: 'Bahrain', ar: 'البحرين', flag: '🇧🇭' },
  { code: '+968', name: 'Oman', ar: 'عُمان', flag: '🇴🇲' },
  { code: '+20', name: 'Egypt', ar: 'مصر', flag: '🇪🇬' },
  { code: '+961', name: 'Lebanon', ar: 'لبنان', flag: '🇱🇧' },
  { code: '+964', name: 'Iraq', ar: 'العراق', flag: '🇮🇶' },
  { code: '+1', name: 'US / Canada', ar: 'أمريكا / كندا', flag: '🇺🇸' },
  { code: '+44', name: 'UK', ar: 'بريطانيا', flag: '🇬🇧' }
]

/** Arabic-Indic digits → 0-9, drop spaces/dashes and a leading trunk 0, then join with the country code (E.164). */
export const latinDigits = (s: string) => s.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/\D/g, '')
export function toE164(country: string, local: string): string | null {
  const digits = latinDigits(local).replace(/^0+/, '')
  const full = country + digits
  return /^\+[1-9]\d{6,14}$/.test(full) ? full : null
}

const friendly = (e?: { message?: string; status?: number } | null) => {
  const m = (e?.message ?? '').toLowerCase()
  if (e?.status === 429 || /rate|too many/.test(m)) return 'Too many tries. Wait a minute and try again.'
  if (/invalid|incorrect|expired/.test(m)) return 'That code didn’t work. Check it, or send a new one.'
  if (/not found|no user|not exist/.test(m)) return 'No Tadween account uses this number yet. Sign in with Google, then add your phone in Settings.'
  return 'We couldn’t send a code right now. Try again in a moment.'
}

export async function sendPhoneCode(phone: string): Promise<string | null> {
  const c = ba()
  if (!c?.phoneNumber) return 'Phone sign-in isn’t available yet.'
  try { const r = await c.phoneNumber.sendOtp({ phoneNumber: phone }); return r?.error ? friendly(r.error) : null } catch { return friendly() }
}

/** `link` adds the number to the signed-in account; otherwise it signs in the account that owns the number. */
export async function verifyPhoneCode(phone: string, code: string, link = false): Promise<string | null> {
  const c = ba()
  if (!c?.phoneNumber) return 'Phone sign-in isn’t available yet.'
  try {
    const r = await c.phoneNumber.verify({ phoneNumber: phone, code, ...(link ? { updatePhoneNumber: true } : {}) })
    return r?.error ? friendly(r.error) : null
  } catch { return friendly() }
}
