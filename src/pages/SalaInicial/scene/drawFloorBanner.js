import { noise } from '../../../utils/canvas.js'
import { forEachTextPixel, getTextWidth, SMALL_FONT } from '../../../utils/pixelFont.js'

// Faixa com o nome do andar, como a "BASEMENT I" do Isaac: tinta preta atravessando a sala,
// borda irregular, respingos na ponta esquerda e embaixo, e o nome em branco no centro.
// Desenha em pixels da tela (o ctx deve estar sem escala), como o drawTimer.
// Tudo é feito de blocos de pixelSize: a borda e os respingos saem de noise(), então a faixa é sempre igual.
const ENTER_MS = 300
const STAY_MS = 2200
const EXIT_MS = 300
const TOTAL_MS = ENTER_MS + STAY_MS + EXIT_MS
const SLIDE_BLOCKS = 6 // de quantos blocos acima a faixa desce ao entrar
const INK = '#0a0606'
const TEXT_COLOR = '#f4ece4'
const PADDING_BLOCKS = 3 // tinta acima e abaixo do texto, em blocos
const TAPER_BLOCKS = 10 // as pontas afinam, como uma pincelada

// elapsedMs = tempo desde que a faixa apareceu. Depois de TOTAL_MS (2800 ms) não desenha nada.
export function drawFloorBanner(ctx, { text, elapsedMs, reduceMotion, left, right, centerY, pixelSize }) {
  if (elapsedMs < 0 || elapsedMs >= TOTAL_MS) return
  const { alpha, offset } = getBannerMotion(elapsedMs, reduceMotion)

  ctx.save()
  ctx.globalAlpha = alpha
  ctx.translate(0, Math.round(offset * SLIDE_BLOCKS * pixelSize))
  drawInk(ctx, left, right, centerY, pixelSize)
  drawText(ctx, text, (left + right) / 2, centerY, pixelSize)
  ctx.restore()
}

// Transparência e deslocamento (0 = no lugar, -1 = SLIDE_BLOCKS acima) em cada momento.
// Com "reduzir movimento", a faixa só aparece e some, sem deslizar nem esmaecer.
function getBannerMotion(elapsedMs, reduceMotion) {
  if (reduceMotion) return { alpha: 1, offset: 0 }
  if (elapsedMs < ENTER_MS) {
    const progress = easeOut(elapsedMs / ENTER_MS)
    return { alpha: progress, offset: progress - 1 }
  }
  const exitStart = ENTER_MS + STAY_MS
  if (elapsedMs < exitStart) return { alpha: 1, offset: 0 }
  const progress = (elapsedMs - exitStart) / EXIT_MS
  return { alpha: 1 - progress, offset: -progress * 0.5 }
}

function easeOut(value) {
  return 1 - (1 - value) * (1 - value)
}

// Corpo da faixa: uma coluna de blocos por vez, com topo e base irregulares
function drawInk(ctx, left, right, centerY, size) {
  const columns = Math.floor((right - left) / size)
  const halfHeight = Math.ceil(7 / 2) + PADDING_BLOCKS // metade da altura, em blocos (texto de 7 linhas + folga)
  const middle = Math.round(centerY / size) * size
  ctx.fillStyle = INK

  for (let col = 0; col < columns; col++) {
    const x = left + col * size
    const taper = getTaper(col, columns)
    // Degraus largos (a borda muda a cada 5 ou 7 colunas) e, de vez em quando, um dente de 1 bloco
    const top = halfHeight - taper + getEdgeStep(col, 5, 11) - (noise(col + 300) > 0.85 ? 1 : 0)
    const bottom = halfHeight - taper + getEdgeStep(col, 7, 71) - (noise(col + 900) > 0.85 ? 1 : 0)
    if (top + bottom <= 0) continue
    ctx.fillRect(x, middle - top * size, size, (top + bottom) * size)

    // Escorridos embaixo: alguns pingos descem da base
    if (noise(col + 1500) > 0.93 && taper === 0) {
      const length = 1 + Math.floor(noise(col + 1700) * 4)
      ctx.fillRect(x, middle + bottom * size, size, length * size)
      if (length > 2) ctx.fillRect(x, middle + (bottom + length + 1) * size, size, size)
    }
  }
  drawSplatters(ctx, left, right, middle, halfHeight, size)
}

// Borda em degraus: -1, 0 ou +1 bloco, sorteado por trecho de `width` colunas
function getEdgeStep(col, width, seed) {
  return Math.round(noise(Math.floor(col / width) + seed) * 2) - 1
}

// Nas pontas a faixa afina (mais rápido na esquerda, que termina em respingos)
function getTaper(col, columns) {
  const fromLeft = col
  const fromRight = columns - 1 - col
  if (fromLeft < TAPER_BLOCKS) return Math.round((TAPER_BLOCKS - fromLeft) * 0.45 + noise(col + 40) * 2)
  if (fromRight < TAPER_BLOCKS / 2) return Math.round((TAPER_BLOCKS / 2 - fromRight) * 0.6 + noise(col + 80) * 2)
  return 0
}

// Respingos soltos: um punhado na ponta esquerda e alguns embaixo, ao longo da faixa
function drawSplatters(ctx, left, right, middle, halfHeight, size) {
  for (let i = 0; i < 24; i++) {
    const x = left - 7 * size + Math.floor(noise(i + 2000) * 18) * size
    const y = middle + Math.round((noise(i + 2100) * 2 - 1) * (halfHeight + 4)) * size
    drawDrop(ctx, x, y, size, noise(i + 2200))
  }
  const columns = Math.floor((right - left) / size)
  for (let i = 0; i < 12; i++) {
    const x = left + Math.floor(noise(i + 2400) * columns * 0.7) * size
    const y = middle + (halfHeight + 2 + Math.floor(noise(i + 2500) * 4)) * size
    drawDrop(ctx, x, y, size, noise(i + 2600) * 0.85) // embaixo, gotas menores
  }
}

// Gota de tamanho sorteado por kind (0 a 1): 1 bloco, 2x1, 2x2 ou uma bolha 4x4 sem os cantos
function drawDrop(ctx, x, y, size, kind) {
  const width = kind > 0.3 ? 2 : 1
  const height = kind > 0.6 ? 2 : 1
  ctx.fillRect(x, y, width * size, height * size)
  if (kind > 0.8) {
    ctx.fillRect(x - size, y, size, 2 * size)
    ctx.fillRect(x + 2 * size, y, size, 2 * size)
    ctx.fillRect(x, y - size, 2 * size, size)
    ctx.fillRect(x, y + 2 * size, 2 * size, size)
  }
}

// Nome do andar em branco, centrado na faixa (a fonte tem 7 linhas).
// Letras grossas, como as do Isaac: cada pixel da fonte fica com o dobro da largura.
function drawText(ctx, text, centerX, centerY, size) {
  const pixelWidth = size * 2
  const textLeft = Math.round(centerX - (getTextWidth(SMALL_FONT, text) * pixelWidth) / 2)
  const textTop = Math.round(centerY / size) * size - Math.round(7 / 2) * size
  ctx.fillStyle = TEXT_COLOR
  forEachTextPixel(SMALL_FONT, text, (col, row) => {
    ctx.fillRect(textLeft + col * pixelWidth, textTop + row * size, pixelWidth, size)
  })
}
