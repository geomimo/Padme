import { useState, useEffect } from 'react'
import styles from './ExerciseMatchPairs.module.css'

export default function ExerciseMatchPairs({ exercise, answer, onAnswer, disabled }) {
  // answer is a JSON string of {left: right} or ''
  const matched = answer ? JSON.parse(answer) : {}
  const [selectedLeft, setSelectedLeft] = useState(null)

  useEffect(() => {
    if (disabled) setSelectedLeft(null)
  }, [disabled])

  const matchedLefts = new Set(Object.keys(matched))
  const matchedRights = new Set(Object.values(matched))

  const handleLeftClick = (left) => {
    if (disabled || matchedLefts.has(left)) return
    setSelectedLeft(prev => prev === left ? null : left)
  }

  const handleRightClick = (right) => {
    if (disabled || matchedRights.has(right) || !selectedLeft) return
    const newMatched = { ...matched, [selectedLeft]: right }
    setSelectedLeft(null)
    onAnswer(JSON.stringify(newMatched))
  }

  return (
    <div className={styles.exercise}>
      <h2>{exercise.question}</h2>
      <div className={styles.columns}>
        <div>
          <div className={styles.columnLabel}>Term</div>
          <div className={styles.items}>
            {exercise.lefts.map(left => (
              <button
                key={left}
                className={[
                  styles.item,
                  matchedLefts.has(left) ? styles.matched : '',
                  selectedLeft === left ? styles.selected : '',
                  disabled ? styles.disabled : '',
                ].join(' ')}
                onClick={() => handleLeftClick(left)}
              >
                {left}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className={styles.columnLabel}>Definition</div>
          <div className={styles.items}>
            {exercise.rights.map(right => (
              <button
                key={right}
                className={[
                  styles.item,
                  matchedRights.has(right) ? styles.matched : '',
                  disabled ? styles.disabled : '',
                ].join(' ')}
                onClick={() => handleRightClick(right)}
              >
                {right}
              </button>
            ))}
          </div>
        </div>
      </div>
      {!disabled && selectedLeft && (
        <p className={styles.hint}>Now select a definition for "{selectedLeft}"</p>
      )}
      {!disabled && !selectedLeft && matchedLefts.size === 0 && (
        <p className={styles.hint}>Select a term, then select its matching definition</p>
      )}
    </div>
  )
}
