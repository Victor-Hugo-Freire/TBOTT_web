import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Login from '../../components/Login/Login.jsx'
import { ROUTES } from '../../routes/paths.js'
import { getMenuNavigationAction, isTypingTarget } from '../../utils/menuKeyboard.js'
import './Opcoes.css'

const STORAGE_KEY = 'tbott.options'
const DEFAULT_OPTIONS = { musicVolume: 70, effectsVolume: 80 }
const OPTION_ITEMS = ['music', 'effects', 'controls', 'fullscreen']

function normalizeVolume(value, fallback) {
  const volume = Number(value)
  return Number.isFinite(volume) ? Math.min(100, Math.max(0, volume)) : fallback
}

function readOptions() {
  try {
    const savedOptions = window.localStorage.getItem(STORAGE_KEY)
    if (!savedOptions) return { options: DEFAULT_OPTIONS, error: '' }

    const parsedOptions = JSON.parse(savedOptions)
    return {
      options: {
        musicVolume: normalizeVolume(parsedOptions?.musicVolume, DEFAULT_OPTIONS.musicVolume),
        effectsVolume: normalizeVolume(parsedOptions?.effectsVolume, DEFAULT_OPTIONS.effectsVolume),
      },
      error: '',
    }
  } catch {
    return {
      options: DEFAULT_OPTIONS,
      error: 'Não foi possível carregar as preferências salvas neste navegador.',
    }
  }
}

export default function Opcoes() {
  const navigate = useNavigate()
  const backRef = useRef(null)
  const userRef = useRef(null)
  const itemRefs = useRef(new Map())
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
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOptions))
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
    const firstItem = screen === 'options' ? OPTION_ITEMS[0] : 'back'
    itemRefs.current.get(firstItem)?.focus()

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
        (item) => itemRefs.current.get(item) === document.activeElement,
      )

      if (currentIndex === -1) {
        const index = action === 'down' ? 0 : navigableItems.length - 1
        itemRefs.current.get(navigableItems[index])?.focus()
        return
      }

      const direction = action === 'down' ? 1 : -1
      const nextIndex = (currentIndex + direction + navigableItems.length) % navigableItems.length
      itemRefs.current.get(navigableItems[nextIndex])?.focus()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [screen])

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

  function handleBack() {
    if (screen === 'controls') {
      setScreen('options')
      return
    }

    navigate(ROUTES.menuPrincipal)
  }

  return (
    <main className="opcoes" aria-label="Options">
      <title>Options | The Binding of Tung Tung</title>

      <button
        className="opcoes__voltar"
        ref={backRef}
        type="button"
        aria-label={screen === 'controls' ? 'Voltar para opções' : 'Voltar para o menu'}
        onClick={handleBack}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M15 5 8 12l7 7" />
        </svg>
      </button>

      <Login className="opcoes__usuario" ref={userRef} />

      <section className="opcoes__painel" aria-labelledby="opcoes-titulo">
        <h1 id="opcoes-titulo">{screen === 'controls' ? 'Controls' : 'Options'}</h1>

        {screen === 'options' ? (
          <>
            <p className="opcoes__ajuda">
              Use ↑/↓ or W/S to navigate, Enter to select, and ←/→ to adjust volume.
            </p>
            <div className="opcoes__lista">
              <label className="opcoes__volume" htmlFor="volume-musica">
                <span className="opcoes__rotulo">Music volume</span>
                <span className="opcoes__controle-volume">
                  <input
                    id="volume-musica"
                    ref={(element) => {
                      if (element) itemRefs.current.set('music', element)
                      else itemRefs.current.delete('music')
                    }}
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={options.musicVolume}
                    aria-label="Volume da música"
                    onChange={(event) => updateOption('musicVolume', Number(event.target.value))}
                  />
                  <output htmlFor="volume-musica">{options.musicVolume}%</output>
                </span>
              </label>

              <label className="opcoes__volume" htmlFor="volume-efeitos">
                <span className="opcoes__rotulo">Sound effects</span>
                <span className="opcoes__controle-volume">
                  <input
                    id="volume-efeitos"
                    ref={(element) => {
                      if (element) itemRefs.current.set('effects', element)
                      else itemRefs.current.delete('effects')
                    }}
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={options.effectsVolume}
                    aria-label="Volume dos efeitos sonoros"
                    onChange={(event) => updateOption('effectsVolume', Number(event.target.value))}
                  />
                  <output htmlFor="volume-efeitos">{options.effectsVolume}%</output>
                </span>
              </label>

              <button
                className="opcoes__item"
                ref={(element) => {
                  if (element) itemRefs.current.set('controls', element)
                  else itemRefs.current.delete('controls')
                }}
                type="button"
                onClick={() => setScreen('controls')}
              >
                Controls
              </button>

              <button
                className="opcoes__item"
                ref={(element) => {
                  if (element) itemRefs.current.set('fullscreen', element)
                  else itemRefs.current.delete('fullscreen')
                }}
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
              ref={(element) => {
                if (element) itemRefs.current.set('back', element)
                else itemRefs.current.delete('back')
              }}
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
