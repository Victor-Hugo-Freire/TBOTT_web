import { getVisibleItems } from '../../../utils/appearance.js'
import { applyUnlocking, getRoomDoors, SIDE_VECTORS } from '../../../utils/doors.js'
import { getRoomPedestals } from '../../../utils/pedestals.js'
import { PUDDLE_FALL_CAUSE, TRALALERO_CAUSE } from '../../../utils/roomInteractions.js'
import { ROOM_SIZE } from '../../../utils/roomMovement.js'
import {
  FLOOR_TRANSITION_MS,
  getCurrentRoom,
  getDrumFall,
  getRoomObstacles,
  getRoomTheme,
  isDrumVisible,
  isSecretMarkVisible,
} from '../../../utils/run.js'
import { drawDoors, drawSecretMark } from './drawDoors.js'
import { drawCollecting, drawDrops, drawNotice } from './drawDrops.js'
import { drawDrum, drawDrumDust, drawDrumText } from './drawDrum.js'
import { drawBreakingObstacles, drawFloorObstacles, drawObstacle } from './drawObstacles.js'
import { drawFlashes, drawPlayerAuras, drawPuddles, drawShards } from './drawItemEffects.js'
import { drawHeldItem, drawPedestal } from './drawPedestals.js'
import { drawPlayer } from './drawPlayer.js'
import { drawRoom } from './drawRoom.js'
import { drawPuddleFall, drawSharkGrab } from './drawShark.js'
import { drawGodStatue, drawRoomScenery, GOD_STATUE_FEET_Y } from './drawSpecialRooms.js'
import { ROOM_VIEW_BOTTOM_EXTRA } from './view.js'
import { ROOM_THEMES } from './themes.js'

// Desenha a run em unidades da sala (o ctx já vem com a escala da tela): a sala atual ou,
// na troca de sala, a sala de origem e a nova deslizando juntas.
// screen = a área da tela em unidades da sala: { left, top, width, height } (left e top ficam <= 0 quando sobra tela).
export function drawRunScene(ctx, run, sheets, reduceMotion, screen) {
  // timeMs: um só relógio para as duas salas da transição (as setas da esteira andam com ele)
  // unlocking: a porta trancada que está abrindo agora (só existe na sala atual)
  // death: a morte (a do Tralalero tem o seu próprio desenho); finMs: o relógio da barbatana, o mesmo da lógica
  const options = {
    sheets,
    reduceMotion,
    extraX: -screen.left,
    timeMs: performance.now(),
    unlocking: run.unlocking,
    death: run.death,
    finMs: run.finMs,
    drumDrop: run.drumDrop, // o tambor caindo do céu na sala do chefe (veja getDrumFall)
    pickup: run.pickup, // o item pego agora, sobre a cabeça do Tung
    vanishing: run.vanishing, // itens sumindo da sala de escolha (cada um diz de que sala é)
    // Efeitos dos itens na sala atual (itemEffects.js): poças, efeitos que tocam uma vez e o que acompanha o Tung
    puddles: run.puddles,
    shards: run.shards, // lascas do Parmesão voando
    collecting: run.collecting, // grão, garfo e coração que acabaram de ser pegos (animação "coleta")
    notice: run.notice, // aviso curto em cima do Tung ("Faltam grãos"...)
    arcadeSpin: run.arcadeSpin, // o tambor do Fliperama girando numa jogada
    flashes: run.flashes,
    effects: run.effects,
    visibleItems: getVisibleItems(run.items, run.catalog), // itens que aparecem no Tung (1 por slot)
  }
  const { transition } = run
  if (transition?.type !== 'room') {
    const room = getCurrentRoom(run)
    const pedestals = getRoomPedestals(run, room)
    drawRoomScene(ctx, run.floor, room, run.obstacles, pedestals, run.player, isSecretMarkVisible(run), options)
    return
  }

  // Durante a troca de sala, run.roomId ainda é a sala de origem
  const fromRoom = getCurrentRoom(run)
  const toRoom = run.floor.rooms.find((room) => room.id === transition.toRoomId)
  const fromPedestals = getRoomPedestals(run, fromRoom)
  const toPedestals = getRoomPedestals(run, toRoom)
  const drawFrom = () =>
    drawRoomScene(ctx, run.floor, fromRoom, transition.fromObstacles, fromPedestals, transition.fromPlayer, isSecretMarkVisible(run), options)
  // A sala nova entra vazia: o jogador aparece nela quando a transição termina
  const drawTo = () =>
    drawRoomScene(ctx, run.floor, toRoom, getRoomObstacles(run.floor, toRoom), toPedestals, null, false, {
      ...options,
      unlocking: null,
      pickup: null,
      puddles: [],
      shards: [],
      flashes: [],
      collecting: [],
      notice: null,
    })
  const progress = transition.elapsedMs / transition.durationMs

  // Reduzir movimento: em vez de deslizar, escurece até a metade e clareia já na sala nova
  if (reduceMotion) {
    if (progress < 0.5) drawFrom()
    else drawTo()
    fillScreen(ctx, screen, progress < 0.5 ? progress * 2 : (1 - progress) * 2)
    return
  }

  // A câmera anda na direção da porta: a sala de origem sai pelo lado oposto e a nova entra pela porta.
  // Andar uma tela inteira (pelo menos uma sala, com a faixa de rodapé dela) faz as duas salas nunca se cobrirem.
  const vector = SIDE_VECTORS[transition.side]
  const distanceX = screen.width
  const distanceY = Math.max(ROOM_SIZE.height + ROOM_VIEW_BOTTOM_EXTRA, screen.height)
  const eased = smoothStep(progress)
  drawShifted(ctx, vector.x * -eased * distanceX, vector.y * -eased * distanceY, drawFrom)
  drawShifted(ctx, vector.x * (1 - eased) * distanceX, vector.y * (1 - eased) * distanceY, drawTo)
}

