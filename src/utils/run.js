import { overlaps } from './collision.js'
import {
  applyUnlocking,
  DOOR_HIT_ZONES,
  FORK_UNLOCK_MS,
  getEntryPosition,
  getExitSide,
  getRoomDoors,
  HITS_TO_OPEN,
  isNearDoor,
  OPPOSITE_SIDE,
} from './doors.js'
import { generateFloor, LAST_FLOOR } from './floorGenerator.js'
import { applyDamage, DAMAGE_LIGHT, MAX_HEALTH } from './health.js'
import { createPlayer, DEATH_DURATION_MS, getAttackHitbox, hurtPlayer, killPlayer, updatePlayer } from './player.js'
import { createProgressSnapshot } from './progress.js'
import { buildRoomObstacles } from './roomLayout.js'
import { getFeetBox, ROOM_PLAYER_BOUNDS, ROOM_PLAYER_START } from './roomMovement.js'
import {
  getFloorEffect,
  getRoomSolids,
  getSlipMovement,
  hitObstacles,
  pushPlayer,
  stopBlockedAxes,
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
export const DEATH_HOLD_MS = 500 // depois da animação de morte, ele fica deitado esse tempo antes do aviso
export const RESTART_HOLD_MS = 1000 // segurar R por 1 s recomeça a run com outra seed (como no Isaac)
export const STARTING_FORKS = 1 // garfos no começo da run (cada porta trancada gasta 1)

// O que machuca hoje: só a chapa quente. A causa vai para o aviso de morte (veja health.js).
const HOT_PLATE_CAUSE = 'chapa'
const NO_INPUT = { movement: { x: 0, y: 0 }, attackDirection: null }

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
    slip: null, // velocidade do deslize no líquido ({ x, y }) ou null (veja getSlipMovement)
    swingCounted: false,
    unlocking: null, // porta trancada abrindo agora: { side, elapsedMs } (veja "Porta trancada" em updateRoom)
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

// Ids das salas visitadas do andar, para o progresso salvo. A fonte única é room.visited:
// o minimapa (F3 hoje, o do jogo depois) lê esse mesmo campo.
export function getVisitedRoomIds(floor) {
  return floor.rooms.filter((room) => room.visited).map((room) => room.id)
}

// O que mudou em cada sala do andar, para o progresso salvo: obstáculos quebrados, batidas
// (parede da adega e tambor) e se a sala trancada já foi aberta com um garfo. Só entram as salas em que algo mudou.
export function getRoomStates(floor) {
  const states = {}
  for (const room of floor.rooms) {
    if (room.removed.length > 0 || room.hits > 0 || room.unlocked) {
      states[room.id] = { removed: [...room.removed], hits: room.hits, unlocked: room.unlocked }
    }
  }
  return states
}

// Começa a run (nova ou continuada). roomId inválido (ou o antigo 'sala-inicial') = sala inicial.
// Do progresso salvo vêm também:
// - visitedRoomIds: as salas já visitadas;
// - roomStates: o que quebrou e as batidas de cada sala (formato de getRoomStates);
// - health: a vida, em meios corações;
// - forks: os garfos que sobraram (a run começa com STARTING_FORKS).
// Ids que não existem neste andar são ignorados (os ids repetem de um andar para outro).
export function createRun({
  seed,
  floorNumber = 1,
  roomId = null,
  position = null,
  characterId,
  visitedRoomIds = [],
  roomStates = {},
  health = MAX_HEALTH,
  forks = STARTING_FORKS,
}) {
  const floor = generateFloor(seed, floorNumber)
  const room = findRoom(floor, roomId) ?? findRoom(floor, floor.startRoomId)
  for (const id of visitedRoomIds) {
    const visited = findRoom(floor, id)
    if (visited) visited.visited = true
  }
  // O que quebrou continua quebrado, e as batidas na parede da adega e no tambor continuam contadas
  for (const [id, state] of Object.entries(roomStates)) {
    const saved = findRoom(floor, id)
    if (!saved) continue
    saved.removed = [...state.removed]
    saved.hits = state.hits
    saved.unlocked = Boolean(state.unlocked) // a porta aberta com garfo continua aberta
  }

  // Save antigo (sem o estado das salas) dentro da adega: a parede da origem abre, senão ele ficaria preso
  if (room.type === 'adega') {
    floor.rooms.find((other) => other.secret?.roomId === room.id).hits = HITS_TO_OPEN
  }

  const start = {
    seed,
    characterId,
    grains: 0,
    forks,
    health, // vida em meios corações (veja health.js)
    death: null, // { cause } depois que a vida acaba: toca a animação de morte e a run termina
    transition: null,
    // A faixa com o nome do andar aparece sempre que a run começa (New game, Continue em qualquer sala e R)
    banner: createBanner(floor),
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
    // Morreu = acabou: um save feito durante a animação de morte já conta como run encerrada
    finished: run.finished || Boolean(run.death),
    visitedRoomIds: getVisitedRoomIds(run.floor),
    roomStates: getRoomStates(run.floor),
    health: run.health,
    forks: run.forks,
    deathCause: run.death?.cause ?? null,
  })
}

