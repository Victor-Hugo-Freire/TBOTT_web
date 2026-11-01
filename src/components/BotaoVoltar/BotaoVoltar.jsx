import { useEffect } from 'react'
import './BotaoVoltar.css'

// Seta de voltar no canto superior esquerdo, igual em todas as telas.
// A tecla Esc faz o mesmo que clicar.
// - ref: vai para o botão, para o atalho A/← do menu conseguir selecioná-lo
// - label: texto lido pelo leitor de tela (ex.: "Voltar para o menu")
export default function BotaoVoltar({ ref, label, className = '', onClick }) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key !== 'Escape' || event.repeat) return

      onClick()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClick])

  return (
    <button className={`botao-voltar ${className}`} ref={ref} type="button" aria-label={label} onClick={onClick}>
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M15 5 8 12l7 7" />
      </svg>
    </button>
  )
}