// Na morte a sala só escurece em parte: o personagem caído continua aparecendo atrás do aviso
const DEATH_DIM = 0.6

// Escurecimento da troca de andar: 0 (nada) a 1 (preto). Escurece até 450 ms e clareia até 900 ms.
// Depois do fim da run a tela fica escura, atrás do aviso.
export function getFloorFade(run) {
  if (run.finished) return run.death ? DEATH_DIM : 1
  if (run.transition?.type !== 'floor') return 0
  const half = FLOOR_TRANSITION_MS / 2
  const { elapsedMs } = run.transition
  return elapsedMs < half ? elapsedMs / half : Math.max(0, 1 - (elapsedMs - half) / half)
}

// Uma sala, de baixo para cima: sala, piso, cenário, portas, marca da adega,
// depois obstáculos, tambor, pedestais e jogador na ordem dos pés (quem está mais embaixo fica na frente).
// pedestals = getRoomPedestals da sala; player = null desenha a sala sem o jogador.
function drawRoomScene(ctx, floor, room, obstacles, pedestals, player, showSecretMark, options) {
  const { sheets, reduceMotion, extraX, timeMs, unlocking, death, finMs, drumDrop, pickup, vanishing } = options
  const { puddles, shards, flashes, effects, visibleItems } = options // efeitos e aparência dos itens
  const { collecting, notice, arcadeSpin } = options // grãos, garfos e corações; aviso; tambor do Fliperama
  // Morte na poça do Tralalero: puxado por ele ou caído sozinho. Nas duas, a barbatana da volta some
  // (a animação desenha a dela).
  const pulledByShark = death?.cause === TRALALERO_CAUSE
  const fellInPuddle = death?.cause === PUDDLE_FALL_CAUSE
  const theme = getRoomTheme(floor, room)
  drawRoom(ctx, extraX, theme)
  drawFloorObstacles(ctx, obstacles, timeMs, reduceMotion)
  drawPuddles(ctx, puddles) // poças de molho da Concha, no chão
  const arcadeSpinMs = arcadeSpin?.roomId === room.id ? arcadeSpin.elapsedMs : null
  drawRoomScenery(ctx, room.type, { finMs, hideFin: pulledByShark || fellInPuddle, arcadeSpinMs })
  drawDrops(ctx, room.drops, timeMs, reduceMotion) // grãos, garfos e corações no chão (embaixo de quem anda)

  const doors = applyUnlocking(getRoomDoors(floor, room), unlocking)
  drawDoors(ctx, doors, ROOM_THEMES[theme])
  const secretDoor = room.secret ? doors.find((door) => door.side === room.secret.side) : null
  if (showSecretMark && secretDoor?.state === 'hidden') drawSecretMark(ctx, secretDoor.side)

  // O tambor só aparece depois de cair do céu (na sala do chefe que ainda vai entrar deslizando, ele ainda não caiu).
  // Com "reduzir movimento", ele já aparece no chão, sem a queda e sem a poeira.
  const drum = isDrumVisible(room) && room.drumDropped ? obstacles.find((obstacle) => obstacle.mechanic === 'tambor') : null
  const drumFall = reduceMotion ? getDrumFall(null) : getDrumFall(drumDrop)
  const sprites = []
  for (const obstacle of obstacles) {
    if (obstacle.blocking && !obstacle.removed) {
      sprites.push({ feetY: getFeetY(obstacle.box), draw: () => drawObstacle(ctx, obstacle, timeMs, reduceMotion) })
    }
  }
  if (drum) sprites.push({ feetY: getFeetY(drum.box), draw: () => drawDrum(ctx, drum.box, drumFall.height) })
  // A estátua do Tung Tung God também entra na ordem dos pés: o jogador passa por trás dela
  if (room.type === 'god') sprites.push({ feetY: GOD_STATUE_FEET_Y, draw: () => drawGodStatue(ctx) })
  for (const pedestal of pedestals) {
    // O item que está sumindo deste pedestal (o que não foi escolhido), se houver
    const leaving = vanishing.find((item) => item.roomId === room.id && item.pedestalId === pedestal.id) ?? null
    sprites.push({ feetY: pedestal.y, draw: () => drawPedestal(ctx, pedestal, { timeMs, reduceMotion, leaving }) })
  }
  if (player) {
    const drawTung = () => {
      // Na poça, no lugar do personagem caído: a animação dele sendo puxado ou afundando sozinho
      if (pulledByShark) drawSharkGrab(ctx, sheets, player, death.fin, reduceMotion)
      else if (fellInPuddle) drawPuddleFall(ctx, sheets, player, death.fin, reduceMotion)
      else {
        // Efeitos dos itens que acompanham o Tung, na frente dele: a bolha do escudo, o vapor e o cacau
        drawPlayer(ctx, sheets, player, reduceMotion, visibleItems)
        if (effects && !player.dead) drawPlayerAuras(ctx, player, effects, timeMs)
      }
      // Item que ele acabou de pegar, sobre a cabeça (não aparece na morte)
      if (pickup && !player.dead) drawHeldItem(ctx, player, pickup)
    }
    sprites.push({ feetY: player.y, draw: drawTung })
  }
  sprites.sort((a, b) => a.feetY - b.feetY).forEach((sprite) => sprite.draw())

  // Cacos do garrafão voando, poeira da batida do tambor no chão e o "TUNG" acima dele:
  // desenhados por último, o jogador não os cobre
  drawBreakingObstacles(ctx, obstacles, reduceMotion)
  if (drum) drawDrumDust(ctx, drum.box, drumFall.landedMs)
  if (drum && drumFall.height === 0) drawDrumText(ctx, drum.box, room.hits)
  // Lascas do Parmesão voando e efeitos dos itens que tocam uma vez (estalo, notas, mordida, faísca...), por cima de tudo
  drawShards(ctx, shards)
  drawFlashes(ctx, flashes)
  drawCollecting(ctx, collecting)
  if (player && notice && !player.dead) drawNotice(ctx, player, notice)
}

// Os pés de um obstáculo ficam no meio da borda de baixo da caixa
function getFeetY(box) {
  return box.y + box.height
}

function drawShifted(ctx, x, y, draw) {
  ctx.save()
  ctx.translate(x, y)
  draw()
  ctx.restore()
}

function fillScreen(ctx, screen, alpha) {
  ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`
  ctx.fillRect(screen.left, screen.top, screen.width, screen.height)
}

// Começa e termina devagar (0 -> 0, 1 -> 1)
function smoothStep(value) {
  const clamped = Math.min(1, Math.max(0, value))
  return clamped * clamped * (3 - 2 * clamped)
}
