// As músicas da trilha no formato do ZzFXM, por id. Só o worker (src/workers/musica.worker.js), o
// script de render e os testes importam este arquivo: a thread principal usa faixas.js.

import { VILA_ESPERA_INSTRUMENTOS, VILA_ESPERA_INTRO_INSTRUMENTOS, VILA_ESPERA_INTRO_SONG, VILA_ESPERA_SONG } from './vila-espera.js'
import { CANTINA_HARMONIA, CANTINA_INSTRUMENTOS, CANTINA_MELODIA, CANTINA_META, CANTINA_MOTIVO, CANTINA_SECOES, CANTINA_SONG } from './andar-cantina.js'
import { CUCINA_HARMONIA, CUCINA_INSTRUMENTOS, CUCINA_MELODIA, CUCINA_META, CUCINA_MOTIVO, CUCINA_SECOES, CUCINA_SONG } from './andar-cucina.js'
import { PIAZZA_HARMONIA, PIAZZA_INSTRUMENTOS, PIAZZA_MELODIA, PIAZZA_META, PIAZZA_MOTIVO, PIAZZA_SECOES, PIAZZA_SONG } from './andar-piazza.js'
import { PASTIFICIO_HARMONIA, PASTIFICIO_INSTRUMENTOS, PASTIFICIO_MELODIA, PASTIFICIO_META, PASTIFICIO_MOTIVO, PASTIFICIO_SECOES, PASTIFICIO_SONG } from './andar-pastificio.js'
import { CHEFE_FASES, criarIntroducao, criarTransicao, criarVitoria } from './chefe.js'
import { criarAbertura, criarFinal, PALCO_BASTIDORES, PALCO_SHOW } from './palco.js'
import { PORTO_HARMONIA, PORTO_INSTRUMENTOS, PORTO_MELODIA, PORTO_META, PORTO_MOTIVO, PORTO_SECOES, PORTO_SONG } from './andar-porto.js'

// As salas do chefe e do palco: faixas na grade de 12 passos, com introduções, transições e finais
const INTRO_DO_CHEFE = criarIntroducao({ andamento: 140, tonica: 0, compassos: 4 })
const TRANSICAO_DA_FASE_2 = criarTransicao({ andamento: 152, tonica: 3 })
const VITORIA_DO_CHEFE = criarVitoria({ andamento: 140 })
const INTRO_DO_FINAL = criarIntroducao({ andamento: 144, tonica: 0, compassos: 6 })
const TRANSICAO_FINAL_2 = criarTransicao({ andamento: 156, tonica: 3 })
const TRANSICAO_FINAL_3 = criarTransicao({ andamento: 168, tonica: 6 })
const VITORIA_DO_FINAL = criarVitoria({ andamento: 144, grande: true })
const ABERTURA_DO_PALCO = criarAbertura(152)
const FINAL_DO_PALCO = criarFinal(152)

export const MUSICAS = Object.freeze({
  'a-vila-espera': VILA_ESPERA_SONG,
  'andar-cantina': CANTINA_SONG,
  'andar-cucina': CUCINA_SONG,
  'andar-piazza': PIAZZA_SONG,
  'andar-pastificio': PASTIFICIO_SONG,
  'andar-porto': PORTO_SONG,
  chefe: CHEFE_FASES.chefe.song,
  'chefe-fase2': CHEFE_FASES['chefe-fase2'].song,
  'chefe-vitoria': VITORIA_DO_CHEFE.song,
  'chefe-final': CHEFE_FASES['chefe-final'].song,
  'chefe-final-fase2': CHEFE_FASES['chefe-final-fase2'].song,
  'chefe-final-fase3': CHEFE_FASES['chefe-final-fase3'].song,
  'chefe-final-vitoria': VITORIA_DO_FINAL.song,
  palco: PALCO_BASTIDORES.song,
  'palco-show': PALCO_SHOW.song,
  'palco-fim': FINAL_DO_PALCO.song,
})

