# Tadween — just say it

A voice-first everyday app: calendar, reminders, lists, family groceries and a journal. Speak in English or Arabic and Tadween turns it into events, reminders, list items and notes.

- **Live:** https://raqrabawi.github.io/nook/
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

## Supabase setup (one time)

**Authentication → URL Configuration**
- Site URL: `https://raqrabawi.github.io/nook/`
- Redirect URLs: `https://raqrabawi.github.io/nook/**` and `http://localhost:5173/**`

**Authentication → Sign In / Providers**
- **Google:** create an OAuth client (Web) in Google Cloud, add the redirect URI
  `https://xqwbzymgtbnxyeeyurfq.supabase.co/auth/v1/callback`, then paste the Client ID and secret into Supabase.
- **Apple:** needs an Apple Developer account — a Services ID, a Sign in with Apple key, and the same callback URL.
- **Phone:** connect an SMS provider (e.g. Twilio).
- **Email:** on by default.

The publishable key in `src/lib/supabase.ts` is safe in the browser — all data is protected by row-level security.
