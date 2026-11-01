import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BotaoVoltar from '../../components/BotaoVoltar/BotaoVoltar.jsx'
import Login from '../../components/Login/Login.jsx'
import { ROUTES } from '../../routes/paths.js'
import { apiRequest } from '../../services/api.js'
import { formatDuration } from '../../utils/formatDuration.js'
import './Ranking.css'

const PAGE_SIZE = 50

// Mesmo ícone de avatar do CardUsuario (ainda não existe foto de perfil no banco)
function Avatar() {
  return (
    <span className="ranking__avatar" aria-hidden="true">
      <svg viewBox="0 0 48 48">
        <circle cx="24" cy="16" r="9" />
        <path d="M7 43c1-10 7-15 17-15s16 5 17 15" />
      </svg>
    </span>
  )
}

export default function Ranking() {
  const navigate = useNavigate()
  const backRef = useRef(null)
  const [entries, setEntries] = useState([])
  const [hasMore, setHasMore] = useState(false)
  // attempt muda a cada clique em "Carregar mais", para tentar de novo mesmo com o mesmo offset
  const [request, setRequest] = useState({ offset: 0, attempt: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    backRef.current?.focus()
  }, [])

  // Busca a página atual. Ao pedir "carregar mais", o efeito roda de novo.
  useEffect(() => {
    const { offset } = request
    let isActive = true

    async function loadRanking() {
      setIsLoading(true)
      setError('')

      try {
        const response = await apiRequest(`/api/ranking?limit=${PAGE_SIZE}&offset=${offset}`, { credentials: 'include' })
        if (!isActive) return

        const page = Array.isArray(response?.ranking) ? response.ranking : []
        // slice evita linhas repetidas se a mesma página for buscada de novo (nova tentativa)
        setEntries((previous) => [...previous.slice(0, offset), ...page])
        // A API não informa o total: página cheia significa que talvez haja mais
        setHasMore(page.length === PAGE_SIZE)
      } catch (loadError) {
        if (!isActive) return
        setError(loadError.message || 'Não foi possível carregar o ranking.')
      } finally {
        if (isActive) setIsLoading(false)
      }
    }

    loadRanking()

    return () => {
      isActive = false
    }
  }, [request])

  function getMessage() {
    if (isLoading && entries.length === 0) return 'Carregando ranking...'
    if (error && entries.length === 0) return error
    if (entries.length === 0) return 'Ninguém completou uma run ainda.'
    return ''
  }

  const message = getMessage()

  return (
    <main className="ranking">
      <title>Ranking | The Binding of Tung Tung</title>

      <BotaoVoltar ref={backRef} label="Voltar para o menu" onClick={() => navigate(ROUTES.menuPrincipal)} />

      <Login className="ranking__usuario" />

      <section className="ranking__painel" aria-label="Ranking dos jogadores">
        <div className="ranking__rolagem">
          <table className="ranking__tabela">
            <thead>
              <tr>
                <th scope="col">Usuário</th>
                <th scope="col">Personagem</th>
                <th scope="col">Tempo</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.username}>
                  <td>
                    <span className="ranking__usuario-celula">
                      <Avatar />
                      <span className="ranking__posicao">{entry.position}.</span>
                      <span className="ranking__nome">{entry.username}</span>
                    </span>
                  </td>
                  <td>{entry.character?.name}</td>
                  <td className="ranking__tempo">{formatDuration(entry.durationMs)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {message && <p className="ranking__estado" aria-live="polite">{message}</p>}

          {error && entries.length > 0 && <p className="ranking__estado" role="alert">{error}</p>}

          {hasMore && (
            <button
              type="button"
              className="ranking__mais"
              disabled={isLoading}
              onClick={() => setRequest((previous) => ({ offset: entries.length, attempt: previous.attempt + 1 }))}
            >
              {isLoading ? 'Carregando...' : 'Carregar mais'}
            </button>
          )}
        </div>
      </section>
    </main>
  )
}
