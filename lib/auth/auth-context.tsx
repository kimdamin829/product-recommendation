'use client'

import { createContext, useContext, useEffect, useState } from 'react'

interface AuthContextType {
  user: any | null
  loading: boolean
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  refreshSession: async () => {},
})

export const useAuth = () => {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshSession = async () => {
    const res = await fetch('/api/auth/demo-session', { cache: 'no-store' })
    const data = await res.json().catch(() => ({ user: null }))
    setUser(data?.user ?? null)
  }

  useEffect(() => {
    const checkSession = async () => {
      try {
        await refreshSession()
      } finally {
        setLoading(false)
      }
    }
    checkSession()
  }, [])

  const signOut = async () => {
    await fetch('/api/auth/demo-logout', { method: 'POST' }).catch(() => {})
    setUser(null)
  }

  const value = {
    user,
    loading,
    signOut,
    refreshSession,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

