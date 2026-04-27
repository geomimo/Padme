import styles from './LessonCard.module.css'

export default function LessonCard({ lesson }) {
  return (
    <div className={styles.card}>
      <h3>{lesson.title}</h3>
      <p>{lesson.description}</p>
      <div className={styles.xp}>+{lesson.xp_reward} XP</div>
    </div>
  )
}
