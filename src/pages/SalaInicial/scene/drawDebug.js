import { DOOR_HIT_ZONES, getRoomDoors } from '../../../utils/doors.js'
import { FLOOR_COLS, FLOOR_ROWS, getRoomId } from '../../../utils/floorGenerator.js'
import { getAttackHitbox } from '../../../utils/player.js'
import { getCellRect, getLayoutPoints } from '../../../utils/roomLayout.js'
import { getRoomSolids } from '../../../utils/roomObstacles.js'
import { PLAYER_FEET_BOX } from '../../../utils/roomMovement.js'
import { getCurrentRoom } from '../../../utils/run.js'

// Camada de depuração (F3), só no `npm run dev`: mostra o que a colisão, as portas e o golpe enxergam,
// e um painel com a seed e o mapa do andar. Serve para testar e calibrar; não faz parte do jogo.
// Cores na sala: vermelho = sólidos (paredes e obstáculos que bloqueiam), verde = vão de porta aberta,
// laranja = porta fechada ou parede da adega, magenta = onde o golpe acerta a parede da adega,
// ciano = caixa dos pés, amarelo = golpe acertando, branco = ponto dos pés.

// Vão de cada porta (122 u), da borda da sala até o piso
const DOOR_GAPS = {
  up: { x: 739, y: 127, width: 122, height: 138 },
  down: { x: 739, y: 786, width: 122, height: 67 },
  left: { x: 23, y: 464.5, width: 95, height: 122 },
  right: { x: 1482, y: 464.5, width: 95, height: 122 },
}

// Uma letra por tipo de sala no mapa do painel
const ROOM_LETTERS = {
  inicial: 'I',
  comum: '.',
  chefe: 'C',
  tesouro: 'T',
  loja: 'L',
  palco: 'P',
  fliperama: 'F',
  descanso: 'D',
  adega: 'A',
  pacto: 'X',
  mamae: 'M',
}

const LEGEND = ['I inicial  . comum  C chefe', 'T tesouro  L loja  P palco', 'F fliperama  D descanso', 'A adega  X pacto  M mamae', 'amarelo = atual  branco = visitada']

// Em unidades da sala (o ctx já vem com a escala)
export function drawDebug(ctx, run) {
  const room = getCurrentRoom(run)
  const { player } = run
  ctx.save()
  ctx.lineWidth = 2

  for (const solid of getRoomSolids(run.obstacles)) {
    strokeBox(ctx, solid, 'rgba(255, 60, 60, 0.25)', 'rgba(255, 60, 60, 0.9)')
  }

  for (const door of getRoomDoors(run.floor, room)) {
    const color = door.state === 'open' ? '60, 220, 90' : '255, 150, 40'
    strokeBox(ctx, DOOR_GAPS[door.side], `rgba(${color}, 0.25)`, `rgb(${color})`)
  }
  if (room.secret) strokeBox(ctx, DOOR_HIT_ZONES[room.secret.side], 'rgba(255, 0, 255, 0.15)', 'magenta')

  // Pontos do layout: i = inimigo, t = item (ainda não aparece nada neles)
  const { enemies, items } = getLayoutPoints(room.layoutId)
  ctx.font = 'bold 28px monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  for (const [points, letter, color] of [[enemies, 'i', '#ff6060'], [items, 't', '#60ff90']]) {
    ctx.fillStyle = color
    for (const { col, row } of points) {
      const cell = getCellRect(col, row)
      ctx.fillText(letter, cell.x + cell.width / 2, cell.y + cell.height / 2)
    }
  }

  const { width, height } = PLAYER_FEET_BOX
  ctx.strokeStyle = 'cyan'
  ctx.strokeRect(player.x - width / 2, player.y - height, width, height)

  const hitbox = getAttackHitbox(player)
  if (hitbox) strokeBox(ctx, hitbox, 'rgba(255, 230, 0, 0.3)', 'yellow')

  ctx.fillStyle = 'white'
  ctx.fillRect(player.x - 2, player.y - 2, 4, 4)
  ctx.restore()
}

// Painel em pixels da tela (o ctx deve estar sem escala), no canto direito:
// seed, andar, sala atual, tentativas da geração e o mapa 9 x 8 com uma letra por sala.
export function drawDebugPanel(ctx, run, { right, top, fontSize }) {
  const room = getCurrentRoom(run)
  const { floor } = run
  const lines = [
    `seed ${run.seed}`,
    `andar ${floor.number} ${floor.name}`,
    `sala ${room.id} ${room.type} (${room.layoutId})`,
    `tentativas ${floor.attempts}`,
  ]

  ctx.save()
  ctx.font = `${fontSize}px monospace`
  ctx.textBaseline = 'top'
  const lineHeight = Math.round(fontSize * 1.3)
  const cell = Math.round(fontSize * 1.4) // casa do mapa
  const padding = Math.round(fontSize * 0.6)
  const textWidth = Math.max(...[...lines, ...LEGEND].map((line) => ctx.measureText(line).width))
  const width = Math.max(textWidth, FLOOR_COLS * cell) + padding * 2
  const height = padding * 2 + (lines.length + LEGEND.length) * lineHeight + FLOOR_ROWS * cell + lineHeight
  const left = right - width

  ctx.fillStyle = 'rgba(0, 0, 0, 0.78)'
  ctx.fillRect(left, top, width, height)

  ctx.fillStyle = 'white'
  let y = top + padding
  for (const line of lines) {
    ctx.fillText(line, left + padding, y)
    y += lineHeight
  }

  y += lineHeight / 2
  drawFloorMap(ctx, floor, room, left + padding, y, cell)
  y += FLOOR_ROWS * cell + lineHeight / 2

  ctx.fillStyle = '#bbb'
  for (const line of LEGEND) {
    ctx.fillText(line, left + padding, y)
    y += lineHeight
  }
  ctx.restore()
}

// Mapa do andar: casa vazia apagada, sala visitada em branco, não visitada em cinza e a atual em amarelo.
// Mostra também a adega, que no jogo fica escondida.
function drawFloorMap(ctx, floor, current, left, top, cell) {
  ctx.textAlign = 'center'
  for (let row = 0; row < FLOOR_ROWS; row++) {
    for (let col = 0; col < FLOOR_COLS; col++) {
      const x = left + col * cell
      const y = top + row * cell
      const room = floor.rooms.find((item) => item.id === getRoomId(col, row))
      ctx.fillStyle = room === current ? '#e8c020' : 'rgba(255, 255, 255, 0.08)'
      ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2)
      if (!room) continue
      ctx.fillStyle = room === current ? 'black' : room.visited ? 'white' : '#777'
      ctx.fillText(ROOM_LETTERS[room.type], x + cell / 2, y + cell * 0.18)
    }
  }
  ctx.textAlign = 'left'
}

function strokeBox(ctx, box, fill, stroke) {
  ctx.fillStyle = fill
  ctx.strokeStyle = stroke
  ctx.fillRect(box.x, box.y, box.width, box.height)
  ctx.strokeRect(box.x, box.y, box.width, box.height)
}
