import { Link } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import styles from './Navbar.module.css'

export default function Navbar() {
  const { user } = useUser()

  return (
    <nav className={styles.nav}>
      <Link to="/" className={styles.logo}>Padme</Link>
      <div className={styles.stats}>
        <span>{user?.xp || 0} XP</span>
        <span>{user?.streak || 0} 🔥</span>
      </div>
      <Link to="/profile">Profile</Link>
    </nav>
  )
}
