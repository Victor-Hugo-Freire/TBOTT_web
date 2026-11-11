import { ROOM_PLAYER_BOUNDS } from './roomMovement.js'

// Portas da sala: os 4 lados, o vão, onde o personagem surge ao entrar e quando ele atravessa.
// Os lados usam os mesmos nomes das direções do personagem.
export const SIDES = ['up', 'right', 'down', 'left']

export const OPPOSITE_SIDE = { up: 'down', down: 'up', left: 'right', right: 'left' }

export const SIDE_VECTORS = {
  up: { x: 0, y: -1 },
  right: { x: 1, y: 0 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
}

// Casas da grade 13 x 7 na frente de cada porta. Ficam vazias em todo layout,
// mesmo quando a sala não tem porta ali (a sala pode ser ligada por qualquer lado).
export const DOOR_CELLS = {
  up: { col: 6, row: 0 },
  right: { col: 12, row: 3 },
  down: { col: 6, row: 6 },
  left: { col: 0, row: 3 },
}

// O vão tem 122 u. Centro das portas de cima e de baixo: x = 800; das laterais: y = 525,5 (meio do piso).
const DOOR_CENTER_X = 800
const SIDE_DOOR_TOP = 464.5 // 525,5 - 61
const SIDE_DOOR_BOTTOM = 586.5 // 525,5 + 61
// Os pés (44 u de largura) cabem no vão quando o meio deles está a até 39 u do centro: 61 - 22
const DOOR_FEET_RANGE = 39

// Onde os pés aparecem ao entrar pela porta daquele lado (30 u para dentro da porta)
const ENTRY_POSITIONS = {
  up: { x: 800, y: 321 },
  down: { x: 800, y: 756 },
  left: { x: 170, y: 534.5 },
  right: { x: 1430, y: 534.5 },
}

// Sair pela porta "up" da sala A leva para a sala B, entrando pelo lado "down" de B:
// quem chama passa OPPOSITE_SIDE[ladoDaSaída].
export function getEntryPosition(side) {
  return { ...ENTRY_POSITIONS[side] }
}

// O personagem atravessa quando os pés encostam na parede dentro do vão de uma porta aberta
// e ele continua apertando para aquele lado. Andar de lado encostado na parede não troca de sala.
// Devolve o lado da porta atravessada, ou null.
export function getExitSide(position, movement, doors) {
  const { x, y } = position
  const { minX, maxX, minY, maxY } = ROOM_PLAYER_BOUNDS
  const insideTopBottomGap = Math.abs(x - DOOR_CENTER_X) <= DOOR_FEET_RANGE
  const insideSideGap = y - 18 >= SIDE_DOOR_TOP && y <= SIDE_DOOR_BOTTOM

  const crosses = {
    up: y <= minY + 0.5 && insideTopBottomGap && movement.y < 0,
    down: y >= maxY - 0.5 && insideTopBottomGap && movement.y > 0,
    left: x <= minX + 0.5 && insideSideGap && movement.x < 0,
    right: x >= maxX - 0.5 && insideSideGap && movement.x > 0,
  }

  const door = doors.find((item) => item.state === 'open' && crosses[item.side])
  return door ? door.side : null
}

// Onde um golpe do bastão acerta a porta (usado na parede da adega secreta)
export const DOOR_HIT_ZONES = {
  up: { x: 739, y: 140, width: 122, height: 170 },
  down: { x: 739, y: 740, width: 122, height: 120 },
  left: { x: 20, y: 464.5, width: 150, height: 122 },
  right: { x: 1430, y: 464.5, width: 150, height: 122 },
}

// Ponto de cada porta na borda do piso, para saber se o personagem está perto dela
export const DOOR_POINTS = {
  up: { x: 800, y: 291 },
  down: { x: 800, y: 786 },
  left: { x: 140, y: 534.5 },
  right: { x: 1460, y: 534.5 },
}

// "De perto" = até 1 casa (120 u) entre os pés e o ponto da porta. A marca da adega só aparece assim.
const NEAR_DISTANCE = 120

export function isNearDoor(feet, side) {
  const point = DOOR_POINTS[side]
  return Math.hypot(feet.x - point.x, feet.y - point.y) <= NEAR_DISTANCE
}

const NORMAL_ROOM_TYPES = ['inicial', 'comum']

function isSpecial(room) {
  return !NORMAL_ROOM_TYPES.includes(room.type)
}

function findRoom(floor, id) {
  return floor.rooms.find((room) => room.id === id)
}

// Id da sala do outro lado da porta. A porta secreta conta como ligação.
function getTargetId(room, side) {
  if (room.neighbors[side]) return room.neighbors[side]
  if (room.secret && room.secret.side === side) return room.secret.roomId
  return null
}

// Tipo do desenho da porta. A porta de uma sala especial é temática dos dois lados (como no protótipo):
// primeiro vale a sala do outro lado; se ela não for especial, vale a própria sala.
export function getDoorKind(floor, room, side) {
  const target = findRoom(floor, getTargetId(room, side))
  if (target && isSpecial(target)) return target.type
  if (isSpecial(room)) return room.type
  return 'comum'
}

// Golpes para abrir a parede da adega (e batidas no tambor do chefe para passar de andar)
export const HITS_TO_OPEN = 3

// Parede da adega: escondida até o 1º golpe, trincada no 1º e no 2º, aberta a partir do 3º
function getSecretState(hits) {
  if (hits >= HITS_TO_OPEN) return 'open'
  if (hits >= 1) return 'cracked'
  return 'hidden'
}

// Portas da sala: { side, kind, targetId, state }, com state 'open', 'closed', 'hidden' ou 'cracked'.
// As portas com condição (garfo, grão, vida cheia) ficam abertas nesta entrega.
export function getRoomDoors(floor, room) {
  const doors = []

  for (const side of SIDES) {
    const targetId = getTargetId(room, side)
    if (!targetId) continue

    const target = findRoom(floor, targetId)
    const kind = getDoorKind(floor, room, side)
    let state = room.cleared ? 'open' : 'closed'

    if (room.secret && room.secret.side === side) {
      state = getSecretState(room.hits)
    } else if (room.type === 'chefe' && target && ['pacto', 'mamae'].includes(target.type)) {
      // A porta do pacto ou da mamãe só aparece depois que a sala do chefe fica limpa
      if (!room.cleared) continue
    }

    doors.push({ side, kind, targetId, state })
  }

  return doors
}
