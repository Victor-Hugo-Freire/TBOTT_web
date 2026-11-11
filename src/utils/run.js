import { overlaps } from './collision.js'
import { DOOR_HIT_ZONES, getEntryPosition, HITS_TO_OPEN, getExitSide, getRoomDoors, isNearDoor, OPPOSITE_SIDE } from './doors.js'
import { generateFloor, LAST_FLOOR } from './floorGenerator.js'
import { createPlayer, getAttackHitbox, hurtPlayer, updatePlayer } from './player.js'
import { createProgressSnapshot } from './progress.js'
import { buildRoomObstacles } from './roomLayout.js'
import { getFeetBox, ROOM_PLAYER_BOUNDS, ROOM_PLAYER_START } from './roomMovement.js'
import {
  getFloorEffect,
  getRoomSolids,
  getSlipMovement,
  hitObstacles,
  isBlockedStep,
  pushPlayer,
  touchesHot,
  updateRollingObstacles,
} from './roomObstacles.js'

// Estado da run: o andar, a sala atual, o jogador, as transições, a faixa e os contadores.
// Funções puras no estilo de player.js (sem React, sem canvas), para testar com node:test.
// Nada aqui usa Math.random nem Date: o andar sai da seed e o tempo vem do deltaSeconds.
//
// run.floor é o ESTADO VIVO DO ANDAR: o que muda numa sala (visited, cleared, removed e hits)
// fica gravado no próprio objeto da sala, dentro de run.floor.rooms. Assim, sair e voltar
// encontra a sala do jeito que ficou. O resto da run é trocado por um objeto novo a cada quadro.

export const BANNER_TOTAL_MS = 2800 // faixa do andar: entra 300, fica 2200, sai 300
export const ROOM_TRANSITION_MS = 350
export const FLOOR_TRANSITION_MS = 900 // escurece 450, troca de andar, clareia 450

const NORMAL_ROOM_TYPES = ['inicial', 'comum']

// O tambor fica sempre na mesma casa da sala do chefe (D em (6,3) no layout "chefe")
const DRUM_BOX = buildRoomObstacles('chefe', 'cantina').find((obstacle) => obstacle.mechanic === 'tambor').box

export function getDrumBox() {
  return { ...DRUM_BOX }
}

// O tambor aparece quando a sala do chefe está limpa (hoje: ao entrar, porque não há inimigos)
export function isDrumVisible(room) {
  return room.type === 'chefe' && room.cleared
}

function findRoom(floor, id) {
  return floor.rooms.find((room) => room.id === id)
}

export function getCurrentRoom(run) {
  return findRoom(run.floor, run.roomId)
}

// Paleta da sala: a inicial e as comuns usam o tema do andar; as especiais, a paleta do tipo delas
export function getRoomTheme(floor, room) {
  return NORMAL_ROOM_TYPES.includes(room.type) ? floor.theme : room.type
}

// Tema dos obstáculos: a adega usa sempre os da cantina, as outras salas os do andar
export function getObstacleTheme(floor, room) {
  return room.type === 'adega' ? 'cantina' : floor.theme
}

// Obstáculos da sala, sem os que já quebraram nela
export function getRoomObstacles(floor, room) {
  return buildRoomObstacles(room.layoutId, getObstacleTheme(floor, room)).filter((obstacle) => !room.removed.includes(obstacle.id))
}

// A marca de giz da adega aparece de perto ou depois do 1º golpe
export function isSecretMarkVisible(run) {
  const room = getCurrentRoom(run)
  if (!room.secret) return false
  return room.hits >= 1 || isNearDoor(run.player, room.secret.side)
}

// Entra na sala: ela fica visitada e limpa (sem inimigos, toda sala fica limpa ao entrar).
// O jogador surge parado, sem golpe e sem dano, virado para `direction`.
function enterRoom(run, floor, room, position, direction = 'down') {
  room.visited = true
  room.cleared = true
  return {
    ...run,
    floor,
    roomId: room.id,
    player: { ...createPlayer(position), direction },
    obstacles: getRoomObstacles(floor, room),
    slip: null,
    blocked: false, // o passo anterior bateu em algo? (usado pelo piso escorregadio)
    swingCounted: false,
  }
}

