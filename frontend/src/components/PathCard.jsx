import { useNavigate } from 'react-router-dom'
import styles from './PathCard.module.css'

export default function PathCard({ path, onEnroll, onUnenroll, loading }) {
  const navigate = useNavigate()
  const progressPct = path.lesson_count > 0
    ? Math.round((path.completed_count / path.lesson_count) * 100)
    : 0

  const handleAction = (e) => {
    e.stopPropagation()
    if (path.enrolled) onUnenroll(path.id)
    else onEnroll(path.id)
  }

  return (
    <div
      className={`${styles.card} ${path.completed ? styles.completed : ''}`}
      onClick={() => path.enrolled && navigate(`/paths/${path.id}`)}
      role={path.enrolled ? 'button' : undefined}
      tabIndex={path.enrolled ? 0 : undefined}
    >
      {path.completed && <div className={styles.completedBadge}>Completed ✓</div>}

      <div className={styles.header}>
        <h3 className={styles.title}>{path.title}</h3>
        <div className={styles.tags}>
          {path.certification_tier && (
            <span className={`${styles.tag} ${styles.certTag}`}>{path.certification_tier}</span>
          )}
          <span className={styles.tag}>{path.estimated_minutes} min</span>
          <span className={styles.tag}>{path.lesson_count} lessons</span>
        </div>
      </div>

      <p className={styles.description}>{path.description}</p>

      {path.enrolled && (
        <div className={styles.progressSection}>
          <div className={styles.progressRow}>
            <span className={styles.progressLabel}>{path.completed_count} / {path.lesson_count} lessons</span>
            <span className={styles.progressPct}>{progressPct}%</span>
          </div>
          <div className={styles.progressTrack}>
            <div
              className={`${styles.progressFill} ${path.completed ? styles.progressFillDone : ''}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      <div className={styles.footer}>
        {path.enrolled && !path.completed && (
          <button
            className={styles.continueBtn}
            onClick={(e) => { e.stopPropagation(); navigate(`/paths/${path.id}`) }}
          >
            Continue →
          </button>
        )}
        <button
          className={path.enrolled ? styles.unenrollBtn : styles.enrollBtn}
          onClick={handleAction}
          disabled={loading}
        >
          {loading ? '...' : path.enrolled ? 'Unenroll' : 'Enroll'}
        </button>
      </div>
    </div>
  )
}
