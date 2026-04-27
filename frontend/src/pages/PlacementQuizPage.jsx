import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './PlacementQuizPage.module.css'

const QUESTIONS = [
  {
    q: "In Spark, which operation triggers actual computation?",
    opts: ["map()", "filter()", "collect()", "select()"],
    ans: 2,
  },
  {
    q: "What does Delta Lake add on top of Apache Spark?",
    opts: ["A SQL query engine", "ACID transactions and time travel", "A machine learning library", "A streaming framework"],
    ans: 1,
  },
  {
    q: "Which Delta Lake command compacts small files into larger ones?",
    opts: ["VACUUM", "OPTIMIZE", "MERGE INTO", "ZORDER BY"],
    ans: 1,
  },
  {
    q: "What MLflow component lets you register and version production models?",
    opts: ["Tracking Server", "Artifacts Store", "Model Registry", "Projects"],
    ans: 2,
  },
  {
    q: "In Unity Catalog, what does the three-level namespace look like?",
    opts: ["schema.table.column", "catalog.schema.table", "database.schema.table", "workspace.catalog.table"],
    ans: 1,
  },
]

const RESULT_LABELS = [
  { minScore: 0,  chapter: 'Chapter 1 — Spark Foundations', desc: "Start from the very beginning — you'll build a solid base quickly." },
  { minScore: 2,  chapter: 'Chapter 2 — Delta Lake',         desc: "You've got Spark basics covered. Jump into Delta Lake!" },
  { minScore: 4,  chapter: 'Chapter 3 — MLflow',             desc: "Strong foundations! Start your journey at MLflow." },
]

function getResult(score) {
  let result = RESULT_LABELS[0]
  for (const r of RESULT_LABELS) {
    if (score >= r.minScore) result = r
  }
  return result
}

const LETTERS = ['A', 'B', 'C', 'D']

export default function PlacementQuizPage() {
  const navigate = useNavigate()
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)

  const question = QUESTIONS[index]
  const isLast = index === QUESTIONS.length - 1

  const handleSelect = (i) => {
    if (selected !== null) return
    setSelected(i)
  }

  const handleNext = () => {
    const correct = selected === question.ans
    const newScore = correct ? score + 1 : score
    if (isLast) {
      setScore(newScore)
      setDone(true)
    } else {
      setScore(newScore)
      setIndex(i => i + 1)
      setSelected(null)
    }
  }

  if (done) {
    const result = getResult(score)
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.logo}>Padme</div>
          <div className={styles.scoreCircle}>
            <span className={styles.scoreNum}>{score}/{QUESTIONS.length}</span>
          </div>
          <h1 className={styles.resultTitle}>Quiz Complete!</h1>
          <div className={styles.resultBox}>
            <div className={styles.resultChapter}>{result.chapter}</div>
            <p className={styles.resultDesc}>{result.desc}</p>
          </div>
          <button className={styles.nextBtn} onClick={() => navigate('/journey')}>
            Start Journey →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.topRow}>
          <div className={styles.logo}>Padme</div>
          <button className={styles.skipBtn} onClick={() => navigate('/journey')}>Skip</button>
        </div>

        <div className={styles.progressTrack}>
          <div
            className={styles.progressFill}
            style={{ width: `${((index) / QUESTIONS.length) * 100}%` }}
          />
        </div>
        <p className={styles.counter}>{index + 1} / {QUESTIONS.length}</p>

        <h1 className={styles.question}>{question.q}</h1>

        <div className={styles.options}>
          {question.opts.map((opt, i) => {
            let cls = styles.option
            if (selected !== null) {
              if (i === question.ans) cls = `${styles.option} ${styles.optionCorrect}`
              else if (i === selected) cls = `${styles.option} ${styles.optionWrong}`
            } else {
              cls = styles.option
            }
            return (
              <button key={i} className={cls} onClick={() => handleSelect(i)}>
                <span className={styles.letter}>{LETTERS[i]}</span>
                <span>{opt}</span>
              </button>
            )
          })}
        </div>

        <button
          className={styles.nextBtn}
          onClick={handleNext}
          disabled={selected === null}
        >
          {isLast ? 'Finish' : 'Next →'}
        </button>
      </div>
    </div>
  )
}
