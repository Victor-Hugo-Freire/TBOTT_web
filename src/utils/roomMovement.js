import { moveAndCollide } from './collision.js'

// Tamanho da sala em unidades, com as paredes. A proporção é quase 16:9, como as salas do Isaac:
// assim a sala ocupa telas largas e celulares deitados sem deixar faixas grandes nos lados.
export const ROOM_SIZE = { width: 1600, height: 853 }

// A posição do personagem é o centro dos pés. A colisão usa só uma caixa nos pés
// (e não o corpo todo), então a cabeça pode passar por cima da parede de cima.
export const PLAYER_FEET_BOX = { width: 44, height: 18 }

// Paredes (sólidos), em unidades da sala. Elas passam da borda da sala e têm mais de
// 100 de espessura, bem mais que o passo máximo (260 x 0,05 = 13), então nada atravessa.
// A sala é uma caixa fechada de tamanho fixo (igual em qualquer tela), com parede dos quatro lados.
// ROOM_FLOOR é a borda do piso, medida no protótipo da sala inicial: o desenho e a colisão usam a mesma.
export const ROOM_FLOOR = { left: 118, top: 265, right: ROOM_SIZE.width - 118, bottom: 786 }

const OUTSIDE = 100 // quanto cada parede passa da borda da sala
const TOP_WALL_END = ROOM_FLOOR.top + 8 // os pés param um pouco abaixo da viga
export const ROOM_WALLS = [
  { x: -OUTSIDE, y: -OUTSIDE, width: ROOM_SIZE.width + 2 * OUTSIDE, height: OUTSIDE + TOP_WALL_END }, // em cima
  { x: -OUTSIDE, y: ROOM_FLOOR.bottom, width: ROOM_SIZE.width + 2 * OUTSIDE, height: ROOM_SIZE.height - ROOM_FLOOR.bottom + OUTSIDE }, // embaixo
  { x: -OUTSIDE, y: -OUTSIDE, width: OUTSIDE + ROOM_FLOOR.left, height: ROOM_SIZE.height + 2 * OUTSIDE }, // esquerda
  { x: ROOM_FLOOR.right, y: -OUTSIDE, width: ROOM_SIZE.width - ROOM_FLOOR.right + OUTSIDE, height: ROOM_SIZE.height + 2 * OUTSIDE }, // direita
]

// Onde os pés podem ficar, calculado das paredes: x de 140 a 1460 e y de 291 a 786.
// O corpo e o bastão alcançam até cerca de 58 u para cada lado dos pés, então ficam dentro da sala.
export const ROOM_PLAYER_BOUNDS = {
  minX: ROOM_FLOOR.left + PLAYER_FEET_BOX.width / 2,
  maxX: ROOM_FLOOR.right - PLAYER_FEET_BOX.width / 2,
  minY: TOP_WALL_END + PLAYER_FEET_BOX.height,
  maxY: ROOM_FLOOR.bottom,
}

// Onde o personagem começa (pés)
export const ROOM_PLAYER_START = { x: ROOM_SIZE.width / 2, y: 560 }

export const ROOM_PLAYER_SPEED = 260

// Teclas pelo código físico (event.code), que não muda com o layout do teclado.
// WASD movem o personagem; as setas atacam na direção delas.
const MOVEMENT_KEYS = {
  up: ['KeyW'],
  down: ['KeyS'],
  left: ['KeyA'],
  right: ['KeyD'],
}

const ATTACK_KEYS = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
}

// A tecla faz parte dos controles da sala? (a página usa para decidir o preventDefault)
export function isRoomKey(code) {
  return code in ATTACK_KEYS || Object.values(MOVEMENT_KEYS).some((codes) => codes.includes(code))
}

// Direção do ataque: a última seta pressionada que ainda está segurada.
// O Set guarda as teclas na ordem em que foram apertadas, então basta olhar de trás para a frente.
export function getAttackDirection(keys) {
  const held = [...keys].reverse().find((code) => code in ATTACK_KEYS)
  return held ? ATTACK_KEYS[held] : null
}

export function shouldReturnToMenu(key) {
  return typeof key === 'string' && key.toLowerCase() === 'escape'
}

// Um eixo do movimento: -1, 0 ou 1. Com as duas teclas opostas seguradas, vale a última apertada
// (como nas setas), para trocar de lado sem parar.
function getAxis(keys, negativeKeys, positiveKeys) {
  const last = [...keys].reverse().find((code) => negativeKeys.includes(code) || positiveKeys.includes(code))
  if (!last) return 0
  return positiveKeys.includes(last) ? 1 : -1
}

export function getRoomMovement(keys) {
  const horizontal = getAxis(keys, MOVEMENT_KEYS.left, MOVEMENT_KEYS.right)
  const vertical = getAxis(keys, MOVEMENT_KEYS.up, MOVEMENT_KEYS.down)
  const magnitude = Math.hypot(horizontal, vertical)

  if (magnitude === 0) return { x: 0, y: 0 }
  return { x: horizontal / magnitude, y: vertical / magnitude }
}

// Caixa dos pés na posição (x, y), que é o meio da borda de baixo da caixa.
// margin aumenta a caixa para todos os lados (ex.: a folga da chapa quente).
export function getFeetBox(position, margin = 0) {
  const { width, height } = PLAYER_FEET_BOX
  return { x: position.x - width / 2 - margin, y: position.y - height - margin, width: width + 2 * margin, height: height + 2 * margin }
}

// Move os pés conforme a direção e o tempo, parando nas paredes (ou deslizando nelas).
// speedMultiplier: 1 é a velocidade normal; menor que 1 deixa o personagem mais lento (ex.: durante o golpe).
// solids: as caixas que bloqueiam. Sem informar, só as paredes; numa sala com obstáculos,
// quem chama passa as paredes mais os obstáculos (getRoomSolids, em roomObstacles.js).
export function moveRoomPlayer(position, movement, deltaSeconds, speedMultiplier = 1, solids = ROOM_WALLS) {
  const elapsed = Math.max(0, Math.min(deltaSeconds, 0.05))
  const distance = ROOM_PLAYER_SPEED * speedMultiplier * elapsed
  const { width, height } = PLAYER_FEET_BOX

  const box = moveAndCollide(
    getFeetBox(position),
    movement.x * distance,
    movement.y * distance,
    solids,
  )
  const x = box.x + width / 2
  const y = box.y + height

  if (x === position.x && y === position.y) return position
  return { x, y }
}
