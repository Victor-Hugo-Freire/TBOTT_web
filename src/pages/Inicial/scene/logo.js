import { forEachTextPixel, getTextWidth, SMALL_FONT } from '../../../utils/pixelFont.js'
import { drawBat } from './bat.js'
import { COLORS } from './colors.js'
import { noise, rect } from '../../../utils/canvas.js'

// Letras grandes do título: cada '#' vira um bloco de 4x4 pixels
const TITLE_FONT = {
  spacing: 1,
  glyphs: {
    T: ['######', '######', '..##..', '..##..', '..##..', '..##..', '..##..', '..##..'],
    U: ['##..##', '##..##', '##..##', '##..##', '##..##', '##..##', '######', '.####.'],
    N: ['##..##', '###.##', '###.##', '######', '##.###', '##.###', '##..##', '##..##'],
    G: ['.#####', '######', '##....', '##....', '##.###', '##..##', '######', '.#####'],
    ' ': ['..', '..', '..', '..', '..', '..', '..', '..'],
  },
}

const TITLE = 'TUNG TUNG'
const SUBTITLE = 'THE BINDING OF'
const BLOCK = 4 // tamanho de cada bloco das letras grandes
const DEPTH = 3 // altura da faixa vermelha embaixo das letras
const TITLE_Y = 28
const SUBTITLE_Y = 15
const SUBTITLE_FONT = { ...SMALL_FONT, spacing: 3 } // letras em negrito precisam de mais espaço

// Tacos ao lado do título: o cabo fica embaixo e a ponta manchada em cima
const BAT_STYLE = {
  handleWidth: 4,
  tipWidth: 12,
  bloodSpots: [
    { at: 0.62, side: 0.3, size: 1 },
    { at: 0.74, side: -0.5, size: 2 },
    { at: 0.82, side: 0.6, size: 2 },
    { at: 0.9, side: -0.1, size: 2 },
    { at: 0.97, side: 0.4, size: 1 },
  ],
}
const LEFT_BAT = { handle: { x: 79, y: 79 }, tip: { x: 56, y: 31 } }
const RIGHT_BAT = { handle: { x: 284, y: 79 }, tip: { x: 306, y: 31 } }

// Posição de cada bloco das letras grandes, calculada uma vez só
const TITLE_LEFT = Math.round(180 - (getTextWidth(TITLE_FONT, TITLE) * BLOCK) / 2)
const TITLE_BLOCKS = []
forEachTextPixel(TITLE_FONT, TITLE, (col, row) => {
  TITLE_BLOCKS.push({ col, row, x: TITLE_LEFT + col * BLOCK, y: TITLE_Y + row * BLOCK })
})
const FILLED = new Set(TITLE_BLOCKS.map((block) => `${block.col},${block.row}`))

// Pingos de sangue: um a cada três blocos da última linha das letras
const DRIP_TOP = TITLE_Y + 8 * BLOCK + DEPTH
const DRIPS = TITLE_BLOCKS.filter((block) => block.row === 7)
  .filter((_, index) => index % 3 === 1)
  .map((block, index) => ({
    x: block.x + 1,
    length: 4 + Math.floor(noise(index + 70) * 8),
    period: 3 + noise(index + 90) * 4,
    delay: noise(index + 110) * 10,
  }))

// Logo "THE BINDING OF / TUNG TUNG" com os dois tacos e o sangue escorrendo
export function drawLogo(ctx, time) {
  drawBat(ctx, LEFT_BAT.handle, LEFT_BAT.tip, BAT_STYLE)
  drawBat(ctx, RIGHT_BAT.handle, RIGHT_BAT.tip, BAT_STYLE)
  drawSubtitle(ctx)
  drawTitle(ctx)
  drawDrips(ctx, time)
}

function drawSubtitle(ctx) {
  const left = Math.round(180 - (getTextWidth(SUBTITLE_FONT, SUBTITLE) + 1) / 2)

  // Contorno escuro em volta de cada pixel
  forEachTextPixel(SUBTITLE_FONT, SUBTITLE, (col, row) => {
    rect(ctx, COLORS.outline, left + col - 1, SUBTITLE_Y + row - 1, 4, 3)
  })

  // Letras em negrito (cada pixel ocupa 2 colunas), mais claras em cima
  const gradient = ctx.createLinearGradient(0, SUBTITLE_Y, 0, SUBTITLE_Y + 7)
  gradient.addColorStop(0, COLORS.subtitleTop)
  gradient.addColorStop(1, COLORS.subtitleBottom)
  forEachTextPixel(SUBTITLE_FONT, SUBTITLE, (col, row) => {
    rect(ctx, gradient, left + col, SUBTITLE_Y + row, 2, 1)
  })
}

function drawTitle(ctx) {
  // 1. Contorno escuro em volta das letras e da faixa vermelha
  for (const block of TITLE_BLOCKS) {
    rect(ctx, COLORS.outline, block.x - 1, block.y - 1, BLOCK + 2, BLOCK + 2 + DEPTH)
  }

  // 2. Faixa vermelha embaixo das letras, como se estivessem sujas de sangue
  for (const block of TITLE_BLOCKS) rect(ctx, COLORS.bloodDark, block.x, block.y + DEPTH, BLOCK, BLOCK)

  // 3. Face das letras, com textura de madeira gasta
  for (const block of TITLE_BLOCKS) {
    const { x, y, col, row } = block
    const seed = col * 31 + row * 7
    rect(ctx, COLORS.titleFill, x, y, BLOCK, BLOCK)
    if (noise(seed) > 0.45) {
      rect(ctx, COLORS.titleSpeck, x + Math.floor(noise(seed + 1) * 3), y + Math.floor(noise(seed + 2) * 3), 2, 1)
    }
    if (noise(seed + 4) > 0.75) {
      rect(ctx, COLORS.titleLight, x + Math.floor(noise(seed + 5) * 3), y + Math.floor(noise(seed + 6) * 3), 1, 1)
    }
    // Borda de cima mais clara e borda de baixo manchada de sangue
    if (!FILLED.has(`${col},${row - 1}`)) rect(ctx, COLORS.titleLight, x, y, BLOCK, 1)
    if (!FILLED.has(`${col},${row + 1}`)) rect(ctx, COLORS.blood, x, y + BLOCK - 1, BLOCK, 1)
  }
}

function drawDrips(ctx, time) {
  for (const drip of DRIPS) {
    const progress = ((time + drip.delay) % drip.period) / drip.period
    rect(ctx, COLORS.blood, drip.x, DRIP_TOP, 2, 1)

    if (progress < 0.8) {
      // O pingo cresce devagar...
      const grow = progress / 0.8
      const length = Math.max(1, Math.round(drip.length * grow * grow))
      rect(ctx, COLORS.blood, drip.x, DRIP_TOP, 2, length)
      rect(ctx, COLORS.bloodLight, drip.x, DRIP_TOP, 1, Math.max(1, length - 1))
    } else {
      // ...até a gota se soltar e cair, sumindo aos poucos
      const fall = (progress - 0.8) / 0.2
      ctx.globalAlpha = 1 - fall
      rect(ctx, COLORS.blood, drip.x, DRIP_TOP + drip.length + Math.round(fall * 12), 2, 2)
      ctx.globalAlpha = 1
    }
  }
}
