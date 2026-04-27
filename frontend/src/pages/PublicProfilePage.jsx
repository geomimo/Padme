import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { xpProgressToNextLevel, getNextLevel } from '../config/levels'
import styles from './PublicProfilePage.module.css'

export default function PublicProfilePage() {
  const { userId } = useParams()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!userId) return
    fetch(`/api/users/${userId}/public`)
      .then(r => {
        if (!r.ok) { setNotFound(true); setLoading(false); return null }
        return r.json()
      })
      .then(data => { if (data) { setProfile(data); setLoading(false) } })
  }, [userId])

  if (loading) return <div className={styles.loading}>Loading profile...</div>
  if (notFound) return <div className={styles.notFound}><h2>Profile not found</h2></div>

  const xp = profile.xp ?? 0
  const progress = xpProgressToNextLevel(xp)
  const nextLevel = getNextLevel(xp)

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1>{profile.level_icon} Profile</h1>

        <div className={styles.levelCard}>
          <div className={styles.levelHeader}>
            <span className={styles.levelIcon}>{profile.level_icon}</span>
            <div>
              <div className={styles.levelName}>{profile.level_name}</div>
              <div className={styles.levelXp}>{xp} XP total</div>
            </div>
          </div>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${progress * 100}%` }} />
          </div>
          <div className={styles.progressLabel}>
            {nextLevel
              ? <>{Math.round(progress * 100)}% to <strong>{nextLevel.name}</strong> ({profile.xp_to_next_level} XP away)</>
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
            <span className={styles.value}>{profile.streak} 🔥</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.label}>Lessons</span>
            <span className={styles.value}>{profile.lessons_completed}</span>
          </div>
        </div>

        {profile.topic_mastery?.length > 0 && (
          <div className={styles.masterySection}>
            <h2>Topic Mastery</h2>
            {profile.topic_mastery.map(t => (
              <div key={t.topic_id} className={styles.topicRow}>
                <span className={styles.topicIcon}>{t.icon}</span>
                <span className={styles.topicTitle}>{t.title}</span>
                <div className={styles.topicTrack}>
                  <div className={styles.topicFill} style={{ width: `${t.mastery_pct}%` }} />
                </div>
                <span className={styles.topicPct}>{t.mastery_pct}%</span>
              </div>
            ))}
          </div>
        )}

        {profile.badges_earned?.length > 0 && (
          <div className={styles.badgeSection}>
            <div className={styles.badgeSectionHeader}>
              <h2>Badges</h2>
              <span className={styles.badgeCount}>{profile.badges_earned.length} earned</span>
            </div>
            <div className={styles.badgeGrid}>
              {profile.badges_earned.map(badge => (
                <span key={badge.id} className={styles.badgePill} title={badge.description}>
                  {badge.icon} {badge.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
