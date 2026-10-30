import './CardUsuario.css'

// Cartão com avatar e nome do usuário. Quem usa define a posição (por className).
// - ref: vai para o botão, para o menu conseguir selecioná-lo pelo teclado
// - nome: texto mostrado ao lado do avatar
export default function CardUsuario({ ref, nome, className = '', onClick }) {
  return (
    <button className={`card-usuario ${className}`} ref={ref} type="button" aria-label="Perfil do usuário" onClick={onClick}>
      <span className="card-usuario__avatar" aria-hidden="true">
        <svg viewBox="0 0 48 48">
          <circle cx="24" cy="16" r="9" />
          <path d="M7 43c1-10 7-15 17-15s16 5 17 15" />
        </svg>
      </span>
      <span>{nome}</span>
    </button>
  )
}
