import { moveAndCollide } from './collision.js'

// Tamanho da sala em unidades. A proporção é a da imagem de referência (1080x768), com cerca de 11% mais
// área de piso para andar; o personagem não muda de tamanho.
export const ROOM_SIZE = { width: 1200, height: 853 }

// A posição do personagem é o centro dos pés. A colisão usa só uma caixa nos pés
// (e não o corpo todo), então a cabeça pode passar por cima da parede de cima.
export const PLAYER_FEET_BOX = { width: 44, height: 18 }

// Paredes (sólidos), em unidades da sala. Elas passam da borda da sala e têm mais de
// 100 de espessura, bem mais que o passo máximo (260 x 0,05 = 13), então nada atravessa.
export const ROOM_WALLS = [
  { x: -100, y: -100, width: 1400, height: 343 }, // em cima (até y = 243)
  { x: -100, y: 741, width: 1400, height: 212 }, // embaixo (a partir de y = 741)
  { x: -100, y: -100, width: 103, height: 1053 }, // esquerda (até x = 3)
  { x: 1192, y: -100, width: 108, height: 1053 }, // direita (a partir de x = 1192)
]

// Onde os pés podem ficar, calculado das paredes: x de 25 a 1170 e y de 261 a 741
export const ROOM_PLAYER_BOUNDS = {
  minX: 3 + PLAYER_FEET_BOX.width / 2,
  maxX: 1192 - PLAYER_FEET_BOX.width / 2,
  minY: 243 + PLAYER_FEET_BOX.height,
  maxY: 741,
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
// speedMultiplier: 1 é a velocidade normal; menor que 1 deixa o personagem mais lento (ex.: durante o golpe).
export function moveRoomPlayer(position, movement, deltaSeconds, speedMultiplier = 1) {
  const elapsed = Math.max(0, Math.min(deltaSeconds, 0.05))
  const distance = ROOM_PLAYER_SPEED * speedMultiplier * elapsed
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
