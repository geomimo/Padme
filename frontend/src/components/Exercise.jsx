import ExerciseCodeReading from './ExerciseCodeReading'
import ExerciseMatchPairs from './ExerciseMatchPairs'
import ExerciseOrderSteps from './ExerciseOrderSteps'
import styles from './Exercise.module.css'

export default function Exercise({ exercise, answer, onAnswer, disabled }) {
  if (exercise.type === 'multiple_choice') {
    return (
      <div className={styles.exercise}>
        <h2>{exercise.question}</h2>
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
          disabled={disabled}
        />
      </div>
    )
  }

  if (exercise.type === 'code_reading') {
    return <ExerciseCodeReading exercise={exercise} answer={answer} onAnswer={onAnswer} disabled={disabled} />
  }

  if (exercise.type === 'match_pairs') {
    return <ExerciseMatchPairs exercise={exercise} answer={answer} onAnswer={onAnswer} disabled={disabled} />
  }

  if (exercise.type === 'order_steps') {
    return <ExerciseOrderSteps exercise={exercise} answer={answer} onAnswer={onAnswer} disabled={disabled} />
  }

  return null
}
