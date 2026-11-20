import { ITEM_BANNERS } from '../data/itemBanners.js'
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
import { applyDamage, DAMAGE_LIGHT, normalizeHealth } from './health.js'
import { assignPedestalItems, findTouchedPedestal, getPedestalSolids, getRoomPedestals } from './pedestals.js'
import { removeAccents } from './pixelFont.js'
import { createPlayer, DEATH_DURATION_MS, getAttackHitbox, hurtPlayer, killPlayer, updatePlayer } from './player.js'
import { createProgressSnapshot } from './progress.js'
import {
  getSharkFinPosition,
  isInPuddle,
  isNearFin,
  isNearHammock,
  PUDDLE_FALL_CAUSE,
  SHARK_DEATH_MS,
  SLEEP_MS,
  TRALALERO_CAUSE,
} from './roomInteractions.js'
import { buildRoomObstacles, findFreeCell, getCellRect } from './roomLayout.js'
import { getFeetBox, ROOM_PLAYER_BOUNDS, ROOM_PLAYER_START } from './roomMovement.js'
import {
  getFloorEffect,
  getRoomSolids,
  getSlipMovement,
  hitObstacles,
  isOnShards,
  pushPlayer,
  stopBlockedAxes,
  toShards,
  touchesHot,
  updateBreakingObstacles,
  updateRollingObstacles,
} from './roomObstacles.js'
import { getBaseStats, getPlayerStats, STAT_LIMITS } from './stats.js'
import { createTrainingTarget, swingAtTargets, updateTargets } from './targets.js'

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
export const PICKUP_MS = 1000 // o item pego fica este tempo sobre a cabeça do Tung (ele continua andando e atacando)
export const VANISH_MS = 600 // numa sala de escolha, o item que não foi pego some (sobe e apaga) neste tempo

// O que machuca no piso: a chapa quente e os cacos do garrafão quebrado. A causa vai para o aviso de morte (veja health.js).
const HOT_PLATE_CAUSE = 'chapa'
const SHARDS_CAUSE = 'cacos'

// Tambor caindo do céu na sala do chefe: cai em DRUM_FALL_MS (cada vez mais rápido) de DRUM_FALL_HEIGHT u de altura
// e levanta poeira até DRUM_DROP_MS. Enquanto cai, não dá para bater nele.
export const DRUM_FALL_MS = 550
export const DRUM_DROP_MS = 950
const DRUM_FALL_HEIGHT = 700
const NO_INPUT = { movement: { x: 0, y: 0 }, attackDirection: null }

const NORMAL_ROOM_TYPES = ['inicial', 'comum']

// O tambor fica sempre na mesma casa da sala do chefe (D em (6,2) no layout "chefe", acima do meio da sala)
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

// Bônus dos itens que ele tem. Por enquanto só o custo da Sala do Pacto: o item com maxHealthCost tira essa vida
// máxima para sempre (o custo é pago ao pegar). Os efeitos dos outros itens vão entrar aqui.
function getItemBonuses(run) {
  const bonuses = []
  for (const id of run.items) {
    const cost = run.catalog[id]?.effect?.maxHealthCost
    if (cost) bonuses.push({ stat: 'maxHealth', add: -cost })
  }
  return bonuses
}

// Atributos do jogador agora (dano, velocidades, vida máxima e invencibilidade): a ficha do personagem com os
// bônus dos itens (veja stats.js)
export function getRunStats(run) {
  return getPlayerStats(getBaseStats(run.characterId), getItemBonuses(run))
}

// O item entra na lista (na ordem em que foi pego), fica PICKUP_MS sobre a cabeça do Tung e aparece o banner
// com o nome dele e a frase do item.md. Se o item tira vida máxima (Pacto), a vida que passar do novo máximo cai junto.
function giveItem(run, itemId) {
  const next = { ...run, items: [...run.items, itemId] }
  next.health = Math.min(next.health, getRunStats(next).maxHealth)
  const name = run.catalog[itemId]?.name ?? itemId
  next.banner = { text: removeAccents(name), subtitle: ITEM_BANNERS[itemId] ?? '', elapsedMs: 0 }
  next.pickup = { itemId, elapsedMs: 0 }
  return next
}

// O item sobre a cabeça: o tempo anda até PICKUP_MS, e aí ele some
function advancePickup(pickup, stepMs) {
  if (!pickup) return null
  const elapsedMs = pickup.elapsedMs + stepMs
  return elapsedMs >= PICKUP_MS ? null : { ...pickup, elapsedMs }
}

