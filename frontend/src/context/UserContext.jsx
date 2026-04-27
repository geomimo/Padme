import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

const UserContext = createContext()

export function UserProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadUser = useCallback(async (userId) => {
    const res = await fetch(`/api/users/${userId}`)
    const userData = await res.json()
    setUser(userData)
  }, [])

  useEffect(() => {
    const userId = localStorage.getItem('user_id')
    if (userId) {
      loadUser(userId).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [loadUser])

  // Called by OnboardingPage after user creation
  const initUser = useCallback(async (userId) => {
    localStorage.setItem('user_id', userId)
    await loadUser(userId)
  }, [loadUser])

  return (
    <UserContext.Provider value={{ user, setUser, loading, initUser }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  return useContext(UserContext)
}
