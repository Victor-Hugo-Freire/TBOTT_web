// As músicas da trilha no formato do ZzFXM, por id. Só o worker (src/workers/musica.worker.js), o
// script de render e os testes importam este arquivo: a thread principal usa faixas.js.

import { VILA_ESPERA_INSTRUMENTOS, VILA_ESPERA_INTRO_INSTRUMENTOS, VILA_ESPERA_INTRO_SONG, VILA_ESPERA_SONG } from './vila-espera.js'
import { CANTINA_INSTRUMENTOS, CANTINA_MELODIA, CANTINA_MOTIVO, CANTINA_SECOES, CANTINA_SONG } from './andar-cantina.js'
import { CUCINA_INSTRUMENTOS, CUCINA_MELODIA, CUCINA_MOTIVO, CUCINA_SECOES, CUCINA_SONG } from './andar-cucina.js'
import { PIAZZA_INSTRUMENTOS, PIAZZA_MELODIA, PIAZZA_MOTIVO, PIAZZA_SECOES, PIAZZA_SONG } from './andar-piazza.js'
import { PASTIFICIO_INSTRUMENTOS, PASTIFICIO_MELODIA, PASTIFICIO_MOTIVO, PASTIFICIO_SECOES, PASTIFICIO_SONG } from './andar-pastificio.js'
import { PORTO_INSTRUMENTOS, PORTO_MELODIA, PORTO_MOTIVO, PORTO_SECOES, PORTO_SONG } from './andar-porto.js'

export const MUSICAS = Object.freeze({
  'a-vila-espera': VILA_ESPERA_SONG,
  'andar-cantina': CANTINA_SONG,
  'andar-cucina': CUCINA_SONG,
  'andar-piazza': PIAZZA_SONG,
  'andar-pastificio': PASTIFICIO_SONG,
  'andar-porto': PORTO_SONG,
})

// Nomes dos instrumentos de cada música, na ordem do array de instrumentos (testes e medições)
export const INSTRUMENTOS_DAS_MUSICAS = Object.freeze({
  'a-vila-espera': VILA_ESPERA_INSTRUMENTOS,
  'andar-cantina': CANTINA_INSTRUMENTOS,
  'andar-cucina': CUCINA_INSTRUMENTOS,
  'andar-piazza': PIAZZA_INSTRUMENTOS,
  'andar-pastificio': PASTIFICIO_INSTRUMENTOS,
  'andar-porto': PORTO_INSTRUMENTOS,
})

// Onde cada faixa toca a célula do Tung e o tung-tung-tung (os testes conferem)
export const MOTIVOS_DAS_MUSICAS = Object.freeze({
  'andar-cantina': CANTINA_MOTIVO,
  'andar-cucina': CUCINA_MOTIVO,
  'andar-piazza': PIAZZA_MOTIVO,
  'andar-pastificio': PASTIFICIO_MOTIVO,
  'andar-porto': PORTO_MOTIVO,
})

// Vozes de melodia de cada faixa de andar (analiseMelodica.js): medições e testes
export const MELODIAS_DAS_MUSICAS = Object.freeze({
  'andar-cantina': CANTINA_MELODIA,
  'andar-cucina': CUCINA_MELODIA,
  'andar-piazza': PIAZZA_MELODIA,
  'andar-pastificio': PASTIFICIO_MELODIA,
  'andar-porto': PORTO_MELODIA,
})

// Seções de cada faixa ({ nome, papel, inicio, compassos }): medições e testes
export const SECOES_DAS_MUSICAS = Object.freeze({
  'andar-cantina': CANTINA_SECOES,
  'andar-cucina': CUCINA_SECOES,
  'andar-piazza': PIAZZA_SECOES,
  'andar-pastificio': PASTIFICIO_SECOES,
  'andar-porto': PORTO_SECOES,
})

// Introduções: tocam uma vez antes do loop (o corpo é a música de MUSICAS)
export const INTROS = Object.freeze({
  'a-vila-espera': VILA_ESPERA_INTRO_SONG,
})

export const INSTRUMENTOS_DAS_INTROS = Object.freeze({
  'a-vila-espera': VILA_ESPERA_INTRO_INSTRUMENTOS,
})

export function obterMusica(id) {
  const musica = MUSICAS[id]
  if (!musica) throw new Error(`Faixa desconhecida: ${id}`)
  return musica
}

// A faixa inteira para a preparação: { corpo, intro } (intro null quando a faixa não tem)
export function obterFaixa(id) {
  return { corpo: obterMusica(id), intro: INTROS[id] ?? null }
}
