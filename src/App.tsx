import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useStore } from './lib/store'
import { Spinner, TabBar, GlobalToast } from './components/ui'
import { SavePrompt } from './components/SignIn'
import Welcome from './screens/Welcome'
import Setup from './screens/Setup'
import Today from './screens/Today'
import Calendar from './screens/Calendar'
import Lists from './screens/Lists'
import Notes from './screens/Notes'
import NoteScreen from './screens/Note'
import Ask from './screens/Ask'
import Add from './screens/Add'
import Listen from './screens/Listen'
import Review from './screens/Review'
import Settings from './screens/Settings'
import Accessibility from './screens/Accessibility'
import PhoneSignIn from './screens/PhoneSignIn'
import { PHONE_READY } from './lib/phone'
import { useState } from 'react'
import { Splash } from './components/Splash'
import { Onboarding, needsOnboarding } from './components/Onboarding'

const TAB_ROUTES = ['/', '/calendar', '/lists', '/notes']

export default function App() {
  const { ready, session, profile, guest } = useStore()
  const loc = useLocation()

  const [splash, setSplash] = useState(true)
  const [onboard, setOnboard] = useState(needsOnboarding)

  const splashEl = splash && <Splash ready={ready} onGone={() => setSplash(false)} />
  if (!ready) return <>{splash ? null : <div className="app"><div className="screen"><Spinner /></div></div>}{splashEl}</>

  if (!guest && profile && !profile.onboarded && loc.pathname !== '/setup') return <Navigate to="/setup" replace />

  return (
    <>
    <div className="app">
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
      {TAB_ROUTES.includes(loc.pathname) && <TabBar />}
      {!onboard && <SavePrompt />}
      <GlobalToast />
      {onboard && !session && <Onboarding onDone={() => setOnboard(false)} />}
    </div>
    {splashEl}
    </>
  )
}
