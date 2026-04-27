import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { adminFetch } from '../context/AdminAuthContext'
import styles from './shared.module.css'

const EMPTY = { id: '', name: '', description: '', icon: '' }

export default function BadgeFormPage() {
  const { badgeId } = useParams()
  const isEdit = Boolean(badgeId)
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isEdit) {
      adminFetch('/api/admin/badges').then((r) => r.json()).then((badges) => {
        const b = badges.find((x) => x.id === badgeId)
        if (b) setForm(b)
      })
    }
  }, [badgeId])

  function set(key, val) { setForm((f) => ({ ...f, [key]: val })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await adminFetch(
        isEdit ? `/api/admin/badges/${badgeId}` : '/api/admin/badges',
        { method: isEdit ? 'PUT' : 'POST', body: JSON.stringify(form) }
      )
      if (res.ok) {
        navigate('/admin/badges')
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
      <button className={styles.back} onClick={() => navigate('/admin/badges')}>← Badges</button>
      <h1 className={styles.heading} style={{ marginBottom: '1.5rem' }}>
        {isEdit ? 'Edit Badge' : 'New Badge'}
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
              <input className={styles.input} value={form.icon} onChange={(e) => set('icon', e.target.value)} placeholder="🏅" />
              <span className={styles.iconPreview}>{form.icon}</span>
            </div>
          </label>
          <label className={`${styles.fieldLabel} ${styles.fieldFull}`}>
            Name
            <input className={styles.input} value={form.name} onChange={(e) => set('name', e.target.value)} required />
          </label>
          <label className={`${styles.fieldLabel} ${styles.fieldFull}`}>
            Description
            <textarea className={styles.textarea} value={form.description} onChange={(e) => set('description', e.target.value)} />
          </label>
        </div>
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.submitRow}>
          <button className={styles.submitBtn} type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          <button className={styles.cancelBtn} type="button" onClick={() => navigate('/admin/badges')}>Cancel</button>
        </div>
      </form>
    </div>
  )
}
