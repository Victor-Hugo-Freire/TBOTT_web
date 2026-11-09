import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BotaoVoltar from '../../components/BotaoVoltar/BotaoVoltar.jsx'
import Login from '../../components/Login/Login.jsx'
import { ROUTES } from '../../routes/paths.js'
import { apiRequest } from '../../services/api.js'
import { normalizeProgressPayload } from '../../utils/progress.js'
import { getMenuNavigationAction, getNextIndex, isTypingTarget } from '../../utils/menuKeyboard.js'
import './MenuPrincipal.css'

const MENU_ITEMS = [
  { label: 'Continue', route: null, disabled: false },
  { label: 'New game', route: ROUTES.selecaoPersonagem },
  { label: 'Ranks', route: ROUTES.ranking },
  { label: 'Options', route: ROUTES.opcoes },
]

export default function MenuPrincipal() {
  const navigate = useNavigate()
  const backRef = useRef(null)
  const userRef = useRef(null)
  const itemRefs = useRef(new Map())
  const [hasProgress, setHasProgress] = useState(false)
  const [isCheckingProgress, setIsCheckingProgress] = useState(true)
  const [progressError, setProgressError] = useState('')
  const lastFocusedItemRef = useRef('Continue')

  const refreshProgressState = useCallback(async () => {
    try {
      const response = await apiRequest('/api/progress/exists', {
        method: 'GET',
        credentials: 'include',
      })

      const exists = Boolean(response?.exists)
      setHasProgress(exists)
      setProgressError(exists ? '' : '')
      return exists
    } catch (error) {
      if (error?.status === 401) {
        setHasProgress(false)
        setProgressError('')
        return false
      }

      setHasProgress(false)
      setProgressError(error?.message || 'Não foi possível consultar a partida salva.')
      return false
    } finally {
      setIsCheckingProgress(false)
    }
  }, [])

  useEffect(() => {
    let active = true

    async function loadProgressState() {
      setIsCheckingProgress(true)
      const exists = await refreshProgressState()
      if (!active) return
      setHasProgress(Boolean(exists))
    }

    void loadProgressState()
    return () => {
      active = false
    }
  }, [refreshProgressState])

  async function handleContinue() {
    try {
      const exists = await refreshProgressState()
      if (!exists) {
        setHasProgress(false)
        setProgressError('Nenhuma partida salva para continuar.')
        return
      }

      const response = await apiRequest('/api/progress', {
        method: 'GET',
        credentials: 'include',
      })

      if (!response?.exists || !response?.progress) {
        setHasProgress(false)
        setProgressError('Nenhuma partida salva para continuar.')
        return
      }

      const progress = normalizeProgressPayload(response.progress)
      navigate(ROUTES.novaPartida, {
        state: {
          character: {
            id: progress.characterId || 'tung-tung-sahur',
            name: 'Tung Tung Sahur',
            description: 'Personagem principal do jogo.',
          },
          continueProgress: progress,
        },
      })
    } catch (error) {
      if (error?.status === 401) {
        navigate(ROUTES.entrar)
        return
      }

      setProgressError(error?.message || 'Não foi possível recuperar a partida salva.')
    }
  }

  useEffect(() => {
    const navigableItems = MENU_ITEMS.filter((item) => item.label === 'Continue' ? hasProgress && !isCheckingProgress : true)
    const firstItem = navigableItems[0]?.label ?? 'New game'
    itemRefs.current.get(firstItem)?.focus()

    function handleKeyDown(event) {
      if (isTypingTarget(event.target)) return
      if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return

      const action = getMenuNavigationAction(event.key)
      if (!action) return

      event.preventDefault()

      if (action === 'user') {
        userRef.current?.focus()
        return
      }

      if (action === 'back') {
        backRef.current?.focus()
        return
      }

      const currentIndex = navigableItems.findIndex((item) => itemRefs.current.get(item.label) === document.activeElement)
      if (currentIndex === -1) {
        if (action === 'down') itemRefs.current.get(lastFocusedItemRef.current)?.focus()
        return
      }

      const nextIndex = getNextIndex(currentIndex, action, navigableItems.length)
      itemRefs.current.get(navigableItems[nextIndex].label)?.focus()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hasProgress, isCheckingProgress])

  return (
    <main className="menu-principal" aria-label="Menu principal">
      <title>Menu principal | The Binding of Tung Tung</title>

      <div className="menu-principal__stage">
        <BotaoVoltar ref={backRef} label="Voltar para a tela inicial" onClick={() => navigate(ROUTES.inicial)} />

        <Login className="menu-principal__usuario" ref={userRef} />

        <nav className="menu-principal__painel" aria-label="Opções do jogo">
          <h1 className="visually-hidden">Menu principal</h1>
          {MENU_ITEMS.map((item) => {
            const disabled = item.label === 'Continue' ? !hasProgress || isCheckingProgress : item.disabled

            return (
              <button
                className="menu-principal__item"
                ref={(element) => {
                  if (element) itemRefs.current.set(item.label, element)
                  else itemRefs.current.delete(item.label)
                }}
                type="button"
                key={item.label}
                disabled={disabled}
                onFocus={() => {
                  if (!disabled) lastFocusedItemRef.current = item.label
                }}
                onClick={() => {
                  if (item.label === 'Continue') {
                    if (!hasProgress || isCheckingProgress) return
                    void handleContinue()
                    return
                  }

                  if (item.route) navigate(item.route)
                }}
              >
                {item.label}
              </button>
            )
          })}
        </nav>

        {progressError ? <p className="menu-principal__erro">{progressError}</p> : null}
      </div>
    </main>
  )
}
