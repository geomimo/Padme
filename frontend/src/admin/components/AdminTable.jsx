import styles from './AdminTable.module.css'

export default function AdminTable({ columns, rows, onRowClick, keyField = 'id', emptyText = 'No records' }) {
  if (!rows || rows.length === 0) {
    return <p className={styles.empty}>{emptyText}</p>
  }

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={styles.th}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row[keyField]}
              className={`${styles.tr} ${onRowClick ? styles.clickable : ''}`}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((col) => (
                <td key={col.key} className={styles.td}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