// Itens sumindo (sala de escolha): o tempo de cada um anda até VANISH_MS, e aí ele sai da lista
function advanceVanishing(vanishing, stepMs) {
  const next = []
  for (const item of vanishing) {
    const elapsedMs = item.elapsedMs + stepMs
    if (elapsedMs < VANISH_MS) next.push({ ...item, elapsedMs })
  }
  return next
}

// Dá para pagar o custo do item? O custo em vida máxima não pode deixar menos de 1 coração (STAT_LIMITS)
function canPayItemCost(run, pedestal) {
  return getRunStats(run).maxHealth - pedestal.maxHealthCost >= STAT_LIMITS.maxHealth.min
}

// Paleta da sala: a inicial e as comuns usam o tema do andar; as especiais, a paleta do tipo delas
export function getRoomTheme(floor, room) {
  return NORMAL_ROOM_TYPES.includes(room.type) ? floor.theme : room.type
}

// Tema dos obstáculos: a adega usa sempre os da cantina, as outras salas os do andar
export function getObstacleTheme(floor, room) {
  return room.type === 'adega' ? 'cantina' : floor.theme
}

// Obstáculos da sala, sem os que já quebraram nela. O garrafão quebrado volta como cacos de vidro.
export function getRoomObstacles(floor, room) {
  const obstacles = []
  for (const obstacle of buildRoomObstacles(room.layoutId, getObstacleTheme(floor, room))) {
    if (!room.removed.includes(obstacle.id)) obstacles.push(obstacle)
    else if (obstacle.kind === 'garrafao') obstacles.push(toShards(obstacle))
  }
  return obstacles
}

// Altura do tambor caindo do céu (0 = no chão) e há quanto tempo ele já caiu (-1 = ainda caindo).
// drumDrop = run.drumDrop ({ elapsedMs }) ou null (sem animação: o tambor está no chão).
export function getDrumFall(drumDrop) {
  if (!drumDrop) return { height: 0, landedMs: Infinity }
  if (drumDrop.elapsedMs >= DRUM_FALL_MS) return { height: 0, landedMs: drumDrop.elapsedMs - DRUM_FALL_MS }
  const t = drumDrop.elapsedMs / DRUM_FALL_MS
  return { height: DRUM_FALL_HEIGHT * (1 - t * t), landedMs: -1 } // t * t: cai cada vez mais rápido
}

// A marca de giz da adega aparece de perto ou depois do 1º golpe
export function isSecretMarkVisible(run) {
  const room = getCurrentRoom(run)
  if (!room.secret) return false
  return room.hits >= 1 || isNearDoor(run.player, room.secret.side)
}

