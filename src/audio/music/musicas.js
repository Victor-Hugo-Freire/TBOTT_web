// As músicas da trilha no formato do ZzFXM, por id. Só o worker (src/workers/musica.worker.js), o
// script de render e os testes importam este arquivo: a thread principal usa faixas.js.

import { VILA_ESPERA_INSTRUMENTOS, VILA_ESPERA_SONG } from './vila-espera.js'
import { CANTINA_INSTRUMENTOS, CANTINA_SONG } from './andar-cantina.js'

export const MUSICAS = Object.freeze({
  'a-vila-espera': VILA_ESPERA_SONG,
  'andar-cantina': CANTINA_SONG,
})

// Nomes dos instrumentos de cada música, na ordem do array de instrumentos (testes e medições)
export const INSTRUMENTOS_DAS_MUSICAS = Object.freeze({
  'a-vila-espera': VILA_ESPERA_INSTRUMENTOS,
  'andar-cantina': CANTINA_INSTRUMENTOS,
})

export function obterMusica(id) {
  const musica = MUSICAS[id]
  if (!musica) throw new Error(`Faixa desconhecida: ${id}`)
  return musica
}
