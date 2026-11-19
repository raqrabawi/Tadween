import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useStore } from './lib/store'
import { Spinner, TabBar } from './components/ui'
import Welcome from './screens/Welcome'
import PhoneAuth from './screens/PhoneAuth'
import EmailAuth from './screens/EmailAuth'
import Setup from './screens/Setup'
import Today from './screens/Today'
import Calendar from './screens/Calendar'
import Lists from './screens/Lists'
import Journal from './screens/Journal'
import NoteScreen from './screens/Note'
import Ask from './screens/Ask'
import Add from './screens/Add'
import Listen from './screens/Listen'
import Review from './screens/Review'
import Settings from './screens/Settings'

const TAB_ROUTES = ['/', '/calendar', '/lists', '/journal']

export default function App() {
  const { ready, session, profile } = useStore()
  const loc = useLocation()

  if (!ready) return <div className="app"><div className="screen"><Spinner /></div></div>

  if (!session) {
    return (
      <div className="app">
        <Routes>
          <Route path="/auth/phone" element={<PhoneAuth />} />
          <Route path="/auth/email" element={<EmailAuth />} />
          <Route path="*" element={<Welcome />} />
        </Routes>
      </div>
    )
  }

  if (profile && !profile.onboarded && loc.pathname !== '/setup') return <Navigate to="/setup" replace />

  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Today />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/lists" element={<Lists />} />
        <Route path="/journal" element={<Journal />} />
        <Route path="/note/:id" element={<NoteScreen />} />
        <Route path="/ask" element={<Ask />} />
        <Route path="/add" element={<Add />} />
        <Route path="/listen" element={<Listen />} />
        <Route path="/review" element={<Review />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/setup" element={<Setup />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {TAB_ROUTES.includes(loc.pathname) && <TabBar />}
    </div>
  )
}
