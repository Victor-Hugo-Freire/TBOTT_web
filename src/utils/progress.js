import { ROOM_PLAYER_BOUNDS, ROOM_PLAYER_START } from './roomMovement.js'

export const DEFAULT_ROOM_ID = 'sala-inicial'
export const DEFAULT_CHARACTER_ID = 'tung-tung-sahur'

// Número dentro de [min, max]; valor que não é número vira o mínimo
function clamp(value, min, max) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return min
  return Math.min(Math.max(numeric, min), max)
}

// A API guarda qualquer objeto JSON, então quem valida o formato do progresso é o jogo:
// campos que faltam ganham valores padrão e a posição fica dentro da sala.
export function normalizeProgressPayload(value) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {}

  return {
    roomId: typeof source.roomId === 'string' && source.roomId ? source.roomId : DEFAULT_ROOM_ID,
    characterId:
      typeof source.characterId === 'string' && source.characterId ? source.characterId : DEFAULT_CHARACTER_ID,
    playerX: clamp(source.playerX ?? ROOM_PLAYER_START.x, ROOM_PLAYER_BOUNDS.minX, ROOM_PLAYER_BOUNDS.maxX),
    playerY: clamp(source.playerY ?? ROOM_PLAYER_START.y, ROOM_PLAYER_BOUNDS.minY, ROOM_PLAYER_BOUNDS.maxY),
    elapsedMs: clamp(source.elapsedMs ?? 0, 0, Infinity),
  }
}

// Monta o progresso a salvar, em unidades da sala (e não em pixels da tela).
// Sem player, fica na posição inicial: é o progresso de uma partida nova.
export function createProgressSnapshot({ player, elapsedMs = 0, characterId, roomId }) {
  return normalizeProgressPayload({
    roomId,
    characterId,
    playerX: player?.x,
    playerY: player?.y,
    elapsedMs,
  })
}
