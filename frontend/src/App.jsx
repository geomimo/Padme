import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { UserProvider } from './context/UserContext'
import Home from './pages/Home'
import JourneyPage from './pages/JourneyPage'
import TopicPage from './pages/TopicPage'
import LessonPage from './pages/LessonPage'
import ProfilePage from './pages/ProfilePage'

export default function App() {
  return (
    <Router>
      <UserProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/journey" replace />} />
          <Route path="/journey" element={<JourneyPage />} />
          <Route path="/topics" element={<Home />} />
          <Route path="/topic/:topicId" element={<TopicPage />} />
          <Route path="/lesson/:lessonId" element={<LessonPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </UserProvider>
    </Router>
  )
}
