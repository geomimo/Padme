import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { UserProvider, useUser } from './context/UserContext'
import AdminApp from './admin/AdminApp'
import Home from './pages/Home'
import JourneyPage from './pages/JourneyPage'
import TopicPage from './pages/TopicPage'
import LessonPage from './pages/LessonPage'
import ProfilePage from './pages/ProfilePage'
import OnboardingPage from './pages/OnboardingPage'
import PlacementQuizPage from './pages/PlacementQuizPage'
import PathsPage from './pages/PathsPage'
import PathDetailPage from './pages/PathDetailPage'
import LeaderboardPage from './pages/LeaderboardPage'
import PublicProfilePage from './pages/PublicProfilePage'

const ONBOARDING_ENABLED = import.meta.env.VITE_ONBOARDING_ENABLED === 'true'

function RequireUser({ children }) {
  const { loading } = useUser()

  if (!ONBOARDING_ENABLED) {
    if (loading) return null
    return children
  }

  if (!localStorage.getItem('user_id')) return <Navigate to="/onboarding" replace />
  return children
}

function MainRoutes() {
  return (
    <UserProvider>
      <Routes>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/placement-quiz" element={<PlacementQuizPage />} />
        <Route path="/" element={<RequireUser><Navigate to="/journey" replace /></RequireUser>} />
        <Route path="/journey" element={<RequireUser><JourneyPage /></RequireUser>} />
        <Route path="/topics" element={<RequireUser><Home /></RequireUser>} />
        <Route path="/topic/:topicId" element={<RequireUser><TopicPage /></RequireUser>} />
        <Route path="/lesson/:lessonId" element={<RequireUser><LessonPage /></RequireUser>} />
        <Route path="/profile" element={<RequireUser><ProfilePage /></RequireUser>} />
        <Route path="/paths" element={<RequireUser><PathsPage /></RequireUser>} />
        <Route path="/paths/:pathId" element={<RequireUser><PathDetailPage /></RequireUser>} />
        <Route path="/leaderboard" element={<RequireUser><LeaderboardPage /></RequireUser>} />
        <Route path="/profile/:userId" element={<PublicProfilePage />} />
      </Routes>
    </UserProvider>
  )
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="/*" element={<MainRoutes />} />
      </Routes>
    </Router>
  )
}
