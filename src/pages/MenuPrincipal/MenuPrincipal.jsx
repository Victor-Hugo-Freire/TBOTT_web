import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import CardUsuario from '../../components/CardUsuario/CardUsuario.jsx'
import { ROUTES } from '../../routes/paths.js'
import { getMenuNavigationAction } from '../../utils/menuKeyboard.js'
import './MenuPrincipal.css'

const MENU_ITEMS = [
  { label: 'Continue', route: null, disabled: true },
  { label: 'New game', route: ROUTES.selecaoPersonagem },
  { label: 'Ranks', route: ROUTES.ranking },
  { label: 'Options', route: ROUTES.opcoes },
]

const NAVIGABLE_ITEMS = MENU_ITEMS.filter((item) => !item.disabled)

export default function MenuPrincipal() {
  const navigate = useNavigate()
  const backRef = useRef(null)
  const userRef = useRef(null)
  const itemRefs = useRef(new Map())
  const lastFocusedItemRef = useRef(NAVIGABLE_ITEMS[0].label)

  useEffect(() => {
    itemRefs.current.get(NAVIGABLE_ITEMS[0].label)?.focus()

    function handleKeyDown(event) {
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

      const currentIndex = NAVIGABLE_ITEMS.findIndex((item) => itemRefs.current.get(item.label) === document.activeElement)
      if (currentIndex === -1) {
        if (action === 'down') itemRefs.current.get(lastFocusedItemRef.current)?.focus()
        return
      }

      const direction = action === 'down' ? 1 : -1
      const nextIndex = (currentIndex + direction + NAVIGABLE_ITEMS.length) % NAVIGABLE_ITEMS.length
      itemRefs.current.get(NAVIGABLE_ITEMS[nextIndex].label)?.focus()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <main className="menu-principal" aria-label="Menu principal">
      <title>Menu principal | The Binding of Tung Tung</title>

      <div className="menu-principal__stage">
        <button
          className="menu-principal__voltar"
          ref={backRef}
          type="button"
          aria-label="Voltar para a tela inicial"
          onClick={() => navigate(ROUTES.inicial)}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M15 5 8 12l7 7" />
          </svg>
        </button>

        <CardUsuario
          className="menu-principal__usuario"
          ref={userRef}
          nome="(nome do usuário)"
          onClick={() => navigate(ROUTES.perfil)}
        />

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
              disabled={item.disabled}
              onFocus={() => {
                if (!item.disabled) lastFocusedItemRef.current = item.label
              }}
              onClick={() => item.route && navigate(item.route)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </main>
  )
}
