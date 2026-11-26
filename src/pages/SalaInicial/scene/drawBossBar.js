import { BOSS_PHASES, VULNERABLE_ANIMATIONS } from '../../../data/bossBehavior.js'
import { getBossPhase } from '../../../utils/bosses.js'
import { getEnemyPose } from '../../../utils/enemies.js'
import { forEachTextPixel, getTextWidth, removeAccents, SMALL_FONT } from '../../../utils/pixelFont.js'

// Barra de vida do chefe, embaixo da tela, adaptada da barra do protótipo das salas
// (docs/referencias/prototipo-salas-issue-18/hud.js, função bossBar): moldura preta, anel dourado, trilho escuro e
// 6 linhas de cor com luz em cima. Em cima da barra, o nome do chefe. As marcas das fases são losangos que acendem
// quando a vida passa por eles. O pedaço que ele acabou de perder fica em creme e apaga em LOST_CHUNK_MS.
// Tudo é medido em "pixels de arte" de pixelSize pixels da tela, como o HUD.

const BAR_WIDTH = 150 // largura do trilho, em pixels de arte (a barra inteira tem BAR_WIDTH + 6)
const BAR_HEIGHT = 12 // altura da barra inteira, em pixels de arte
export const LOST_CHUNK_MS = 500 // o pedaço de vida perdido apaga neste tempo
const LOW_HEALTH_SHARE = 0.2 // abaixo de 20% da vida a barra pisca
const BLINK_MS = 250 // o pisca troca de cor a cada 250 ms

// Cores das 6 linhas do preenchimento, de cima para baixo (a de cima é a luz)
const FILL_COLORS = {
  normal: ['#ee7a52', '#d4513a', '#bc3a2e', '#bc3a2e', '#962c26', '#74201e'],
  fase2: ['#f6b04a', '#e68a2c', '#cc5a1c', '#cc5a1c', '#a23e14', '#7c2c10'],
  vulneravel: ['#c4f4e6', '#92dcc6', '#62bea6', '#62bea6', '#46a08a', '#32806e'],
  pisca: ['#ffb097', '#ff7a5c', '#f0503c', '#f0503c', '#c83c30', '#9c2a24'],
}
const LOST_COLORS = ['#fff4cc', '#f4e2aa', '#e6cf90', '#e6cf90', '#c8b078', '#a89460']
// Anel em volta do trilho: luz em cima, meio e sombra embaixo
const RING_COLORS = {
  normal: ['#e8c050', '#a8782a', '#6a4a1a'],
  vazia: ['#9a9088', '#6a6058', '#463e38'], // o chefe morreu
  alerta: ['#ff8a70', '#d83c2c', '#7a1c14'], // pouca vida (piscando)
}
const FRAME_COLOR = '#140806'
const BACK_COLOR = '#1c0e0a'
const TRACK_COLOR = '#3a1a14'
const MARK_OFF = '#6a4a1a'
const MARK_ON = '#ffd860'
const NAME_COLOR = '#f4ecdc'
const VULNERABLE_COLOR = '#92dcc6'
const TEXT_OUTLINE = 'rgba(20, 12, 8, 0.9)'

// O que a barra mostra agora, ou null sem chefe na sala (ou depois que a morte dele acabou e ele apagou):
// { name, health (0 a 1), lost (até onde vai o pedaço perdido, 0 a 1), lostAlpha, marks, state, low }.
// state: 'normal', 'fase2' (passou da 1ª marca), 'vulneravel' (parado esperando o golpe) ou 'vazia' (morreu).
// O pedaço perdido soma os danos dos últimos LOST_CHUNK_MS (os números de dano do alvo, damageTexts).
export function getBossBar(targets) {
  const boss = targets.find((target) => target.boss)
  if (!boss || !getEnemyPose(boss)) return null

  let lostHealth = 0
  let newestHitMs = LOST_CHUNK_MS
  for (const text of boss.damageTexts) {
    if (text.ageMs < LOST_CHUNK_MS) {
      lostHealth += text.amount
      newestHitMs = Math.min(newestHitMs, text.ageMs)
    }
  }

  let state = 'normal'
  if (boss.dead) state = 'vazia'
  else if (VULNERABLE_ANIMATIONS.includes(boss.animation)) state = 'vulneravel'
  else if (getBossPhase(boss) > 1) state = 'fase2'

  const health = boss.health / boss.maxHealth
  return {
    name: removeAccents(boss.name).toUpperCase(),
    health,
    lost: Math.min(1, (boss.health + lostHealth) / boss.maxHealth),
    lostAlpha: 1 - newestHitMs / LOST_CHUNK_MS,
    marks: BOSS_PHASES[boss.enemyId] ?? [],
    state,
    low: !boss.dead && health < LOW_HEALTH_SHARE,
  }
}

// Retângulo com os cantos cortados (1 pixel de arte), como a moldura do protótipo
function fillRounded(ctx, x, y, width, height, u, color) {
  ctx.fillStyle = color
  ctx.fillRect(x + u, y, (width - 2) * u, height * u)
  ctx.fillRect(x, y + u, width * u, (height - 2) * u)
}

