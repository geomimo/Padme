import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { adminFetch } from '../context/AdminAuthContext'
import styles from './shared.module.css'

const EMPTY = { id: '', title: '', description: '', icon: '', order: 1, lesson_ids: '', boss_lesson_id: '' }

export default function ChapterFormPage() {
  const { chapterId } = useParams()
  const isEdit = Boolean(chapterId)
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isEdit) {
      adminFetch('/api/admin/chapters').then((r) => r.json()).then((chapters) => {
        const ch = chapters.find((x) => x.id === chapterId)
        if (ch) setForm({ ...ch, lesson_ids: ch.lesson_ids.join(', ') })
      })
    }
  }, [chapterId])

  function set(key, val) { setForm((f) => ({ ...f, [key]: val })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const payload = {
      ...form,
      order: Number(form.order),
      lesson_ids: form.lesson_ids.split(',').map((s) => s.trim()).filter(Boolean),
    }
    try {
      const res = await adminFetch(
        isEdit ? `/api/admin/chapters/${chapterId}` : '/api/admin/chapters',
        { method: isEdit ? 'PUT' : 'POST', body: JSON.stringify(payload) }
      )
      if (res.ok) {
        navigate('/admin/chapters')
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
      <button className={styles.back} onClick={() => navigate('/admin/chapters')}>← Chapters</button>
      <h1 className={styles.heading} style={{ marginBottom: '1.5rem' }}>
        {isEdit ? 'Edit Chapter' : 'New Chapter'}
      </h1>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.fieldGrid}>
          <label className={styles.fieldLabel}>
            ID {isEdit && <span style={{ color: 'var(--text-secondary)', textTransform: 'none' }}>(read-only)</span>}
            <input className={styles.input} value={form.id} onChange={(e) => set('id', e.target.value)} readOnly={isEdit} required />
          </label>
          <label className={styles.fieldLabel}>
            Order
            <input className={styles.input} type="number" value={form.order} onChange={(e) => set('order', e.target.value)} min={1} />
          </label>
          <label className={styles.fieldLabel}>
            Icon (emoji)
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input className={styles.input} value={form.icon} onChange={(e) => set('icon', e.target.value)} placeholder="⚡" />
              <span className={styles.iconPreview}>{form.icon}</span>
            </div>
          </label>
          <label className={styles.fieldLabel}>
            Boss Lesson ID
            <input className={styles.input} value={form.boss_lesson_id} onChange={(e) => set('boss_lesson_id', e.target.value)} placeholder="spark_boss" />
          </label>
          <label className={`${styles.fieldLabel} ${styles.fieldFull}`}>
            Title
            <input className={styles.input} value={form.title} onChange={(e) => set('title', e.target.value)} required />
          </label>
          <label className={`${styles.fieldLabel} ${styles.fieldFull}`}>
            Description
            <textarea className={styles.textarea} value={form.description} onChange={(e) => set('description', e.target.value)} />
          </label>
          <label className={`${styles.fieldLabel} ${styles.fieldFull}`}>
            Lesson IDs (comma-separated, in order)
            <input className={styles.input} value={form.lesson_ids} onChange={(e) => set('lesson_ids', e.target.value)} placeholder="spark_intro, spark_dataframes, …" />
          </label>
        </div>
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.submitRow}>
          <button className={styles.submitBtn} type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          <button className={styles.cancelBtn} type="button" onClick={() => navigate('/admin/chapters')}>Cancel</button>
        </div>
      </form>
    </div>
  )
}
