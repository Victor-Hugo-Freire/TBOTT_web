import { DOOR_HIT_ZONES, getRoomDoors } from '../../../utils/doors.js'
import { FLOOR_COLS, FLOOR_ROWS, getRoomId } from '../../../utils/floorGenerator.js'
import { getPedestalSolids, getRoomPedestals } from '../../../utils/pedestals.js'
import { getAttackHitbox } from '../../../utils/player.js'
import { getCellRect, getLayoutPoints } from '../../../utils/roomLayout.js'
import { getRoomSolids } from '../../../utils/roomObstacles.js'
import { PLAYER_FEET_BOX } from '../../../utils/roomMovement.js'
import { getCurrentRoom, getRunStats } from '../../../utils/run.js'
import { DAMAGE_TEXT_MS, getTargetBox } from '../../../utils/targets.js'

// Camada de depuração (F3), só no `npm run dev`: mostra o que a colisão, as portas e o golpe enxergam,
// o alvo de treino (tecla T) e um painel com a seed, os atributos, os itens e o mapa do andar.
// Serve para testar e calibrar; não faz parte do jogo.
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
  god: 'G',
}

const LEGEND = ['I inicial  . comum  C chefe', 'T tesouro  L loja  P palco', 'F fliperama  D descanso', 'A adega  X pacto  G god', 'amarelo = atual  branco = visitada']

// Em unidades da sala (o ctx já vem com a escala)
export function drawDebug(ctx, run) {
  const room = getCurrentRoom(run)
  const { player } = run
  ctx.save()
  ctx.lineWidth = 2

  for (const solid of getRoomSolids(run.obstacles, getPedestalSolids(getRoomPedestals(run, room)))) {
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

  for (const target of run.targets) {
    if (target.training) drawTrainingTarget(ctx, target)
  }
  ctx.restore()
}

// Alvo de treino, desenhado por código e com cara de ferramenta de teste: um poste listrado de amarelo e preto
// com uma mira em cima. Mostra a vida, o dano de cada acerto (subindo) e se está lento, preso ou sendo empurrado.
// Morto, fica apagado até voltar.
function drawTrainingTarget(ctx, target) {
  const box = getTargetBox(target)
  ctx.save()
  ctx.globalAlpha = target.dead ? 0.35 : 1

  // Poste: listras de 12 u
  const postTop = box.y + 44
  ctx.fillStyle = '#f2c618'
  ctx.fillRect(box.x + 12, postTop, box.width - 24, box.y + box.height - postTop)
  ctx.fillStyle = '#111'
  for (let y = postTop; y < box.y + box.height; y += 24) {
    ctx.fillRect(box.x + 12, y, box.width - 24, Math.min(12, box.y + box.height - y))
  }

  // Mira: círculos vermelho, branco e vermelho
  const rings = [
    [24, '#d42020'],
    [16, '#ffffff'],
    [8, '#d42020'],
  ]
  for (const [radius, color] of rings) {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(target.x, box.y + 24, radius, 0, Math.PI * 2)
    ctx.fill()
  }

  // Nome e barra de vida em cima
  ctx.font = 'bold 18px monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'bottom'
  ctx.fillStyle = '#f2c618'
  ctx.fillText(target.dead ? 'ALVO (abatido)' : 'ALVO', target.x, box.y - 22)
  const barWidth = 80
  ctx.fillStyle = '#400'
  ctx.fillRect(target.x - barWidth / 2, box.y - 18, barWidth, 12)
  ctx.fillStyle = '#3c3'
  ctx.fillRect(target.x - barWidth / 2, box.y - 18, (barWidth * target.health) / target.maxHealth, 12)
  ctx.font = 'bold 12px monospace'
  ctx.fillStyle = 'white'
  ctx.fillText(`${target.health}/${target.maxHealth}`, target.x, box.y - 6)

  // Efeitos ativos embaixo da base
  const states = []
  if (target.slowMs > 0) states.push('LENTO')
  if (target.stunMs > 0) states.push('PRESO')
  if (target.push) states.push('EMPURRADO')
  ctx.font = 'bold 16px monospace'
  ctx.textBaseline = 'top'
  ctx.fillStyle = '#7fd7ff'
  ctx.fillText(states.join(' '), target.x, target.y + 6)
  ctx.restore()

  // Números de dano: sobem 50 u e somem em DAMAGE_TEXT_MS
  ctx.save()
  ctx.font = 'bold 30px monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'bottom'
  ctx.lineWidth = 5
  ctx.strokeStyle = 'black'
  for (const text of target.damageTexts) {
    const progress = text.ageMs / DAMAGE_TEXT_MS
    ctx.globalAlpha = 1 - progress
    const y = box.y - 40 - progress * 50
    ctx.strokeText(`-${text.amount}`, target.x + 30, y)
    ctx.fillStyle = 'white'
    ctx.fillText(`-${text.amount}`, target.x + 30, y)
  }
  ctx.restore()
}

// Painel em pixels da tela (o ctx deve estar sem escala), no canto direito:
// seed, andar, sala atual, tentativas da geração, atributos, abates, itens e o mapa 9 x 8 com uma letra por sala.
export function drawDebugPanel(ctx, run, { right, top, fontSize }) {
  const room = getCurrentRoom(run)
  const { floor } = run
  const stats = getRunStats(run)
  const lines = [
    `seed ${run.seed}`,
    `andar ${floor.number} ${floor.name}`,
    `sala ${room.id} ${room.type} (${room.layoutId})`,
    `tentativas ${floor.attempts}`,
    `dano ${stats.damage}  velocidade ${stats.moveSpeed.toFixed(2)}  golpe ${stats.attackSpeed.toFixed(2)}`,
    `vida ${run.health}/${stats.maxHealth}  invencível ${stats.invincibilityMs} ms`,
    `abates na sala ${run.roomKills}`,
    // Contagens dos efeitos dos itens (itemEffects.js)
    `golpes ${run.effects.swingCount}  ritmo ${run.effects.rhythmCombo}  acertos seguidos ${run.effects.hitStreak}`,
    `frenesi ${run.effects.frenzyStacks}  escudo ${run.effects.shieldHits}  curas no andar ${run.effects.floorHealsUsed}`,
    `itens ${run.items.length}`,
  ]
  // Os itens, três por linha (a lista inteira numa linha só deixaria o painel largo demais)
  for (let i = 0; i < run.items.length; i += 3) lines.push(`  ${run.items.slice(i, i + 3).join(', ')}`)
  lines.push('T alvo de treino   I próximo item   G recompensa da sala')

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
