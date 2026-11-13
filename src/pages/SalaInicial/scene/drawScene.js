import { applyUnlocking, getRoomDoors, SIDE_VECTORS } from '../../../utils/doors.js'
import { ROOM_SIZE } from '../../../utils/roomMovement.js'
import {
  FLOOR_TRANSITION_MS,
  getCurrentRoom,
  getRoomObstacles,
  getRoomTheme,
  isDrumVisible,
  isSecretMarkVisible,
} from '../../../utils/run.js'
import { drawDoors, drawSecretMark } from './drawDoors.js'
import { drawDrum, drawDrumText } from './drawDrum.js'
import { drawFloorObstacles, drawObstacle } from './drawObstacles.js'
import { drawPlayer } from './drawPlayer.js'
import { drawRoom } from './drawRoom.js'
import { drawRoomScenery } from './drawSpecialRooms.js'
import { ROOM_VIEW_BOTTOM_EXTRA } from './view.js'
import { ROOM_THEMES } from './themes.js'

// Desenha a run em unidades da sala (o ctx já vem com a escala da tela): a sala atual ou,
// na troca de sala, a sala de origem e a nova deslizando juntas.
// screen = a área da tela em unidades da sala: { left, top, width, height } (left e top ficam <= 0 quando sobra tela).
export function drawRunScene(ctx, run, sheets, reduceMotion, screen) {
  // timeMs: um só relógio para as duas salas da transição (as setas da esteira andam com ele)
  // unlocking: a porta trancada que está abrindo agora (só existe na sala atual)
  const options = { sheets, reduceMotion, extraX: -screen.left, timeMs: performance.now(), unlocking: run.unlocking }
  const { transition } = run
  if (transition?.type !== 'room') {
    drawRoomScene(ctx, run.floor, getCurrentRoom(run), run.obstacles, run.player, isSecretMarkVisible(run), options)
    return
  }

  // Durante a troca de sala, run.roomId ainda é a sala de origem
  const fromRoom = getCurrentRoom(run)
  const toRoom = run.floor.rooms.find((room) => room.id === transition.toRoomId)
  const drawFrom = () =>
    drawRoomScene(ctx, run.floor, fromRoom, transition.fromObstacles, transition.fromPlayer, isSecretMarkVisible(run), options)
  // A sala nova entra vazia: o jogador aparece nela quando a transição termina
  const drawTo = () =>
    drawRoomScene(ctx, run.floor, toRoom, getRoomObstacles(run.floor, toRoom), null, false, { ...options, unlocking: null })
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
// depois obstáculos, tambor e jogador na ordem dos pés (quem está mais embaixo fica na frente).
// player = null desenha a sala sem o jogador.
function drawRoomScene(ctx, floor, room, obstacles, player, showSecretMark, { sheets, reduceMotion, extraX, timeMs, unlocking }) {
  const theme = getRoomTheme(floor, room)
  drawRoom(ctx, extraX, theme)
  drawFloorObstacles(ctx, obstacles, timeMs, reduceMotion)
  drawRoomScenery(ctx, room.type)

  const doors = applyUnlocking(getRoomDoors(floor, room), unlocking)
  drawDoors(ctx, doors, ROOM_THEMES[theme])
  const secretDoor = room.secret ? doors.find((door) => door.side === room.secret.side) : null
  if (showSecretMark && secretDoor?.state === 'hidden') drawSecretMark(ctx, secretDoor.side)

  const drum = isDrumVisible(room) ? obstacles.find((obstacle) => obstacle.mechanic === 'tambor') : null
  const sprites = []
  for (const obstacle of obstacles) {
    if (obstacle.blocking && !obstacle.removed) {
      sprites.push({ feetY: getFeetY(obstacle.box), draw: () => drawObstacle(ctx, obstacle) })
    }
  }
  if (drum) sprites.push({ feetY: getFeetY(drum.box), draw: () => drawDrum(ctx, drum.box) })
  if (player) sprites.push({ feetY: player.y, draw: () => drawPlayer(ctx, sheets, player, reduceMotion) })
  sprites.sort((a, b) => a.feetY - b.feetY).forEach((sprite) => sprite.draw())

  // O "TUNG" fica acima do tambor: desenhado de novo por último, o jogador não o cobre
  if (drum) drawDrumText(ctx, drum.box, room.hits)
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
