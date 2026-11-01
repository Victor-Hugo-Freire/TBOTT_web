import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BotaoVoltar from '../../components/BotaoVoltar/BotaoVoltar.jsx'
import Login from '../../components/Login/Login.jsx'
import { ROUTES } from '../../routes/paths.js'
import { getMenuNavigationAction, getNextIndex, isTypingTarget } from '../../utils/menuKeyboard.js'
import { OPTIONS_STORAGE_KEY, readOptions } from '../../utils/options.js'
import './Opcoes.css'

const OPTION_ITEMS = ['music', 'effects', 'controls', 'fullscreen']

// name: chave em options (e no localStorage); item: nome usado no foco pelo teclado
const VOLUME_ITEMS = [
  { item: 'music', name: 'musicVolume', id: 'volume-musica', label: 'Music volume' },
  { item: 'effects', name: 'effectsVolume', id: 'volume-efeitos', label: 'Sound effects' },
]

export default function Opcoes() {
  const navigate = useNavigate()
  const backRef = useRef(null)
  const itemToFocusRef = useRef(OPTION_ITEMS[0])
  const userRef = useRef(null)
  const [itemRefs] = useState(() => new Map())
  const [initialState] = useState(readOptions)
  const [options, setOptions] = useState(initialState.options)
  const [screen, setScreen] = useState('options')
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement))
  const [statusMessage, setStatusMessage] = useState(initialState.error)
  const [storageError, setStorageError] = useState('')

  function updateOption(name, value) {
    const updatedOptions = { ...options, [name]: value }
    setOptions(updatedOptions)
    setStatusMessage('')
    try {
      window.localStorage.setItem(OPTIONS_STORAGE_KEY, JSON.stringify(updatedOptions))
      setStorageError('')
    } catch {
      setStorageError('Não foi possível salvar as preferências neste navegador.')
    }
  }

  useEffect(() => {
    function syncFullscreen() {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }

    document.addEventListener('fullscreenchange', syncFullscreen)
    return () => document.removeEventListener('fullscreenchange', syncFullscreen)
  }, [])

  useEffect(() => {
    // Ao voltar de Controls, o foco volta para o botão Controls
    itemRefs.get(screen === 'options' ? itemToFocusRef.current : 'back')?.focus()

    function handleKeyDown(event) {
      const isRangeInput = event.target instanceof HTMLInputElement && event.target.type === 'range'
      if (document.body.classList.contains('auth-form-open')) return
      if (isTypingTarget(event.target) && !isRangeInput) return
      if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return

      if (isRangeInput && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) return

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

      const navigableItems = screen === 'options' ? OPTION_ITEMS : ['back']
      const currentIndex = navigableItems.findIndex(
        (item) => itemRefs.get(item) === document.activeElement,
      )

      const nextIndex = getNextIndex(currentIndex, action, navigableItems.length)
      itemRefs.get(navigableItems[nextIndex])?.focus()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [screen, itemRefs])

  async function toggleFullscreen() {
    setStatusMessage('')

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      } else if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen()
      } else {
        setStatusMessage('A tela cheia não é compatível com este navegador.')
      }
    } catch {
      setStatusMessage('Não foi possível alterar o modo de tela cheia.')
    }
  }

  // Guarda cada elemento navegável pelo teclado no Map, pelo nome
  function registerItem(name) {
    return (element) => {
      if (element) itemRefs.set(name, element)
      else itemRefs.delete(name)
    }
  }

  function handleBack() {
    if (screen === 'controls') {
      itemToFocusRef.current = 'controls'
      setScreen('options')
      return
    }

    navigate(ROUTES.menuPrincipal)
  }

  return (
    <main className="opcoes" aria-label="Options">
      <title>Options | The Binding of Tung Tung</title>

      <BotaoVoltar
        ref={backRef}
        label={screen === 'controls' ? 'Voltar para opções' : 'Voltar para o menu'}
        onClick={handleBack}
      />

      <Login className="opcoes__usuario" ref={userRef} />

      <section className="opcoes__painel" aria-labelledby="opcoes-titulo">
        <h1 id="opcoes-titulo">{screen === 'controls' ? 'Controls' : 'Options'}</h1>

        {screen === 'options' ? (
          <>
            <p className="opcoes__ajuda">
              Use ↑/↓ or W/S to navigate, Enter to select, and ←/→ to adjust volume.
            </p>
            <div className="opcoes__lista">
              {VOLUME_ITEMS.map(({ item, name, id, label }) => (
                <label className="opcoes__volume" htmlFor={id} key={id}>
                  <span className="opcoes__rotulo">{label}</span>
                  <span className="opcoes__controle-volume">
                    <input
                      id={id}
                      ref={registerItem(item)}
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={options[name]}
                      onChange={(event) => updateOption(name, Number(event.target.value))}
                    />
                    <output htmlFor={id}>{options[name]}%</output>
                  </span>
                </label>
              ))}

              <button
                className="opcoes__item"
                ref={registerItem('controls')}
                type="button"
                onClick={() => setScreen('controls')}
              >
                Controls
              </button>

              <button
                className="opcoes__item"
                ref={registerItem('fullscreen')}
                type="button"
                aria-pressed={isFullscreen}
                onClick={toggleFullscreen}
              >
                Fullscreen <span>{isFullscreen ? 'On' : 'Off'}</span>
              </button>
            </div>
          </>
        ) : (
          <div className="opcoes__controles">
            <p>Use these controls while playing:</p>
            <dl>
              <div>
                <dt>Move</dt>
                <dd><kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd></dd>
              </div>
              <div>
                <dt>Attack</dt>
                <dd><kbd>↑</kbd> <kbd>←</kbd> <kbd>↓</kbd> <kbd>→</kbd></dd>
              </div>
              <div>
                <dt>Return to menu</dt>
                <dd><kbd>Esc</kbd></dd>
              </div>
            </dl>
            <button
              className="opcoes__item opcoes__item--voltar"
              ref={registerItem('back')}
              type="button"
              onClick={handleBack}
            >
              Back to options
            </button>
          </div>
        )}

        {statusMessage && <p className="opcoes__aviso" role="alert">{statusMessage}</p>}
        {storageError && <p className="opcoes__aviso" role="alert">{storageError}</p>}
      </section>
    </main>
  )
}
