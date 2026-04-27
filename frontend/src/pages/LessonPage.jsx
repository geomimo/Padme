import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import Navbar from '../components/Navbar'
import Exercise from '../components/Exercise'
import styles from './LessonPage.module.css'

export default function LessonPage() {
  const { lessonId } = useParams()
  const navigate = useNavigate()
  const { user, setUser } = useUser()
  const [lesson, setLesson] = useState(null)
  const [currentExercise, setCurrentExercise] = useState(0)
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/lessons/${lessonId}`)
      setLesson(await res.json())
    }
    load()
  }, [lessonId])

  const handleAnswer = (exerciseId, answer) => {
    setAnswers(prev => ({ ...prev, [exerciseId]: answer }))
  }

  const handleSubmit = async () => {
    const res = await fetch(`/api/lessons/${lessonId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, answers })
    })
    const data = await res.json()

    setResult(data)
    setSubmitted(true)

    setUser(prev => ({ ...prev, xp: data.total_xp, streak: data.streak }))
  }

  if (!lesson) return <div>Loading...</div>

  if (submitted && result) {
    return (
      <div className={styles.container}>
        <Navbar />
        <main className={styles.main}>
          <div className={styles.results}>
            <h1>Lesson Complete! 🎉</h1>
            <div className={styles.score}>
              <div className={styles.scoreCircle}>
                <span className={styles.scoreText}>{result.score}/{result.total}</span>
              </div>
            </div>
            <p>+{result.xp_earned} XP</p>
            <p>Streak: {result.streak} 🔥</p>
            <button onClick={() => navigate(-1)}>← Back</button>
          </div>
        </main>
      </div>
    )
  }

  const exercise = lesson.exercises[currentExercise]
  const isLast = currentExercise === lesson.exercises.length - 1

  return (
    <div className={styles.container}>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.header}>
          <h1>{lesson.title}</h1>
          <p className={styles.progress}>
            Question {currentExercise + 1} of {lesson.exercises.length}
          </p>
        </div>

        <div className={styles.exerciseContainer}>
          <Exercise
            exercise={exercise}
            answer={answers[exercise.id] || ''}
            onAnswer={answer => handleAnswer(exercise.id, answer)}
          />
        </div>

        <div className={styles.controls}>
          {currentExercise > 0 && (
            <button onClick={() => setCurrentExercise(currentExercise - 1)}>
              ← Previous
            </button>
          )}
          {!isLast ? (
            <button onClick={() => setCurrentExercise(currentExercise + 1)}>
              Next →
            </button>
          ) : (
            <button onClick={handleSubmit} className={styles.submit}>
              Submit
            </button>
          )}
        </div>
      </main>
    </div>
  )
}
