import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { adminFetch } from '../context/AdminAuthContext'
import ExerciseEditor from '../components/ExerciseEditor'
import styles from './shared.module.css'
import exStyles from './LessonFormPage.module.css'

let _exId = 0
function newExId() { return `__new_${++_exId}` }

function newExercise() {
  return {
    id: newExId(),
    type: 'multiple_choice',
    question: '',
    options: [],
    correct_answer: 0,
    explanation_correct: '',
    explanation_wrong: '',
  }
}

function prepareExercises(rawExercises) {
  return (rawExercises || []).map((ex) => {
    if (ex.type === 'match_pairs' && ex.correct_answer && typeof ex.correct_answer === 'object' && !Array.isArray(ex.correct_answer)) {
      const lefts = Object.keys(ex.correct_answer)
      const rights = Object.values(ex.correct_answer)
      return { ...ex, lefts, rights }
    }
    return ex
  })
}

function finalizeExercises(exercises) {
  return exercises.map((ex) => {
    const out = { ...ex }
    if (out.type === 'match_pairs') {
      const lefts = out.lefts || []
      const rights = out.rights || []
      const ca = {}
      lefts.forEach((l, i) => { if (rights[i] !== undefined) ca[l] = rights[i] })
      out.correct_answer = ca
      delete out.lefts
      delete out.rights
    }
    if (out.type === 'order_steps') {
      const steps = out.steps || []
      out.correct_answer = steps.map((_, i) => i)
    }
    delete out._isNew
    return out
  })
}

const EMPTY_FORM = {
  id: '', title: '', description: '', xp_reward: 100,
  topic_id: '', chapter_id: '', order: 1, boss: false,
}

export default function LessonFormPage() {
  const { lessonId } = useParams()
  const isEdit = Boolean(lessonId)
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY_FORM)
  const [exercises, setExercises] = useState([])
  const [topics, setTopics] = useState([])
  const [chapters, setChapters] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    adminFetch('/api/admin/topics').then((r) => r.json()).then(setTopics)
    adminFetch('/api/admin/chapters').then((r) => r.json()).then(setChapters)
    if (isEdit) {
      adminFetch(`/api/admin/lessons/${lessonId}`).then((r) => r.json()).then((lesson) => {
        const { exercises: exs, ...meta } = lesson
        setForm(meta)
        setExercises(prepareExercises(exs))
      })
    }
  }, [lessonId])

  function setField(key, val) { setForm((f) => ({ ...f, [key]: val })) }

  function updateExercise(idx, updated) {
    setExercises((prev) => prev.map((e, i) => i === idx ? updated : e))
  }

  function deleteExercise(idx) {
    setExercises((prev) => prev.filter((_, i) => i !== idx))
  }

  function addExercise() {
    setExercises((prev) => [...prev, newExercise()])
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const payload = {
      ...form,
      xp_reward: Number(form.xp_reward),
      order: Number(form.order),
      boss: Boolean(form.boss),
      exercises: finalizeExercises(exercises),
    }
    try {
      const res = await adminFetch(
        isEdit ? `/api/admin/lessons/${lessonId}` : '/api/admin/lessons',
        { method: isEdit ? 'PUT' : 'POST', body: JSON.stringify(payload) }
      )
      if (res.ok) {
        navigate('/admin/lessons')
      } else {
        const d = await res.json()
        setError(d.error || 'Save failed')
      }
    } catch {
      setError('Connection error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <button className={styles.back} onClick={() => navigate('/admin/lessons')}>← Lessons</button>
      <h1 className={styles.heading} style={{ marginBottom: '1.5rem' }}>
        {isEdit ? 'Edit Lesson' : 'New Lesson'}
      </h1>
      <form onSubmit={handleSubmit}>
        <div className={styles.form}>
          <div className={styles.fieldGrid}>
            <label className={styles.fieldLabel}>
              ID {isEdit && <span style={{ color: 'var(--text-secondary)', textTransform: 'none' }}>(read-only)</span>}
              <input className={styles.input} value={form.id} onChange={(e) => setField('id', e.target.value)} readOnly={isEdit} required />
            </label>
            <label className={styles.fieldLabel}>
              XP Reward
              <input className={styles.input} type="number" value={form.xp_reward} onChange={(e) => setField('xp_reward', e.target.value)} min={0} />
            </label>
            <label className={styles.fieldLabel}>
              Topic
              <select className={styles.select} value={form.topic_id} onChange={(e) => setField('topic_id', e.target.value)}>
                <option value="">— none —</option>
                {topics.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </label>
            <label className={styles.fieldLabel}>
              Chapter
              <select className={styles.select} value={form.chapter_id} onChange={(e) => setField('chapter_id', e.target.value)}>
                <option value="">— none —</option>
                {chapters.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </label>
            <label className={styles.fieldLabel}>
              Order
              <input className={styles.input} type="number" value={form.order} onChange={(e) => setField('order', e.target.value)} min={1} />
            </label>
            <label className={`${styles.fieldLabel}`} style={{ justifyContent: 'flex-end' }}>
              <label className={styles.checkbox}>
                <input type="checkbox" checked={form.boss} onChange={(e) => setField('boss', e.target.checked)} />
                Boss Lesson
              </label>
            </label>
            <label className={`${styles.fieldLabel} ${styles.fieldFull}`}>
              Title
              <input className={styles.input} value={form.title} onChange={(e) => setField('title', e.target.value)} required />
            </label>
            <label className={`${styles.fieldLabel} ${styles.fieldFull}`}>
              Description
              <textarea className={styles.textarea} value={form.description} onChange={(e) => setField('description', e.target.value)} />
            </label>
          </div>
        </div>

        <div className={exStyles.exercisesSection}>
          <div className={exStyles.exHeader}>
            <h2 className={exStyles.exTitle}>Exercises ({exercises.length})</h2>
            <button className={styles.newBtn} type="button" onClick={addExercise}>+ Add Exercise</button>
          </div>
          <div className={exStyles.exList}>
            {exercises.map((ex, idx) => (
              <ExerciseEditor
                key={ex.id}
                exercise={ex}
                index={idx}
                onChange={(updated) => updateExercise(idx, updated)}
                onDelete={() => deleteExercise(idx)}
              />
            ))}
            {exercises.length === 0 && (
              <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No exercises yet. Add one above.</p>
            )}
          </div>
        </div>

        {error && <p className={styles.error} style={{ marginTop: '1rem' }}>{error}</p>}
        <div className={styles.submitRow} style={{ marginTop: '1.5rem' }}>
          <button className={styles.submitBtn} type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Lesson'}</button>
          <button className={styles.cancelBtn} type="button" onClick={() => navigate('/admin/lessons')}>Cancel</button>
        </div>
      </form>
    </div>
  )
}
