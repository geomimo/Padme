import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { adminFetch } from '../context/AdminAuthContext'
import ConfirmModal from '../components/ConfirmModal'
import AdminTable from '../components/AdminTable'
import styles from './UserDetailPage.module.css'

function fmt(d) {
  return d ? new Date(d).toLocaleDateString() : '—'
}

export default function UserDetailPage() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [edit, setEdit] = useState({})
  const [saving, setSaving] = useState(false)
  const [modal, setModal] = useState(null) // 'reset' | 'delete'

  useEffect(() => {
    adminFetch(`/api/admin/users/${userId}`)
      .then((r) => r.json())
      .then((u) => { setUser(u); setEdit({ xp: u.xp, streak: u.streak, daily_goal_xp: u.daily_goal_xp }) })
  }, [userId])

  async function handleSave() {
    setSaving(true)
    const res = await adminFetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ xp: Number(edit.xp), streak: Number(edit.streak), daily_goal_xp: Number(edit.daily_goal_xp) }),
    })
    const updated = await res.json()
    setUser((u) => ({ ...u, ...updated }))
    setSaving(false)
  }

  async function handleReset() {
    await adminFetch(`/api/admin/users/${userId}/reset-xp`, { method: 'POST' })
    setModal(null)
    adminFetch(`/api/admin/users/${userId}`).then((r) => r.json()).then(setUser)
  }

  async function handleDelete() {
    await adminFetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
    navigate('/admin/users')
  }

  if (!user) return <p className={styles.loading}>Loading…</p>

  const progressColumns = [
    { key: 'lesson_id', label: 'Lesson ID' },
    { key: 'score', label: 'Score', render: (v, r) => `${v} / ${r.total}` },
    { key: 'xp_earned', label: 'XP' },
    { key: 'completed_at', label: 'Completed', render: fmt },
  ]

  return (
    <div>
      <button className={styles.back} onClick={() => navigate('/admin/users')}>← Users</button>
      <h1 className={styles.heading}>
        {user.level_icon} {user.level_name}
      </h1>
      <p className={styles.uid}>{user.id}</p>

      <div className={styles.statsRow}>
        <div className={styles.statCard}><span className={styles.statVal}>{user.xp.toLocaleString()}</span><span className={styles.statLabel}>Total XP</span></div>
        <div className={styles.statCard}><span className={styles.statVal}>🔥 {user.streak}</span><span className={styles.statLabel}>Streak</span></div>
        <div className={styles.statCard}><span className={styles.statVal}>{user.streak_shields}</span><span className={styles.statLabel}>Shields</span></div>
        <div className={styles.statCard}><span className={styles.statVal}>{user.progress.length}</span><span className={styles.statLabel}>Lessons done</span></div>
        <div className={styles.statCard}><span className={styles.statVal}>{fmt(user.last_active_date)}</span><span className={styles.statLabel}>Last active</span></div>
        <div className={styles.statCard}><span className={styles.statVal}>{fmt(user.created_at)}</span><span className={styles.statLabel}>Joined</span></div>
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Edit User</h2>
        <div className={styles.editGrid}>
          <label className={styles.fieldLabel}>
            XP
            <input className={styles.input} type="number" value={edit.xp} onChange={(e) => setEdit({ ...edit, xp: e.target.value })} />
          </label>
          <label className={styles.fieldLabel}>
            Streak
            <input className={styles.input} type="number" value={edit.streak} onChange={(e) => setEdit({ ...edit, streak: e.target.value })} />
          </label>
          <label className={styles.fieldLabel}>
            Daily Goal XP
            <input className={styles.input} type="number" value={edit.daily_goal_xp} onChange={(e) => setEdit({ ...edit, daily_goal_xp: e.target.value })} />
          </label>
        </div>
        <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </section>

      {user.badges.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Badges</h2>
          <div className={styles.badges}>
            {user.badges.map((b) => (
              <div key={b.badge_id} className={styles.badge}>
                <span>{b.badge_id}</span>
                <span className={styles.badgeDate}>{fmt(b.earned_at)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {user.progress.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Lesson Progress</h2>
          <AdminTable columns={progressColumns} rows={user.progress} keyField="lesson_id" />
        </section>
      )}

      <section className={`${styles.section} ${styles.danger}`}>
        <h2 className={styles.sectionTitle}>Danger Zone</h2>
        <div className={styles.dangerRow}>
          <div>
            <strong>Reset XP &amp; Progress</strong>
            <p className={styles.dangerDesc}>Zeros XP, streak, and deletes all lesson progress and badges.</p>
          </div>
          <button className={styles.dangerBtn} onClick={() => setModal('reset')}>Reset</button>
        </div>
        <div className={styles.dangerRow}>
          <div>
            <strong>Delete User</strong>
            <p className={styles.dangerDesc}>Permanently deletes this user and all their data.</p>
          </div>
          <button className={styles.dangerBtn} onClick={() => setModal('delete')}>Delete</button>
        </div>
      </section>

      {modal === 'reset' && (
        <ConfirmModal
          title="Reset XP & Progress"
          message="This will zero this user's XP, streak, and delete all lesson progress and badges. This cannot be undone."
          confirmLabel="Reset"
          onConfirm={handleReset}
          onCancel={() => setModal(null)}
        />
      )}
      {modal === 'delete' && (
        <ConfirmModal
          title="Delete User"
          message="This will permanently delete this user and all their data. This cannot be undone."
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  )
}
