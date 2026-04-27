import { Link } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { getLevelForXP, getNextLevel, xpProgressToNextLevel } from '../config/levels'
import Navbar from '../components/Navbar'
import styles from './ProfilePage.module.css'

export default function ProfilePage() {
  const { user } = useUser()
  const xp = user?.xp ?? 0
  const level = getLevelForXP(xp)
  const nextLevel = getNextLevel(xp)
  const progress = xpProgressToNextLevel(xp)

  return (
    <div className={styles.container}>
      <Navbar />
      <main className={styles.main}>
        <Link to="/" className={styles.back}>← Home</Link>
        <h1>Profile</h1>

        <div className={styles.levelCard}>
          <div className={styles.levelHeader}>
            <span className={styles.levelIcon}>{level.icon}</span>
            <div>
              <div className={styles.levelName}>{level.name}</div>
              <div className={styles.levelXp}>{xp} XP total</div>
            </div>
          </div>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${progress * 100}%` }} />
          </div>
          <div className={styles.progressLabel}>
            {nextLevel
              ? <>{Math.round(progress * 100)}% to <strong>{nextLevel.name}</strong> ({user?.xp_to_next_level ?? nextLevel.min - xp} XP away)</>
              : 'Maximum level reached'}
          </div>
        </div>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.label}>XP</span>
            <span className={styles.value}>{xp}</span>
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
