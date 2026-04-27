import styles from './ExerciseCodeReading.module.css'

export default function ExerciseCodeReading({ exercise, answer, onAnswer, disabled }) {
  return (
    <div className={styles.exercise}>
      <h2>{exercise.question}</h2>
      <div className={styles.codeBlock}>
        <pre>{exercise.code}</pre>
      </div>
      <div className={styles.options}>
        {exercise.options.map((option, idx) => (
          <button
            key={idx}
            className={`${styles.option} ${answer === String(idx) ? styles.selected : ''}`}
            onClick={() => !disabled && onAnswer(String(idx))}
            disabled={disabled}
          >
            <span className={styles.letter}>{String.fromCharCode(65 + idx)}</span>
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}
