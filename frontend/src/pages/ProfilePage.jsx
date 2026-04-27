import { Link } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import Navbar from '../components/Navbar'
import styles from './ProfilePage.module.css'

export default function ProfilePage() {
  const { user } = useUser()

  return (
    <div className={styles.container}>
      <Navbar />
      <main className={styles.main}>
        <Link to="/" className={styles.back}>← Home</Link>
        <h1>Profile</h1>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.label}>XP</span>
            <span className={styles.value}>{user?.xp || 0}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.label}>Streak</span>
            <span className={styles.value}>{user?.streak || 0} 🔥</span>
          </div>
        </div>
      </main>
    </div>
  )
}
