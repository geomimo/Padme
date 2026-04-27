import AdminNav from './AdminNav'
import styles from './AdminLayout.module.css'

export default function AdminLayout({ children }) {
  return (
    <div className={styles.shell}>
      <AdminNav />
      <main className={styles.content}>{children}</main>
    </div>
  )
}
