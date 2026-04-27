import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { getLevelForXP } from '../config/levels'
import Navbar from '../components/Navbar'
import Exercise from '../components/Exercise'
import FeedbackPanel from '../components/FeedbackPanel'
import BadgeIcon from '../components/BadgeIcon'
import styles from './LessonPage.module.css'

// phase: 'question' | 'feedback' | 'results'
export default function LessonPage() {
  const { lessonId } = useParams()
  const navigate = useNavigate()
  const { user, setUser } = useUser()

  const [lesson, setLesson] = useState(null)
  const [phase, setPhase] = useState('question')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [answers, setAnswers] = useState({})   // accumulated correct answers for /complete
  const [feedback, setFeedback] = useState(null)
  const [result, setResult] = useState(null)
  const [levelUp, setLevelUp] = useState(null)  // new level if levelled up
  const [isChecking, setIsChecking] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)

  useEffect(() => {
    fetch(`/api/lessons/${lessonId}`)
      .then(r => r.json())
      .then(setLesson)
  }, [lessonId])

  if (!lesson) return <div className={styles.loading}>Loading...</div>

  const exercises = lesson.exercises
  const exercise = exercises[currentIndex]
  const progress = ((currentIndex) / exercises.length) * 100

  const handleCheck = async () => {
    if (!currentAnswer) return
    setIsChecking(true)

    const res = await fetch(`/api/lessons/${lessonId}/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, exercise_id: exercise.id, answer: currentAnswer }),
    })
    const data = await res.json()
    setIsChecking(false)
    setFeedback(data)
    setPhase('feedback')

    if (data.correct) {
      setAnswers(prev => ({ ...prev, [exercise.id]: currentAnswer }))
    }
  }

  const handleContinue = async () => {
    if (!feedback.correct) {
      setCurrentAnswer('')
      setFeedback(null)
      setPhase('question')
      return
    }

    const isLast = currentIndex === exercises.length - 1
    if (isLast) {
      setIsCompleting(true)
      const finalAnswers = { ...answers, [exercise.id]: currentAnswer }
      const res = await fetch(`/api/lessons/${lessonId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, answers: finalAnswers }),
      })
      const data = await res.json()

      const prevLevel = getLevelForXP(user.xp ?? 0)
      const newLevel = getLevelForXP(data.total_xp ?? 0)
      if (newLevel.min > prevLevel.min) setLevelUp(newLevel)

      setResult(data)
      setUser(prev => ({
        ...prev,
        xp: data.total_xp,
        streak: data.streak,
        streak_shields: data.streak_shields ?? prev.streak_shields,
        daily_xp_today: data.daily_xp_today ?? prev.daily_xp_today,
        daily_goal_xp: data.daily_goal_xp ?? prev.daily_goal_xp,
      }))
      setPhase('results')
    } else {
      setCurrentIndex(i => i + 1)
      setCurrentAnswer('')
      setFeedback(null)
      setPhase('question')
    }
  }

  if (phase === 'results' && result) {
    const concepts = result.results
      ? Object.values(result.results).map(r => r.explanation).filter(Boolean)
      : []

    return (
      <div className={styles.container}>
        <Navbar />
        <main className={styles.main}>
          <div className={styles.results}>
            {levelUp && (
              <div className={styles.levelUpBanner}>
                <span className={styles.levelUpIcon}>{levelUp.icon}</span>
                <div>
                  <div className={styles.levelUpTitle}>Level Up!</div>
                  <div className={styles.levelUpName}>{levelUp.name}</div>
                </div>
              </div>
            )}

            <div className={styles.scoreCircle}>
              <span className={styles.scoreText}>{result.score}/{result.total}</span>
            </div>
            <h1 className={styles.resultsTitle}>Lesson Complete!</h1>
            <p className={styles.xpLine}>+{result.xp_earned} XP &nbsp;·&nbsp; {result.streak} day streak 🔥</p>

            {result.new_badges?.length > 0 && (
              <div className={styles.newBadges}>
                <h2 className={styles.newBadgesTitle}>Badge{result.new_badges.length > 1 ? 's' : ''} Unlocked!</h2>
                <div className={styles.newBadgesRow}>
                  {result.new_badges.map(badge => (
                    <BadgeIcon key={badge.id} badge={{ ...badge, earned: true }} size="lg" />
                  ))}
                </div>
              </div>
            )}

            {concepts.length > 0 && (
              <div className={styles.concepts}>
                <h2>Concepts covered</h2>
                <ul>
                  {concepts.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </div>
            )}

            <button onClick={() => navigate(-1)}>← Back to lessons</button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>

        <div className={styles.header}>
          <h1>{lesson.title}</h1>
          <p className={styles.progressText}>
            {currentIndex + 1} / {exercises.length}
          </p>
        </div>

        <div className={styles.exerciseContainer}>
          <Exercise
            exercise={exercise}
            answer={currentAnswer}
            onAnswer={setCurrentAnswer}
            disabled={phase === 'feedback'}
          />
        </div>

        {phase === 'feedback' && feedback ? (
          <FeedbackPanel
            correct={feedback.correct}
            explanation={feedback.explanation}
            onContinue={handleContinue}
            loading={isCompleting}
          />
        ) : (
          <div className={styles.controls}>
            <button
              className={styles.checkBtn}
              onClick={handleCheck}
              disabled={!currentAnswer || isChecking}
            >
              {isChecking ? 'Checking...' : 'Check'}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
