import { Routes, Route, Navigate } from 'react-router-dom'
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext'
import AdminLayout from './components/AdminLayout'
import AdminLoginPage from './pages/AdminLoginPage'
import DashboardPage from './pages/DashboardPage'
import UsersPage from './pages/UsersPage'
import UserDetailPage from './pages/UserDetailPage'
import TopicsPage from './pages/TopicsPage'
import TopicFormPage from './pages/TopicFormPage'
import ChaptersPage from './pages/ChaptersPage'
import ChapterFormPage from './pages/ChapterFormPage'
import LessonsPage from './pages/LessonsPage'
import LessonFormPage from './pages/LessonFormPage'
import PathsPage from './pages/PathsPage'
import PathFormPage from './pages/PathFormPage'
import BadgesPage from './pages/BadgesPage'
import BadgeFormPage from './pages/BadgeFormPage'

function RequireAdmin({ children }) {
  const { token } = useAdminAuth()
  if (!token) return <Navigate to="/admin/login" replace />
  return children
}

function AdminRoutes() {
  return (
    <Routes>
      <Route path="login" element={<AdminLoginPage />} />
      <Route
        path="*"
        element={
          <RequireAdmin>
            <AdminLayout>
              <Routes>
                <Route index element={<DashboardPage />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="users/:userId" element={<UserDetailPage />} />
                <Route path="topics" element={<TopicsPage />} />
                <Route path="topics/new" element={<TopicFormPage />} />
                <Route path="topics/:topicId/edit" element={<TopicFormPage />} />
                <Route path="chapters" element={<ChaptersPage />} />
                <Route path="chapters/new" element={<ChapterFormPage />} />
                <Route path="chapters/:chapterId/edit" element={<ChapterFormPage />} />
                <Route path="lessons" element={<LessonsPage />} />
                <Route path="lessons/new" element={<LessonFormPage />} />
                <Route path="lessons/:lessonId/edit" element={<LessonFormPage />} />
                <Route path="paths" element={<PathsPage />} />
                <Route path="paths/new" element={<PathFormPage />} />
                <Route path="paths/:pathId/edit" element={<PathFormPage />} />
                <Route path="badges" element={<BadgesPage />} />
                <Route path="badges/new" element={<BadgeFormPage />} />
                <Route path="badges/:badgeId/edit" element={<BadgeFormPage />} />
              </Routes>
            </AdminLayout>
          </RequireAdmin>
        }
      />
    </Routes>
  )
}

export default function AdminApp() {
  return (
    <AdminAuthProvider>
      <AdminRoutes />
    </AdminAuthProvider>
  )
}
