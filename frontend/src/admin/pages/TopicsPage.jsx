import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminFetch } from '../context/AdminAuthContext'
import AdminTable from '../components/AdminTable'
import ConfirmModal from '../components/ConfirmModal'
import styles from './shared.module.css'

export default function TopicsPage() {
  const [topics, setTopics] = useState([])
  const [deleting, setDeleting] = useState(null)
  const navigate = useNavigate()

  function load() {
    adminFetch('/api/admin/topics').then((r) => r.json()).then(setTopics)
  }
  useEffect(load, [])

  async function handleDelete(topic) {
    await adminFetch(`/api/admin/topics/${topic.id}`, { method: 'DELETE' })
    setDeleting(null)
    load()
  }

  const columns = [
    { key: 'icon', label: '', render: (v) => <span style={{ fontSize: '1.2rem' }}>{v}</span> },
    { key: 'id', label: 'ID', render: (v) => <code style={{ fontSize: '0.8rem' }}>{v}</code> },
    { key: 'title', label: 'Title' },
    { key: 'description', label: 'Description', render: (v) => <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{v?.slice(0, 60)}{v?.length > 60 ? '…' : ''}</span> },
    { key: 'lesson_ids', label: 'Lessons', render: (v) => v?.length ?? 0 },
    {
      key: '_actions', label: '',
      render: (_, row) => (
        <div className={styles.actions}>
          <button className={styles.actionBtn} onClick={(e) => { e.stopPropagation(); navigate(`/admin/topics/${row.id}/edit`) }}>Edit</button>
          <button className={styles.deleteBtn} onClick={(e) => { e.stopPropagation(); setDeleting(row) }}>Delete</button>
        </div>
      )
    },
  ]

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.heading}>Topics</h1>
        <button className={styles.newBtn} onClick={() => navigate('/admin/topics/new')}>+ New Topic</button>
      </div>
      <AdminTable columns={columns} rows={topics} emptyText="No topics" />
      {deleting && (
        <ConfirmModal
          title={`Delete "${deleting.title}"?`}
          message="This removes the topic from the catalog. Lessons are not deleted."
          confirmLabel="Delete"
          onConfirm={() => handleDelete(deleting)}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  )
}
