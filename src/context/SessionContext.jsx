import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../services/api.js'
import { SessionContext } from './useSession.js'

const NO_SESSION = { profile: null, isAuthenticated: false }

// Pergunta à API quem está logado. Só devolve o resultado: quem chama atualiza o estado.
async function fetchSession() {
  try {
    const response = await apiRequest('/api/auth/me', { method: 'GET', credentials: 'include' })
    const profile = response?.profile ?? null
    return { profile, isAuthenticated: Boolean(profile?.username) }
  } catch (error) {
    // 401 só quer dizer "ninguém logado"; qualquer outro erro é mostrado a quem chamou
    if (error?.status === 401) return NO_SESSION
    return { ...NO_SESSION, error: error?.message || 'Não foi possível consultar a sessão.' }
  }
}

export function SessionProvider({ children }) {
  const [session, setSession] = useState(NO_SESSION)
  const [isLoading, setIsLoading] = useState(true)

  const refreshSession = useCallback(async () => {
    const result = await fetchSession()
    setSession({ profile: result.profile, isAuthenticated: result.isAuthenticated })
    setIsLoading(false)
    return result
  }, [])

  // Só limpa a sessão local se a API confirmou o logout (ou se ela já tinha expirado, 401).
  // Se a API falhar, o cookie continua válido: o erro sobe para a tela avisar o jogador.
  const logoutSession = useCallback(async () => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST', credentials: 'include' })
    } catch (error) {
      if (error?.status !== 401) throw error
    }
    setSession(NO_SESSION)
  }, [])

  // Consulta a sessão ao abrir o jogo. O setState fica dentro do .then (e não em refreshSession)
  // para o React não renderizar de novo de forma síncrona dentro do efeito.
  useEffect(() => {
    let active = true
    fetchSession().then(({ profile, isAuthenticated }) => {
      if (!active) return
      setSession({ profile, isAuthenticated })
      setIsLoading(false)
    })
    return () => {
      active = false
    }
  }, [])

  const value = useMemo(
    () => ({ ...session, isLoading, refreshSession, logoutSession }),
    [session, isLoading, refreshSession, logoutSession],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