// Entra na sala: ela fica visitada e limpa (sem inimigos, toda sala fica limpa ao entrar).
// O jogador surge parado, sem golpe e sem dano, virado para `direction`.
// Na primeira entrada na sala do chefe o tambor cai do céu (quando houver luta, ele vai cair quando o chefe morrer).
function enterRoom(run, floor, room, position, direction = 'down') {
  room.visited = true
  room.cleared = true
  let drumDrop = null
  if (room.type === 'chefe' && !room.drumDropped) {
    room.drumDropped = true
    drumDrop = { elapsedMs: 0 }
  }
  return {
    ...run,
    drumDrop, // { elapsedMs } enquanto o tambor cai do céu (veja getDrumFall), senão null
    floor,
    roomId: room.id,
    player: { ...createPlayer(position), direction },
    obstacles: getRoomObstacles(floor, room),
    slip: null, // velocidade do deslize no líquido ({ x, y }) ou null (veja getSlipMovement)
    swingCounted: false,
    unlocking: null, // porta trancada abrindo agora: { side, elapsedMs } (veja "Porta trancada" em updateRoom)
    // Alvos da sala (targets.js): hoje só o alvo de treino; depois, os inimigos. Saem ao trocar de sala.
    targets: [],
    swingTargetIds: [], // alvos que o golpe atual já acertou (cada golpe acerta um alvo uma vez)
    roomKills: 0, // abates nesta sala
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
// (parede da adega e tambor), se a sala trancada já foi aberta com um garfo, se ele já dormiu na rede
// e os pedestais que ficaram vazios. Só entram as salas em que algo mudou.
export function getRoomStates(floor) {
  const states = {}
  for (const room of floor.rooms) {
    if (room.removed.length > 0 || room.hits > 0 || room.unlocked || room.slept || room.emptied.length > 0) {
      states[room.id] = {
        removed: [...room.removed],
        hits: room.hits,
        unlocked: room.unlocked,
        slept: room.slept,
        emptied: [...room.emptied],
      }
    }
  }
  return states
}

// Começa a run (nova ou continuada). roomId inválido (ou o antigo 'sala-inicial') = sala inicial.
// Do progresso salvo vêm também:
// - visitedRoomIds: as salas já visitadas;
// - roomStates: o que quebrou e as batidas de cada sala (formato de getRoomStates);
// - health: a vida, em meios corações (sem ela, ou acima da vida máxima, a run começa com a vida máxima);
// - forks: os garfos que sobraram (a run começa com STARTING_FORKS).
// Ids que não existem neste andar são ignorados (os ids repetem de um andar para outro).
// catalog = itens do catálogo da API, por id (itemCatalog.js); items = ids dos itens que ele já tem.
export function createRun({
  seed,
  floorNumber = 1,
  roomId = null,
  position = null,
  characterId,
  visitedRoomIds = [],
  roomStates = {},
  health,
  forks = STARTING_FORKS,
  catalog = {},
  items = [],
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
    saved.slept = Boolean(state.slept) // quem já dormiu na rede deste andar não dorme de novo
    saved.emptied = [...(state.emptied ?? [])] // pedestal de onde o item já saiu continua vazio
  }

  // Save antigo (sem o estado das salas) dentro da adega: a parede da origem abre, senão ele ficaria preso
  if (room.type === 'adega') {
    floor.rooms.find((other) => other.secret?.roomId === room.id).hits = HITS_TO_OPEN
  }

  const start = {
    seed,
    characterId,
    catalog,
    items: [...items], // na ordem em que foram pegos
    pedestalItems: assignPedestalItems(seed, catalog), // itens dos pedestais de todos os andares (pedestals.js)
    pickup: null, // item pego agora, sobre a cabeça do Tung: { itemId, elapsedMs } (some depois de PICKUP_MS)
    grains: 0,
    forks,
    health: 0, // vida em meios corações (veja health.js): vem logo abaixo, com a vida máxima dos atributos
    death: null, // { cause } depois que a vida acaba: toca a animação de morte e a run termina
    transition: null,
    finMs: 0, // relógio da barbatana do Tralalero na Sala do Pacto (o desenho usa o mesmo, para bater com o perigo)
    sleep: null, // { elapsedMs } enquanto ele dorme na rede da Sala de Descanso (veja updateSleep)
    // A faixa com o nome do andar aparece sempre que a run começa (New game, Continue em qualquer sala e R)
    banner: createBanner(floor),
    finished: false,
  }
  start.health = normalizeHealth(health, getRunStats(start).maxHealth)
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
    items: run.items,
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
// O garrafão que virou cacos também conta como quebrado (ao voltar, getRoomObstacles traz os cacos de novo).
function saveRemoved(room, obstacles) {
  for (const obstacle of obstacles) {
    const broken = obstacle.removed || obstacle.rolling || obstacle.kind === 'cacos'
    if (broken && !room.removed.includes(obstacle.id)) room.removed.push(obstacle.id)
  }
}

// O golpe acerta o tambor ou a parede da adega? (até 3 batidas)
// A parede secreta só conta golpe com a marca visível (de perto, ou já trincada): de longe, nada acontece.
// O tambor ainda caindo do céu (drumFalling) não conta golpe.
function hitsTarget(room, obstacles, hitbox, player, drumFalling) {
  if (room.hits >= HITS_TO_OPEN) return false
  const drum = obstacles.find((obstacle) => obstacle.mechanic === 'tambor')
  if (drum && isDrumVisible(room)) return !drumFalling && overlaps(hitbox, drum.box)
  if (!room.secret) return false
  const markVisible = room.hits >= 1 || isNearDoor(player, room.secret.side)
  return markVisible && overlaps(hitbox, DOOR_HIT_ZONES[room.secret.side])
}

// Um quadro normal dentro da sala
function updateRoom(run, input, deltaSeconds) {
  const room = getCurrentRoom(run)
  const stats = getRunStats(run)

  // Piso: escorregadio (inércia), grudento (mais lento) e esteira (empurra)
  const effect = getFloorEffect(run.obstacles, run.player)
  const slipping = getSlipMovement(run.slip, effect, input.movement, deltaSeconds)
  const { movement } = slipping
  // Os pedestais são sólidos, como os obstáculos
  const pedestals = getRoomPedestals(run, room)
  const solids = getRoomSolids(run.obstacles, getPedestalSolids(pedestals))

  let player = updatePlayer(run.player, { movement, attackDirection: input.attackDirection }, deltaSeconds, {
    solids,
    speedMultiplier: effect.speedMultiplier,
    stats,
  })
  const slip = stopBlockedAxes(slipping.slip, run.player, player, deltaSeconds)
  player = { ...player, ...pushPlayer(player, effect.push, deltaSeconds, solids) }

  // Chapa quente (encostar) e cacos de vidro (pisar): meio coração por machucado. hurtPlayer devolve o mesmo
  // objeto enquanto ele está invencível, então só o golpe que vale tira vida. Sem vida, ele morre (e a animação
  // de dano nem toca).
  let { health, death } = run
  let hazard = null
  if (touchesHot(run.obstacles, player)) hazard = HOT_PLATE_CAUSE
  else if (isOnShards(run.obstacles, player)) hazard = SHARDS_CAUSE
  if (hazard) {
    const hurt = hurtPlayer(player, stats.invincibilityMs)
    if (hurt !== player) {
      player = hurt
      health = applyDamage(health, DAMAGE_LIGHT)
      if (health === 0) {
        player = killPlayer(player)
        death = { cause: hazard }
      }
    }
  }

  // Poça do Tralalero (Sala do Pacto): a barbatana dá voltas na poça. Ele morre na hora, com qualquer vida:
  // - passou perto da barbatana: o Tralalero puxa o Tung para a água;
  // - pisou na poça com a barbatana longe: ele cai sozinho e a barbatana mergulha.
  // death.fin guarda onde a barbatana estava, para a animação começar dali.
  const finMs = run.finMs + deltaSeconds * 1000
  if (room.type === 'pacto' && !death) {
    const fin = getSharkFinPosition(finMs)
    let cause = null
    if (isNearFin(player, fin)) cause = TRALALERO_CAUSE
    else if (isInPuddle(player)) cause = PUDDLE_FALL_CAUSE
    if (cause) {
      health = 0
      player = killPlayer(player)
      death = { cause, fin: { x: fin.x, y: fin.y, turn: fin.turn } }
    }
  }

  // Rede da Sala de Descanso: chegar perto dela com a vida incompleta faz o Tung dormir. Só uma vez por andar
  // (room.slept; só existe uma Descanso por andar). A vida enche no meio do sono, com a tela preta (veja updateSleep).
  let sleep = null
  if (room.type === 'descanso' && !death && !room.slept && health < stats.maxHealth && isNearHammock(player)) {
    sleep = { elapsedMs: 0 }
  }

  // Golpe novo: não havia golpe, ou o tempo dele voltou a ser menor (outro golpe começou)
  const previous = run.player.attack
  const newSwing = player.attack && (!previous || player.attack.elapsed < previous.elapsed)
  let swingCounted = newSwing ? false : run.swingCounted
  let swingTargetIds = newSwing ? [] : run.swingTargetIds

  let obstacles = run.obstacles
  // Alvos: os tempos deles andam (lento, preso, empurrão, números de dano e a volta do alvo de treino)
  let targets = updateTargets(run.targets, deltaSeconds, solids)
  let roomKills = run.roomKills
  const hitbox = getAttackHitbox(player)
  if (hitbox) {
    obstacles = hitObstacles(obstacles, hitbox, player.attack.direction)
    // A caixa do golpe fica vários quadros em cima do alvo, mas cada golpe conta uma vez só
    if (!swingCounted && hitsTarget(room, obstacles, hitbox, player, Boolean(run.drumDrop))) {
      room.hits += 1
      swingCounted = true
    }
    // Nos alvos também: cada golpe acerta cada alvo uma vez, com o dano dos atributos
    const swing = swingAtTargets(targets, hitbox, stats.damage, swingTargetIds)
    targets = swing.targets
    swingTargetIds = swing.hitIds
    roomKills += swing.kills
  }
  obstacles = updateRollingObstacles(obstacles, deltaSeconds)
  obstacles = updateBreakingObstacles(obstacles, deltaSeconds)

  // Tambor caindo do céu: o tempo da animação anda até DRUM_DROP_MS, e aí ela acaba
  let drumDrop = null
  if (run.drumDrop) {
    const elapsedMs = run.drumDrop.elapsedMs + deltaSeconds * 1000
    if (elapsedMs < DRUM_DROP_MS) drumDrop = { elapsedMs }
  }
  saveRemoved(room, obstacles)

  let next = { ...run, player, obstacles, slip, swingCounted, swingTargetIds, targets, roomKills, health, death, finMs, drumDrop }
  if (death) return next // morto não atravessa porta nem passa de andar
  if (sleep) return { ...next, sleep } // começou a dormir: neste quadro ele não atravessa porta

  // Pedestal: encostar pega o item, se der para pagar o custo (Sala do Pacto). Todos os pedestais da sala ficam
  // vazios: numa sala de escolha (2 pedestais), o outro item some e não aparece mais na run.
  const touched = findTouchedPedestal(pedestals, player)
  if (touched && canPayItemCost(next, touched)) {
    for (const pedestal of pedestals) {
      if (!room.emptied.includes(pedestal.id)) room.emptied.push(pedestal.id)
    }
    next = giveItem(next, touched.itemId)
  }

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
// A morte pelo Tralalero tem outra animação (puxado para a piscina), com outra duração.
function updateDeath(run, deltaSeconds) {
  const player = updatePlayer(run.player, NO_INPUT, deltaSeconds)
  const { cause } = run.death
  const inPuddle = cause === TRALALERO_CAUSE || cause === PUDDLE_FALL_CAUSE
  const animationMs = inPuddle ? SHARK_DEATH_MS : DEATH_DURATION_MS
  return { ...run, player, finished: player.dead.elapsed >= animationMs + DEATH_HOLD_MS }
}

// Sono na rede: o tempo do sono anda e os controles são ignorados (a página escurece a tela com getSleepFade).
// No meio do sono, com a tela preta, a vida enche e a sala fica marcada como "já dormiu", no mesmo quadro:
// assim o save automático nunca guarda uma coisa sem a outra.
function updateSleep(run, stepMs) {
  const elapsedMs = run.sleep.elapsedMs + stepMs
  const halfMs = SLEEP_MS / 2
  let { health } = run
  if (run.sleep.elapsedMs < halfMs && elapsedMs >= halfMs) {
    getCurrentRoom(run).slept = true
    health = getRunStats(run).maxHealth
  }
  // A faixa do andar (escondida no sono) continua contando, para não voltar a aparecer quando ele acordar
  const banner = advanceBanner(run.banner, stepMs)
  // Futuro: quando o sono acabar, tocar o áudio do Tung falando "tung tung sahur"
  if (elapsedMs >= SLEEP_MS) return { ...run, health, banner, sleep: null }
  return { ...run, health, banner, sleep: { elapsedMs } }
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
  if (run.sleep) return updateSleep(run, stepMs)

  // A faixa só começa a contar depois da troca de andar; na troca de sala ela continua contando
  if (run.transition?.type === 'floor') return updateFloorTransition(run, stepMs)

  // O item sobre a cabeça continua na troca de sala: ele anda junto com o Tung
  const current = { ...run, banner: advanceBanner(run.banner, stepMs), pickup: advancePickup(run.pickup, stepMs) }
  if (current.transition) return updateRoomTransition(current, stepMs)
  return updateRoom(current, input, deltaSeconds)
}

// ---------- ferramentas de teste (só no npm run dev, com o F3 ligado; veja SalaInicial.jsx) ----------

const CENTER_CELL = { col: 6, row: 3 } // casa do meio da sala (a grade tem 13 x 7)

// Tecla T: põe o alvo de treino numa casa livre perto do meio da sala, ou tira o que já está lá.
// A base fica a 3/4 da altura da casa, para a caixa da base (a que bate no empurrão) caber dentro dela.
export function toggleTrainingTarget(run) {
  if (run.targets.some((target) => target.training)) return removeTrainingTarget(run)
  const cell = findFreeCell(getCurrentRoom(run).layoutId, CENTER_CELL.col, CENTER_CELL.row)
  if (!cell) return run
  const rect = getCellRect(cell.col, cell.row)
  const target = createTrainingTarget({ x: rect.x + rect.width / 2, y: rect.y + rect.height * 0.75 })
  return { ...run, targets: [...run.targets, target] }
}

// Desligar o F3 tira o alvo de treino: ele só existe com o F3 ligado
export function removeTrainingTarget(run) {
  return { ...run, targets: run.targets.filter((target) => !target.training) }
}

// Tecla I: dá o próximo item do catálogo que o jogador ainda não tem (na ordem do catálogo, que vem por nome),
// com o banner, como se tivesse pego. Ele não aparece mais no pedestal da sala dele.
export function giveNextItem(run) {
  for (const id of Object.keys(run.catalog)) {
    if (!run.items.includes(id)) return giveItem(run, id)
  }
  return run
}
