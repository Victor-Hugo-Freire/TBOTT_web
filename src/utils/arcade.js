import { ARCADE_GRAIN_PRIZE, ARCADE_ITEM_REPEAT_GRAINS, ARCADE_PRIZE_CHANCES } from '../data/economy.js'
import { overlaps } from './collision.js'
import { pickByChance } from './drops.js'
import { createRandom, mixSeed } from './random.js'
import { getCellRect } from './roomLayout.js'
import { getFeetBox } from './roomMovement.js'

// Fliperama: o tambor de bingo (a máquina) fica nas casas X do meio da sala, colunas 5 a 7 e fileiras 1 a 3
// (as torres e o tambor de drawArcade, em drawSpecialRooms.js). Encostar nela faz uma jogada (quem paga é run.js).
// Funções puras, para testar com node:test.

const MACHINE_CELLS = { col0: 5, row0: 1, col1: 7, row1: 3 }
const TOUCH_MARGIN = 6 // folga em volta dos pés: a máquina é sólida, então os pés param na borda dela
const ARCADE_SEED = 9300 // separa o sorteio do Fliperama dos outros sorteios da run
export const ARCADE_PRIZE_CELL = { col: 6, row: 5 } // o prêmio de grão ou garfo cai aqui, na frente do pedestal

// Caixa da máquina inteira (as duas torres e o tambor)
export function getArcadeMachineBox() {
  const first = getCellRect(MACHINE_CELLS.col0, MACHINE_CELLS.row0)
  const last = getCellRect(MACHINE_CELLS.col1, MACHINE_CELLS.row1)
  return { x: first.x, y: first.y, width: last.x + last.width - first.x, height: last.y + last.height - first.y }
}

// Os pés do jogador encostam na máquina?
export function isTouchingMachine(position) {
  return overlaps(getFeetBox(position, TOUCH_MARGIN), getArcadeMachineBox())
}

// Prêmio da jogada número `play` (0, 1, 2...) desta sala. Sorteio pela seed + andar + sala + jogada.
// itemAvailable = o item do Fliperama ainda pode sair (se já saiu na run, esse prêmio vira grãos).
// Devolve { kind: 'item' | 'graos' | 'garfo' | 'nada', amount }.
export function rollArcadePrize(seed, floorNumber, room, play, itemAvailable) {
  const roomSeed = mixSeed(mixSeed(seed, ARCADE_SEED + floorNumber), room.col * 16 + room.row)
  const prize = pickByChance(createRandom(mixSeed(roomSeed, play)), ARCADE_PRIZE_CHANCES)
  if (prize === 'item' && itemAvailable) return { kind: 'item', amount: 1 }
  if (prize === 'item') return { kind: 'graos', amount: ARCADE_ITEM_REPEAT_GRAINS }
  if (prize === 'graos') return { kind: 'graos', amount: ARCADE_GRAIN_PRIZE }
  if (prize === 'garfo') return { kind: 'garfo', amount: 1 }
  return { kind: 'nada', amount: 0 }
}
