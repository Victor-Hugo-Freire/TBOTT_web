import data from '../data/roomLayouts.json' with { type: 'json' }
import { overlaps } from './collision.js'
import { DOOR_CELLS, getEntryPosition, SIDES } from './doors.js'
import { shuffle } from './random.js'
import { getFeetBox, PLAYER_FEET_BOX, ROOM_FLOOR, ROOM_PLAYER_BOUNDS, ROOM_WALLS } from './roomMovement.js'

// Layouts das salas: uma grade de 13 x 7 casas sobre o piso, com uma letra por casa
// (veja src/data/roomLayouts.json). A letra diz o papel; o andar escolhe o obstáculo.
// Salas especiais: o cenário desenhado (balcão, mesa, piscina...) deve cobrir as casas X,
// porque a colisão usa a casa X inteira e o que fica fora delas não bloqueia.

export const GRID_COLS = 13
export const GRID_ROWS = 7
export const CELL_WIDTH = (ROOM_FLOOR.right - ROOM_FLOOR.left) / GRID_COLS // 104,92...
export const CELL_HEIGHT = (ROOM_FLOOR.bottom - ROOM_FLOOR.top) / GRID_ROWS // 74,43...

export function getCellRect(col, row) {
  return {
    x: ROOM_FLOOR.left + col * CELL_WIDTH,
    y: ROOM_FLOOR.top + row * CELL_HEIGHT,
    width: CELL_WIDTH,
    height: CELL_HEIGHT,
  }
}

export const ROOM_LAYOUTS = data.layouts

export function getLayout(id) {
  return ROOM_LAYOUTS.find((layout) => layout.id === id) ?? null
}

// Aceita o id ou o próprio layout (os testes montam layouts falsos)
function resolveLayout(layoutOrId) {
  const layout = typeof layoutOrId === 'string' ? getLayout(layoutOrId) : layoutOrId
  if (!layout) throw new Error(`Layout desconhecido: ${layoutOrId}`)
  return layout
}

// Letra do layout -> obstáculo de cada andar
export const THEME_OBSTACLES = {
  cantina: { '#': 'barril', o: 'garrafao', '~': 'vinho', '*': 'barril-deitado' },
  cucina: { '#': 'balcao', o: 'saco', '~': 'azeite', '*': 'chapa' },
  piazza: { '#': 'vespa', o: 'caixote-tomate', '~': 'sorvete', '*': 'mesa' },
  pastificio: { '#': 'maquina', o: 'parmesao', '~': 'massa', '*': 'esteira' },
  porto: { '#': 'caixote-peixe', o: 'lagosta', '~': 'poca', '*': 'rede' },
}

// Obstáculo -> mecânica (as regras de cada mecânica ficam em roomObstacles.js)
export const OBSTACLE_MECHANICS = {
  barril: 'solido',
  balcao: 'solido',
  vespa: 'solido',
  mesa: 'solido',
  maquina: 'solido',
  'caixote-peixe': 'solido',
  garrafao: 'quebravel',
  saco: 'quebravel',
  'caixote-tomate': 'quebravel',
  lagosta: 'quebravel',
  'barril-deitado': 'rolante',
  parmesao: 'rolante',
  vinho: 'escorregadio',
  azeite: 'escorregadio',
  sorvete: 'escorregadio',
  poca: 'escorregadio',
  chapa: 'quente',
  massa: 'grudento',
  rede: 'grudento',
  esteira: 'esteira',
  cenario: 'cenario',
  tambor: 'tambor',
}

const BLOCKING_MECHANICS = ['solido', 'quebravel', 'rolante', 'quente', 'cenario', 'tambor']

// Caixa sólida de um obstáculo que bloqueia: menor que a casa, para sobrar passagem entre vizinhos
const SOLID_BOX = { width: 84, height: 60 }

function getSolidBox(col, row) {
  const cell = getCellRect(col, row)
  return {
    x: cell.x + (CELL_WIDTH - SOLID_BOX.width) / 2,
    y: cell.y + (CELL_HEIGHT - SOLID_BOX.height) / 2,
    width: SOLID_BOX.width,
    height: SOLID_BOX.height,
  }
}

