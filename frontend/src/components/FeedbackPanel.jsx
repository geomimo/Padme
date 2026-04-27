import styles from './FeedbackPanel.module.css'

export default function FeedbackPanel({ correct, explanation, onContinue, loading }) {
  return (
    <div className={`${styles.panel} ${correct ? styles.correct : styles.wrong}`}>
      <div className={styles.icon}>{correct ? '✓' : '✗'}</div>
      <p className={styles.label}>{correct ? 'Correct!' : 'Not quite'}</p>
      <p className={styles.explanation}>{explanation}</p>
      <button className={styles.btn} onClick={onContinue} disabled={loading}>
        {loading ? 'Saving...' : correct ? 'Continue →' : 'Try again'}
      </button>
    </div>
  )
}
