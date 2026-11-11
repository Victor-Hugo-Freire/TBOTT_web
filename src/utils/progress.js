import { LAST_FLOOR } from './floorGenerator.js'
import { ROOM_PLAYER_BOUNDS, ROOM_PLAYER_START } from './roomMovement.js'

// Valor antigo do roomId. A run (run.js) trata qualquer id que não existe no andar como a sala inicial.
export const DEFAULT_ROOM_ID = 'sala-inicial'
export const DEFAULT_CHARACTER_ID = 'tung-tung-sahur'

const MAX_SEED = 4294967295 // a seed é um inteiro de 32 bits sem sinal (random.js)

// Número dentro de [min, max]; valor que não é número vira o mínimo
function clamp(value, min, max) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return min
  return Math.min(Math.max(numeric, min), max)
}

// Seed salva: inteiro de 0 a 4294967295. Qualquer outra coisa vira null (a sala cria uma seed nova).
function normalizeSeed(value) {
  return Number.isInteger(value) && value >= 0 && value <= MAX_SEED ? value : null
}

// Andar salvo: inteiro de 1 a 5. Qualquer outra coisa volta para o andar 1.
function normalizeFloor(value) {
  return Number.isInteger(value) && value >= 1 && value <= LAST_FLOOR ? value : 1
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
    seed: normalizeSeed(source.seed),
    floor: normalizeFloor(source.floor),
    // A run já acabou (o tambor do andar 5 foi batido): só falta o tempo chegar ao ranking
    finished: source.finished === true,
  }
}

// Monta o progresso a salvar, em unidades da sala (e não em pixels da tela).
// Sem player, fica na posição inicial: é o progresso de uma partida nova (sem seed: a sala cria uma).
export function createProgressSnapshot({ player, elapsedMs = 0, characterId, roomId, seed, floor, finished }) {
  return normalizeProgressPayload({
    roomId,
    characterId,
    playerX: player?.x,
    playerY: player?.y,
    elapsedMs,
    seed,
    floor,
    finished,
  })
}
