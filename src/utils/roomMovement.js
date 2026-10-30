export const ROOM_SIZE = { width: 1080, height: 720 }

export const ROOM_PLAYER_BOUNDS = {
  minX: 25,
  maxX: 1050,
  minY: 200,
  maxY: 570,
}

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

export function moveRoomPlayer(position, movement, deltaSeconds) {
  const elapsed = Math.max(0, Math.min(deltaSeconds, 0.05))
  const distance = ROOM_PLAYER_SPEED * elapsed
  const x = Math.max(ROOM_PLAYER_BOUNDS.minX, Math.min(ROOM_PLAYER_BOUNDS.maxX, position.x + movement.x * distance))
  const y = Math.max(ROOM_PLAYER_BOUNDS.minY, Math.min(ROOM_PLAYER_BOUNDS.maxY, position.y + movement.y * distance))

  if (x === position.x && y === position.y) return position
  return { x, y }
}
