import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../routes/paths.js'
import { isAdvanceKey } from '../../utils/keyboard.js'
import TitleScene from './TitleScene.jsx'
import './Inicial.css'

// Tela inicial (Issue #6): mostra a cena do jogo e vai para o menu principal
// quando o jogador aperta uma tecla válida (veja isAdvanceKey).
export default function Inicial() {
  const navigate = useNavigate()
  // true enquanto a animação de saída (transição para o menu) acontece
  const [saindo, setSaindo] = useState(false)

  useEffect(() => {
    function handleKeyDown(event) {
      if (!isAdvanceKey(event)) return
      // Remove o listener antes de começar a saída: outra tecla apertada
      // no mesmo instante não dispara uma segunda navegação.
      window.removeEventListener('keydown', handleKeyDown)
      setSaindo(true)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Vai para o menu quando a animação de saída da tela termina.
  // As animações de dentro da cena (como a respiração) também disparam esse
  // evento, por isso conferimos o elemento e o nome da animação.
  function handleAnimationEnd(event) {
    if (event.target === event.currentTarget && event.animationName === 'inicial-saida') {
      navigate(ROUTES.menuPrincipal)
    }
  }

  return (
    <main className={saindo ? 'inicial inicial--saindo' : 'inicial'} onAnimationEnd={handleAnimationEnd}>
      <title>The Binding of Tung Tung</title>
      {/* Textos da cena para leitores de tela (o canvas é só imagem) */}
      <h1 className="visually-hidden">The Binding of Tung Tung</h1>
      <p className="visually-hidden">Clique qualquer tecla para iniciar.</p>
      <TitleScene />
    </main>
  )
}
