import { HAZARD_AVOID_MARGIN } from '../data/enemyBehavior.js'
import { overlaps } from './collision.js'
import { CELL_HEIGHT, CELL_WIDTH, getCellPoint, GRID_COLS, GRID_ROWS } from './roomLayout.js'
import { ROOM_FLOOR } from './roomMovement.js'
import { getBaseBox } from './targets.js'

// Caminho dos inimigos até o Tung, desviando dos obstáculos. Usa a grade da sala (13 x 7 casas, roomLayout.js):
// - se o caminho em linha reta está livre, o inimigo vai direto (é o normal numa sala aberta);
// - senão, um mapa de distâncias diz, para cada casa livre, quantas casas faltam até a casa do Tung, andando só
//   para os lados, para cima e para baixo (busca em largura). O inimigo anda até a casa vizinha mais perto do Tung.
// Funções puras, para testar com node:test. solids = o que o caminho não atravessa: o que bloqueia (paredes,
// obstáculos, pedestais e portas) e os perigos do chão (getHazardBoxes), que o inimigo evita ao escolher o caminho.

const PATH_STEP = 20 // de quantas em quantas u o caminho reto é conferido
const NEIGHBORS = [
  { col: 1, row: 0 },
  { col: -1, row: 0 },
  { col: 0, row: 1 },
  { col: 0, row: -1 },
]

// Perigos do chão que o inimigo evita ao escolher o caminho (eles não bloqueiam o passo): a chapa quente, com
// HAZARD_AVOID_MARGIN de folga em volta, e os cacos de vidro do garrafão quebrado
export function getHazardBoxes(obstacles) {
  const boxes = []
  for (const obstacle of obstacles) {
    if (obstacle.removed) continue
    if (obstacle.mechanic === 'cacos') boxes.push(obstacle.box)
    if (obstacle.mechanic === 'quente') {
      const { x, y, width, height } = obstacle.box
      const margin = HAZARD_AVOID_MARGIN
      boxes.push({ x: x - margin, y: y - margin, width: width + 2 * margin, height: height + 2 * margin })
    }
  }
  return boxes
}

// Casa da grade em que está um ponto (os pés). Fora do piso, vale a casa da borda mais perto.
export function getCellAt(point) {
  const col = Math.floor((point.x - ROOM_FLOOR.left) / CELL_WIDTH)
  const row = Math.floor((point.y - ROOM_FLOOR.top) / CELL_HEIGHT)
  return { col: Math.min(GRID_COLS - 1, Math.max(0, col)), row: Math.min(GRID_ROWS - 1, Math.max(0, row)) }
}

// A caixa da base de um inimigo cabe no ponto (os pés) sem tocar em nada que bloqueia?
function fitsAt(point, solids) {
  const box = getBaseBox(point)
  return !solids.some((solid) => overlaps(box, solid))
}

// O caminho em linha reta de `from` até `to` está livre? Confere a caixa da base a cada PATH_STEP u.
export function hasClearPath(from, to, solids) {
  const steps = Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / PATH_STEP)
  for (let step = 1; step <= steps; step++) {
    const t = step / steps
    if (!fitsAt({ x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t }, solids)) return false
  }
  return true
}

// Mapa de distâncias até o Tung: distance[row][col] = quantas casas faltam (Infinity = não dá para chegar ou a
// casa está ocupada). Uma casa é livre quando a caixa da base cabe no ponto dela. Feito uma vez por quadro.
export function createChaseMap(solids, target) {
  const distance = []
  for (let row = 0; row < GRID_ROWS; row++) distance.push(new Array(GRID_COLS).fill(Infinity))
  const start = getCellAt(target)
  distance[start.row][start.col] = 0
  const queue = [start]
  while (queue.length > 0) {
    const cell = queue.shift()
    for (const step of NEIGHBORS) {
      const col = cell.col + step.col
      const row = cell.row + step.row
      if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_ROWS) continue
      if (distance[row][col] !== Infinity || !fitsAt(getCellPoint(col, row), solids)) continue
      distance[row][col] = distance[cell.row][cell.col] + 1
      queue.push({ col, row })
    }
  }
  return distance
}

// Para onde o inimigo anda para chegar a `target`: direto, com o caminho livre; senão, até o ponto da casa vizinha
// mais perto do alvo no mapa (chaseMap). Sem vizinha melhor (já está ao lado do alvo, ou preso), vai direto.
// Devolve o ponto para onde andar.
export function getChasePoint(enemy, target, chaseMap, solids) {
  if (hasClearPath(enemy, target, solids)) return target
  const here = getCellAt(enemy)
  let best = null
  let bestDistance = chaseMap[here.row][here.col]
  for (const step of NEIGHBORS) {
    const col = here.col + step.col
    const row = here.row + step.row
    if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_ROWS) continue
    if (chaseMap[row][col] < bestDistance) {
      best = { col, row }
      bestDistance = chaseMap[row][col]
    }
  }
  return best ? getCellPoint(best.col, best.row) : target
}
