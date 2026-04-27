import { createContext, useContext, useState, useCallback } from 'react'

const AdminAuthContext = createContext(null)

export function AdminAuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('admin_token') || '')

  const login = useCallback((t) => {
    localStorage.setItem('admin_token', t)
    setToken(t)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('admin_token')
    setToken('')
  }, [])

  return (
    <AdminAuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  return useContext(AdminAuthContext)
}

export async function adminFetch(url, options = {}) {
  const token = localStorage.getItem('admin_token') || ''
  const headers = {
    'Content-Type': 'application/json',
    'X-Admin-Token': token,
    ...options.headers,
  }
  const res = await fetch(url, { ...options, headers })
  if (res.status === 401) {
    localStorage.removeItem('admin_token')
    window.location.href = '/admin/login'
    return res
  }
  return res
}
