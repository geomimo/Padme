import React, { createContext, useContext, useState, useEffect } from 'react'

const UserContext = createContext()

export function UserProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUser = async () => {
      let userId = localStorage.getItem('user_id')

      if (!userId) {
        const res = await fetch('/api/users/', { method: 'POST' })
        const data = await res.json()
        userId = data.id
        localStorage.setItem('user_id', userId)
      }

      const res = await fetch(`/api/users/${userId}`)
      const userData = await res.json()
      setUser(userData)
      setLoading(false)
    }

    loadUser()
  }, [])

  return (
    <UserContext.Provider value={{ user, setUser, loading }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  return useContext(UserContext)
}
