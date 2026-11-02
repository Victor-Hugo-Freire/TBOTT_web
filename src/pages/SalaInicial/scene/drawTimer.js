import { forEachTextPixel, getTextWidth, SMALL_FONT } from '../../../utils/pixelFont.js'

// Contador de tempo da sala: branco com contorno escuro, como o do Isaac.
// Desenha em pixels da tela (o ctx deve estar sem escala), centralizado em centerX.
// pixelSize = lado de cada pixel da fonte, em pixels da tela (inteiro, para o texto ficar nítido).
export function drawTimer(ctx, text, centerX, top, pixelSize) {
  const left = Math.round(centerX - (getTextWidth(SMALL_FONT, text) * pixelSize) / 2)
  // Primeiro o contorno (um quadrado maior em volta de cada pixel), depois o branco por cima
  ctx.fillStyle = 'rgba(20, 12, 8, 0.9)'
  forEachTextPixel(SMALL_FONT, text, (col, row) => {
    ctx.fillRect(left + col * pixelSize - pixelSize, top + row * pixelSize - pixelSize, pixelSize * 3, pixelSize * 3)
  })
  ctx.fillStyle = '#f4ece4'
  forEachTextPixel(SMALL_FONT, text, (col, row) => {
    ctx.fillRect(left + col * pixelSize, top + row * pixelSize, pixelSize, pixelSize)
  })
}
