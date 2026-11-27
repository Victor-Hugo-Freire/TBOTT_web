import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BotaoVoltar from '../../components/BotaoVoltar/BotaoVoltar.jsx'
import CharacterSprite from '../../components/CharacterSprite/CharacterSprite.jsx'
import Login from '../../components/Login/Login.jsx'
import { CHARACTER_SPRITES } from '../../data/characterSprites.js'
import { UNLOCK_HINTS } from '../../data/characterUnlocks.js'
import { apiRequest } from '../../services/api.js'
import { ROUTES } from '../../routes/paths.js'
import { createProgressSnapshot } from '../../utils/progress.js'
import { retryPendingUnlocks } from '../../services/unlocks.js'
import { isCharacterLocked, readPendingUnlocks } from '../../utils/unlocks.js'
import { getMenuNavigationAction, getNextIndex, isTypingTarget } from '../../utils/menuKeyboard.js'
import './SessaoPersonagem.css'

const EMPTY_STATE = {
  text: 'Sem personagens disponíveis no momento.',
}

function getVisibleCharacters(characters, currentIndex) {
  if (characters.length === 0) return []

  const visibleCount = Math.min(characters.length, 3)

  if (visibleCount === 1) {
    return [{ character: characters[currentIndex], position: 'center', index: currentIndex }]
  }

  if (visibleCount === 2) {
    return [
      { character: characters[(currentIndex - 1 + characters.length) % characters.length], position: 'left', index: (currentIndex - 1 + characters.length) % characters.length },
      { character: characters[currentIndex], position: 'center', index: currentIndex },
    ]
  }

  return [
    { character: characters[(currentIndex - 1 + characters.length) % characters.length], position: 'left', index: (currentIndex - 1 + characters.length) % characters.length },
    { character: characters[currentIndex], position: 'center', index: currentIndex },
    { character: characters[(currentIndex + 1) % characters.length], position: 'right', index: (currentIndex + 1) % characters.length },
  ]
}

// Cadeado em pixels (grade de 10x12), na cor da borda dos cards
function Cadeado() {
  return (
    <svg className="sessao-personagem__cadeado" viewBox="0 0 10 12" shapeRendering="crispEdges" aria-hidden="true">
      <rect x="3" y="0" width="4" height="1" />
      <rect x="2" y="1" width="1" height="4" />
      <rect x="7" y="1" width="1" height="4" />
      <rect x="1" y="5" width="8" height="7" />
      <rect x="4" y="7" width="2" height="2" className="sessao-personagem__cadeado-furo" />
      <rect x="4" y="9" width="2" height="1" className="sessao-personagem__cadeado-furo" />
    </svg>
  )
}

// O que aparece dentro do card. Liberado: a foto, o nome e a descrição.
// Bloqueado: a silhueta cinza do Tung Tung Sahur com um cadeado, sem foto e sem nome ("???"), e a dica de como liberar.
function CardPersonagem({ character }) {
  if (character.locked) {
    return (
      <div className="sessao-personagem__info">
        <div className="sessao-personagem__imagem">
          <CharacterSprite sprite={CHARACTER_SPRITES.tungTungSahurPiscar} className="sessao-personagem__silhueta" />
          <Cadeado />
        </div>
        <span className="sessao-personagem__nome">???</span>
        <p className="sessao-personagem__descricao">{UNLOCK_HINTS[character.id] ?? 'Ainda bloqueado'}</p>
      </div>
    )
  }

  return (
    <div className="sessao-personagem__info">
      {character.spritePath && (
        <div className="sessao-personagem__imagem">
          <img className="sessao-personagem__foto" src={character.spritePath} alt="" />
        </div>
      )}
      <span className="sessao-personagem__nome">{character.name}</span>
      <p className="sessao-personagem__descricao">{character.description}</p>
    </div>
  )
}

