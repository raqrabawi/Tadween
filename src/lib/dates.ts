export const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }
export const sameDay = (a: Date, b: Date) => startOfDay(a).getTime() === startOfDay(b).getTime()
export const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
export const hm = (d: Date | string) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
export const weekStart = (d: Date) => { const x = startOfDay(d); const day = (x.getDay() + 6) % 7; return addDays(x, -day) }
export const minutesUntil = (d: Date | string) => Math.round((new Date(d).getTime() - Date.now()) / 60000)
export const relTime = (d: Date | string) => {
  const m = minutesUntil(d)
  if (m < 0) return m > -60 ? 'now' : 'earlier'
  if (m < 60) return `in ${m} min`
  const h = Math.round(m / 60)
  if (h < 24) return `in ${h} h`
  return `in ${Math.round(h / 24)} d`
}
export const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning,' : h < 18 ? 'Good afternoon,' : 'Good evening,' }
export const daysAgo = (d: Date | string) => Math.max(0, Math.round((startOfDay(new Date()).getTime() - startOfDay(new Date(d)).getTime()) / 86400000))
