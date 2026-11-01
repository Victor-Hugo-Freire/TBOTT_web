import { Navigate, useNavigate } from 'react-router-dom'
import BotaoVoltar from '../../components/BotaoVoltar/BotaoVoltar.jsx'
import Login from '../../components/Login/Login.jsx'
import { useSession } from '../../context/useSession.js'
import { ROUTES } from '../../routes/paths.js'
import './Entrar.css'

// Tela de entrada (Issue #14): é para onde vai quem não está logado.
// Depois do login, ou se já houver sessão, segue para o menu principal.
export default function Entrar() {
  const navigate = useNavigate()
  const { isAuthenticated, isLoading, sessionExpired } = useSession()

  if (isLoading) return null
  if (isAuthenticated) return <Navigate to={ROUTES.menuPrincipal} replace />

  return (
    <main className="entrar">
      <title>Entrar | The Binding of Tung Tung</title>

      <BotaoVoltar label="Voltar para a tela inicial" onClick={() => navigate(ROUTES.inicial)} />

      <section className="entrar__painel" aria-label="Acesso ao jogo">
        <h1 className="entrar__titulo">The Binding of Tung Tung</h1>
        {sessionExpired && (
          <p className="entrar__aviso" role="alert">
            Sua sessão expirou. Entre de novo.
          </p>
        )}
        <Login className="entrar__login" />
      </section>
    </main>
  )
}
