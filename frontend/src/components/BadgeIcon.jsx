import styles from './BadgeIcon.module.css'

export default function BadgeIcon({ badge, size = 'md' }) {
  return (
    <div
      className={`${styles.badge} ${styles[size]} ${badge.earned ? styles.earned : styles.locked}`}
      title={badge.description}
    >
      <span className={styles.icon}>{badge.icon}</span>
      <span className={styles.name}>{badge.name}</span>
    </div>
  )
}
