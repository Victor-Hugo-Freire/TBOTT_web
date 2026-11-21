import { ARCADE_DOOR_PRICE, ARCADE_PLAY_PRICE, ARCADE_SPIN_MS, NOTICE_MS } from '../data/economy.js'
import { ITEM_BANNERS } from '../data/itemBanners.js'
import { ARCADE_PRIZE_CELL, isTouchingMachine, rollArcadePrize } from './arcade.js'
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
import {
  advanceDrops,
  collectDrops,
  createCellarDrops,
  createGrainDrop,
  DROP_COLLECT_MS,
  healWithHeart,
  placeDrops,
  rollLuckyGrain,
  rollRoomReward,
} from './drops.js'
import {
  areEnemiesDefeated,
  createRoomEnemies,
  findTouchingEnemy,
  pickRoomEnemies,
  updateEnemies,
  updateEnemyFloor,
} from './enemies.js'
import { generateFloor, LAST_FLOOR } from './floorGenerator.js'
import { applyDamage, DAMAGE_LIGHT, normalizeHealth } from './health.js'
import {
  assignPedestalItems,
  CHOICE_ROOM_TYPES,
  findTouchedPedestal,
  getPedestalSolids,
  getRoomPedestals,
  getRoomTypeItem,
  PEDESTAL_TOP_HEIGHT,
} from './pedestals.js'
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
import { buildRoomObstacles, findFreeCell, getCellRect, getLayoutPoints } from './roomLayout.js'
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
import {
  addBumpFlashes,
  applyMotherHeal,
  armRoomShield,
  createItemEffects,
  createLuckyFlash,
  createSwing,
  endSwing,
  getEffect,
  getItemBonuses,
  hitWithSwing,
  onKills,
  onPlayerHurt,
  startSwing,
  updateEffectTimers,
  updateFlashes,
  updatePuddles,
  updateShards,
  spendShield,
} from './itemEffects.js'
import { createTrainingTarget, findNewKills, updateTargets } from './targets.js'

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

// Atributos do jogador agora (dano, velocidades, vida máxima e invencibilidade): a ficha do personagem com os
// bônus dos itens (getItemBonuses, em itemEffects.js; os limites ficam em stats.js)
export function getRunStats(run) {
  return getPlayerStats(getBaseStats(run.characterId), getItemBonuses(run))
}

// Dano no jogador (hoje a chapa quente e os cacos; depois, os inimigos). Devolve { player, health, death, effects }.
// - invencível, no meio do dano ou morto: nada acontece;
// - Caldo da Mamãe: o escudo da sala anula o dano (ele fica invencível um pouco, sem a animação de dano,
//   e o Café não dispara);
// - senão perde a vida, liga a corrida do Café e zera a sequência do Elixir; com pouca vida, o Caldo cura.
function damagePlayer(run, player, health, effects, amount, cause, stats) {
  const hurt = hurtPlayer(player, stats.invincibilityMs)
  if (hurt === player) return { player, health, death: null, effects }
  const shielded = spendShield(effects)
  if (shielded) return { player: { ...player, invincibleMs: stats.invincibilityMs }, health, death: null, effects: shielded }

  const nextHealth = applyDamage(health, amount)
  const hurtEffects = onPlayerHurt(run, effects)
  if (nextHealth === 0) return { player: killPlayer(hurt), health: 0, death: { cause }, effects: hurtEffects }
  const healed = applyMotherHeal(run, nextHealth, stats.maxHealth, hurtEffects)
  return { player: hurt, health: healed.health, death: null, effects: healed.effects }
}

