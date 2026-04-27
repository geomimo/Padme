import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminFetch } from '../context/AdminAuthContext'
import AdminTable from '../components/AdminTable'
import ConfirmModal from '../components/ConfirmModal'
import styles from './shared.module.css'

export default function BadgesPage() {
  const [badges, setBadges] = useState([])
  const [deleting, setDeleting] = useState(null)
  const navigate = useNavigate()

  function load() {
    adminFetch('/api/admin/badges').then((r) => r.json()).then(setBadges)
  }
  useEffect(load, [])

  async function handleDelete(badge) {
    await adminFetch(`/api/admin/badges/${badge.id}`, { method: 'DELETE' })
    setDeleting(null)
    load()
  }

  const columns = [
    { key: 'icon', label: '', render: (v) => <span style={{ fontSize: '1.4rem' }}>{v}</span> },
    { key: 'id', label: 'ID', render: (v) => <code style={{ fontSize: '0.8rem' }}>{v}</code> },
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description', render: (v) => <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{v}</span> },
    {
      key: '_actions', label: '',
      render: (_, row) => (
        <div className={styles.actions}>
          <button className={styles.actionBtn} onClick={(e) => { e.stopPropagation(); navigate(`/admin/badges/${row.id}/edit`) }}>Edit</button>
          <button className={styles.deleteBtn} onClick={(e) => { e.stopPropagation(); setDeleting(row) }}>Delete</button>
        </div>
      )
    },
  ]

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.heading}>Badges</h1>
        <button className={styles.newBtn} onClick={() => navigate('/admin/badges/new')}>+ New Badge</button>
      </div>
      <AdminTable columns={columns} rows={badges} emptyText="No badges" />
      {deleting && (
        <ConfirmModal
          title={`Delete "${deleting.name}"?`}
          message="Users who already earned this badge will keep it, but the badge definition will be removed."
          confirmLabel="Delete"
          onConfirm={() => handleDelete(deleting)}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  )
}
