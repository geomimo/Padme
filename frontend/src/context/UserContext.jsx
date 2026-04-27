import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

const UserContext = createContext()

const ONBOARDING_ENABLED = import.meta.env.VITE_ONBOARDING_ENABLED === 'true'

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
    } else if (!ONBOARDING_ENABLED) {
      // Onboarding off: auto-create an anonymous user (original behaviour)
      fetch('/api/users/', { method: 'POST' })
        .then(r => r.json())
        .then(data => {
          localStorage.setItem('user_id', data.id)
          return loadUser(data.id)
        })
        .finally(() => setLoading(false))
    } else {
      // Onboarding on: wait for OnboardingPage to call initUser
      setLoading(false)
    }
  }, [loadUser])

  // Called by OnboardingPage after user creation
  const initUser = useCallback(async (userId) => {
    localStorage.setItem('user_id', userId)
    await loadUser(userId)
  }, [loadUser])

  const refreshUser = useCallback(async () => {
    const userId = localStorage.getItem('user_id')
    if (userId) await loadUser(userId)
  }, [loadUser])

  return (
    <UserContext.Provider value={{ user, setUser, loading, initUser, refreshUser }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  return useContext(UserContext)
}