// Para que lado a esteira empurra: 1 = direita, -1 = esquerda. Depende só da casa, então é sempre o mesmo
// na mesma sala. As linhas alternam, e a metade direita da sala (coluna 7 em diante) é o contrário da esquerda:
// esteiras vizinhas na mesma linha empurram juntas, e a mesma sala costuma ter esteiras para os dois lados.
export function getConveyorDirection(col, row) {
  return (row + (col > 6 ? 1 : 0)) % 2 === 0 ? 1 : -1
}

// Passa por todas as casas do layout: callback(letra, coluna, linha)
function forEachTile(layout, callback) {
  layout.tiles.forEach((line, row) => {
    ;[...line].forEach((letter, col) => callback(letter, col, row))
  })
}

// Obstáculos da sala no tema do andar. A adega usa sempre os da cantina.
// box: caixa sólida (84 x 60) para o que bloqueia, a casa inteira para o cenário X e para os pisos.
export function buildRoomObstacles(layoutId, theme) {
  const layout = resolveLayout(layoutId)
  const letters = THEME_OBSTACLES[layout.type === 'adega' ? 'cantina' : theme]
  if (!letters) throw new Error(`Tema desconhecido: ${theme}`)

  const obstacles = []
  forEachTile(layout, (letter, col, row) => {
    let kind = letters[letter]
    if (letter === 'X') kind = 'cenario'
    if (letter === 'D') kind = 'tambor'
    if (!kind) return

    const mechanic = OBSTACLE_MECHANICS[kind]
    const blocking = BLOCKING_MECHANICS.includes(mechanic)
    const box = blocking && kind !== 'cenario' ? getSolidBox(col, row) : getCellRect(col, row)
    const obstacle = { id: `${col}-${row}`, col, row, kind, mechanic, blocking, box }
    if (mechanic === 'esteira') obstacle.direction = getConveyorDirection(col, row)
    obstacles.push(obstacle)
  })
  return obstacles
}

// Pontos de inimigo (i) e de item (t). Ainda não aparece nada neles.
export function getLayoutPoints(layoutId) {
  const enemies = []
  const items = []
  forEachTile(resolveLayout(layoutId), (letter, col, row) => {
    if (letter === 'i') enemies.push({ col, row })
    if (letter === 't') items.push({ col, row })
  })
  return { enemies, items }
}

// ---------- validação do caminho ----------

// A busca anda em passos de meia caixa dos pés (22 x 9 u). Com passos menores que a caixa,
// as caixas de dois pontos vizinhos se encostam, então o caminho entre eles também está livre.
const STEP_X = PLAYER_FEET_BOX.width / 2
const STEP_Y = PLAYER_FEET_BOX.height / 2
const { minX, maxX, minY, maxY } = ROOM_PLAYER_BOUNDS
const STEPS_X = Math.round((maxX - minX) / STEP_X) + 1 // 61 pontos de 140 a 1460
const STEPS_Y = Math.round((maxY - minY) / STEP_Y) + 1 // 56 pontos de 291 a 786
const ENTRY_MARGIN = 16 // folga em volta dos pés na entrada
const POINT_REACH = 40 // basta chegar a 40 u do centro da casa de um ponto

// Caixas que bloqueiam no pior caso: o * conta como bloqueio (em alguns andares ele bloqueia)
function getWorstCaseBlockers(layout) {
  const blockers = []
  forEachTile(layout, (letter, col, row) => {
    if (letter === 'X') blockers.push(getCellRect(col, row))
    if (['#', 'o', '*', 'D'].includes(letter)) blockers.push(getSolidBox(col, row))
  })
  return blockers
}

// Separa os pontos livres da sala em grupos ligados (busca em largura).
// groups[índice] = número do grupo, ou -1 se a caixa dos pés não cabe ali.
// Fica guardado por layout: a mesma busca serve para todas as combinações de portas.
const mapCache = new WeakMap()

