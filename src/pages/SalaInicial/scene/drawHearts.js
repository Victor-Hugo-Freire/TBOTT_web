import { HEART_PIXELS } from '../../../data/heartPixels.js'

// Corações de vida do HUD. Desenha em pixels da tela (o ctx deve estar sem escala), um retângulo por pixel
// do desenho, então ficam nítidos em qualquer tela.
const GAP_PIXELS = 1 // espaço entre um coração e o seguinte, em pixels do desenho

// Altura da fileira de corações na tela, para o HUD pôr os contadores embaixo dela
export function getHeartsHeight(pixelSize) {
  return HEART_PIXELS.height * pixelSize
}

// states = lista de 'full', 'half' ou 'empty' (getHeartStates, em health.js), da esquerda para a direita.
// left e top = canto superior esquerdo do primeiro coração; pixelSize = o mesmo do contador de tempo.
export function drawHearts(ctx, states, left, top, pixelSize) {
  const step = (HEART_PIXELS.width + GAP_PIXELS) * pixelSize
  states.forEach((state, index) => drawHeart(ctx, HEART_PIXELS[state], left + index * step, top, pixelSize))
}

function drawHeart(ctx, rows, left, top, pixelSize) {
  rows.forEach((line, row) => {
    for (let col = 0; col < line.length; col++) {
      const color = HEART_PIXELS.palette[line[col]]
      if (!color) continue // '.' é transparente
      ctx.fillStyle = color
      ctx.fillRect(left + col * pixelSize, top + row * pixelSize, pixelSize, pixelSize)
    }
  })
}
