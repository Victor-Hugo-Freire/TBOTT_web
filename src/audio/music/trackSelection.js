// Qual faixa toca em cada momento: função pura, a partir da rota, do andar e do tipo da sala.
//
// - Fora de /jogo: a "A Vila Espera".
// - Em /jogo: a faixa do andar ("A Ronda" de cada andar). Loja, descanso, God, fliperama e pacto
//   têm faixa própria. Tesouro, palco, adega e chefe ficam com a faixa do andar (o chefe só ganha
//   faixa quando houver luta de verdade).
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
export function getPlannedTrack({ floorNumber, roomType }) {
  if (!Number.isInteger(floorNumber) || floorNumber < 1 || floorNumber > LAST_FLOOR) return null
  return SALAS_COM_FAIXA_PROPRIA[roomType] ?? FAIXAS_DOS_ANDARES[floorNumber - 1]
}

// Faixa do andar, com a Cantina no lugar das que ainda não foram compostas
export function getFloorTrack(floorNumber, compostas = FAIXAS_COMPOSTAS) {
  const planejada = getPlannedTrack({ floorNumber, roomType: 'comum' })
  if (!planejada) return null
  return compostas.includes(planejada) ? planejada : FAIXA_INICIAL
}

// Faixa que toca de fato (só faixas compostas)
export function getTrackForContext({ pathname = ROUTES.novaPartida, floorNumber, roomType }, compostas = FAIXAS_COMPOSTAS) {
  if (pathname !== ROUTES.novaPartida) return FAIXA_DO_MENU
  const planejada = getPlannedTrack({ floorNumber, roomType })
  if (!planejada) return null
  if (compostas.includes(planejada)) return planejada
  return getFloorTrack(floorNumber, compostas)
}

export function isKnownTrack(id) {
  return Object.hasOwn(FAIXAS, id)
}
