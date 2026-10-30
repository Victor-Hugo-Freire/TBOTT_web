import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../routes/paths.js'
import './Opcoes.css'

export default function Opcoes() {
  const navigate = useNavigate()

  return (
    <main className="opcoes">
      <title>Options | The Binding of Tung Tung</title>
      <section className="opcoes__painel" aria-labelledby="opcoes-titulo">
        <h1 id="opcoes-titulo">Options</h1>

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
