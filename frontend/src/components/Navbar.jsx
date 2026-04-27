import { NavLink } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import styles from './Navbar.module.css'

export default function Navbar() {
  const { user } = useUser()

  return (
    <nav className={styles.nav}>
      <NavLink to="/journey" className={styles.logo}>Padme</NavLink>

      <div className={styles.links}>
        <NavLink
          to="/journey"
          className={({ isActive }) => isActive ? `${styles.link} ${styles.active}` : styles.link}
        >
          Journey
        </NavLink>
        <NavLink
          to="/topics"
          className={({ isActive }) => isActive ? `${styles.link} ${styles.active}` : styles.link}
        >
          Topics
        </NavLink>
        <span className={`${styles.link} ${styles.disabled}`} title="Coming soon">
          Paths
        </span>
        <NavLink
          to="/profile"
          className={({ isActive }) => isActive ? `${styles.link} ${styles.active}` : styles.link}
        >
          Profile
        </NavLink>
      </div>

      <div className={styles.stats}>
        <span>{user?.xp ?? 0} XP</span>
        <span>{user?.streak ?? 0} 🔥</span>
      </div>
    </nav>
  )
}
