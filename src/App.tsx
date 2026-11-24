import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useStore } from './lib/store'
import { TabBar, GlobalToast } from './components/ui'
import { PageSkeleton } from './components/Skeleton'
import { SavePrompt } from './components/SignIn'
import Today from './screens/Today'
import Calendar from './screens/Calendar'
import Lists from './screens/Lists'
import Notes from './screens/Notes'
import { PHONE_READY } from './lib/phone'
import { lazy, Suspense, useEffect, useState } from 'react'
import type React from 'react'
import { Splash } from './components/Splash'
import { Onboarding, needsOnboarding } from './components/Onboarding'

// Tabs load with the app; everything else loads when first opened.
// If a screen's file is gone because a newer version was deployed, reload once to pick it up.
type Screen = { default: React.ComponentType }
const page = (load: () => Promise<Screen>) => lazy(() => load().then((m) => { sessionStorage.removeItem('tadween-chunk-reload'); return m }, (e) => {
  if (!sessionStorage.getItem('tadween-chunk-reload')) { sessionStorage.setItem('tadween-chunk-reload', '1'); location.reload() }
  throw e
}))
const Welcome = page(() => import('./screens/Welcome'))
const Setup = page(() => import('./screens/Setup'))
const NoteScreen = page(() => import('./screens/Note'))
const Ask = page(() => import('./screens/Ask'))
const Add = page(() => import('./screens/Add'))
const Listen = page(() => import('./screens/Listen'))
const Review = page(() => import('./screens/Review'))
const Settings = page(() => import('./screens/Settings'))
const Accessibility = page(() => import('./screens/Accessibility'))
const PhoneSignIn = page(() => import('./screens/PhoneSignIn'))
const Join = page(() => import('./screens/Join'))
const EmailAuth = page(() => import('./screens/EmailAuth'))

const TAB_ROUTES = ['/', '/calendar', '/lists', '/notes', '/settings']

export default function App() {
  const { ready, session, profile, guest } = useStore()
  const loc = useLocation()
  const nav = useNavigate()

  const [splash, setSplash] = useState(true)
  // Invite links skip the first-run slides and go straight to the shared list or note
  const [onboard, setOnboard] = useState(() => needsOnboarding() && !location.hash.startsWith('#/join/'))

  // Signed in after opening an invite link: carry on to it
  useEffect(() => {
    if (!session || !profile?.onboarded || loc.pathname.startsWith('/join/')) return
    let tok: string | null = null
    try { tok = localStorage.getItem('tadween-pending-invite') } catch { /* private mode */ }
    if (tok) nav('/join/' + tok, { replace: true })
  }, [session, profile?.onboarded, loc.pathname, nav])

  const splashEl = splash && <Splash ready={ready} onGone={() => setSplash(false)} />
  if (!ready) return <>{splash ? null : <div className="app"><PageSkeleton /></div>}{splashEl}</>

  if (!guest && profile && !profile.onboarded && loc.pathname !== '/setup') return <Navigate to="/setup" replace />

  return (
    <>
    <div className="app">
      {/* First launch: only onboarding is drawn; the app mounts when it's done (faster first paint) */}
      {!(onboard && !session) && <>
      <Suspense fallback={<PageSkeleton />}>
      <Routes>
        <Route path="/" element={<Today />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/lists" element={<Lists />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/journal" element={<Navigate to="/notes" replace />} />
        <Route path="/note/:id" element={<NoteScreen />} />
        <Route path="/ask" element={<Ask />} />
        <Route path="/add" element={<Add />} />
        <Route path="/listen" element={<Listen />} />
        <Route path="/review" element={<Review />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/settings/accessibility" element={<Accessibility />} />
        <Route path="/setup" element={<Setup />} />
        <Route path="/join/:token" element={<Join />} />
        <Route path="/welcome" element={session ? <Navigate to="/" replace /> : <Welcome />} />
        <Route path="/auth/email" element={session ? <Navigate to="/" replace /> : <EmailAuth />} />
        {PHONE_READY && <Route path="/auth/phone" element={session ? <Navigate to="/" replace /> : <PhoneSignIn />} />}
        <Route path="/auth/*" element={<Navigate to={session ? '/' : '/welcome'} replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
      {TAB_ROUTES.includes(loc.pathname) && <TabBar />}
      </>}
      {!onboard && <SavePrompt />}
      <GlobalToast />
      {onboard && !session && <Onboarding live={!splash} onDone={() => { setOnboard(false); if (loc.pathname !== '/') nav('/', { replace: true }) }} />}
    </div>
    {splashEl}
    </>
  )
}
