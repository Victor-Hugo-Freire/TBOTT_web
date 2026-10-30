import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CardUsuario from '../../components/CardUsuario/CardUsuario.jsx'
import { apiRequest } from '../../services/api.js'
import { ROUTES } from '../../routes/paths.js'
import './SessaoPersonagem.css'

const EMPTY_STATE = {
  text: 'Sem personagens disponíveis no momento.',
}

function getVisibleCharacters(characters, currentIndex) {
  if (characters.length === 0) return []

  const positions = [
    { position: 'left', offset: -1 },
    { position: 'center', offset: 0 },
    { position: 'right', offset: 1 },
  ]

  return positions.map(({ position, offset }) => {
    const index = characters.length === 1 ? 0 : (currentIndex + offset + characters.length) % characters.length

    return {
      character: characters[index],
      position,
      index,
    }
  })
}

export default function SessaoPersonagem() {
  const navigate = useNavigate()
  const [characters, setCharacters] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedCharacterId, setSelectedCharacterId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isActive = true

    async function loadCharacters() {
      setIsLoading(true)
      setError('')

      try {
        const response = await apiRequest('/api/characters')
        if (!isActive) return

        const list = Array.isArray(response?.characters) ? response.characters : []
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

  const currentCharacter = characters[currentIndex] ?? null
  const selectedCharacter = characters.find((character) => character.id === selectedCharacterId) ?? null
  const activeCharacter = selectedCharacter ?? currentCharacter
  const visibleCharacters = useMemo(() => getVisibleCharacters(characters, currentIndex), [characters, currentIndex])

  const selectionIndicators = characters.map((character, index) => ({
    ...character,
    isActive: selectedCharacterId ? character.id === selectedCharacterId : index === currentIndex,
  }))

  function moveCarousel(direction) {
    if (characters.length === 0) return

    setCurrentIndex((previousIndex) => (previousIndex + direction + characters.length) % characters.length)
  }

  function handleSelectCharacter(index) {
    const nextCharacter = characters[index]
    if (!nextCharacter) return

    setCurrentIndex(index)
    setSelectedCharacterId(nextCharacter.id)
  }

  function handleStartGame() {
    if (!activeCharacter) return
    navigate(ROUTES.novaPartida, { state: { character: activeCharacter } })
  }

  return (
    <main className="sessao-personagem" aria-label="Seleção de personagem">
      <title>Seleção de personagem | The Binding of Tung Tung</title>

      <div className="sessao-personagem__layout">
        <header className="sessao-personagem__header">
          <button
            type="button"
            className="sessao-personagem__voltar"
            aria-label="Voltar ao menu principal"
            onClick={() => navigate(ROUTES.menuPrincipal)}
          >
            &lt;
          </button>

          <CardUsuario
            className="sessao-personagem__usuario"
            nome="(nome do usuário)"
            onClick={() => navigate(ROUTES.perfil)}
          />
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
                        type="button"
                        className={`sessao-personagem__preview sessao-personagem__preview--${position} ${currentCharacter?.id === character.id ? 'sessao-personagem__preview--selecionado' : ''}`}
                        style={
                          position === 'center'
                            ? { '--offset-x': '0%', '--scale': '1', '--lift': '0rem', '--z-index': '3' }
                            : undefined
                        }
                        aria-label={`Selecionar ${character.name}`}
                        onClick={() => handleSelectCharacter(index)}
                        aria-pressed={selectedCharacterId === character.id}
                      >
                        <div className="sessao-personagem__info">
                          <span className="sessao-personagem__nome">{character.name}</span>
                          <p className="sessao-personagem__descricao">{character.description}</p>
                        </div>
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
                      <div className="sessao-personagem__info">
                        <span className="sessao-personagem__nome">{character.name}</span>
                        <p className="sessao-personagem__descricao">{character.description}</p>
                      </div>
                    </div>
                  )
                })}

                <div className="sessao-personagem__indicadores" aria-label="Indicadores de personagem">
                  {selectionIndicators.map((character) => (
                    <button
                      key={character.id}
                      type="button"
                      className={`sessao-personagem__indicador ${character.isActive ? 'sessao-personagem__indicador--ativo' : ''}`}
                      aria-label={`Selecionar ${character.name}`}
                      onClick={() => handleSelectCharacter(characters.findIndex((item) => item.id === character.id))}
                      aria-pressed={character.isActive}
                    />
                  ))}
                </div>
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
          type="button"
          className="sessao-personagem__inicio"
          disabled={!activeCharacter}
          onClick={handleStartGame}
        >
          Começar Jogo
        </button>
      </div>
    </main>
  )
}
