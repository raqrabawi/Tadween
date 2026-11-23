import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useStore } from './lib/store'
import { Spinner, TabBar, GlobalToast } from './components/ui'
import { SavePrompt } from './components/SignIn'
import Welcome from './screens/Welcome'
import { Login, Register, Verify } from './screens/Auth'
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

const TAB_ROUTES = ['/', '/calendar', '/lists', '/notes']

export default function App() {
  const { ready, session, profile, guest } = useStore()
  const loc = useLocation()

  if (!ready) return <div className="app"><div className="screen"><Spinner /></div></div>

  if (!guest && profile && !profile.onboarded && loc.pathname !== '/setup') return <Navigate to="/setup" replace />

  return (
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
        <Route path="/auth/login" element={session ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/auth/register" element={session ? <Navigate to="/" replace /> : <Register />} />
        <Route path="/auth/verify" element={session ? <Navigate to="/" replace /> : <Verify />} />
        <Route path="/auth/email" element={<Navigate to="/auth/register" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {TAB_ROUTES.includes(loc.pathname) && <TabBar />}
      <SavePrompt />
      <GlobalToast />
    </div>
  )
}
