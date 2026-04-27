import { useEffect, useState } from 'react'
import { adminFetch } from '../context/AdminAuthContext'
import styles from './DashboardPage.module.css'

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    adminFetch('/api/admin/stats')
      .then((r) => r.json())
      .then(setStats)
      .catch(() => setError('Failed to load stats'))
  }, [])

  if (error) return <p className={styles.error}>{error}</p>
  if (!stats) return <p className={styles.loading}>Loading…</p>

  const cards = [
    { label: 'Total Users', value: stats.total_users, icon: '👥' },
    { label: 'Active (7d)', value: stats.active_7d, icon: '📅' },
    { label: 'Active (30d)', value: stats.active_30d, icon: '📆' },
    { label: 'Topics', value: stats.total_topics, icon: '🗂️' },
    { label: 'Chapters', value: stats.total_chapters, icon: '📖' },
    { label: 'Lessons', value: stats.total_lessons, icon: '📝' },
    { label: 'Exercises', value: stats.total_exercises, icon: '✏️' },
    { label: 'Paths', value: stats.total_paths, icon: '🛤️' },
  ]

  return (
    <div>
      <h1 className={styles.heading}>Dashboard</h1>
      <div className={styles.grid}>
        {cards.map((c) => (
          <div key={c.label} className={styles.card}>
            <span className={styles.cardIcon}>{c.icon}</span>
            <span className={styles.cardValue}>{c.value}</span>
            <span className={styles.cardLabel}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
