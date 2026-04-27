import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { UserProvider } from './context/UserContext'
import Home from './pages/Home'
import TopicPage from './pages/TopicPage'
import LessonPage from './pages/LessonPage'
import ProfilePage from './pages/ProfilePage'

export default function App() {
  return (
    <Router>
      <UserProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/topic/:topicId" element={<TopicPage />} />
          <Route path="/lesson/:lessonId" element={<LessonPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </UserProvider>
    </Router>
  )
}
