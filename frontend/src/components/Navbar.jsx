import { NavLink } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { getLevelForXP } from '../config/levels'
import styles from './Navbar.module.css'

export default function Navbar() {
  const { user } = useUser()
  const xp = user?.xp ?? 0
  const level = getLevelForXP(xp)

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
        <span className={styles.level}>{level.icon} {level.name}</span>
        <span>{xp} XP</span>
        <span className={styles.streakStat}>
          {user?.streak ?? 0} 🔥
          {(user?.streak_shields ?? 0) > 0 && (
            <span className={styles.shieldBadge} title={`${user.streak_shields} streak shield${user.streak_shields > 1 ? 's' : ''}`}>
              🛡️{user.streak_shields}
            </span>
          )}
        </span>
      </div>
    </nav>
  )
}
