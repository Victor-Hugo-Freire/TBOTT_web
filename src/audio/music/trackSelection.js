// Qual faixa toca em cada momento: função pura, a partir da rota, do andar e do tipo da sala.
//
// - Fora de /jogo: a "A Vila Espera".
// - Em /jogo: a faixa do andar ("A Ronda" de cada andar). Loja, descanso, God, fliperama e pacto
//   têm faixa própria. Tesouro e adega ficam com a faixa do andar.
// - Sala do chefe: a faixa do chefe (andares 1 a 4: chefe e chefe-fase2; andar 5, o Tralalero:
//   chefe-final, -fase2 e -fase3). Quando o chefe cai (bossState 'vitoria'), o final da vitória.
//   bossPhase e bossState vêm de run.boss (hoje não existe: a luta é a issue #47; sem ele, fase 1 e luta).
// - Palco: os bastidores (palco) com a sala aberta, antes da Batuta e depois da vitória; o show (palco-show)
//   enquanto as ondas lutam. O final do espetáculo (palco-fim) é um evento da mesa, não uma faixa de contexto.
// - Faixa ainda não composta: a sala especial usa a faixa do andar; o andar usa a Cantina.

import { LAST_FLOOR } from '../../utils/floorGenerator.js'
import { ROUTES } from '../../routes/paths.js'
import { FAIXAS, FAIXAS_COMPOSTAS } from './faixas.js'

export const FAIXA_DO_MENU = 'a-vila-espera'
export const FAIXA_INICIAL = 'andar-cantina'

export const FAIXAS_DOS_ANDARES = Object.freeze([
  'andar-cantina', 'andar-cucina', 'andar-piazza', 'andar-pastificio', 'andar-porto',
])

export const SALAS_COM_FAIXA_PROPRIA = Object.freeze({
  loja: 'loja',
  descanso: 'descanso',
  god: 'god',
  fliperama: 'fliperama',
  pacto: 'pacto',
})

// Faixa do plano (pode ainda não existir). Andar além do último → null (a run acabou).
export const FASES_DO_CHEFE = Object.freeze({
  comum: Object.freeze(['chefe', 'chefe-fase2']),
  final: Object.freeze(['chefe-final', 'chefe-final-fase2', 'chefe-final-fase3']),
})
export const VITORIA_DO_CHEFE = Object.freeze({ comum: 'chefe-vitoria', final: 'chefe-final-vitoria' })

// O chefe do andar 5 é sempre o Tralalero Tralala (o chefe final); os dos andares 1 a 4 compartilham a faixa
export function getBossTrack(floorNumber, { bossPhase = 1, bossState = 'luta' } = {}) {
  const familia = floorNumber === LAST_FLOOR ? 'final' : 'comum'
  if (bossState === 'vitoria') return VITORIA_DO_CHEFE[familia]
  const fases = FASES_DO_CHEFE[familia]
  const fase = Number.isInteger(bossPhase) ? Math.min(Math.max(bossPhase, 1), fases.length) : 1
  return fases[fase - 1]
}

// 'show' = as ondas lutando; 'espera' e 'depois' (Batuta já pega, luta vencida) = os bastidores
export const getStageTrack = (palco) => (palco === 'show' ? 'palco-show' : 'palco')

export function getPlannedTrack({ floorNumber, roomType, bossPhase, bossState, palco }) {
  if (!Number.isInteger(floorNumber) || floorNumber < 1 || floorNumber > LAST_FLOOR) return null
  if (roomType === 'chefe') return getBossTrack(floorNumber, { bossPhase, bossState })
  if (roomType === 'palco') return getStageTrack(palco)
  return SALAS_COM_FAIXA_PROPRIA[roomType] ?? FAIXAS_DOS_ANDARES[floorNumber - 1]
}

// Faixa do andar, com a Cantina no lugar das que ainda não foram compostas
export function getFloorTrack(floorNumber, compostas = FAIXAS_COMPOSTAS) {
  const planejada = getPlannedTrack({ floorNumber, roomType: 'comum' })
  if (!planejada) return null
  return compostas.includes(planejada) ? planejada : FAIXA_INICIAL
}

// Faixa que toca de fato (só faixas compostas)
export function getTrackForContext({ pathname = ROUTES.novaPartida, floorNumber, roomType, bossPhase, bossState, palco }, compostas = FAIXAS_COMPOSTAS) {
  if (pathname !== ROUTES.novaPartida) return FAIXA_DO_MENU
  const planejada = getPlannedTrack({ floorNumber, roomType, bossPhase, bossState, palco })
  if (!planejada) return null
  if (compostas.includes(planejada)) return planejada
  return getFloorTrack(floorNumber, compostas)
}

export function isKnownTrack(id) {
  return Object.hasOwn(FAIXAS, id)
}
