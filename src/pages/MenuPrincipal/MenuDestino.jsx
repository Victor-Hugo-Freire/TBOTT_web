import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../routes/paths.js'
import './MenuPrincipal.css'

// Tela provisória. Com proximaRota, mostra um botão que leva para a próxima tela.
export default function MenuDestino({ titulo, proximaRota, textoProxima }) {
  const navigate = useNavigate()

  return (
    <main className="menu-destino">
      <title>{titulo} | The Binding of Tung Tung</title>
      <div className="menu-destino__conteudo">
        <h1>{titulo}</h1>
        <p>Esta tela será implementada em uma próxima etapa.</p>
        {proximaRota && (
          <button type="button" onClick={() => navigate(proximaRota)}>
            {textoProxima}
          </button>
        )}
        <button type="button" onClick={() => navigate(ROUTES.menuPrincipal)}>
          Voltar ao menu
        </button>
      </div>
    </main>
  )
}
