import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { UserProvider } from './context/UserContext'
import Home from './pages/Home'
import JourneyPage from './pages/JourneyPage'
import TopicPage from './pages/TopicPage'
import LessonPage from './pages/LessonPage'
import ProfilePage from './pages/ProfilePage'
import OnboardingPage from './pages/OnboardingPage'
import PlacementQuizPage from './pages/PlacementQuizPage'

function RequireUser({ children }) {
  const userId = localStorage.getItem('user_id')
  if (!userId) return <Navigate to="/onboarding" replace />
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
        </Routes>
      </UserProvider>
    </Router>
  )
}
