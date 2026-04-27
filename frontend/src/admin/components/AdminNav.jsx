import { NavLink, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthContext'
import styles from './AdminNav.module.css'

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: '📊', end: true },
  { to: '/admin/users', label: 'Users', icon: '👥' },
  { to: '/admin/topics', label: 'Topics', icon: '🗂️' },
  { to: '/admin/chapters', label: 'Chapters', icon: '📖' },
  { to: '/admin/lessons', label: 'Lessons', icon: '📝' },
  { to: '/admin/paths', label: 'Paths', icon: '🛤️' },
  { to: '/admin/badges', label: 'Badges', icon: '🏅' },
]

export default function AdminNav() {
  const { logout } = useAdminAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/admin/login')
  }

  return (
    <nav className={styles.nav}>
      <div className={styles.brand}>
        <span className={styles.logo}>Padme</span>
        <span className={styles.adminLabel}>Admin</span>
      </div>
      <ul className={styles.list}>
        {NAV_ITEMS.map(({ to, label, icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `${styles.link} ${isActive ? styles.active : ''}`
              }
            >
              <span className={styles.icon}>{icon}</span>
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
      <button className={styles.logout} onClick={handleLogout}>
        Logout
      </button>
    </nav>
  )
}
