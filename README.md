# Tadween — just say it

A voice-first everyday app: calendar, reminders, lists, family groceries and notes. Speak in English or Arabic and Tadween turns it into events, reminders, list items and notes.

- **Live:** https://raqrabawi.github.io/Tadween/
- **Stack:** React + Vite + TypeScript, installable PWA, Supabase (auth, Postgres with row-level security, realtime).
- **Sign-in:** Apple, Google, phone code or email code.

## Run locally

```bash
npm install
npm run dev
```

## Deploy

Every push to `main` builds and publishes to GitHub Pages (`.github/workflows/deploy.yml`).
In the repo, set **Settings → Pages → Source** to **GitHub Actions** once.

## Backend: Neon (project "Tadween")

- **Database:** Neon Postgres, project `soft-mud-10655524`, database `tadween`, region EU Central (Frankfurt).
- **Sign-in:** Neon Managed Better Auth: Google (works now with Neon's shared credentials), email code, Apple (needs your Apple Developer keys).
- **Data access:** Neon Data API from the browser with `@neon/neon-js` (Supabase-compatible client). Row-level security on every table; `public.ensure_me()` creates the profile and family on first sign-in; `public.join_family(code)` joins a family.
- **Base URL** (public): `https://ep-icy-frost-b9znduk1.c-7.eu-central-1.aws.neon.tech/tadween`, override with `VITE_NEON_URL`.

**Neon Console settings**
- Auth › Domains: `https://raqrabawi.github.io` is trusted; localhost is allowed.
- Auth › OAuth: add your own Google client for production, and Apple keys to enable Apple.
- Family lists refresh every 15 seconds and when the app regains focus. Turn on Neon Realtime later for instant updates.
