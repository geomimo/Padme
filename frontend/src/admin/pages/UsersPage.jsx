import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminFetch } from '../context/AdminAuthContext'
import AdminTable from '../components/AdminTable'
import styles from './UsersPage.module.css'

const TIER_NAMES = { 1: 'Bronze', 2: 'Silver', 3: 'Gold', 4: 'Diamond' }

function fmt(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString()
}

function truncate(id) {
  return id ? id.slice(0, 8) + '…' : '—'
}

export default function UsersPage() {
  const [data, setData] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState('xp')
  const [order, setOrder] = useState('desc')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  function load(p = page) {
    setLoading(true)
    const qs = new URLSearchParams({ page: p, per_page: 50, sort, order, search }).toString()
    adminFetch(`/api/admin/users?${qs}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load(1) }, [sort, order])

  function handleSearch(e) {
    e.preventDefault()
    setPage(1)
    load(1)
  }

  const columns = [
    { key: 'id', label: 'User ID', render: (v) => <code style={{ fontSize: '0.8rem' }}>{truncate(v)}</code> },
    { key: 'level_icon', label: '', render: (v, r) => `${v} ${r.level_name}` },
    { key: 'xp', label: 'XP', render: (v) => v.toLocaleString() },
    { key: 'streak', label: 'Streak', render: (v) => `🔥 ${v}` },
    { key: 'lessons_completed', label: 'Lessons' },
    { key: 'league_tier', label: 'League', render: (v) => TIER_NAMES[v] || v },
    { key: 'last_active_date', label: 'Last Active', render: fmt },
    { key: 'created_at', label: 'Joined', render: (v) => fmt(v) },
  ]

  return (
    <div>
      <h1 className={styles.heading}>Users</h1>
      <div className={styles.toolbar}>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <input
            className={styles.searchInput}
            placeholder="Search by user ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className={styles.searchBtn} type="submit">Search</button>
        </form>
        <div className={styles.sortControls}>
          <select className={styles.select} value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="xp">Sort: XP</option>
            <option value="streak">Sort: Streak</option>
            <option value="created_at">Sort: Joined</option>
            <option value="last_active_date">Sort: Last Active</option>
          </select>
          <select className={styles.select} value={order} onChange={(e) => setOrder(e.target.value)}>
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
        </div>
      </div>

      {loading && <p className={styles.loading}>Loading…</p>}

      {data && (
        <>
          <p className={styles.meta}>{data.total} users — page {data.page} of {data.pages}</p>
          <AdminTable
            columns={columns}
            rows={data.users}
            onRowClick={(row) => navigate(`/admin/users/${row.id}`)}
            emptyText="No users found"
          />
          <div className={styles.pagination}>
            <button
              className={styles.pageBtn}
              disabled={page <= 1}
              onClick={() => { const p = page - 1; setPage(p); load(p) }}
            >← Prev</button>
            <button
              className={styles.pageBtn}
              disabled={page >= data.pages}
              onClick={() => { const p = page + 1; setPage(p); load(p) }}
            >Next →</button>
          </div>
        </>
      )}
    </div>
  )
}
