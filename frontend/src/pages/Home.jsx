import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import Navbar from '../components/Navbar'
import TopicCard from '../components/TopicCard'
import styles from './Home.module.css'

export default function Home() {
  const { user } = useUser()
  const [topics, setTopics] = useState([])

  useEffect(() => {
    const loadTopics = async () => {
      const res = await fetch(`/api/topics/?user_id=${user.id}`)
      const data = await res.json()
      setTopics(data)
    }

    if (user) loadTopics()
  }, [user])

  return (
    <div className={styles.container}>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.hero}>
          <h1>Learn Databricks</h1>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.value}>{user?.xp || 0}</span>
              <span className={styles.label}>XP</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.value}>{user?.streak || 0}</span>
              <span className={styles.label}>Streak 🔥</span>
            </div>
          </div>
        </div>

        <section className={styles.topics}>
          <h2>Topics</h2>
          <div className={styles.grid}>
            {topics.map(topic => (
              <Link key={topic.id} to={`/topic/${topic.id}`} style={{ textDecoration: 'none' }}>
                <TopicCard topic={topic} />
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