// Chifre da Sorte: cada abate do quadro (killed, os alvos que acabaram de morrer) tem extraCoinChance de soltar
// 1 grão nos pés de quem morreu, com o brilho da sorte. O sorteio usa o número do abate na sala (run.roomKills
// ainda é o de antes deste quadro), então o mesmo abate dá sempre o mesmo resultado.
function dropLuckyGrains(run, room, killed) {
  const horn = getEffect(run, 'chifre-da-sorte')
  if (!horn?.extraCoinChance || killed.length === 0) return run
  const flashes = [...run.flashes]
  for (let index = 0; index < killed.length; index++) {
    if (!rollLuckyGrain(run.seed, run.floor.number, room, run.roomKills + index, horn.extraCoinChance)) continue
    const { x, y } = killed[index]
    room.drops.push(createGrainDrop(x, y))
    flashes.push(createLuckyFlash(x, y))
  }
  return { ...run, flashes }
}

// O item entra na lista (na ordem em que foi pego), fica PICKUP_MS sobre a cabeça do Tung e aparece o banner
// com o nome dele e a frase do item.md. Se o item tira vida máxima (Pacto), a vida que passar do novo máximo cai junto.
function giveItem(run, itemId) {
  const next = { ...run, items: [...run.items, itemId] }
  // A vida máxima que o item dá (Muçarela) já vem cheia; a que ele tira (Pacto) leva a vida junto
  const gained = run.catalog[itemId]?.effect?.maxHealthBonus ?? 0
  next.health = Math.min(next.health + gained, getRunStats(next).maxHealth)
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

// Aviso curto em cima do Tung ("Faltam grãos", "Vida cheia"...), por NOTICE_MS
function showNotice(run, text) {
  return { ...run, notice: { text, elapsedMs: 0 } }
}

function advanceNotice(notice, stepMs) {
  if (!notice) return null
  const elapsedMs = notice.elapsedMs + stepMs
  return elapsedMs >= NOTICE_MS ? null : { ...notice, elapsedMs }
}

// O que acabou de ser pego toca a animação "coleta" no lugar onde estava: { kind, amount, x, y, elapsedMs }
function advanceCollecting(collecting, stepMs) {
  const next = []
  for (const thing of collecting) {
    const elapsedMs = thing.elapsedMs + stepMs
    if (elapsedMs < DROP_COLLECT_MS) next.push({ ...thing, elapsedMs })
  }
  return next
}

// A Adega começa com grãos e um garfo no chão (o save troca pelo que sobrou, se ele já esteve lá)
function prepareCellarDrops(floor) {
  for (const room of floor.rooms) {
    if (room.type === 'adega') room.drops = createCellarDrops(room.layoutId)
  }
}

// Pedestal tocado: pega o item (de graça, pagando grãos na Loja ou vida máxima no Pacto) ou compra o garfo ou o
// coração da Loja. Sem grãos, ou coração com a vida cheia, não compra e mostra um aviso (só no começo do toque,
// firstTouch). O pedestal fica vazio.
function takeFromPedestal(run, room, pedestals, pedestal, firstTouch, maxHealth) {
  if (pedestal.price > run.grains) return firstTouch ? showNotice(run, 'Faltam grãos') : run
  if (pedestal.consumable === 'coracao' && run.health >= maxHealth) return firstTouch ? showNotice(run, 'Vida cheia') : run
  if (!canPayItemCost(run, pedestal)) return run
  room.emptied.push(pedestal.id)
  const emptiedHere = [...run.emptiedHere, pedestal.id]
  const paid = { ...run, grains: run.grains - pedestal.price, emptiedHere }

  // Garfo e coração vão direto para o bolso; a animação de pegar toca em cima do pedestal
  if (pedestal.consumable) {
    const top = { kind: pedestal.consumable, amount: 1, x: pedestal.x, y: pedestal.y - PEDESTAL_TOP_HEIGHT, elapsedMs: 0 }
    const collecting = [...paid.collecting, top]
    if (pedestal.consumable === 'garfo') return { ...paid, forks: paid.forks + 1, collecting }
    return { ...paid, health: healWithHeart(paid.health, maxHealth), collecting }
  }

  // Item. Numa sala de escolha (Tesouro e God), os outros pedestais também esvaziam: os outros itens somem com uma
  // animação (sobem e apagam) e não aparecem mais na run. No Pacto e na Loja, os outros continuam lá.
  const vanishing = []
  if (CHOICE_ROOM_TYPES.includes(room.type)) {
    for (const other of pedestals) {
      if (other === pedestal || !other.itemId) continue
      room.emptied.push(other.id)
      emptiedHere.push(other.id)
      vanishing.push({ roomId: room.id, pedestalId: other.id, itemId: other.itemId, elapsedMs: 0 })
    }
  }
  return { ...giveItem(paid, pedestal.itemId), vanishing, emptiedHere }
}

// Fliperama: encostar no tambor (uma jogada por encostada: para jogar de novo, ele se afasta e volta) paga
// ARCADE_PLAY_PRICE grãos e sorteia o prêmio (arcade.js). O prêmio já fica guardado na sala na hora (grão e garfo no
// chão, esperando; o item no pedestal), para o save não perder nada, mas só aparece quando o tambor para de girar.
function updateArcade(run, room, player, stepMs) {
  let next = run
  if (run.arcadeSpin) {
    const elapsedMs = run.arcadeSpin.elapsedMs + stepMs
    if (elapsedMs < ARCADE_SPIN_MS) next = { ...next, arcadeSpin: { ...run.arcadeSpin, elapsedMs } }
    else if (run.arcadeSpin.prize.kind === 'nada') next = showNotice({ ...next, arcadeSpin: null }, 'Nada desta vez!')
    else next = { ...next, arcadeSpin: null }
  }

  const touching = isTouchingMachine(player)
  const firstTouch = touching && !run.touchingMachine
  next = { ...next, touchingMachine: touching }
  if (!firstTouch || next.arcadeSpin) return next
  if (next.grains < ARCADE_PLAY_PRICE) return showNotice(next, 'Faltam grãos')

  // O item do Fliperama (o Chifre da Sorte) sai uma vez só: se ele já saiu, esse prêmio vira grãos
  const itemId = getRoomTypeItem(next, 'fliperama')
  const prize = rollArcadePrize(next.seed, next.floor.number, room, room.plays, Boolean(itemId) && room.prize !== itemId)
  room.plays += 1
  if (prize.kind === 'item') {
    const point = getLayoutPoints(room.layoutId).items[0]
    room.prize = itemId
    room.emptied = room.emptied.filter((id) => id !== `${point.col}-${point.row}`)
  }
  if (prize.kind === 'graos' || prize.kind === 'garfo') {
    const drop = placeDrops([prize], ARCADE_PRIZE_CELL.col, ARCADE_PRIZE_CELL.row, -ARCADE_SPIN_MS)[0]
    drop.x += ((room.plays % 3) - 1) * 40 // um pouco para o lado a cada jogada: os prêmios não ficam um em cima do outro
    room.drops.push(drop)
  }
  return { ...next, grains: next.grains - ARCADE_PLAY_PRICE, arcadeSpin: { roomId: room.id, elapsedMs: 0, prize } }
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

// Entra na sala: ela fica visitada. Sala ainda não limpa ganha os inimigos dela (enemies.js), com a vida cheia;
// sem inimigos, ela fica limpa na hora. O jogador surge parado, sem golpe e sem dano, virado para `direction`.
// Na primeira entrada na sala do chefe o tambor cai do céu (quando houver luta, ele vai cair quando o chefe morrer).
// As batidas no tambor recomeçam do zero a cada entrada: sair da sala (ou da run, e continuar depois) perde os "TUNG".
function enterRoom(run, floor, room, position, direction = 'down') {
  room.visited = true
  const enemies = room.cleared ? [] : createRoomEnemies(run.seed, floor.number, room, run.enemyCatalog)
  if (enemies.length === 0) room.cleared = true
  if (room.type === 'chefe') room.hits = 0
  let drumDrop = null
  if (room.type === 'chefe' && !room.drumDropped) {
    room.drumDropped = true
    drumDrop = { elapsedMs: 0 }
  }
  // Com inimigos vivos na sala, o escudo do Caldo arma
  return armRoomShield({
    ...run,
    drumDrop, // { elapsedMs } enquanto o tambor cai do céu (veja getDrumFall), senão null
    floor,
    roomId: room.id,
    player: { ...createPlayer(position), direction },
    obstacles: getRoomObstacles(floor, room),
    slip: null, // velocidade do deslize no líquido ({ x, y }) ou null (veja getSlipMovement)
    swingCounted: false,
    unlocking: null, // porta trancada abrindo agora: { side, elapsedMs } (veja "Porta trancada" em updateRoom)
    // Alvos da sala (targets.js): os inimigos e, no F3, o alvo de treino. Saem ao trocar de sala.
    targets: enemies,
    swing: createSwing(), // o golpe atual: alvos que ele já acertou e os efeitos de item que valem nele
    roomKills: 0, // abates nesta sala
    // Coisas dos efeitos dos itens que ficam na sala (itemEffects.js): somem ao trocar de sala
    shards: [], // lascas do Parmesão voando
    puddles: [], // poças da Concha
    enemyFloor: [], // rastros dos inimigos no chão (o gelo do Pinguino): obstáculos de piso que somem com o tempo
    flashes: [], // efeitos visuais que tocam uma vez (estalo, notas, mordida, faísca...)
    effects: { ...run.effects, shieldHits: 0 }, // o escudo do Caldo é de cada sala
    collecting: [], // o que acabou de ser pego, tocando a animação "coleta" (veja advanceCollecting)
    emptiedHere: [], // pedestais esvaziados nesta visita: só eles aparecem vazios (os outros vazios somem)
    touchingPedestal: null, // id do pedestal que ele estava tocando no quadro anterior (o aviso sai só no começo)
    touchingMachine: false, // Fliperama: ele estava encostado no tambor no quadro anterior (uma jogada por encostada)
    arcadeSpin: null, // Fliperama: o tambor girando, { roomId, elapsedMs, prize }
  })
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

// Ids das salas limpas do andar (sem inimigo vivo), para o progresso salvo: sala limpa não volta a ter inimigos.
// A sala em que ele estava no meio da luta não entra: ao continuar, os inimigos dela voltam com a vida cheia.
export function getClearedRoomIds(floor) {
  return floor.rooms.filter((room) => room.cleared).map((room) => room.id)
}

// O que mudou em cada sala do andar, para o progresso salvo: obstáculos quebrados, batidas
// (parede da adega e tambor), se a sala trancada já foi aberta (garfo ou grão), se ele já dormiu na rede,
// os pedestais que ficaram vazios, o que está no chão, as recompensas de sala limpa já dadas e, no Fliperama,
// as jogadas e o item no pedestal. Só entram as salas em que algo mudou (a Adega visitada sempre entra:
// o chão dela começa com grãos e garfo, e o save guarda o que sobrou, mesmo que não tenha sobrado nada).
export function getRoomStates(floor) {
  const states = {}
  for (const room of floor.rooms) {
    const changed = room.removed.length > 0 || room.hits > 0 || room.unlocked || room.slept || room.emptied.length > 0
    // O chão da Adega começa cheio: ele só entra no save depois que o jogador passou por ela
    const hasDrops = room.type === 'adega' ? room.visited : room.drops.length > 0
    if (changed || hasDrops || room.rewards > 0 || room.plays > 0 || room.prize !== null) {
      states[room.id] = {
        removed: [...room.removed],
        hits: room.hits,
        unlocked: room.unlocked,
        slept: room.slept,
        emptied: [...room.emptied],
        // Sem appearMs: ao continuar, o que estava aparecendo já está no chão
        drops: room.drops.map((drop) => ({ kind: drop.kind, amount: drop.amount, x: drop.x, y: drop.y })),
        rewards: room.rewards,
        plays: room.plays,
        prize: room.prize,
      }
    }
  }
  return states
}

// Começa a run (nova ou continuada). roomId inválido (ou o antigo 'sala-inicial') = sala inicial.
// Do progresso salvo vêm também:
// - visitedRoomIds: as salas já visitadas;
// - clearedRoomIds: as salas já limpas (save antigo, sem a lista: as visitadas, porque antes não havia inimigos);
// - roomStates: o que quebrou e as batidas de cada sala (formato de getRoomStates);
// - health: a vida, em meios corações (sem ela, ou acima da vida máxima, a run começa com a vida máxima);
// - forks: os garfos que sobraram (a run começa com STARTING_FORKS); grains: os grãos de café (começa com 0).
// Ids que não existem neste andar são ignorados (os ids repetem de um andar para outro).
// catalog = itens do catálogo da API, por id (itemCatalog.js); items = ids dos itens que ele já tem.
// enemyCatalog = inimigos do catálogo, por id (buildEnemyCatalog); vazio = nenhuma sala tem inimigos.
export function createRun({
  seed,
  floorNumber = 1,
  roomId = null,
  position = null,
  characterId,
  visitedRoomIds = [],
  clearedRoomIds = null,
  roomStates = {},
  health,
  forks = STARTING_FORKS,
  grains = 0,
  catalog = {},
  enemyCatalog = {},
  items = [],
  floorHealsUsed = 0,
}) {
  const floor = generateFloor(seed, floorNumber)
  prepareCellarDrops(floor)
  const room = findRoom(floor, roomId) ?? findRoom(floor, floor.startRoomId)
  for (const id of visitedRoomIds) {
    const visited = findRoom(floor, id)
    if (visited) visited.visited = true
  }
  for (const id of clearedRoomIds ?? visitedRoomIds) {
    const cleared = findRoom(floor, id)
    if (cleared) cleared.cleared = true
  }
  // O que quebrou continua quebrado, e as batidas na parede da adega continuam contadas
  // (as do tambor ficam no save, mas o enterRoom lá embaixo zera ao entrar na sala do chefe)
  for (const [id, state] of Object.entries(roomStates)) {
    const saved = findRoom(floor, id)
    if (!saved) continue
    saved.removed = [...state.removed]
    saved.hits = state.hits
    saved.unlocked = Boolean(state.unlocked) // a porta aberta com garfo continua aberta
    saved.slept = Boolean(state.slept) // quem já dormiu na rede deste andar não dorme de novo
    saved.emptied = [...(state.emptied ?? [])] // pedestal de onde o item já saiu continua vazio
    if (state.drops) saved.drops = state.drops.map((drop) => ({ ...drop })) // o que ficou no chão (Adega: o que sobrou)
    saved.rewards = state.rewards ?? 0
    saved.plays = state.plays ?? 0 // Fliperama: jogadas feitas (o sorteio continua de onde parou)
    saved.prize = state.prize ?? null // Fliperama: o item que saiu no tambor e ainda está no pedestal
  }

  // Save antigo (sem o estado das salas) dentro da adega: a parede da origem abre, senão ele ficaria preso
  if (room.type === 'adega') {
    floor.rooms.find((other) => other.secret?.roomId === room.id).hits = HITS_TO_OPEN
  }

  const start = {
    seed,
    characterId,
    catalog,
    enemyCatalog,
    items: [...items], // na ordem em que foram pegos
    pedestalItems: assignPedestalItems(seed, catalog), // itens dos pedestais de todos os andares (pedestals.js)
    pickup: null, // item pego agora, sobre a cabeça do Tung: { itemId, elapsedMs } (some depois de PICKUP_MS)
    vanishing: [], // itens sumindo da sala de escolha: { roomId, pedestalId, itemId, elapsedMs } (VANISH_MS)
    effects: createItemEffects(floorHealsUsed), // tempos e contagens dos efeitos dos itens (itemEffects.js)
    swing: createSwing(), // o golpe atual (o enterRoom zera de novo a cada sala)
    attackHeld: false, // a seta de ataque estava segurada no quadro anterior
    grains,
    forks,
    notice: null, // aviso curto em cima do Tung: { text, elapsedMs } (veja showNotice)
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
    clearedRoomIds: getClearedRoomIds(run.floor),
    roomStates: getRoomStates(run.floor),
    health: run.health,
    forks: run.forks,
    grains: run.grains,
    deathCause: run.death?.cause ?? null,
    items: run.items,
    floorHealsUsed: run.effects.floorHealsUsed,
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
// A parede secreta só conta golpe com a marca visível (de perto, ou já trincada) e com a sala limpa.
// O tambor ainda caindo do céu (drumFalling) não conta golpe.
function hitsTarget(room, obstacles, hitbox, player, drumFalling) {
  if (room.hits >= HITS_TO_OPEN) return false
  const drum = obstacles.find((obstacle) => obstacle.mechanic === 'tambor')
  if (drum && isDrumVisible(room)) return !drumFalling && overlaps(hitbox, drum.box)
  // Com inimigo vivo a parede secreta não trinca: abrir a adega seria fugir da luta
  if (!room.secret || !room.cleared) return false
  const markVisible = room.hits >= 1 || isNearDoor(player, room.secret.side)
  return markVisible && overlaps(hitbox, DOOR_HIT_ZONES[room.secret.side])
}

// Um quadro normal dentro da sala
function updateRoom(run, input, deltaSeconds) {
  const room = getCurrentRoom(run)
  const stats = getRunStats(run)

  // Piso: escorregadio (inércia), grudento (mais lento) e esteira (empurra). O gelo do Pinguino também escorrega.
  // Personagem que voa (stats.flying) não sente o piso.
  const effect = getFloorEffect(stats.flying ? [] : [...run.obstacles, ...run.enemyFloor], run.player)
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

  // Chapa quente (encostar) e cacos de vidro (pisar): meio coração por machucado. Encostar num inimigo vivo: o dano
  // dele (catálogo), e a causa da morte é o id dele. Tudo passa por damagePlayer; enquanto ele está invencível,
  // nada tira vida. Sem vida, ele morre (e a animação de dano nem toca).
  let { health, death, effects } = run
  let hazard = null
  let hazardDamage = DAMAGE_LIGHT
  const touchedEnemy = findTouchingEnemy(run.targets, player)
  // Voando, a chapa e os cacos não o machucam
  if (!stats.flying && touchesHot(run.obstacles, player)) hazard = HOT_PLATE_CAUSE
  else if (!stats.flying && isOnShards(run.obstacles, player)) hazard = SHARDS_CAUSE
  else if (touchedEnemy) {
    hazard = touchedEnemy.enemyId
    hazardDamage = touchedEnemy.damage
  }
  if (hazard) {
    const hit = damagePlayer(run, player, health, effects, hazardDamage, hazard, stats)
    player = hit.player
    health = hit.health
    effects = hit.effects
    if (hit.death) death = hit.death
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

  // Golpe novo: não havia golpe, ou o tempo dele voltou a ser menor (outro golpe começou).
  // O golpe anterior acabou se não há mais golpe, ou se outro começou no mesmo quadro.
  const previous = run.player.attack
  const newSwing = player.attack && (!previous || player.attack.elapsed < previous.elapsed)
  const swingEnded = Boolean(previous) && (!player.attack || newSwing)
  let swingCounted = newSwing ? false : run.swingCounted

  let obstacles = run.obstacles
  const hitbox = getAttackHitbox(player)
  if (hitbox) {
    obstacles = hitObstacles(obstacles, hitbox, player.attack.direction)
    // A caixa do golpe fica vários quadros em cima do alvo, mas cada golpe conta uma vez só
    if (!swingCounted && hitsTarget(room, obstacles, hitbox, player, Boolean(run.drumDrop))) {
      room.hits += 1
      swingCounted = true
    }
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

  // Alvos e efeitos dos itens (itemEffects.js), nesta ordem: os tempos andam (os dos alvos também: lento, preso,
  // empurrão e a volta do alvo de treino), o golpe que acabou, o que começou, os acertos dele, as lascas,
  // as poças e, no fim, os abates do quadro (de qualquer dano: golpe, lascas, onda, raio ou parede).
  const stepMs = deltaSeconds * 1000
  // Os alvos também batem nas portas (as zonas delas avançam sobre o piso): empurrado, ninguém para dentro do vão
  const targetSolids = [...solids, ...Object.values(DOOR_HIT_ZONES)]
  // Os inimigos agem (enemyBehaviors.js) e deixam no "mundo" o que fizeram: dano fora do contato, efeitos e rastros
  const world = { player: { x: player.x, y: player.y }, solids: targetSolids, deltaSeconds, hits: [], flashes: [], floor: [] }
  world.floorObstacles = [...obstacles, ...run.enemyFloor] // o piso vale para os inimigos também
  const targets = updateEnemies(updateTargets(run.targets, deltaSeconds, targetSolids), world)
  for (const hit of world.hits) {
    const result = damagePlayer(run, player, health, effects, hit.damage, hit.cause, stats)
    player = result.player
    health = result.health
    effects = result.effects
    if (result.death) death = result.death
  }
  let next = {
    ...run,
    player,
    obstacles,
    slip,
    swingCounted,
    health,
    death,
    finMs,
    drumDrop,
    effects: updateEffectTimers(effects, stepMs),
    targets,
    flashes: [...updateFlashes(run.flashes, stepMs, targets), ...world.flashes], // o efeito em cima de um alvo vai junto com ele
    enemyFloor: [...updateEnemyFloor(run.enemyFloor, stepMs), ...world.floor], // o gelo do Pinguino no chão
    // A seta está segurada agora? (a Batuta só conta o golpe de uma seta apertada de novo, e não segurada)
    attackHeld: input.attackDirection !== null,
  }
  next = addBumpFlashes(next)
  if (swingEnded) next = endSwing(next)
  if (newSwing) next = startSwing(next, !run.attackHeld, stats)
  if (hitbox) next = hitWithSwing(next, hitbox, stats)
  next = updateShards(next, deltaSeconds, solids)
  next = updatePuddles(next, stepMs)
  const killed = findNewKills(run.targets, next.targets)
  next = dropLuckyGrains(next, room, killed)
  next = onKills({ ...next, roomKills: run.roomKills + killed.length }, killed.length)

  // O último inimigo morreu: a sala fica limpa (as portas abrem) e pode soltar a recompensa
  if (!room.cleared && areEnemiesDefeated(next.targets)) {
    room.cleared = true
    next = giveRoomReward(next)
  }

  if (death) return next // morto não atravessa porta nem passa de andar
  if (sleep) return { ...next, sleep } // começou a dormir: neste quadro ele não atravessa porta

  // Coisas no chão (drops.js): a animação de aparecer anda e encostar pega. Grão e garfo vão para os contadores;
  // o coração cura (com a vida cheia, ele fica no chão).
  room.drops = advanceDrops(room.drops, stepMs)
  const counters = { grains: next.grains, forks: next.forks, health: next.health, maxHealth: stats.maxHealth }
  const picked = collectDrops(room.drops, player, counters)
  room.drops = picked.drops
  const justPicked = picked.collected.map((drop) => ({ kind: drop.kind, amount: drop.amount, x: drop.x, y: drop.y, elapsedMs: 0 }))
  next = { ...next, grains: picked.grains, forks: picked.forks, health: picked.health, collecting: [...next.collecting, ...justPicked] }

  // Pedestal: encostar pega o item ou compra (veja takeFromPedestal). O aviso de que não dá sai só no começo do toque.
  const touched = findTouchedPedestal(pedestals, player)
  const firstTouch = Boolean(touched) && run.touchingPedestal !== touched.id
  next.touchingPedestal = touched ? touched.id : null
  if (touched) next = takeFromPedestal(next, room, pedestals, touched, firstTouch, stats.maxHealth)

  // Fliperama: o tambor (jogada e prêmio)
  if (room.type === 'fliperama') next = updateArcade(next, room, player, stepMs)

  // Porta trancada: empurrar pagando (1 garfo no nó de espaguete, ou ARCADE_DOOR_PRICE grãos no Fliperama) abre a sala
  // para o resto da run (target.unlocked). Enquanto a animação toca, a porta ainda não deixa passar; sem garfo ou
  // grão, ela só fica trancada.
  if (next.unlocking) {
    const elapsedMs = next.unlocking.elapsedMs + deltaSeconds * 1000
    next.unlocking = elapsedMs >= FORK_UNLOCK_MS ? null : { ...next.unlocking, elapsedMs }
  }
  const roomDoors = getRoomDoors(run.floor, room)
  // Com inimigo vivo, nenhuma porta abre (nem gastando garfo ou grão)
  const lockedSide = next.unlocking || !room.cleared ? null : getExitSide(player, input.movement, roomDoors, 'locked')
  if (lockedSide) {
    const door = roomDoors.find((one) => one.side === lockedSide)
    const paysWithGrain = door.lock === 'grao'
    if (paysWithGrain ? next.grains >= ARCADE_DOOR_PRICE : next.forks > 0) {
      findRoom(run.floor, door.targetId).unlocked = true
      if (paysWithGrain) next.grains -= ARCADE_DOOR_PRICE
      else next.forks -= 1
      next.unlocking = { side: lockedSide, elapsedMs: 0, lock: door.lock } // lock: o desenho sabe se é garfo ou grão
    }
  }

  const doors = applyUnlocking(roomDoors, next.unlocking)
  // A porta vale só com a tecla apertada para ela: o deslize sozinho nunca troca de sala
  const side = getExitSide(player, input.movement, doors)
  if (side) {
    const toRoomId = doors.find((door) => door.side === side).targetId
    // A sala nova sem inimigos já fica limpa: assim as portas dela aparecem abertas enquanto ela desliza para
    // dentro. Com inimigos, elas aparecem fechadas (o enterRoom cria os inimigos no fim da transição).
    const target = findRoom(run.floor, toRoomId)
    target.visited = true
    if (pickRoomEnemies(run.seed, run.floor.number, target, run.enemyCatalog).length === 0) target.cleared = true
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
    prepareCellarDrops(floor)
    next = enterRoom(next, floor, findRoom(floor, floor.startRoomId), { ...ROOM_PLAYER_START })
    next.banner = createBanner(floor)
    // Andar novo: as curas do Caldo da Mamãe ("por andar") voltam
    next.effects = { ...next.effects, floorHealsUsed: 0 }
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
  const current = {
    ...run,
    banner: advanceBanner(run.banner, stepMs),
    pickup: advancePickup(run.pickup, stepMs),
    vanishing: advanceVanishing(run.vanishing, stepMs),
    notice: advanceNotice(run.notice, stepMs),
    collecting: advanceCollecting(run.collecting, stepMs),
  }
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
  // Com o alvo na sala, o escudo do Caldo arma, como ao entrar numa sala com inimigos
  return armRoomShield({ ...run, targets: [...run.targets, target] })
}

// Recompensa da sala limpa na sala atual (drops.js).
// Quem chama: a morte do último inimigo da sala e a tecla G (depuração).
// room.rewards conta as recompensas já dadas: a 1ª é a de verdade; a tecla G sorteia outra a cada vez.
export function giveRoomReward(run) {
  const room = getCurrentRoom(run)
  const reward = rollRoomReward(run.seed, run.floor.number, room, room.rewards)
  room.rewards += 1
  room.drops = [...room.drops, ...reward.drops]
  return { ...run } // "nada" não tem aviso: a sala simplesmente não solta nada
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
