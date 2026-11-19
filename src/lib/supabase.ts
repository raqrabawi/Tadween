import { createClient } from '@supabase/supabase-js'

// Public values: the URL and the publishable key are safe to ship in a web app.
// Row-level security in the database decides what each signed-in person can read and write.
const url = import.meta.env.VITE_SUPABASE_URL ?? 'https://xqwbzymgtbnxyeeyurfq.supabase.co'
const key = import.meta.env.VITE_SUPABASE_KEY ?? 'sb_publishable_QZ3GuRYVNxWpAVWwnIVzLA_e6XciWeB'

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' }
})

/** Where OAuth providers send people back to: the app's own root (works on GitHub Pages and locally). */
export const redirectTo = () => window.location.origin + import.meta.env.BASE_URL
