import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useStore } from './lib/store'
import { Spinner, TabBar, GlobalToast } from './components/ui'
import { SavePrompt } from './components/SignIn'
import Today from './screens/Today'
import Calendar from './screens/Calendar'
import Lists from './screens/Lists'
import Notes from './screens/Notes'
import { PHONE_READY } from './lib/phone'
import { lazy, Suspense, useState } from 'react'
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

const TAB_ROUTES = ['/', '/calendar', '/lists', '/notes', '/settings']

export default function App() {
  const { ready, session, profile, guest } = useStore()
  const loc = useLocation()
  const nav = useNavigate()

  const [splash, setSplash] = useState(true)
  const [onboard, setOnboard] = useState(needsOnboarding)

  const splashEl = splash && <Splash ready={ready} onGone={() => setSplash(false)} />
  if (!ready) return <>{splash ? null : <div className="app"><div className="screen"><Spinner /></div></div>}{splashEl}</>

  if (!guest && profile && !profile.onboarded && loc.pathname !== '/setup') return <Navigate to="/setup" replace />

  return (
    <>
    <div className="app">
      {/* First launch: only onboarding is drawn; the app mounts when it's done (faster first paint) */}
      {!(onboard && !session) && <>
      <Suspense fallback={<div className="screen"><Spinner /></div>}>
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
        <Route path="/welcome" element={session ? <Navigate to="/" replace /> : <Welcome />} />
        {/* Email sign-in is switched off: Google only (phone codes to come) */}
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
