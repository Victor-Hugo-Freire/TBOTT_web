import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BotaoVoltar from '../../components/BotaoVoltar/BotaoVoltar.jsx'
import Login from '../../components/Login/Login.jsx'
import { ROUTES } from '../../routes/paths.js'
import { apiRequest } from '../../services/api.js'
import { getMenuNavigationAction, getNextIndex, isTypingTarget } from '../../utils/menuKeyboard.js'
import './MenuPrincipal.css'

// Continue só fica ativo quando a API diz que existe uma partida salva
const MENU_ITEMS = [
  { label: 'Continue', route: ROUTES.novaPartida },
  { label: 'New game', route: ROUTES.selecaoPersonagem },
  { label: 'Ranks', route: ROUTES.ranking },
  { label: 'Options', route: ROUTES.opcoes },
]

export default function MenuPrincipal() {
  const navigate = useNavigate()
  const backRef = useRef(null)
  const userRef = useRef(null)
  const itemRefs = useRef(new Map())
  const lastFocusedItemRef = useRef('New game')
  const [canContinue, setCanContinue] = useState(false)
  const [progressError, setProgressError] = useState('')

  function isDisabled(item) {
    return item.label === 'Continue' && !canContinue
  }

  useEffect(() => {
    let active = true

    apiRequest('/api/progress/exists', { credentials: 'include' })
      .then((response) => {
        if (active) setCanContinue(Boolean(response?.exists))
      })
      .catch((error) => {
        // 401 é sessão vencida: quem trata é o SessionContext
        if (active && error?.status !== 401) setProgressError(error?.message || 'Não foi possível consultar a partida salva.')
      })

    return () => {
      active = false
    }
  }, [])

  // O foco começa no primeiro item ativo. Se o jogador ainda não mexeu, ele passa para o
  // Continue quando a API confirma a partida salva; se já foi para outro item, não é tirado de lá
  useEffect(() => {
    const focused = document.activeElement
    if (focused !== document.body && focused !== itemRefs.current.get('New game')) return
    itemRefs.current.get(canContinue ? 'Continue' : 'New game')?.focus()
  }, [canContinue])

  useEffect(() => {
    const navigableItems = MENU_ITEMS.filter((item) => item.label !== 'Continue' || canContinue)

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
  }, [canContinue])

  return (
    <main className="menu-principal" aria-label="Menu principal">
      <title>Menu principal | The Binding of Tung Tung</title>

      <div className="menu-principal__stage">
        <BotaoVoltar ref={backRef} label="Voltar para a tela inicial" onClick={() => navigate(ROUTES.inicial)} />

        <Login className="menu-principal__usuario" ref={userRef} />

        <nav className="menu-principal__painel" aria-label="Opções do jogo">
          <h1 className="visually-hidden">Menu principal</h1>
          {MENU_ITEMS.map((item) => (
            <button
              className="menu-principal__item"
              ref={(element) => {
                if (element) itemRefs.current.set(item.label, element)
                else itemRefs.current.delete(item.label)
              }}
              type="button"
              key={item.label}
              disabled={isDisabled(item)}
              onFocus={() => {
                if (!isDisabled(item)) lastFocusedItemRef.current = item.label
              }}
              onClick={() => navigate(item.route)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {progressError ? <p className="menu-principal__erro" role="alert">{progressError}</p> : null}
      </div>
    </main>
  )
}
