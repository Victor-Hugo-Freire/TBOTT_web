import { HITS_TO_OPEN } from './doors.js'
import { LAST_FLOOR } from './floorGenerator.js'
import { normalizeHealth } from './health.js'
import { ROOM_PLAYER_BOUNDS, ROOM_PLAYER_START } from './roomMovement.js'

// Valor antigo do roomId. A run (run.js) trata qualquer id que não existe no andar como a sala inicial.
export const DEFAULT_ROOM_ID = 'sala-inicial'
export const DEFAULT_CHARACTER_ID = 'tung-tung-sahur'

const MAX_SEED = 4294967295 // a seed é um inteiro de 32 bits sem sinal (random.js)
const MAX_ROOMS = 72 // a grade do andar tem 9 x 8 casas
const MAX_OBSTACLES = 91 // a sala tem 13 x 7 casas
const GRID_ID = /^\d{1,2}-\d{1,2}$/ // ids de sala e de obstáculo são 'col-row', como '3-5'
const MAX_CAUSE_LENGTH = 32

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

// Lista de ids 'col-row' sem repetição (salas visitadas, obstáculos quebrados). Qualquer outra coisa vira lista vazia.
// Quem usa (createRun) ignora os ids que não existem no andar.
function normalizeIds(value, max) {
  if (!Array.isArray(value)) return []
  const ids = value.filter((id) => typeof id === 'string' && GRID_ID.test(id))
  return [...new Set(ids)].slice(0, max)
}

// Estado das salas do andar salvo: { idDaSala: { removed: [ids dos obstáculos quebrados], hits: batidas } }.
// Só entram as salas em que algo mudou. hits conta as batidas na parede da adega ou no tambor (até 3).
function normalizeRoomStates(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const states = {}
  for (const [id, state] of Object.entries(value).slice(0, MAX_ROOMS)) {
    if (!GRID_ID.test(id) || !state || typeof state !== 'object') continue
    const removed = normalizeIds(state.removed, MAX_OBSTACLES)
    const hits = Number.isInteger(state.hits) ? clamp(state.hits, 0, HITS_TO_OPEN) : 0
    if (removed.length > 0 || hits > 0) states[id] = { removed, hits }
  }
  return states
}

// O que matou o personagem (id curto, como 'chapa') ou null se ele está vivo
function normalizeDeathCause(value) {
  return typeof value === 'string' && value.length > 0 && value.length <= MAX_CAUSE_LENGTH ? value : null
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
    // A run já acabou (o tambor do andar 5 foi batido, ou o personagem morreu): só falta o resultado chegar à API
    finished: source.finished === true,
    // Salas já visitadas do andar (o minimapa precisa delas depois de sair da run e voltar)
    visitedRoomIds: normalizeIds(source.visitedRoomIds, MAX_ROOMS),
    // Obstáculos quebrados e batidas de cada sala: o que quebrou não volta ao continuar a run
    roomStates: normalizeRoomStates(source.roomStates),
    // Vida em meios corações (6 = 3 corações) e o que matou o personagem, se a run acabou em derrota
    health: normalizeHealth(source.health),
    deathCause: normalizeDeathCause(source.deathCause),
  }
}

// Monta o progresso a salvar, em unidades da sala (e não em pixels da tela).
// Sem player, fica na posição inicial: é o progresso de uma partida nova (sem seed: a sala cria uma).
export function createProgressSnapshot({
  player,
  elapsedMs = 0,
  characterId,
  roomId,
  seed,
  floor,
  finished,
  visitedRoomIds,
  roomStates,
  health,
  deathCause,
}) {
  return normalizeProgressPayload({
    roomId,
    characterId,
    playerX: player?.x,
    playerY: player?.y,
    elapsedMs,
    seed,
    floor,
    finished,
    visitedRoomIds,
    roomStates,
    health,
    deathCause,
  })
}
