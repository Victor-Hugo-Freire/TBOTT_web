import { getCharacterFolder } from '../../data/characterSprites.js'
import { getBaseStats } from '../../utils/stats.js'
import './AvisoPersonagem.css'

// Quanto tempo o aviso fica na tela. A animação do CSS dura o mesmo tempo (entra, fica e sai); quem mostra o aviso
// tira ele da tela depois deste tempo.
export const AVISO_PERSONAGEM_MS = 4000

// Aviso no canto inferior direito quando um personagem é liberado: o rosto (recorte da foto da seleção),
// "NOVO PERSONAGEM" e o nome. Não pede nenhuma tecla nem tapa o jogo: o leitor de tela anuncia o texto (role="status").
export default function AvisoPersonagem({ characterId }) {
  const { name } = getBaseStats(characterId)

  return (
    <div className="aviso-personagem" role="status" style={{ animationDuration: `${AVISO_PERSONAGEM_MS}ms` }}>
      <div className="aviso-personagem__rosto" aria-hidden="true">
        <img src={`${getCharacterFolder(characterId)}/selecao.jpg`} alt="" />
      </div>
      <div className="aviso-personagem__texto">
        <span className="aviso-personagem__titulo">NOVO PERSONAGEM</span>
        <span className="aviso-personagem__nome">{name}</span>
      </div>
    </div>
  )
}
