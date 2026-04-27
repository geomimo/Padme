import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import Navbar from '../components/Navbar'
import styles from './PathDetailPage.module.css'

export default function PathDetailPage() {
  const { pathId } = useParams()
  const navigate = useNavigate()
  const { user } = useUser()
  const [path, setPath] = useState(null)

  useEffect(() => {
    if (!user?.id) return
    fetch(`/api/paths/${pathId}?user_id=${user.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) navigate('/paths', { replace: true })
        else setPath(data)
      })
  }, [pathId, user?.id])

  if (!path) return <div className={styles.loading}>Loading...</div>

  const progressPct = path.lesson_count > 0
    ? Math.round((path.completed_count / path.lesson_count) * 100)
    : 0

  return (
    <div className={styles.container}>
      <Navbar />
      <main className={styles.main}>
        <Link to="/paths" className={styles.back}>← Paths</Link>

        <div className={styles.header}>
          <div className={styles.meta}>
            {path.certification_tier && (
              <span className={styles.certTag}>{path.certification_tier}</span>
            )}
            <span className={styles.metaItem}>{path.estimated_minutes} min</span>
            <span className={styles.metaItem}>{path.lesson_count} lessons</span>
          </div>
          <h1>{path.title}</h1>
          <p className={styles.description}>{path.description}</p>
        </div>

        {path.completed ? (
          <div className={styles.completionBanner}>
            <div className={styles.completionIcon}>🎓</div>
            <div>
              <div className={styles.completionTitle}>Path Complete!</div>
              <div className={styles.completionSub}>You've finished every lesson in this path.</div>
            </div>
          </div>
        ) : (
          <div className={styles.progressSection}>
            <div className={styles.progressRow}>
              <span className={styles.progressLabel}>{path.completed_count} / {path.lesson_count} lessons complete</span>
              <span className={styles.progressPct}>{progressPct}%</span>
            </div>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        )}

        <div className={styles.lessonList}>
          {path.lessons?.map((lesson, idx) => (
            <div
              key={lesson.id}
              className={`${styles.lessonRow} ${lesson.completed ? styles.lessonDone : ''}`}
              onClick={() => navigate(`/lesson/${lesson.id}`)}
              role="button"
              tabIndex={0}
            >
              <div className={styles.lessonIndex}>
                {lesson.completed ? '✓' : idx + 1}
              </div>
              <div className={styles.lessonInfo}>
                <div className={styles.lessonTitle}>{lesson.title}</div>
                <div className={styles.lessonDesc}>{lesson.description}</div>
              </div>
              <div className={styles.lessonXp}>+{lesson.xp_reward} XP</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
