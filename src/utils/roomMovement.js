import { moveAndCollide } from './collision.js'

// Tamanho da sala em unidades (mesma proporção da imagem de referência, 1080x768)
export const ROOM_SIZE = { width: 1080, height: 768 }

// A posição do personagem é o centro dos pés. A colisão usa só uma caixa nos pés
// (e não o corpo todo), então a cabeça pode passar por cima da parede de cima.
export const PLAYER_FEET_BOX = { width: 44, height: 18 }

// Paredes (sólidos), em unidades da sala. Elas passam da borda da sala e têm mais de
// 100 de espessura, bem mais que o passo máximo (260 x 0,05 = 13), então nada atravessa.
export const ROOM_WALLS = [
  { x: -100, y: -100, width: 1280, height: 343 }, // em cima (até y = 243)
  { x: -100, y: 656, width: 1280, height: 212 }, // embaixo (a partir de y = 656)
  { x: -100, y: -100, width: 103, height: 968 }, // esquerda (até x = 3)
  { x: 1072, y: -100, width: 108, height: 968 }, // direita (a partir de x = 1072)
]

// Onde os pés podem ficar, calculado das paredes: x de 25 a 1050 e y de 261 a 656
export const ROOM_PLAYER_BOUNDS = {
  minX: 3 + PLAYER_FEET_BOX.width / 2,
  maxX: 1072 - PLAYER_FEET_BOX.width / 2,
  minY: 243 + PLAYER_FEET_BOX.height,
  maxY: 656,
}

// Onde o personagem começa (pés)
export const ROOM_PLAYER_START = { x: ROOM_SIZE.width / 2, y: 538 }

export const ROOM_PLAYER_SPEED = 260

// Só WASD movem o personagem; as setas não fazem nada na sala
const MOVEMENT_KEYS = {
  up: ['w'],
  down: ['s'],
  left: ['a'],
  right: ['d'],
}

export function shouldReturnToMenu(key) {
  return typeof key === 'string' && key.toLowerCase() === 'escape'
}

export function getRoomMovement(keys) {
  const horizontal = Number(MOVEMENT_KEYS.right.some((key) => keys.has(key)))
    - Number(MOVEMENT_KEYS.left.some((key) => keys.has(key)))
  const vertical = Number(MOVEMENT_KEYS.down.some((key) => keys.has(key)))
    - Number(MOVEMENT_KEYS.up.some((key) => keys.has(key)))
  const magnitude = Math.hypot(horizontal, vertical)

  if (magnitude === 0) return { x: 0, y: 0 }
  return { x: horizontal / magnitude, y: vertical / magnitude }
}

// Move os pés conforme a direção e o tempo, parando nas paredes (ou deslizando nelas).
export function moveRoomPlayer(position, movement, deltaSeconds) {
  const elapsed = Math.max(0, Math.min(deltaSeconds, 0.05))
  const distance = ROOM_PLAYER_SPEED * elapsed
  const { width, height } = PLAYER_FEET_BOX

  const box = moveAndCollide(
    { x: position.x - width / 2, y: position.y - height, width, height },
    movement.x * distance,
    movement.y * distance,
    ROOM_WALLS,
  )
  const x = box.x + width / 2
  const y = box.y + height

  if (x === position.x && y === position.y) return position
  return { x, y }
}
