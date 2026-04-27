import { useNavigate } from 'react-router-dom'
import styles from './LessonNode.module.css'

// status: 'completed' | 'current' | 'available' | 'locked'
export default function LessonNode({ lesson, status, onLockedClick }) {
  const navigate = useNavigate()

  const handleClick = () => {
    if (status === 'locked') {
      onLockedClick()
    } else {
      navigate(`/lesson/${lesson.id}`)
    }
  }

  const icon = status === 'completed'
    ? '✓'
    : status === 'locked'
    ? '🔒'
    : lesson.boss
    ? '🛡️'
    : null

  return (
    <button
      className={[
        styles.node,
        lesson.boss ? styles.boss : '',
        styles[status],
      ].join(' ')}
      onClick={handleClick}
      title={lesson.title}
      aria-label={lesson.title}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      <span className={styles.label}>{lesson.title}</span>
      <span className={styles.xp}>+{lesson.xp_reward} XP</span>
    </button>
  )
}
