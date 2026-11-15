import { forEachTextPixel, getTextWidth, SMALL_FONT } from '../../../utils/pixelFont.js'

// "ZZZ...." do sono na rede, no meio da tela preta: branco com contorno escuro, como o contador de tempo.
// Desenha em pixels da tela (o ctx deve estar sem escala), centralizado em (centerX, centerY).
// pixelSize = lado de cada pixel da fonte, em pixels da tela; alpha some junto com o escurecimento.
export function drawSleepText(ctx, text, centerX, centerY, pixelSize, alpha) {
  if (!text || alpha <= 0) return
  const left = Math.round(centerX - (getTextWidth(SMALL_FONT, text) * pixelSize) / 2)
  const top = Math.round(centerY - (7 * pixelSize) / 2) // a SMALL_FONT tem 7 pixels de altura
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.fillStyle = 'rgba(20, 12, 8, 0.9)'
  forEachTextPixel(SMALL_FONT, text, (col, row) => {
    ctx.fillRect(left + col * pixelSize - pixelSize, top + row * pixelSize - pixelSize, pixelSize * 3, pixelSize * 3)
  })
  ctx.fillStyle = '#dce8ff'
  forEachTextPixel(SMALL_FONT, text, (col, row) => {
    ctx.fillRect(left + col * pixelSize, top + row * pixelSize, pixelSize, pixelSize)
  })
  ctx.restore()
}