// A posição salva serve? Precisa estar dentro da área dos pés e não tocar em nada que bloqueia.
function isFreePosition(position, obstacles) {
  if (!position || !Number.isFinite(position.x) || !Number.isFinite(position.y)) return false
  const { minX, maxX, minY, maxY } = ROOM_PLAYER_BOUNDS
  if (position.x < minX || position.x > maxX || position.y < minY || position.y > maxY) return false
  const feet = getFeetBox(position)
  return !getRoomSolids(obstacles).some((solid) => overlaps(feet, solid))
}

// Onde o jogador começa ao continuar: a posição salva, se servir; senão o centro da sala inicial
// ou a entrada da primeira porta das outras salas (a entrada sempre tem folga, veja roomLayout.js).
function getStartPosition(floor, room, position) {
  if (isFreePosition(position, getRoomObstacles(floor, room))) return { x: position.x, y: position.y }
  if (room.id === floor.startRoomId) return { ...ROOM_PLAYER_START }
  // A parede secreta ainda fechada não conta: nascer colado nela mostraria a marca de graça
  const door = getRoomDoors(floor, room).find((item) => item.state !== 'hidden' && item.state !== 'cracked')
  return getEntryPosition(door.side)
}

function createBanner(floor) {
  return { text: floor.name, elapsedMs: 0 }
}

// Começa a run (nova ou continuada). roomId inválido (ou o antigo 'sala-inicial') = sala inicial.
export function createRun({ seed, floorNumber = 1, roomId = null, position = null, characterId }) {
  const floor = generateFloor(seed, floorNumber)
  const room = findRoom(floor, roomId) ?? findRoom(floor, floor.startRoomId)

  // O estado das salas não vai para o save: se o save está dentro da adega, a parede da origem abre
  if (room.type === 'adega') {
    floor.rooms.find((other) => other.secret?.roomId === room.id).hits = HITS_TO_OPEN
  }

  const start = {
    seed,
    characterId,
    grains: 0,
    forks: 1,
    transition: null,
    banner: room.id === floor.startRoomId ? createBanner(floor) : null,
    finished: false,
  }
  return enterRoom(start, floor, room, getStartPosition(floor, room, position))
}

// Dados do progresso para salvar (formato de progress.js)
export function createRunSnapshot(run, elapsedMs) {
  return createProgressSnapshot({
    player: run.player,
    elapsedMs,
    characterId: run.characterId,
    roomId: run.roomId,
    seed: run.seed,
    floor: run.floor.number,
    finished: run.finished,
  })
}

// A faixa conta o tempo e some sozinha depois de BANNER_TOTAL_MS
function advanceBanner(banner, stepMs) {
  if (!banner) return null
  const elapsedMs = banner.elapsedMs + stepMs
  return elapsedMs >= BANNER_TOTAL_MS ? null : { ...banner, elapsedMs }
}

// Ids que quebraram agora vão para room.removed (não voltam ao sair e entrar de novo)
function saveRemoved(room, obstacles) {
  for (const obstacle of obstacles) {
    if (obstacle.removed && !room.removed.includes(obstacle.id)) room.removed.push(obstacle.id)
  }
}

// O golpe acerta o tambor ou a parede da adega? (até 3 batidas)
// A parede secreta só conta golpe com a marca visível (de perto, ou já trincada): de longe, nada acontece.
function hitsTarget(room, obstacles, hitbox, player) {
  if (room.hits >= HITS_TO_OPEN) return false
  const drum = obstacles.find((obstacle) => obstacle.mechanic === 'tambor')
  if (drum && isDrumVisible(room)) return overlaps(hitbox, drum.box)
  if (!room.secret) return false
  const markVisible = room.hits >= 1 || isNearDoor(player, room.secret.side)
  return markVisible && overlaps(hitbox, DOOR_HIT_ZONES[room.secret.side])
}