// Texto na fonte do jogo com contorno escuro (como o contador de tempo). align 'left' ou 'right' a partir de x.
function drawOutlinedText(ctx, text, x, top, size, color, align) {
  const left = align === 'right' ? x - getTextWidth(SMALL_FONT, text) * size : x
  ctx.fillStyle = TEXT_OUTLINE
  forEachTextPixel(SMALL_FONT, text, (col, row) => {
    ctx.fillRect(left + col * size - size, top + row * size - size, size * 3, size * 3)
  })
  ctx.fillStyle = color
  forEachTextPixel(SMALL_FONT, text, (col, row) => {
    ctx.fillRect(left + col * size, top + row * size, size, size)
  })
}

// Desenha a barra (bar = getBossBar) com o meio em centerX e a base em bottom, em pixels da tela (o ctx deve estar
// sem escala, como no HUD). pixelSize = lado de um pixel de arte. timeMs = relógio do pisca; com "reduzir
// movimento", a barra com pouca vida fica na cor do pisca, sem piscar.
export function drawBossBar(ctx, bar, { centerX, bottom, pixelSize, timeMs, reduceMotion }) {
  const u = pixelSize
  const width = BAR_WIDTH + 6
  const x = Math.round(centerX - (width * u) / 2)
  const y = bottom - BAR_HEIGHT * u
  const blinking = bar.low && (reduceMotion || Math.floor(timeMs / BLINK_MS) % 2 === 0)

  let ring = RING_COLORS.normal
  if (bar.state === 'vazia') ring = RING_COLORS.vazia
  else if (blinking) ring = RING_COLORS.alerta
  let fill = FILL_COLORS.normal
  if (blinking) fill = FILL_COLORS.pisca
  else if (bar.state === 'fase2' || bar.state === 'vulneravel') fill = FILL_COLORS[bar.state]

  // O nome em cima da barra, à esquerda; "VULNERAVEL" à direita, na janela de bater nele
  const textSize = Math.max(2, Math.round(u * 0.75))
  const textTop = y - 2 * u - 7 * textSize
  drawOutlinedText(ctx, bar.name, x + u, textTop, textSize, NAME_COLOR, 'left')
  if (bar.state === 'vulneravel') drawOutlinedText(ctx, 'VULNERAVEL', x + (width - 1) * u, textTop, textSize, VULNERABLE_COLOR, 'right')

  // Moldura, anel dourado (luz em cima, sombra embaixo), fundo e trilho vazio
  fillRounded(ctx, x, y, width, BAR_HEIGHT, u, FRAME_COLOR)
  fillRounded(ctx, x + u, y + u, width - 2, BAR_HEIGHT - 2, u, ring[1])
  ctx.fillStyle = ring[0]
  ctx.fillRect(x + 2 * u, y + u, (width - 4) * u, u)
  ctx.fillStyle = ring[2]
  ctx.fillRect(x + 2 * u, y + 10 * u, (width - 4) * u, u)
  ctx.fillStyle = BACK_COLOR
  ctx.fillRect(x + 2 * u, y + 2 * u, (BAR_WIDTH + 2) * u, 8 * u)
  ctx.fillStyle = TRACK_COLOR
  ctx.fillRect(x + 3 * u, y + 3 * u, BAR_WIDTH * u, 6 * u)

  // A vida (filled) e o pedaço que acabou de perder (lost), em pixels de arte
  const filled = Math.round(Math.max(bar.health, 0) * BAR_WIDTH)
  const lost = Math.round(Math.max(bar.lost, 0) * BAR_WIDTH)
  for (let row = 0; row < 6; row++) {
    if (lost > filled && bar.lostAlpha > 0) {
      ctx.save()
      ctx.globalAlpha = bar.lostAlpha
      ctx.fillStyle = LOST_COLORS[row]
      ctx.fillRect(x + (3 + filled) * u, y + (3 + row) * u, (lost - filled) * u, u)
      ctx.restore()
    }
    if (filled > 0) {
      ctx.fillStyle = fill[row]
      ctx.fillRect(x + 3 * u, y + (3 + row) * u, filled * u, u)
    }
  }
  // A ponta do preenchimento brilha um pouco
  if (filled > 0 && filled < BAR_WIDTH) {
    ctx.save()
    ctx.globalAlpha = 0.5
    ctx.fillStyle = '#fff'
    ctx.fillRect(x + (2 + filled) * u, y + 3 * u, u, 6 * u)
    ctx.restore()
  }

  // Marcas das fases: um risco escuro no trilho e um losango em cima, aceso depois que a vida passou por ele
  for (const mark of bar.marks) {
    const col = 3 + Math.round(mark * BAR_WIDTH)
    const crossed = bar.health <= mark
    ctx.fillStyle = BACK_COLOR
    ctx.fillRect(x + col * u, y + 3 * u, u, 6 * u)
    ctx.fillStyle = crossed ? MARK_ON : MARK_OFF
    ctx.fillRect(x + (col - 1) * u, y + 2 * u, 3 * u, u)
    ctx.fillRect(x + col * u, y + u, u, u)
  }
}
