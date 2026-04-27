import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { UserProvider, useUser } from './context/UserContext'
import Home from './pages/Home'
import JourneyPage from './pages/JourneyPage'
import TopicPage from './pages/TopicPage'
import LessonPage from './pages/LessonPage'
import ProfilePage from './pages/ProfilePage'
import OnboardingPage from './pages/OnboardingPage'
import PlacementQuizPage from './pages/PlacementQuizPage'
import PathsPage from './pages/PathsPage'
import PathDetailPage from './pages/PathDetailPage'

const ONBOARDING_ENABLED = import.meta.env.VITE_ONBOARDING_ENABLED === 'true'

function RequireUser({ children }) {
  const { loading } = useUser()

  if (!ONBOARDING_ENABLED) {
    // Auto-create path: just wait for UserContext to finish creating the user
    if (loading) return null
    return children
  }

  // Onboarding path: redirect immediately if no user_id in storage
  if (!localStorage.getItem('user_id')) return <Navigate to="/onboarding" replace />
  return children
}

export default function App() {
  return (
    <Router>
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
        </Routes>
      </UserProvider>
    </Router>
  )
}
