import { useState, useEffect } from 'react'
import { useUser } from '../context/UserContext'
import Navbar from '../components/Navbar'
import LeagueBadge from '../components/LeagueBadge'
import styles from './LeaderboardPage.module.css'

export default function LeaderboardPage() {
  const { user, setUser } = useUser()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)

  const fetchLeaderboard = async () => {
    if (!user?.id) return
    setLoading(true)
    const res = await fetch(`/api/leaderboard/?user_id=${user.id}`)
    const json = await res.json()
    setData(json)
    setLoading(false)
  }

  useEffect(() => {
    fetchLeaderboard()
  }, [user?.id])

  const handleOptIn = async () => {
    if (!user?.id || joining) return
    setJoining(true)
    await fetch(`/api/users/${user.id}/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leaderboard_opt_in: true }),
    })
    setUser(prev => ({ ...prev, leaderboard_opt_in: true }))
    await fetchLeaderboard()
    setJoining(false)
  }

  return (
    <div className={styles.container}>
      <Navbar />
      <main className={styles.main}>
        <h1>Leaderboard</h1>

        {loading && <p className={styles.loading}>Loading...</p>}

        {!loading && data && !data.opted_in && (
          <div className={styles.optInCard}>
            <h2>Join the Weekly League</h2>
            <p>
              Compete with other learners in your league tier. Earn XP this week
              to climb the rankings — top 25% get promoted each Sunday.
            </p>
            <button className={styles.optInBtn} onClick={handleOptIn} disabled={joining}>
              {joining ? 'Joining...' : 'Join League'}
            </button>
          </div>
        )}

        {!loading && data?.opted_in && (
          <>
            <div className={styles.leagueHeader}>
              <LeagueBadge tier={data.tier} name={data.tier_name} icon={data.tier_icon} />
              <span className={styles.weekLabel}>{data.week}</span>
            </div>

            {data.entries.length === 0 ? (
              <p className={styles.emptyState}>No competitors yet this week. Be the first to earn XP!</p>
            ) : (
              <div className={styles.entryList}>
                {data.entries.map(entry => (
                  <div
                    key={entry.user_id}
                    className={`${styles.entry} ${entry.is_self ? styles.self : ''}`}
                  >
                    <span className={`${styles.rank} ${entry.rank <= 3 ? styles.top : ''}`}>
                      {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
                    </span>
                    <span className={styles.entryLevel}>{entry.level_icon ?? '🔥'}</span>
                    <div className={styles.entryInfo}>
                      <div className={`${styles.entryLevelName} ${entry.is_self ? styles.selfName : ''}`}>
                        {entry.level_name ?? 'Spark Rookie'}
                      </div>
                      <div className={styles.entryTotalXp}>{entry.total_xp ?? 0} XP total</div>
                    </div>
                    <span className={styles.weeklyXp}>+{entry.weekly_xp} XP</span>
                    {entry.is_self && <span className={styles.youLabel}>YOU</span>}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
