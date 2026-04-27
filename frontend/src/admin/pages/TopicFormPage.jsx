import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { adminFetch } from '../context/AdminAuthContext'
import styles from './shared.module.css'

const EMPTY = { id: '', title: '', description: '', icon: '', lesson_ids: '' }

export default function TopicFormPage() {
  const { topicId } = useParams()
  const isEdit = Boolean(topicId)
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isEdit) {
      adminFetch('/api/admin/topics').then((r) => r.json()).then((topics) => {
        const t = topics.find((x) => x.id === topicId)
        if (t) setForm({ ...t, lesson_ids: t.lesson_ids.join(', ') })
      })
    }
  }, [topicId])

  function set(key, val) { setForm((f) => ({ ...f, [key]: val })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const payload = {
      ...form,
      lesson_ids: form.lesson_ids.split(',').map((s) => s.trim()).filter(Boolean),
    }
    try {
      const res = await adminFetch(
        isEdit ? `/api/admin/topics/${topicId}` : '/api/admin/topics',
        { method: isEdit ? 'PUT' : 'POST', body: JSON.stringify(payload) }
      )
      if (res.ok) {
        navigate('/admin/topics')
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
      <button className={styles.back} onClick={() => navigate('/admin/topics')}>← Topics</button>
      <h1 className={styles.heading} style={{ marginBottom: '1.5rem' }}>
        {isEdit ? 'Edit Topic' : 'New Topic'}
      </h1>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.fieldGrid}>
          <label className={styles.fieldLabel}>
            ID {isEdit && <span style={{ color: 'var(--text-secondary)', textTransform: 'none' }}>(read-only)</span>}
            <input className={styles.input} value={form.id} onChange={(e) => set('id', e.target.value)} readOnly={isEdit} required />
          </label>
          <label className={styles.fieldLabel}>
            Icon (emoji)
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input className={styles.input} value={form.icon} onChange={(e) => set('icon', e.target.value)} placeholder="⚡" />
              <span className={styles.iconPreview}>{form.icon}</span>
            </div>
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
            Lesson IDs (comma-separated)
            <input className={styles.input} value={form.lesson_ids} onChange={(e) => set('lesson_ids', e.target.value)} placeholder="spark_intro, spark_dataframes, …" />
          </label>
        </div>
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.submitRow}>
          <button className={styles.submitBtn} type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          <button className={styles.cancelBtn} type="button" onClick={() => navigate('/admin/topics')}>Cancel</button>
        </div>
      </form>
    </div>
  )
}