// Nomes dos instrumentos de cada música, na ordem do array de instrumentos (testes e medições)
export const INSTRUMENTOS_DAS_MUSICAS = Object.freeze({
  'a-vila-espera': VILA_ESPERA_INSTRUMENTOS,
  'andar-cantina': CANTINA_INSTRUMENTOS,
  'andar-cucina': CUCINA_INSTRUMENTOS,
  'andar-piazza': PIAZZA_INSTRUMENTOS,
  'andar-pastificio': PASTIFICIO_INSTRUMENTOS,
  'andar-porto': PORTO_INSTRUMENTOS,
  chefe: CHEFE_FASES.chefe.instrumentos,
  'chefe-fase2': CHEFE_FASES['chefe-fase2'].instrumentos,
  'chefe-vitoria': VITORIA_DO_CHEFE.instrumentos,
  'chefe-final': CHEFE_FASES['chefe-final'].instrumentos,
  'chefe-final-fase2': CHEFE_FASES['chefe-final-fase2'].instrumentos,
  'chefe-final-fase3': CHEFE_FASES['chefe-final-fase3'].instrumentos,
  'chefe-final-vitoria': VITORIA_DO_FINAL.instrumentos,
  palco: PALCO_BASTIDORES.instrumentos,
  'palco-show': PALCO_SHOW.instrumentos,
  'palco-fim': FINAL_DO_PALCO.instrumentos,
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

// META de cada faixa de andar: andamento, grade (passos por tempo e tempos por compasso), tônica e
// modo (medições e testes)
export const METAS_DAS_MUSICAS = Object.freeze({
  'andar-cantina': CANTINA_META,
  'andar-cucina': CUCINA_META,
  'andar-piazza': PIAZZA_META,
  'andar-pastificio': PASTIFICIO_META,
  'andar-porto': PORTO_META,
})

// Harmonia de cada faixa de andar, um item por compasso (analiseDosAndares.js)
export const HARMONIAS_DAS_MUSICAS = Object.freeze({
  'andar-cantina': CANTINA_HARMONIA,
  'andar-cucina': CUCINA_HARMONIA,
  'andar-piazza': PIAZZA_HARMONIA,
  'andar-pastificio': PASTIFICIO_HARMONIA,
  'andar-porto': PORTO_HARMONIA,
})

// Introduções: tocam uma vez antes do loop (o corpo é a música de MUSICAS)
export const INTROS = Object.freeze({
  'a-vila-espera': VILA_ESPERA_INTRO_SONG,
  chefe: INTRO_DO_CHEFE.song,
  'chefe-fase2': TRANSICAO_DA_FASE_2.song,
  'chefe-final': INTRO_DO_FINAL.song,
  'chefe-final-fase2': TRANSICAO_FINAL_2.song,
  'chefe-final-fase3': TRANSICAO_FINAL_3.song,
  'palco-show': ABERTURA_DO_PALCO.song,
})

export const INSTRUMENTOS_DAS_INTROS = Object.freeze({
  'a-vila-espera': VILA_ESPERA_INTRO_INSTRUMENTOS,
  chefe: INTRO_DO_CHEFE.instrumentos,
  'chefe-fase2': TRANSICAO_DA_FASE_2.instrumentos,
  'chefe-final': INTRO_DO_FINAL.instrumentos,
  'chefe-final-fase2': TRANSICAO_FINAL_2.instrumentos,
  'chefe-final-fase3': TRANSICAO_FINAL_3.instrumentos,
  'palco-show': ABERTURA_DO_PALCO.instrumentos,
})

// As faixas de corpo das salas (chefe e palco) para as medições e os testes: meta, seções, harmonia e
// onde caem o tung-tung-tung e a célula do Tung. Os finais (vitória) e as introduções não entram.
const CORPOS_DAS_SALAS = Object.freeze({
  chefe: CHEFE_FASES.chefe,
  'chefe-fase2': CHEFE_FASES['chefe-fase2'],
  'chefe-final': CHEFE_FASES['chefe-final'],
  'chefe-final-fase2': CHEFE_FASES['chefe-final-fase2'],
  'chefe-final-fase3': CHEFE_FASES['chefe-final-fase3'],
  palco: PALCO_BASTIDORES,
  'palco-show': PALCO_SHOW,
})
const dasSalas = (campo) => Object.freeze(Object.fromEntries(Object.entries(CORPOS_DAS_SALAS).map(([id, faixa]) => [id, faixa[campo]])))
export const METAS_DAS_SALAS = dasSalas('meta')
export const SECOES_DAS_SALAS = dasSalas('secoes')
export const HARMONIAS_DAS_SALAS = dasSalas('harmonia')
export const MOTIVOS_DAS_SALAS = dasSalas('motivo')
// Compassos de cada intro, final e transição (para os testes de duração e de compasso inteiro)
export const COMPASSOS_DAS_INTROS = Object.freeze({
  chefe: INTRO_DO_CHEFE.compassos,
  'chefe-fase2': TRANSICAO_DA_FASE_2.compassos,
  'chefe-final': INTRO_DO_FINAL.compassos,
  'chefe-final-fase2': TRANSICAO_FINAL_2.compassos,
  'chefe-final-fase3': TRANSICAO_FINAL_3.compassos,
  'palco-show': ABERTURA_DO_PALCO.compassos,
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
