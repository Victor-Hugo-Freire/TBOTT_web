import { ROOM_PLAYER_BOUNDS, ROOM_PLAYER_START } from './roomMovement.js'

export const DEFAULT_ROOM_ID = 'sala-inicial'

export function clamp(value, min, max) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return min
  return Math.min(Math.max(numeric, min), max)
}

export function normalizeProgressPayload(value = {}, fallback = {}) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {}

  const roomId =
    typeof source.roomId === 'string' && source.roomId
      ? source.roomId
      : typeof source.sala === 'string' && source.sala
        ? source.sala
        : typeof fallback.roomId === 'string' && fallback.roomId
          ? fallback.roomId
          : DEFAULT_ROOM_ID

  const characterId =
    typeof source.characterId === 'string' && source.characterId
      ? source.characterId
      : typeof source.character === 'string' && source.character
        ? source.character
        : typeof fallback.characterId === 'string' && fallback.characterId
          ? fallback.characterId
          : 'tung-tung-sahur'

  const playerX = clamp(
    source.playerX ?? source.x ?? fallback.playerX ?? ROOM_PLAYER_START.x,
    ROOM_PLAYER_BOUNDS.minX,
    ROOM_PLAYER_BOUNDS.maxX,
  )

  const playerY = clamp(
    source.playerY ?? source.y ?? fallback.playerY ?? ROOM_PLAYER_START.y,
    ROOM_PLAYER_BOUNDS.minY,
    ROOM_PLAYER_BOUNDS.maxY,
  )

  const elapsedMs = Number.isFinite(Number(source.elapsedMs ?? fallback.elapsedMs ?? 0))
    ? Math.max(0, Number(source.elapsedMs ?? fallback.elapsedMs ?? 0))
    : 0

  return {
    roomId,
    characterId,
    playerX,
    playerY,
    elapsedMs,
  }
}

export function createProgressSnapshot({
  player,
  elapsedMs = 0,
  characterId = 'tung-tung-sahur',
  roomId = DEFAULT_ROOM_ID,
}) {
  return normalizeProgressPayload(
    {
      roomId,
      characterId,
      playerX: player?.x ?? ROOM_PLAYER_START.x,
      playerY: player?.y ?? ROOM_PLAYER_START.y,
      elapsedMs,
    },
    { roomId, characterId },
  )
}
