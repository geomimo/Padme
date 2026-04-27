import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import Navbar from '../components/Navbar'
import PathCard from '../components/PathCard'
import styles from './PathsPage.module.css'

export default function PathsPage() {
  const { user } = useUser()
  const [paths, setPaths] = useState([])
  const [loading, setLoading] = useState(null) // path_id being toggled

  const fetchPaths = () => {
    if (!user?.id) return
    fetch(`/api/paths/?user_id=${user.id}`)
      .then(r => r.json())
      .then(setPaths)
  }

  useEffect(() => { fetchPaths() }, [user?.id])

  const handleEnroll = async (pathId) => {
    setLoading(pathId)
    await fetch(`/api/paths/${pathId}/enroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id }),
    })
    await fetchPaths()
    setLoading(null)
  }

  const handleUnenroll = async (pathId) => {
    setLoading(pathId)
    await fetch(`/api/paths/${pathId}/unenroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id }),
    })
    await fetchPaths()
    setLoading(null)
  }

  const enrolled = paths.filter(p => p.enrolled)
  const available = paths.filter(p => !p.enrolled)

  return (
    <div className={styles.container}>
      <Navbar />
      <main className={styles.main}>
        <h1>Learning Paths</h1>
        <p className={styles.subtitle}>
          Curated lesson collections built around a goal. Enroll in a path to track your progress toward completing it.
        </p>

        {enrolled.length > 0 && (
          <section className={styles.section}>
            <h2>Your Paths</h2>
            <div className={styles.grid}>
              {enrolled.map(path => (
                <PathCard
                  key={path.id}
                  path={path}
                  onEnroll={handleEnroll}
                  onUnenroll={handleUnenroll}
                  loading={loading === path.id}
                />
              ))}
            </div>
          </section>
        )}

        {available.length > 0 && (
          <section className={styles.section}>
            <h2>{enrolled.length > 0 ? 'More Paths' : 'All Paths'}</h2>
            <div className={styles.grid}>
              {available.map(path => (
                <PathCard
                  key={path.id}
                  path={path}
                  onEnroll={handleEnroll}
                  onUnenroll={handleUnenroll}
                  loading={loading === path.id}
                />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