export default function SessaoPersonagem() {
  const navigate = useNavigate()
  const backRef = useRef(null)
  const userRef = useRef(null)
  const mainRef = useRef(null)
  const centerRef = useRef(null) // o card do meio: é onde o foco fica enquanto se escolhe o personagem
  const startRef = useRef(null) // "Começar Jogo": o foco vai para ele ao escolher e volta quando o aviso de substituir fecha
  const [characters, setCharacters] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedCharacterId, setSelectedCharacterId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showOverwriteDialog, setShowOverwriteDialog] = useState(false)
  const [isStartingGame, setIsStartingGame] = useState(false)

  useEffect(() => {
    backRef.current?.focus()

    let isActive = true

    async function loadCharacters() {
      setIsLoading(true)
      setError('')

      try {
        // Uma liberação que ficou na fila (a API estava fora do ar quando ele pegou o Elixir ou venceu) tenta de novo
        // antes de ler a lista, para o personagem já aparecer liberado
        if (readPendingUnlocks().length > 0) await retryPendingUnlocks()
        if (!isActive) return

        // Os personagens (público) e quais o jogador já liberou. Se a lista de liberados falhar, os bloqueados
        // continuam bloqueados (melhor do que deixar jogar com um personagem que ele não tem).
        const [response, unlockResponse] = await Promise.all([
          apiRequest('/api/characters'),
          apiRequest('/api/unlocks', { credentials: 'include' }).catch(() => null),
        ])
        if (!isActive) return

        const list = Array.isArray(response?.characters) ? response.characters : []
        const unlockedIds = Array.isArray(unlockResponse?.unlocks) ? unlockResponse.unlocks.map((unlock) => unlock.characterId) : []
        const normalized = [...list]
          .sort((left, right) => {
            const leftOrder = Number(left.displayOrder ?? 0)
            const rightOrder = Number(right.displayOrder ?? 0)
            if (leftOrder !== rightOrder) return leftOrder - rightOrder
            return String(left.name ?? '').localeCompare(String(right.name ?? ''))
          })
          .map((character) => ({
            ...character,
            id: character.id ?? character.name ?? 'personagem-sem-id',
            name: character.name ?? 'Personagem',
            description: character.description ?? 'Sem descrição disponível.',
            spritePath: character.spritePath ?? character.sprite_path ?? null,
          }))
          .map((character) => ({ ...character, locked: isCharacterLocked(character, unlockedIds) }))

        setCharacters(normalized)
        setCurrentIndex(0)
        setSelectedCharacterId(null)
      } catch (loadError) {
        if (!isActive) return
        setCharacters([])
        setError(loadError.message || 'Não foi possível carregar os personagens.')
      } finally {
        if (isActive) setIsLoading(false)
      }
    }

    loadCharacters()

    return () => {
      isActive = false
    }
  }, [])

  const selectedCharacter = characters.find((character) => character.id === selectedCharacterId) ?? null
  const visibleCharacters = useMemo(() => getVisibleCharacters(characters, currentIndex), [characters, currentIndex])

  function moveCarousel(direction) {
    if (characters.length === 0) return

    setCurrentIndex((previousIndex) => (previousIndex + direction + characters.length) % characters.length)
  }

  function handleSelectCharacter(index) {
    const nextCharacter = characters[index]
    if (!nextCharacter) return

    setCurrentIndex(index)
    if (nextCharacter.locked) return // bloqueado: o card vira o do meio, mas não dá para escolher
    setSelectedCharacterId(nextCharacter.id)
    // Já estava escolhido: o botão já está ligado e o foco vai direto. Se não, o efeito abaixo leva o foco
    // quando o botão ligar.
    if (nextCharacter.id === selectedCharacterId) startRef.current?.focus()
  }

  // Teclado: o foco fica no card do meio (ao abrir a tela e a cada troca de personagem), então as setas para os lados
  // trocam de personagem e Enter escolhe
  useEffect(() => {
    centerRef.current?.focus()
  }, [currentIndex, isLoading])

  // Escolheu um personagem: o foco vai para "Começar Jogo", e Enter de novo começa
  useEffect(() => {
    if (selectedCharacterId) startRef.current?.focus()
  }, [selectedCharacterId])

  useEffect(() => {
    if (!showOverwriteDialog) return

    function handleOverwriteKey(event) {
      if (event.altKey || event.ctrlKey || event.metaKey || event.isComposing || event.repeat) return

      if (event.key === 'Escape') {
        event.preventDefault()
        setShowOverwriteDialog(false)
        startRef.current?.focus()
        return
      }

      const key = event.key.toLowerCase()
      if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', 'a', 'd', 'w', 's'].includes(key)) {
        event.preventDefault()
        const buttons = Array.from(document.querySelectorAll('.sessao-personagem__dialog-acoes button:not(:disabled)'))
        if (buttons.length === 0) return

        const currentIndex = buttons.findIndex((button) => button === document.activeElement)
        const direction = ['arrowright', 'd', 'arrowdown', 's'].includes(key) ? 1 : -1
        const nextIndex = currentIndex === -1
          ? (direction === 1 ? 0 : buttons.length - 1)
          : (currentIndex + direction + buttons.length) % buttons.length
        buttons[nextIndex]?.focus()
      }

    }

    document.querySelector('.sessao-personagem__dialog-cancelar')?.focus()
    window.addEventListener('keydown', handleOverwriteKey)
    return () => window.removeEventListener('keydown', handleOverwriteKey)
  }, [showOverwriteDialog])

  useEffect(() => {
    function handleKeyDown(event) {
      if (showOverwriteDialog) return
      if (isTypingTarget(event.target)) return
      if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return

      const key = event.key.toLowerCase()

      if (key === 'arrowleft' || key === 'a') {
        event.preventDefault()
        if (key === 'a') {
          backRef.current?.focus()
        } else if (characters.length > 1) {
          setCurrentIndex((previousIndex) => (previousIndex - 1 + characters.length) % characters.length)
        }
        return
      }

      if (key === 'arrowright' || key === 'd') {
        event.preventDefault()
        if (key === 'd') {
          userRef.current?.focus()
        } else if (characters.length > 1) {
          setCurrentIndex((previousIndex) => (previousIndex + 1) % characters.length)
        }
        return
      }

      const action = getMenuNavigationAction(event.key)
      if (action !== 'up' && action !== 'down') return

      event.preventDefault()

      // Para cima e para baixo só passa por três lugares: Voltar, o card do meio e Começar Jogo (quando está ligado)
      const buttons = []
      for (const button of [backRef.current, centerRef.current, startRef.current]) {
        if (button && !button.disabled) buttons.push(button)
      }
      if (buttons.length === 0) return

      const currentIndex = buttons.findIndex((button) => button === document.activeElement)
      const nextIndex = getNextIndex(currentIndex, action, buttons.length)
      buttons[nextIndex]?.focus()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [characters.length, showOverwriteDialog])

  async function startSelectedGame() {
    if (!selectedCharacter || isStartingGame) return

    setIsStartingGame(true)
    setShowOverwriteDialog(false)

    try {
      // A partida nova substitui a salva já aqui (a API troca o progresso do usuário pelo novo).
      // A sala carrega o progresso da API, então nunca depende do state da navegação.
      const newRun = createProgressSnapshot({ characterId: selectedCharacter.id })
      await apiRequest('/api/progress', { method: 'PUT', credentials: 'include', body: JSON.stringify(newRun) })

      navigate(ROUTES.novaPartida, { state: { character: selectedCharacter } })
    } catch (error) {
      if (error?.status === 401) {
        navigate(ROUTES.entrar)
        return
      }

      setError(error?.message || 'Não foi possível iniciar a partida.')
      setIsStartingGame(false)
    }
  }

  async function handleStartGame() {
    if (!selectedCharacter || isStartingGame) return

    try {
      const response = await apiRequest('/api/progress/exists', { credentials: 'include' })

      if (response?.exists) {
        setShowOverwriteDialog(true)
        return
      }

      await startSelectedGame()
    } catch (error) {
      setError(error?.message || 'Não foi possível verificar a partida salva.')
    }
  }

  return (
    <main ref={mainRef} className="sessao-personagem" aria-label="Seleção de personagem">
      <title>Seleção de personagem | The Binding of Tung Tung</title>

      <div className="sessao-personagem__layout">
        <header className="sessao-personagem__header">
          <BotaoVoltar ref={backRef} label="Voltar para o menu" onClick={() => navigate(ROUTES.menuPrincipal)} />

          <Login ref={userRef} className="sessao-personagem__usuario" />
        </header>

        <section className="sessao-personagem__carrossel" aria-live="polite">
          <button
            type="button"
            className="sessao-personagem__arrow"
            aria-label="Personagem anterior"
            onClick={() => moveCarousel(-1)}
            disabled={characters.length <= 1}
          >
            &lt;
          </button>

          <div className="sessao-personagem__vitrine">
            {isLoading ? (
              <p className="sessao-personagem__estado">Carregando personagens...</p>
            ) : visibleCharacters.length === 0 ? (
              <p className="sessao-personagem__estado">{error || EMPTY_STATE.text}</p>
            ) : (
              <>
                {visibleCharacters.map(({ character, position, index }) => {
                  const isCenter = position === 'center'

                  if (isCenter) {
                    return (
                      <button
                        key={`${character.id}-${position}`}
                        ref={centerRef}
                        type="button"
                        className={`sessao-personagem__preview sessao-personagem__preview--${position} ${selectedCharacterId === character.id ? 'sessao-personagem__preview--selecionado' : ''} ${character.locked ? 'sessao-personagem__preview--bloqueado' : ''}`}
                        style={
                          position === 'center'
                            ? { '--offset-x': '0%', '--scale': '1', '--lift': '0rem', '--z-index': '3' }
                            : undefined
                        }
                        aria-label={character.locked ? `Personagem bloqueado. ${UNLOCK_HINTS[character.id] ?? ''}` : `Selecionar ${character.name}`}
                        aria-disabled={character.locked}
                        onClick={() => handleSelectCharacter(index)}
                        aria-pressed={selectedCharacterId === character.id}
                      >
                        <CardPersonagem character={character} />
                      </button>
                    )
                  }

                  return (
                    <div
                      key={`${character.id}-${position}`}
                      className={`sessao-personagem__preview sessao-personagem__preview--${position} sessao-personagem__preview--background`}
                      style={
                        position === 'left'
                          ? { '--offset-x': '-26%', '--scale': '0.8', '--lift': '1rem', '--z-index': '1' }
                          : { '--offset-x': '26%', '--scale': '0.8', '--lift': '1rem', '--z-index': '1' }
                      }
                      aria-hidden="true"
                    >
                      <CardPersonagem character={character} />
                    </div>
                  )
                })}
              </>
            )}
          </div>

          <button
            type="button"
            className="sessao-personagem__arrow"
            aria-label="Próximo personagem"
            onClick={() => moveCarousel(1)}
            disabled={characters.length <= 1}
          >
            &gt;
          </button>
        </section>

        <button
          ref={startRef}
          type="button"
          className="sessao-personagem__inicio"
          disabled={!selectedCharacter}
          onClick={handleStartGame}
        >
          Começar Jogo
        </button>
      </div>

      {showOverwriteDialog && (
        <div className="sessao-personagem__dialog-fundo" role="presentation">
          <section className="sessao-personagem__dialog" role="alertdialog" aria-modal="true" aria-labelledby="sessao-personagem-dialog-titulo">
            <h2 id="sessao-personagem-dialog-titulo">Substituir partida salva?</h2>
            <p>Começar uma nova run apagará o progresso atual.</p>
            <div className="sessao-personagem__dialog-acoes">
              <button
                type="button"
                className="sessao-personagem__dialog-cancelar"
                onClick={() => {
                  setShowOverwriteDialog(false)
                  startRef.current?.focus()
                }}
                autoFocus
              >
                Cancelar
              </button>
              <button
                type="button"
                className="sessao-personagem__dialog-confirmar"
                disabled={isStartingGame}
                onClick={() => void startSelectedGame()}
              >
                Substituir e começar
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
