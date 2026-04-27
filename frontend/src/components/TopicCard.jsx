import styles from './TopicCard.module.css'

export default function TopicCard({ topic }) {
  return (
    <div className={styles.card} data-topic={topic.id}>
      <div className={styles.icon}>{topic.icon}</div>
      <h3>{topic.title}</h3>
      <p>{topic.description}</p>
      <div className={styles.progress}>
        <div className={styles.bar} style={{ width: `${topic.completion_percent}%` }}></div>
      </div>
      <span className={styles.percent}>{Math.round(topic.completion_percent)}%</span>
    </div>
  )
}
