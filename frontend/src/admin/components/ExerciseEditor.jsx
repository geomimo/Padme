import styles from './ExerciseEditor.module.css'

function arrToStr(arr) { return Array.isArray(arr) ? arr.join('\n') : arr || '' }
function strToArr(s) { return s.split('\n').map((x) => x.trim()).filter(Boolean) }

export default function ExerciseEditor({ exercise, onChange, onDelete, index }) {
  function set(key, val) { onChange({ ...exercise, [key]: val }) }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.num}>Exercise {index + 1}</span>
        <select
          className={styles.typeSelect}
          value={exercise.type}
          onChange={(e) => set('type', e.target.value)}
        >
          <option value="multiple_choice">Multiple Choice</option>
          <option value="code_reading">Code Reading</option>
          <option value="fill_blank">Fill in the Blank</option>
          <option value="match_pairs">Match Pairs</option>
          <option value="order_steps">Order Steps</option>
        </select>
        <button className={styles.deleteBtn} type="button" onClick={onDelete}>✕</button>
      </div>

      <label className={styles.label}>
        Question
        <textarea
          className={styles.textarea}
          value={exercise.question || ''}
          onChange={(e) => set('question', e.target.value)}
          rows={2}
        />
      </label>

      {(exercise.type === 'code_reading') && (
        <label className={styles.label}>
          Code Block
          <textarea
            className={`${styles.textarea} ${styles.code}`}
            value={exercise.code || ''}
            onChange={(e) => set('code', e.target.value)}
            rows={5}
            placeholder="# paste code here"
          />
        </label>
      )}

      {(exercise.type === 'multiple_choice' || exercise.type === 'code_reading') && (
        <>
          <label className={styles.label}>
            Options (one per line)
            <textarea
              className={styles.textarea}
              value={arrToStr(exercise.options)}
              onChange={(e) => set('options', strToArr(e.target.value))}
              rows={4}
              placeholder="Option A&#10;Option B&#10;Option C&#10;Option D"
            />
          </label>
          <label className={styles.label}>
            Correct Answer Index (0-based)
            <input
              className={styles.input}
              type="number"
              min={0}
              value={exercise.correct_answer ?? ''}
              onChange={(e) => set('correct_answer', Number(e.target.value))}
            />
          </label>
        </>
      )}

      {exercise.type === 'fill_blank' && (
        <label className={styles.label}>
          Correct Answer (string, case-insensitive)
          <input
            className={styles.input}
            value={exercise.correct_answer || ''}
            onChange={(e) => set('correct_answer', e.target.value)}
          />
        </label>
      )}

      {exercise.type === 'match_pairs' && (
        <>
          <label className={styles.label}>
            Left items (one per line)
            <textarea
              className={styles.textarea}
              value={arrToStr(exercise.lefts)}
              onChange={(e) => set('lefts', strToArr(e.target.value))}
              rows={4}
            />
          </label>
          <label className={styles.label}>
            Right items (one per line, in same order as left)
            <textarea
              className={styles.textarea}
              value={arrToStr(exercise.rights)}
              onChange={(e) => set('rights', strToArr(e.target.value))}
              rows={4}
            />
          </label>
          <p className={styles.hint}>
            Correct answer is auto-derived: left[i] → right[i]. Ensure lists have the same length.
          </p>
        </>
      )}

      {exercise.type === 'order_steps' && (
        <>
          <label className={styles.label}>
            Steps (one per line, in correct order)
            <textarea
              className={styles.textarea}
              value={arrToStr(exercise.steps)}
              onChange={(e) => set('steps', strToArr(e.target.value))}
              rows={5}
            />
          </label>
          <p className={styles.hint}>
            Correct answer is auto-derived as [0, 1, 2, …] — the order you enter here is the correct order.
          </p>
        </>
      )}

      <div className={styles.row}>
        <label className={styles.label} style={{ flex: 1 }}>
          Explanation (correct)
          <textarea
            className={styles.textarea}
            value={exercise.explanation_correct || ''}
            onChange={(e) => set('explanation_correct', e.target.value)}
            rows={2}
          />
        </label>
        <label className={styles.label} style={{ flex: 1 }}>
          Explanation (wrong)
          <textarea
            className={styles.textarea}
            value={exercise.explanation_wrong || ''}
            onChange={(e) => set('explanation_wrong', e.target.value)}
            rows={2}
          />
        </label>
      </div>
    </div>
  )
}
