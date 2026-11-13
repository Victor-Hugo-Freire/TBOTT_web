import { PLAYER_FEET_BOX, ROOM_PLAYER_BOUNDS } from './roomMovement.js'

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
// Os pés cabem no vão quando o meio deles está a até 61 - largura/2 do centro (35 u com 52 u de largura)
const DOOR_FEET_RANGE = 61 - PLAYER_FEET_BOX.width / 2

// Altura dos pés nas portas laterais: a caixa dos pés fica centrada no meio do vão (y = 525,5)
const SIDE_DOOR_FEET_Y = 525.5 + PLAYER_FEET_BOX.height / 2

// Onde os pés aparecem ao entrar pela porta daquele lado: 24 u para dentro do limite dos pés.
// Calculado dos limites, então acompanha o tamanho do personagem (o validador dos layouts
// confere que essa entrada tem folga em toda sala).
const ENTRY_INSET = 24
const ENTRY_POSITIONS = {
  up: { x: DOOR_CENTER_X, y: ROOM_PLAYER_BOUNDS.minY + ENTRY_INSET },
  down: { x: DOOR_CENTER_X, y: ROOM_PLAYER_BOUNDS.maxY - ENTRY_INSET },
  left: { x: ROOM_PLAYER_BOUNDS.minX + ENTRY_INSET, y: SIDE_DOOR_FEET_Y },
  right: { x: ROOM_PLAYER_BOUNDS.maxX - ENTRY_INSET, y: SIDE_DOOR_FEET_Y },
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
  const insideSideGap = y - PLAYER_FEET_BOX.height >= SIDE_DOOR_TOP && y <= SIDE_DOOR_BOTTOM

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
  up: { x: DOOR_CENTER_X, y: ROOM_PLAYER_BOUNDS.minY },
  down: { x: DOOR_CENTER_X, y: ROOM_PLAYER_BOUNDS.maxY },
  left: { x: ROOM_PLAYER_BOUNDS.minX, y: SIDE_DOOR_FEET_Y },
  right: { x: ROOM_PLAYER_BOUNDS.maxX, y: SIDE_DOOR_FEET_Y },
}

// "De perto" = até 1 casa (120 u) entre os pés e o ponto da porta. A marca da adega só aparece assim.
const NEAR_DISTANCE = 120

export function isNearDoor(feet, side) {
  const point = DOOR_POINTS[side]
  return Math.hypot(feet.x - point.x, feet.y - point.y) <= NEAR_DISTANCE
}

const NORMAL_ROOM_TYPES = ['inicial', 'comum']
// Salas que saem da sala do chefe (as únicas ligadas a outra sala especial)
const BOSS_BRANCH_TYPES = ['pacto', 'mamae']

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
// Entre o chefe e o pacto (ou a mamãe) as duas são especiais: vale a do pacto (ou da mamãe) dos dois lados,
// então dentro do pacto a porta de volta continua sendo a do tubarão, e não a do chefe.
export function getDoorKind(floor, room, side) {
  if (BOSS_BRANCH_TYPES.includes(room.type)) return room.type
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
    } else if (room.type === 'chefe' && target && BOSS_BRANCH_TYPES.includes(target.type)) {
      // A porta do pacto ou da mamãe só aparece depois que a sala do chefe fica limpa
      if (!room.cleared) continue
    }

    doors.push({ side, kind, targetId, state })
  }

  return doors
}
