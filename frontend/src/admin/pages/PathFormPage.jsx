import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { adminFetch } from '../context/AdminAuthContext'
import styles from './shared.module.css'

const EMPTY = { id: '', title: '', description: '', lesson_ids: '', estimated_minutes: 30, certification_tier: '', badge_id: 'path_complete' }

export default function PathFormPage() {
  const { pathId } = useParams()
  const isEdit = Boolean(pathId)
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isEdit) {
      adminFetch('/api/admin/paths').then((r) => r.json()).then((paths) => {
        const p = paths.find((x) => x.id === pathId)
        if (p) setForm({ ...p, lesson_ids: p.lesson_ids.join(', '), certification_tier: p.certification_tier || '' })
      })
    }
  }, [pathId])

  function set(key, val) { setForm((f) => ({ ...f, [key]: val })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const payload = {
      ...form,
      estimated_minutes: Number(form.estimated_minutes),
      certification_tier: form.certification_tier || null,
      lesson_ids: form.lesson_ids.split(',').map((s) => s.trim()).filter(Boolean),
    }
    try {
      const res = await adminFetch(
        isEdit ? `/api/admin/paths/${pathId}` : '/api/admin/paths',
        { method: isEdit ? 'PUT' : 'POST', body: JSON.stringify(payload) }
      )
      if (res.ok) {
        navigate('/admin/paths')
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
      <button className={styles.back} onClick={() => navigate('/admin/paths')}>← Paths</button>
      <h1 className={styles.heading} style={{ marginBottom: '1.5rem' }}>
        {isEdit ? 'Edit Path' : 'New Path'}
      </h1>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.fieldGrid}>
          <label className={styles.fieldLabel}>
            ID {isEdit && <span style={{ color: 'var(--text-secondary)', textTransform: 'none' }}>(read-only)</span>}
            <input className={styles.input} value={form.id} onChange={(e) => set('id', e.target.value)} readOnly={isEdit} required />
          </label>
          <label className={styles.fieldLabel}>
            Estimated Minutes
            <input className={styles.input} type="number" value={form.estimated_minutes} onChange={(e) => set('estimated_minutes', e.target.value)} min={1} />
          </label>
          <label className={`${styles.fieldLabel} ${styles.fieldFull}`}>
            Title
            <input className={styles.input} value={form.title} onChange={(e) => set('title', e.target.value)} required />
          </label>
          <label className={`${styles.fieldLabel} ${styles.fieldFull}`}>
            Description
            <textarea className={styles.textarea} value={form.description} onChange={(e) => set('description', e.target.value)} />
          </label>
          <label className={styles.fieldLabel}>
            Certification Tier (optional)
            <input className={styles.input} value={form.certification_tier} onChange={(e) => set('certification_tier', e.target.value)} placeholder="associate" />
          </label>
          <label className={styles.fieldLabel}>
            Badge ID
            <input className={styles.input} value={form.badge_id} onChange={(e) => set('badge_id', e.target.value)} placeholder="path_complete" />
          </label>
          <label className={`${styles.fieldLabel} ${styles.fieldFull}`}>
            Lesson IDs (comma-separated, in order)
            <textarea className={styles.textarea} value={form.lesson_ids} onChange={(e) => set('lesson_ids', e.target.value)} placeholder="spark_intro, delta_intro, …" rows={3} />
          </label>
        </div>
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.submitRow}>
          <button className={styles.submitBtn} type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          <button className={styles.cancelBtn} type="button" onClick={() => navigate('/admin/paths')}>Cancel</button>
        </div>
      </form>
    </div>
  )
}
