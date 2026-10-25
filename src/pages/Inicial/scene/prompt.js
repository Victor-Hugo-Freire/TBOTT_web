import { drawPixelText, getTextWidth, SMALL_FONT } from '../../../utils/pixelFont.js'
import { COLORS } from './colors.js'
import { noise, rect } from './draw.js'

// Mensagem do protótipo, uma linha por item
const LINES = ['CLIQUE QUALQUER TECLA', 'PARA INICIAR']
const FIRST_LINE_Y = 213
const LINE_HEIGHT = 10

// Fiapos do pincel saindo pelas laterais da faixa: [x, y, largura]
const BRUSH_STREAKS = [
  [84, 214, 14],
  [88, 222, 10],
  [82, 229, 12],
  [262, 211, 12],
  [266, 220, 10],
  [260, 233, 14],
]

export function drawPrompt(ctx, time) {
  drawBanner(ctx)

  // A mensagem pulsa devagar para chamar a atenção do jogador
  ctx.globalAlpha = 0.55 + 0.45 * (0.5 + 0.5 * Math.cos(time * 3))
  LINES.forEach((line, index) => {
    const x = Math.round(180 - getTextWidth(SMALL_FONT, line) / 2)
    const y = FIRST_LINE_Y + index * LINE_HEIGHT
    drawPixelText(ctx, SMALL_FONT, line, x, y + 1, COLORS.promptShadow)
    drawPixelText(ctx, SMALL_FONT, line, x, y, COLORS.promptText)
  })
  ctx.globalAlpha = 1
}

// Faixa escura com bordas irregulares, como uma pincelada de tinta
function drawBanner(ctx) {
  ctx.fillStyle = COLORS.banner
  for (let y = 206; y <= 239; y++) {
    const shorter = y < 209 || y > 236 ? 14 : 0 // fileiras de cima e de baixo são mais curtas
    const left = 94 + shorter + Math.floor(noise(y) * 8)
    const right = 266 - shorter - Math.floor(noise(y + 50) * 8)
    ctx.fillRect(left, y, right - left, 1)
  }
  for (const [x, y, width] of BRUSH_STREAKS) rect(ctx, COLORS.banner, x, y, width, 1)
}
