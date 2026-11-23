import { isAr } from './i18n'

/* How Tadween talks out loud.
   - friendly: casual. In Arabic it speaks Jordanian (عامية أردنية).
   - formal:   polite and proper. In Arabic it speaks Modern Standard Arabic (فصحى).
   The choice is kept on this device. */

export type Tone = 'friendly' | 'formal'
const KEY = 'tadween-tone'

export const getTone = (): Tone => {
  try { return localStorage.getItem(KEY) === 'formal' ? 'formal' : 'friendly' } catch { return 'friendly' }
}
export const setTone = (v: Tone) => { try { localStorage.setItem(KEY, v) } catch { /* ignore */ } }

// [English friendly, English formal, Arabic friendly (Jordanian), Arabic formal (MSA)]
const LINES: Record<string, [string, string, string, string]> = {
  morning: ['Morning, {name}!', 'Good morning, {name}.', 'صباح الخير يا {name}!', 'صباح الخير، {name}.'],
  afternoon: ['Hey {name}, good afternoon!', 'Good afternoon, {name}.', 'يعطيك العافية يا {name}!', 'طاب يومك، {name}.'],
  evening: ['Evening, {name}!', 'Good evening, {name}.', 'مسا الخير يا {name}!', 'مساء الخير، {name}.'],
  intro: ['I’m Tadween. Just tell me what’s on your mind.', 'I am Tadween. Please tell me how I may help you.', 'أنا تدوين. احكيلي شو ببالك وأنا بزبطلك ياه.', 'أنا تدوين. تفضّل بإخباري بما تحتاج إليه.'],
  events: ['You’ve got {n} things on today', 'You have {n} events scheduled today', 'عندك اليوم {n} مواعيد', 'لديك اليوم {n} من المواعيد'],
  next: [', next up is {title} at {time}.', ', the next being {title} at {time}.', '، وأول إشي {title} الساعة {time}.', '، أقربها {title} في الساعة {time}.'],
  clear: ['Nothing on your calendar today. Enjoy!', 'Your calendar is clear today.', 'ما عندك ولا إشي اليوم، روّق.', 'لا توجد لديك مواعيد اليوم.'],
  tasks: ['{n} tasks left, starting with {title}.', 'You have {n} open tasks, beginning with {title}.', 'ضايلك {n} مهام، أولها {title}.', 'لديك {n} مهام مفتوحة، أولها {title}.'],
  shop: ['Oh, and {n} things on {list}.', 'Additionally, {n} items remain on {list}.', 'وكمان في {n} أغراض على {list}.', 'إضافةً إلى {n} عناصر في {list}.'],
  saved: ['Done! Saved {n}.', 'Completed. {n} saved.', 'تمام، حفظتلك {n}.', 'تم الحفظ: {n}.'],
  adding: ['Adding {what}.', 'Adding {what} now.', 'رح أضيف {what}.', 'جارٍ إضافة {what}.'],
  nothing: ['Nothing’s picked yet.', 'Nothing is selected.', 'ما اخترت ولا إشي.', 'لم يتم تحديد أي عنصر.'],
  sample: ['Hi! This is how I’ll sound.', 'Hello. This is how I will speak to you.', 'أهلين! هيك رح أحكي معك.', 'مرحبًا. هكذا سأتحدث إليك.']
}

/** A spoken line in the chosen tone and the app's language. */
export function say(key: keyof typeof LINES | string, vars?: Record<string, string | number>): string {
  const row = LINES[key]
  if (!row) return key
  const formal = getTone() === 'formal'
  let s = row[(isAr ? 2 : 0) + (formal ? 1 : 0)]
  if (vars) for (const k in vars) s = s.split(`{${k}}`).join(String(vars[k]))
  return s
}

/** Greeting for the time of day. */
export const sayHello = (name: string) => {
  const h = new Date().getHours()
  return say(h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening', { name })
}
