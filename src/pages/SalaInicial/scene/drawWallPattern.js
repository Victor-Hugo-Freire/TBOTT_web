import { ellipse, noise, rect } from '../../../utils/canvas.js'

// Padrão da faixa de parede (entre as colunas, de y 134 a 226), um por tema.
// Portado do wallStrip() do protótipo da issue #18, adaptado à faixa de 92 u da sala.
// wall = { left, right, top, bottom }: a faixa, em unidades da sala.

const BRICK_ROW_HEIGHT = 23
const BRICK_WIDTH = 56

// Blocos em fileiras: largura, altura e se as fileiras ficam deslocadas meio bloco.
// As alturas dividem a faixa de 92 u em fileiras inteiras.
const BLOCK_SIZES = {
  tile: { width: 46, height: 23, staggered: false },
  metal: { width: 112, height: 46, staggered: false },
  planks: { width: 260, height: 23, staggered: true },
}

// Janelas da fachada (piazza): centro x de cada uma. Ficam fora da faixa da porta de cima (x 690..910).
const WINDOW_CENTERS = [170, 385, 600, 1000, 1215, 1430]
const WINDOW_WIDTH = 44
const WINDOW_HEIGHT = 52
const SHUTTER_WIDTH = 9
const FLOWER_COLORS = ['#c03a3a', '#e8c860', '#e870a0']

function pick(colors, seed) {
  return colors[Math.floor(noise(seed) * colors.length)]
}

export function drawWallPattern(ctx, theme, wall) {
  if (theme.wall === 'brick') drawBricks(ctx, theme, wall)
  else if (theme.wall === 'facade') drawFacade(ctx, theme, wall)
  else drawBlocks(ctx, theme, wall)
}

// Tijolos em fiadas deslocadas meio tijolo, com o rejunte embaixo de cada fiada (a parede da Cantina)
function drawBricks(ctx, theme, { left, right, top, bottom }) {
  rect(ctx, theme.wallCols[2], left, top, right - left, bottom - top)
  for (let row = 0, y = top; y < bottom; row++, y += BRICK_ROW_HEIGHT) {
    const height = Math.min(BRICK_ROW_HEIGHT, bottom - y)
    const shift = (row % 2) * (BRICK_WIDTH / 2)
    for (let col = Math.floor((left + shift) / BRICK_WIDTH), x = col * BRICK_WIDTH - shift; x < right; x += BRICK_WIDTH, col++) {
      rect(ctx, pick(theme.wallCols, row * 31 + col + 1), x + 1, y + 1, BRICK_WIDTH - 2, height - 2)
    }
    rect(ctx, theme.mortar, left, y + height - 2, right - left, 3)
  }
}

// Azulejos, chapas de metal ou tábuas: blocos sobre o rejunte. A chapa ganha dois rebites em cima.
function drawBlocks(ctx, theme, { left, right, top, bottom }) {
  const { width, height, staggered } = BLOCK_SIZES[theme.wall]
  rect(ctx, theme.mortar, left, top, right - left, bottom - top)
  for (let row = 0, y = top; y < bottom; row++, y += height) {
    const shift = staggered ? (row % 2) * (width / 2) : 0
    for (let col = 0, x = left - shift; x < right; col++, x += width) {
      rect(ctx, pick(theme.wallCols, row * 31 + col + 1), x + 1, y + 1, width - 2, height - 2)
      if (theme.wall === 'metal') {
        rect(ctx, '#74787e', x + 6, y + 6, 4, 4)
        rect(ctx, '#74787e', x + width - 10, y + 6, 4, 4)
      }
    }
  }
}

// Fachada de prédio da praça: reboco com linhas finas, uma fileira de janelas com venezianas e floreiras,
// e um friso embaixo, onde a parede encontra a viga
function drawFacade(ctx, theme, { left, right, top, bottom }) {
  const [plaster, trim] = theme.wallCols
  rect(ctx, plaster, left, top, right - left, bottom - top)
  for (let y = top + 15; y < bottom; y += 15) rect(ctx, 'rgba(0, 0, 0, 0.14)', left, y, right - left, 1)

  WINDOW_CENTERS.forEach((center, index) => drawWindow(ctx, center - WINDOW_WIDTH / 2, top + 8, trim, index))

  rect(ctx, trim, left, bottom - 8, right - left, 8)
  rect(ctx, 'rgba(255, 255, 255, 0.12)', left, bottom - 8, right - left, 2)
}

// Uma janela: venezianas verdes, vidro aceso (amarelo) ou apagado (azul), cruz do caixilho, peitoril e floreira
function drawWindow(ctx, x, y, trim, index) {
  rect(ctx, '#3a5a3a', x - SHUTTER_WIDTH - 2, y, SHUTTER_WIDTH, WINDOW_HEIGHT)
  rect(ctx, '#3a5a3a', x + WINDOW_WIDTH + 2, y, SHUTTER_WIDTH, WINDOW_HEIGHT)
  rect(ctx, '#1a1410', x, y, WINDOW_WIDTH, WINDOW_HEIGHT)
  rect(ctx, noise(index + 10) > 0.4 ? '#e8c860' : '#2a3a5a', x + 3, y + 3, WINDOW_WIDTH - 6, WINDOW_HEIGHT - 6)
  rect(ctx, '#1a1410', x + WINDOW_WIDTH / 2 - 1, y, 2, WINDOW_HEIGHT)
  rect(ctx, '#1a1410', x, y + WINDOW_HEIGHT / 2 - 1, WINDOW_WIDTH, 2)
  rect(ctx, trim, x - 4, y + WINDOW_HEIGHT, WINDOW_WIDTH + 8, 4)

  // Floreira com flores, logo abaixo do peitoril
  const boxTop = y + WINDOW_HEIGHT + 6
  rect(ctx, '#4a3020', x - 2, boxTop, WINDOW_WIDTH + 4, 9)
  for (let flower = 0; flower < 5; flower++) {
    ellipse(ctx, FLOWER_COLORS[flower % 3], x + 4 + flower * 9, boxTop, 4, 4)
  }
}
