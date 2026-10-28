import { useNavigate } from 'react-router-dom'
import { useBackgroundMusic } from '../../context/useBackgroundMusic.js'
import { ROUTES } from '../../routes/paths.js'
import './Opcoes.css'

export default function Opcoes() {
  const navigate = useNavigate()
  const { enabled, setEnabled, status } = useBackgroundMusic()

  return (
    <main className="opcoes">
      <title>Options | The Binding of Tung Tung</title>
      <section className="opcoes__painel" aria-labelledby="opcoes-titulo">
        <h1 id="opcoes-titulo">Options</h1>
        <div className="opcoes__linha">
          <div>
            <h2>Música de fundo</h2>
            <p>A música toca somente durante a sala inicial.</p>
          </div>
          <button
            type="button"
            className="opcoes__alternancia"
            role="switch"
            aria-checked={enabled}
            onClick={() => setEnabled((current) => !current)}
          >
            {enabled ? 'Ligada' : 'Desligada'}
          </button>
        </div>

        {status === 'blocked' && enabled && (
          <p className="opcoes__aviso" role="status">
            O navegador bloqueou a reprodução automática. Tente novamente ao entrar na sala.
          </p>
        )}
        {status === 'error' && enabled && (
          <p className="opcoes__aviso" role="status">
            Não foi possível carregar a música da sala inicial.
          </p>
        )}

        <button
          type="button"
          className="opcoes__voltar"
          onClick={() => navigate(ROUTES.menuPrincipal)}
        >
          Voltar ao menu
        </button>
      </section>
    </main>
  )
}
