import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminFetch } from '../context/AdminAuthContext'
import AdminTable from '../components/AdminTable'
import ConfirmModal from '../components/ConfirmModal'
import styles from './shared.module.css'

export default function ChaptersPage() {
  const [chapters, setChapters] = useState([])
  const [deleting, setDeleting] = useState(null)
  const navigate = useNavigate()

  function load() {
    adminFetch('/api/admin/chapters').then((r) => r.json()).then((data) =>
      setChapters([...data].sort((a, b) => a.order - b.order))
    )
  }
  useEffect(load, [])

  async function handleDelete(ch) {
    await adminFetch(`/api/admin/chapters/${ch.id}`, { method: 'DELETE' })
    setDeleting(null)
    load()
  }

  const columns = [
    { key: 'order', label: '#', render: (v) => <span style={{ fontFamily: 'var(--font-mono)' }}>{v}</span> },
    { key: 'icon', label: '', render: (v) => <span style={{ fontSize: '1.2rem' }}>{v}</span> },
    { key: 'id', label: 'ID', render: (v) => <code style={{ fontSize: '0.8rem' }}>{v}</code> },
    { key: 'title', label: 'Title' },
    { key: 'boss_lesson_id', label: 'Boss Lesson', render: (v) => <code style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{v}</code> },
    { key: 'lesson_ids', label: 'Lessons', render: (v) => v?.length ?? 0 },
    {
      key: '_actions', label: '',
      render: (_, row) => (
        <div className={styles.actions}>
          <button className={styles.actionBtn} onClick={(e) => { e.stopPropagation(); navigate(`/admin/chapters/${row.id}/edit`) }}>Edit</button>
          <button className={styles.deleteBtn} onClick={(e) => { e.stopPropagation(); setDeleting(row) }}>Delete</button>
        </div>
      )
    },
  ]

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.heading}>Chapters</h1>
        <button className={styles.newBtn} onClick={() => navigate('/admin/chapters/new')}>+ New Chapter</button>
      </div>
      <AdminTable columns={columns} rows={chapters} emptyText="No chapters" />
      {deleting && (
        <ConfirmModal
          title={`Delete "${deleting.title}"?`}
          message="This removes the chapter from the journey. Lessons are not deleted."
          confirmLabel="Delete"
          onConfirm={() => handleDelete(deleting)}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  )
}