function getPathMap(layout) {
  if (mapCache.has(layout)) return mapCache.get(layout)

  const blockers = getWorstCaseBlockers(layout)
  const solids = [...ROOM_WALLS, ...blockers]
  const free = new Array(STEPS_X * STEPS_Y)
  for (let j = 0; j < STEPS_Y; j++) {
    for (let i = 0; i < STEPS_X; i++) {
      const box = getFeetBox({ x: minX + i * STEP_X, y: minY + j * STEP_Y })
      free[j * STEPS_X + i] = !solids.some((solid) => overlaps(box, solid))
    }
  }

  const groups = new Array(STEPS_X * STEPS_Y).fill(-1)
  let group = 0
  for (let start = 0; start < groups.length; start++) {
    if (!free[start] || groups[start] !== -1) continue
    groups[start] = group
    const queue = [start]
    while (queue.length > 0) {
      const index = queue.shift()
      const i = index % STEPS_X
      const neighbors = []
      if (i > 0) neighbors.push(index - 1)
      if (i < STEPS_X - 1) neighbors.push(index + 1)
      if (index >= STEPS_X) neighbors.push(index - STEPS_X)
      if (index + STEPS_X < groups.length) neighbors.push(index + STEPS_X)
      for (const next of neighbors) {
        if (free[next] && groups[next] === -1) {
          groups[next] = group
          queue.push(next)
        }
      }
    }
    group++
  }

  const map = { blockers, groups }
  mapCache.set(layout, map)
  return map
}

// Ponto da busca mais perto de uma posição. A entrada tem 16 u de folga, mais que o meio passo
// (11 x 4,5 u), então ir da entrada até esse ponto não esbarra em nada.
function getNearestIndex(position) {
  const i = Math.min(STEPS_X - 1, Math.max(0, Math.round((position.x - minX) / STEP_X)))
  const j = Math.min(STEPS_Y - 1, Math.max(0, Math.round((position.y - minY) / STEP_Y)))
  return j * STEPS_X + i
}

// Algum ponto do grupo fica a até 40 u do centro da casa?
function reachesCell(groups, group, col, row) {
  const cell = getCellRect(col, row)
  const centerX = cell.x + cell.width / 2
  const centerY = cell.y + cell.height / 2
  for (let j = 0; j < STEPS_Y; j++) {
    for (let i = 0; i < STEPS_X; i++) {
      const x = minX + i * STEP_X
      const y = minY + j * STEP_Y
      if (groups[j * STEPS_X + i] === group && Math.hypot(x - centerX, y - centerY) <= POINT_REACH) return true
    }
  }
  return false
}

// Confere se o layout serve para uma sala com portas nos lados `sides`.
// Devolve a lista de problemas (vazia = ok). Aceita o id ou o próprio layout.
export function findLayoutProblems(layoutId, sides) {
  const layout = resolveLayout(layoutId)
  const problems = []

  for (const side of SIDES) {
    const { col, row } = DOOR_CELLS[side]
    if (layout.tiles[row][col] !== '.') problems.push(`${layout.id}: a casa da porta ${side} não está vazia`)
  }
  if (sides.length === 0) return problems

  const { blockers, groups } = getPathMap(layout)

  for (const side of sides) {
    const { x, y } = getEntryPosition(side)
    const box = getFeetBox({ x, y }, ENTRY_MARGIN)
    if (blockers.some((blocker) => overlaps(box, blocker))) problems.push(`${layout.id}: a entrada ${side} não tem folga`)
  }

  // Todas as entradas no mesmo grupo = dá para ir de qualquer porta a qualquer outra
  const group = groups[getNearestIndex(getEntryPosition(sides[0]))]
  for (const side of sides) {
    const sideGroup = groups[getNearestIndex(getEntryPosition(side))]
    if (sideGroup === -1 || sideGroup !== group) problems.push(`${layout.id}: a porta ${side} não se liga às outras`)
  }

  const { enemies, items } = getLayoutPoints(layout)
  for (const { col, row } of [...enemies, ...items]) {
    if (group === -1 || !reachesCell(groups, group, col, row)) {
      problems.push(`${layout.id}: o ponto (${col},${row}) não é alcançável`)
    }
  }

  return problems
}

// Sorteia o layout de uma sala: embaralha os do tipo com o sorteio do andar
// e fica com o primeiro que serve para as portas da sala.
export function pickLayout(type, sides, random) {
  const options = shuffle(random, ROOM_LAYOUTS.filter((layout) => layout.type === type))
  const layout = options.find((option) => findLayoutProblems(option, sides).length === 0)
  if (!layout) throw new Error(`Nenhum layout do tipo ${type} serve para as portas: ${sides.join(', ')}`)
  return layout.id
}
