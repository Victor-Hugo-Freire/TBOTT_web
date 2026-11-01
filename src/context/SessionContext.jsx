import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../services/api.js'

const SessionContext = createContext(null)

export function SessionProvider({ children }) {
  const [profile, setProfile] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const refreshSession = useCallback(async () => {
    try {
      const response = await apiRequest('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
      })

      const nextProfile = response?.profile ?? null
      setProfile(nextProfile)
      setIsAuthenticated(Boolean(nextProfile?.username))
      return { profile: nextProfile, isAuthenticated: Boolean(nextProfile?.username) }
    } catch (error) {
      const status = Number(error?.status ?? 0)

      setProfile(null)
      setIsAuthenticated(false)

      if (status === 401) {
        return { profile: null, isAuthenticated: false }
      }

      return {
        profile: null,
        isAuthenticated: false,
        error: error?.message || 'Não foi possível consultar a sessão.',
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logoutSession = useCallback(async () => {
    try {
      await apiRequest('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      const status = Number(error?.status ?? 0)
      if (status >= 500 || status === 0) {
        console.warn('Logout falhou na API, mas a sessão local foi limpa.', error)
      }
    } finally {
      setProfile(null)
      setIsAuthenticated(false)
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshSession()
  }, [refreshSession])

  const value = useMemo(
    () => ({
      profile,
      isAuthenticated,
      isLoading,
      refreshSession,
      logoutSession,
    }),
    [profile, isAuthenticated, isLoading, refreshSession, logoutSession],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const context = useContext(SessionContext)

  if (!context) {
    throw new Error('useSession deve ser usado dentro de SessionProvider.')
  }

  return context
}
