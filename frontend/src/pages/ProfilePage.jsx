import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { getLevelForXP, getNextLevel, xpProgressToNextLevel } from '../config/levels'
import Navbar from '../components/Navbar'
import BadgeIcon from '../components/BadgeIcon'
import styles from './ProfilePage.module.css'

const GOAL_PRESETS = [
  { label: 'Light', xp: 10 },
  { label: 'Regular', xp: 30 },
  { label: 'Intense', xp: 80 },
]

export default function ProfilePage() {
  const { user, setUser } = useUser()
  const [savingGoal, setSavingGoal] = useState(false)
  const [badges, setBadges] = useState([])

  const xp = user?.xp ?? 0
  const level = getLevelForXP(xp)
  const nextLevel = getNextLevel(xp)
  const progress = xpProgressToNextLevel(xp)

  const dailyXp = user?.daily_xp_today ?? 0
  const dailyGoal = user?.daily_goal_xp ?? 30
  const shields = user?.streak_shields ?? 0
  const dailyProgress = Math.min(dailyXp / dailyGoal, 1)

  useEffect(() => {
    if (!user?.id) return
    fetch(`/api/users/${user.id}/badges`)
      .then(r => r.json())
      .then(setBadges)
  }, [user?.id])

  const handleGoalChange = async (newGoal) => {
    if (savingGoal || newGoal === dailyGoal) return
    setSavingGoal(true)
    await fetch(`/api/users/${user.id}/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ daily_goal_xp: newGoal }),
    })
    setUser(prev => ({ ...prev, daily_goal_xp: newGoal }))
    setSavingGoal(false)
  }

  const earnedCount = badges.filter(b => b.earned).length

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

        <div className={styles.goalCard}>
          <div className={styles.goalHeader}>
            <span className={styles.goalTitle}>Daily Goal</span>
            <span className={styles.goalCount}>{dailyXp} / {dailyGoal} XP</span>
          </div>
          <div className={styles.progressTrack}>
            <div
              className={`${styles.progressFill} ${dailyProgress >= 1 ? styles.progressFillGoal : ''}`}
              style={{ width: `${dailyProgress * 100}%` }}
            />
          </div>
          {shields > 0 && (
            <div className={styles.shieldNote}>
              🛡️ {shields} streak shield{shields > 1 ? 's' : ''} — absorbs a missed day
            </div>
          )}
          <div className={styles.goalPresets}>
            {GOAL_PRESETS.map(p => (
              <button
                key={p.xp}
                className={`${styles.presetBtn} ${dailyGoal === p.xp ? styles.presetActive : ''}`}
                onClick={() => handleGoalChange(p.xp)}
                disabled={savingGoal}
              >
                {p.label} · {p.xp} XP
              </button>
            ))}
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
          <div className={styles.stat}>
            <span className={styles.label}>Shields</span>
            <span className={styles.value}>{shields} 🛡️</span>
          </div>
        </div>

        {badges.length > 0 && (
          <div className={styles.badgeSection}>
            <div className={styles.badgeSectionHeader}>
              <h2>Badges</h2>
              <span className={styles.badgeCount}>{earnedCount} / {badges.length}</span>
            </div>
            <div className={styles.badgeGrid}>
              {badges.map(badge => (
                <BadgeIcon key={badge.id} badge={badge} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
