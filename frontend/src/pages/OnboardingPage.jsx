import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import styles from './OnboardingPage.module.css'

const STEPS = [
  {
    question: "What brings you to Padme?",
    key: 'padme_goal',
    options: [
      { value: 'cert',  icon: '🎓', label: 'Pass a certification',      sub: 'Prep for Databricks exams' },
      { value: 'new',   icon: '🌱', label: 'New to Databricks',         sub: 'Start from the very beginning' },
      { value: 'skill', icon: '⚡', label: 'Deepen a specific skill',   sub: 'Focus on what matters to you' },
    ],
  },
  {
    question: "How familiar are you with Databricks?",
    key: 'padme_experience',
    options: [
      { value: 'beginner',     icon: '🐣', label: 'Beginner',     sub: 'Little or no experience' },
      { value: 'intermediate', icon: '🔧', label: 'Intermediate', sub: 'Used it a few times' },
      { value: 'advanced',     icon: '🚀', label: 'Advanced',     sub: 'Work with it regularly' },
    ],
  },
  {
    question: "How much time can you commit each day?",
    key: 'padme_daily_time',
    options: [
      { value: 'light',   icon: '☕', label: '5 minutes',  sub: 'A quick daily habit',    xp: 10 },
      { value: 'regular', icon: '📚', label: '10 minutes', sub: 'Steady and consistent',  xp: 30 },
      { value: 'intense', icon: '🏋️', label: '20+ minutes', sub: 'Go deep, go fast',      xp: 80 },
    ],
  },
]

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { initUser } = useUser()

  const [step, setStep] = useState(0)
  const [selections, setSelections] = useState({})
  const [loading, setLoading] = useState(false)

  const current = STEPS[step]
  const selected = selections[current.key]
  const isLast = step === STEPS.length - 1

  const handleSelect = (value) => {
    setSelections(prev => ({ ...prev, [current.key]: value }))
  }

  const handleNext = async () => {
    if (!selected) return
    if (!isLast) {
      setStep(s => s + 1)
      return
    }

    // Persist selections to localStorage
    setLoading(true)
    const timeOpt = STEPS[2].options.find(o => o.value === selections['padme_daily_time'])
    localStorage.setItem('padme_goal', selections['padme_goal'])
    localStorage.setItem('padme_experience', selections['padme_experience'])
    localStorage.setItem('padme_daily_goal_xp', String(timeOpt?.xp ?? 30))

    // Create user
    const res = await fetch('/api/users/', { method: 'POST' })
    const data = await res.json()
    await initUser(data.id)

    const experience = selections['padme_experience']
    if (experience === 'advanced') {
      navigate('/placement-quiz')
    } else {
      navigate('/journey')
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>Padme</div>

        <div className={styles.dots}>
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`${styles.dot} ${i === step ? styles.dotActive : ''} ${i < step ? styles.dotDone : ''}`}
            />
          ))}
        </div>

        <h1 className={styles.question}>{current.question}</h1>

        <div className={styles.options}>
          {current.options.map(opt => (
            <button
              key={opt.value}
              className={`${styles.option} ${selected === opt.value ? styles.optionSelected : ''}`}
              onClick={() => handleSelect(opt.value)}
            >
              <span className={styles.optionIcon}>{opt.icon}</span>
              <div className={styles.optionText}>
                <span className={styles.optionLabel}>{opt.label}</span>
                <span className={styles.optionSub}>{opt.sub}</span>
              </div>
              <span className={`${styles.optionCheck} ${selected === opt.value ? styles.optionCheckVisible : ''}`}>✓</span>
            </button>
          ))}
        </div>

        <button
          className={styles.nextBtn}
          onClick={handleNext}
          disabled={!selected || loading}
        >
          {loading ? 'Setting up…' : isLast ? "Let's go →" : 'Next →'}
        </button>
      </div>
    </div>
  )
}
