import styles from './Exercise.module.css'

export default function Exercise({ exercise, answer, onAnswer }) {
  if (exercise.type === 'multiple_choice') {
    return (
      <div className={styles.exercise}>
        <h2>{exercise.question}</h2>
        <div className={styles.options}>
          {exercise.options.map((option, idx) => (
            <button
              key={idx}
              className={`${styles.option} ${answer === String(idx) ? styles.selected : ''}`}
              onClick={() => onAnswer(String(idx))}
            >
              <span className={styles.letter}>{String.fromCharCode(65 + idx)}</span>
              {option}
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (exercise.type === 'fill_blank') {
    return (
      <div className={styles.exercise}>
        <h2>{exercise.question}</h2>
        <input
          type="text"
          className={styles.input}
          value={answer}
          onChange={e => onAnswer(e.target.value)}
          placeholder="Type your answer..."
          autoFocus
        />
      </div>
    )
  }

  return null
}