// A faixa conta o tempo e some sozinha depois de BANNER_TOTAL_MS
function advanceBanner(banner, stepMs) {
  if (!banner) return null
  const elapsedMs = banner.elapsedMs + stepMs
  return elapsedMs >= BANNER_TOTAL_MS ? null : { ...banner, elapsedMs }
}

// Ids que quebraram agora vão para room.removed (não voltam ao sair e entrar de novo, nem ao continuar a run).
// O que está rolando também conta: ele sempre quebra no fim, então sair da sala no meio do caminho não o traz de volta.
function saveRemoved(room, obstacles) {
  for (const obstacle of obstacles) {
    if ((obstacle.removed || obstacle.rolling) && !room.removed.includes(obstacle.id)) room.removed.push(obstacle.id)
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

  // Piso: escorregadio (inércia), grudento (mais lento) e esteira (empurra)
  const effect = getFloorEffect(run.obstacles, run.player)
  const slipping = getSlipMovement(run.slip, effect, input.movement, deltaSeconds)
  const { movement } = slipping
  const solids = getRoomSolids(run.obstacles)

  let player = updatePlayer(run.player, { movement, attackDirection: input.attackDirection }, deltaSeconds, {
    solids,
    speedMultiplier: effect.speedMultiplier,
  })
  const slip = stopBlockedAxes(slipping.slip, run.player, player, deltaSeconds)
  player = { ...player, ...pushPlayer(player, effect.push, deltaSeconds, solids) }

  // Chapa quente: meio coração por queimadura. hurtPlayer devolve o mesmo objeto enquanto ele está
  // invencível, então só o golpe que vale tira vida. Sem vida, ele morre (e a animação de dano nem toca).
  let { health, death } = run
  if (touchesHot(run.obstacles, player)) {
    const hurt = hurtPlayer(player)
    if (hurt !== player) {
      player = hurt
      health = applyDamage(health, DAMAGE_LIGHT)
      if (health === 0) {
        player = killPlayer(player)
        death = { cause: HOT_PLATE_CAUSE }
      }
    }
  }

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

  const next = { ...run, player, obstacles, slip, swingCounted, health, death }
  if (death) return next // morto não atravessa porta nem passa de andar

  // Porta trancada: empurrar com garfo no bolso gasta 1 garfo e abre a sala para o resto da run (target.unlocked).
  // Enquanto a animação toca, a porta ainda não deixa passar; sem garfo, ela só fica trancada.
  if (next.unlocking) {
    const elapsedMs = next.unlocking.elapsedMs + deltaSeconds * 1000
    next.unlocking = elapsedMs >= FORK_UNLOCK_MS ? null : { ...next.unlocking, elapsedMs }
  }
  const roomDoors = getRoomDoors(run.floor, room)
  const lockedSide = next.forks > 0 && !next.unlocking ? getExitSide(player, input.movement, roomDoors, 'locked') : null
  if (lockedSide) {
    findRoom(run.floor, roomDoors.find((door) => door.side === lockedSide).targetId).unlocked = true
    next.forks -= 1
    next.unlocking = { side: lockedSide, elapsedMs: 0 }
  }

  const doors = applyUnlocking(roomDoors, next.unlocking)
  // A porta vale só com a tecla apertada para ela: o deslize sozinho nunca troca de sala
  const side = getExitSide(player, input.movement, doors)
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

// Morte: só a animação do personagem anda (o resto da sala fica parado). Quando ela acaba e ele já ficou
// DEATH_HOLD_MS deitado, a run termina: a página mostra o aviso de morte.
function updateDeath(run, deltaSeconds) {
  const player = updatePlayer(run.player, NO_INPUT, deltaSeconds)
  return { ...run, player, finished: player.dead.elapsed >= DEATH_DURATION_MS + DEATH_HOLD_MS }
}

// Segurar R para recomeçar: o tempo segurado cresce até RESTART_HOLD_MS; soltar antes desfaz (3x mais rápido).
// A página escurece a tela conforme getRestartFade e cria outra run quando o tempo completa.
export function updateRestartHold(holdMs, isHeld, stepMs) {
  if (isHeld) return Math.min(RESTART_HOLD_MS, holdMs + stepMs)
  return Math.max(0, holdMs - stepMs * 3)
}

// A tecla R está segurada? Enquanto estiver, a run recomeça a cada RESTART_HOLD_MS (como no Isaac: segurar R
// sorteia uma run atrás da outra). Quem recomeça zera o tempo segurado, e o ciclo começa de novo.
// O evento muda o estado assim:
// - 'press': keydown de um aperto novo (event.repeat === false) liga;
// - 'release' (keyup) e 'blur' (a janela perdeu o foco) desligam;
// - 'repeat': keydown repetido pelo teclado com a tecla no fundo não muda nada. Assim, depois de um blur, o
//   repeat não religa o R sozinho: só um aperto novo.
export function updateRestartKey(held, type) {
  if (type === 'press') return true
  if (type === 'release' || type === 'blur') return false
  return held
}

// Entrada na run (New game, Continue e depois do R): a tela começa preta e clareia em ENTER_FADE_MS, o mesmo
// tempo do clarear da troca de andar. elapsedMs = tempo desde que a run apareceu. Devolve 1 (preto) a 0 (nada).
export const ENTER_FADE_MS = 450

export function getEnterFade(elapsedMs) {
  return Math.min(1, Math.max(0, 1 - elapsedMs / ENTER_FADE_MS))
}

// Escurecimento da tela enquanto o R é segurado: 0 (nada) a 1 (preto)
export function getRestartFade(holdMs) {
  return Math.min(1, Math.max(0, holdMs / RESTART_HOLD_MS))
}

// Avança a run um quadro. input = { movement, attackDirection }, como em updatePlayer.
// Durante as transições e a morte os controles são ignorados. Depois do fim (finished), nada muda.
export function updateRun(run, input, deltaSeconds) {
  if (run.finished) return run
  if (run.death) return updateDeath(run, deltaSeconds)
  const stepMs = Math.max(0, deltaSeconds * 1000)

  // A faixa só começa a contar depois da troca de andar; na troca de sala ela continua contando
  if (run.transition?.type === 'floor') return updateFloorTransition(run, stepMs)

  const current = { ...run, banner: advanceBanner(run.banner, stepMs) }
  if (current.transition) return updateRoomTransition(current, stepMs)
  return updateRoom(current, input, deltaSeconds)
}