// Um quadro normal dentro da sala
function updateRoom(run, input, deltaSeconds) {
  const room = getCurrentRoom(run)

  // Piso: escorregadio (segue a direção guardada), grudento (mais lento) e esteira (empurra)
  const effect = getFloorEffect(run.obstacles, run.player)
  const { slip, movement } = getSlipMovement(run.slip, effect, input.movement, run.blocked)
  const solids = getRoomSolids(run.obstacles)

  let player = updatePlayer(run.player, { movement, attackDirection: input.attackDirection }, deltaSeconds, {
    solids,
    speedMultiplier: effect.speedMultiplier,
  })
  const blocked = isBlockedStep(run.player, player, movement, deltaSeconds)
  player = { ...player, ...pushPlayer(player, effect.push, deltaSeconds, solids) }
  if (touchesHot(run.obstacles, player)) player = hurtPlayer(player)

  // Golpe novo: não havia golpe, ou o tempo dele voltou a ser menor (outro golpe começou)
  const previous = run.player.attack
  const newSwing = player.attack && (!previous || player.attack.elapsed < previous.elapsed)
  let swingCounted = newSwing ? false : run.swingCounted

  let obstacles = run.obstacles
  const hitbox = getAttackHitbox(player)
  if (hitbox) {
    obstacles = hitObstacles(obstacles, hitbox, player.attack.direction)
    // A caixa do golpe fica vários quadros em cima do alvo, mas cada golpe conta uma vez só
    if (!swingCounted && hitsTarget(room, obstacles, hitbox, player)) {
      room.hits += 1
      swingCounted = true
    }
  }
  obstacles = updateRollingObstacles(obstacles, deltaSeconds)
  saveRemoved(room, obstacles)

  const next = { ...run, player, obstacles, slip, blocked, swingCounted }

  const doors = getRoomDoors(run.floor, room)
  const side = getExitSide(player, movement, doors)
  if (side) {
    const toRoomId = doors.find((door) => door.side === side).targetId
    // A sala nova já fica limpa: assim as portas dela aparecem abertas enquanto ela desliza para dentro
    const target = findRoom(run.floor, toRoomId)
    target.visited = true
    target.cleared = true
    return {
      ...next,
      transition: {
        type: 'room',
        side,
        fromRoomId: room.id,
        toRoomId,
        fromObstacles: obstacles,
        fromPlayer: player,
        elapsedMs: 0,
        durationMs: ROOM_TRANSITION_MS,
      },
    }
  }

  if (room.type === 'chefe' && room.hits >= HITS_TO_OPEN) {
    return { ...next, transition: { type: 'floor', elapsedMs: 0, durationMs: FLOOR_TRANSITION_MS, switched: false } }
  }
  return next
}

// Transição de sala: a câmera desliza; no fim o jogador surge na entrada do lado oposto, virado para dentro
function updateRoomTransition(run, stepMs) {
  const { transition } = run
  const elapsedMs = transition.elapsedMs + stepMs
  if (elapsedMs < transition.durationMs) return { ...run, transition: { ...transition, elapsedMs } }

  const room = findRoom(run.floor, transition.toRoomId)
  const entry = getEntryPosition(OPPOSITE_SIDE[transition.side])
  return { ...enterRoom(run, run.floor, room, entry, transition.side), transition: null }
}

// Transição de andar: na metade (tela escura) gera o próximo andar; no andar 5 a run termina
function updateFloorTransition(run, stepMs) {
  const elapsedMs = run.transition.elapsedMs + stepMs
  let next = { ...run, transition: { ...run.transition, elapsedMs } }

  if (!run.transition.switched && elapsedMs >= FLOOR_TRANSITION_MS / 2) {
    next.transition.switched = true
    // A tela fica escura: o fim da run é mostrado pela página
    if (run.floor.number >= LAST_FLOOR) return { ...next, finished: true }

    const floor = generateFloor(run.seed, run.floor.number + 1)
    next = enterRoom(next, floor, findRoom(floor, floor.startRoomId), { ...ROOM_PLAYER_START })
    next.banner = createBanner(floor)
  }

  if (elapsedMs >= FLOOR_TRANSITION_MS) next.transition = null
  return next
}

// Avança a run um quadro. input = { movement, attackDirection }, como em updatePlayer.
// Durante as transições os controles são ignorados. Depois do fim (finished), nada muda.
export function updateRun(run, input, deltaSeconds) {
  if (run.finished) return run
  const stepMs = Math.max(0, deltaSeconds * 1000)

  // A faixa só começa a contar depois da troca de andar; na troca de sala ela continua contando
  if (run.transition?.type === 'floor') return updateFloorTransition(run, stepMs)

  const current = { ...run, banner: advanceBanner(run.banner, stepMs) }
  if (current.transition) return updateRoomTransition(current, stepMs)
  return updateRoom(current, input, deltaSeconds)
}
