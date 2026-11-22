export type Tone = 'mint' | 'sky' | 'sand' | 'lilac' | 'moss'

export interface Profile {
  id: string
  name: string | null
  phone: string | null
  email: string | null
  voice_style: string
  speak_replies: boolean
  morning_brief: boolean
  close_day: boolean
  theme: 'dark' | 'light' | 'system'
  palette: 'marigold' | 'linen' | 'classic'
  onboarded: boolean
}

export interface Family { id: string; name: string; invite_code: string; created_by: string }
export interface Member { family_id: string; user_id: string; role: string; color: string; name?: string | null }

export interface Category { id: string; name: string; position: number }
export interface List {
  id: string; owner_id: string; family_id: string | null; category_id: string | null
  title: string; tone: Tone; verb: string; staples: string[]; created_at: string
}
export interface Item {
  id: string; list_id: string; name: string; qty: string | null; aisle: string | null
  done: boolean; done_at: string | null; added_by: string | null; created_at: string
}
export interface EventRow {
  id: string; owner_id: string; family_id: string | null; title: string
  starts_at: string; ends_at: string | null; location: string | null; calendar: string; alert_minutes: number | null; source: string
}
export interface Reminder { id: string; title: string; remind_at: string | null; done: boolean; source: string }
export interface Note { id: string; title: string; body: string; kind: string; tags: string[]; opens_at: string | null; created_at: string; updated_at: string; image?: string | null }

/** What the voice/text understanding produces before the person confirms it. */
export type Draft =
  | { kind: 'event'; title: string; start: Date; end: Date; calendar: string; location?: string }
  | { kind: 'reminder'; title: string; at: Date | null }
  | { kind: 'item'; name: string; qty?: string; listHint?: string }
  | { kind: 'task'; title: string; due?: Date | null }
  | { kind: 'note'; title: string; body: string }
