import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminFetch } from '../context/AdminAuthContext'
import AdminTable from '../components/AdminTable'
import ConfirmModal from '../components/ConfirmModal'
import styles from './shared.module.css'

export default function LessonsPage() {
  const [lessons, setLessons] = useState([])
  const [topicFilter, setTopicFilter] = useState('')
  const [chapterFilter, setChapterFilter] = useState('')
  const [topics, setTopics] = useState([])
  const [chapters, setChapters] = useState([])
  const [deleting, setDeleting] = useState(null)
  const navigate = useNavigate()

  function load() {
    const qs = new URLSearchParams()
    if (topicFilter) qs.set('topic_id', topicFilter)
    if (chapterFilter) qs.set('chapter_id', chapterFilter)
    adminFetch(`/api/admin/lessons?${qs}`).then((r) => r.json()).then(setLessons)
  }

  useEffect(() => {
    adminFetch('/api/admin/topics').then((r) => r.json()).then(setTopics)
    adminFetch('/api/admin/chapters').then((r) => r.json()).then(setChapters)
  }, [])

  useEffect(load, [topicFilter, chapterFilter])

  async function handleDelete(lesson) {
    await adminFetch(`/api/admin/lessons/${lesson.id}`, { method: 'DELETE' })
    setDeleting(null)
    load()
  }

  const columns = [
    { key: 'boss', label: '', render: (v) => v ? '👑' : '' },
    { key: 'id', label: 'ID', render: (v) => <code style={{ fontSize: '0.8rem' }}>{v}</code> },
    { key: 'title', label: 'Title' },
    { key: 'topic_id', label: 'Topic' },
    { key: 'chapter_id', label: 'Chapter', render: (v) => <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{v}</span> },
    { key: 'order', label: '#' },
    { key: 'xp_reward', label: 'XP' },
    { key: 'exercise_count', label: 'Exercises' },
    {
      key: '_actions', label: '',
      render: (_, row) => (
        <div className={styles.actions}>
          <button className={styles.actionBtn} onClick={(e) => { e.stopPropagation(); navigate(`/admin/lessons/${row.id}/edit`) }}>Edit</button>
          <button className={styles.deleteBtn} onClick={(e) => { e.stopPropagation(); setDeleting(row) }}>Delete</button>
        </div>
      )
    },
  ]

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.heading}>Lessons</h1>
        <button className={styles.newBtn} onClick={() => navigate('/admin/lessons/new')}>+ New Lesson</button>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
        <select
          style={{ padding: '0.5rem 0.75rem', background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'var(--text)', fontSize: '0.875rem', outline: 'none' }}
          value={topicFilter} onChange={(e) => setTopicFilter(e.target.value)}
        >
          <option value="">All Topics</option>
          {topics.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
        </select>
        <select
          style={{ padding: '0.5rem 0.75rem', background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'var(--text)', fontSize: '0.875rem', outline: 'none' }}
          value={chapterFilter} onChange={(e) => setChapterFilter(e.target.value)}
        >
          <option value="">All Chapters</option>
          {chapters.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </div>
      <AdminTable columns={columns} rows={lessons} emptyText="No lessons" />
      {deleting && (
        <ConfirmModal
          title={`Delete "${deleting.title}"?`}
          message="This permanently removes the lesson and all its exercises."
          confirmLabel="Delete"
          onConfirm={() => handleDelete(deleting)}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  )
}
