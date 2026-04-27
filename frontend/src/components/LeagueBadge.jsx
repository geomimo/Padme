import styles from './LeagueBadge.module.css'

const TIER_CLASS = { 1: 'bronze', 2: 'silver', 3: 'gold', 4: 'diamond' }

export default function LeagueBadge({ tier, name, icon }) {
  const cls = TIER_CLASS[tier] || 'bronze'
  return (
    <span className={`${styles.badge} ${styles[cls]}`}>
      {icon} {name}
    </span>
  )
}
