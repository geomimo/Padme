import { useState, useEffect } from 'react'
import styles from './ExerciseOrderSteps.module.css'

export default function ExerciseOrderSteps({ exercise, answer, onAnswer, disabled }) {
  const initialOrder = exercise.steps.map((_, i) => i)
  // order is an array of original indices into exercise.steps, representing current display order
  const [order, setOrder] = useState(initialOrder)

  // Emit initial order so the Check button is enabled from the start
  useEffect(() => {
    onAnswer(JSON.stringify(initialOrder))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercise.id])

  // Reset when answer is cleared externally (wrong answer retry)
  useEffect(() => {
    if (!answer) {
      setOrder(initialOrder)
      onAnswer(JSON.stringify(initialOrder))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answer])

  const move = (pos, dir) => {
    if (disabled) return
    const newOrder = [...order]
    const swapPos = pos + dir
    if (swapPos < 0 || swapPos >= newOrder.length) return
    ;[newOrder[pos], newOrder[swapPos]] = [newOrder[swapPos], newOrder[pos]]
    setOrder(newOrder)
    onAnswer(JSON.stringify(newOrder))
  }

  return (
    <div className={styles.exercise}>
      <h2>{exercise.question}</h2>
      <p className={styles.hint}>Use the arrows to arrange the steps in the correct order.</p>
      <div className={styles.stepList}>
        {order.map((stepIdx, pos) => (
          <div key={stepIdx} className={styles.stepRow}>
            <span className={styles.stepNumber}>{pos + 1}</span>
            <span className={styles.step}>{exercise.steps[stepIdx]}</span>
            {!disabled && (
              <div className={styles.controls}>
                <button
                  className={styles.moveBtn}
                  onClick={() => move(pos, -1)}
                  disabled={pos === 0}
                  aria-label="Move up"
                >▲</button>
                <button
                  className={styles.moveBtn}
                  onClick={() => move(pos, 1)}
                  disabled={pos === order.length - 1}
                  aria-label="Move down"
                >▼</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
