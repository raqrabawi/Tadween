import { createClient } from '@neon/neon-js/supabase'

// Neon project "Tadween": Managed Better Auth for sign-in and the Data API for reads and writes.
// The base URL is public; row-level security in Postgres decides what each signed-in person can see.
const url = import.meta.env.VITE_NEON_URL ?? 'https://ep-icy-frost-b9znduk1.c-7.eu-central-1.aws.neon.tech/tadween'

export const db = createClient(url)

/** Where OAuth providers send people back to: the app's own root (works on GitHub Pages and locally). */
export const redirectTo = () => window.location.origin + import.meta.env.BASE_URL
