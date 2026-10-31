import { COLORS } from './colors.js'
import { rect } from '../../../utils/canvas.js'
import { drawShape, ellipsePath, strokeLine } from './draw.js'

// Desenha um taco de madeira, fino no cabo e largo na ponta.
// É usado pelo personagem e pelos dois tacos do título.
// bloodSpots: manchas de sangue, com a posição ao longo do taco (0 = cabo, 1 = ponta)
// e o lado (-1 a 1, de uma borda à outra).
export function drawBat(ctx, handle, tip, { handleWidth = 3, tipWidth = 9, bloodSpots = [] } = {}) {
  const length = Math.hypot(tip.x - handle.x, tip.y - handle.y)
  // Direção do taco (do cabo para a ponta) e direção perpendicular a ele
  const dirX = (tip.x - handle.x) / length
  const dirY = (tip.y - handle.y) / length
  const sideX = -dirY
  const sideY = dirX
  const handleHalf = handleWidth / 2
  const tipHalf = tipWidth / 2

  // Corpo do taco com a ponta arredondada
  drawShape(
    ctx,
    (c) => {
      c.moveTo(handle.x + sideX * handleHalf, handle.y + sideY * handleHalf)
      c.lineTo(tip.x + sideX * tipHalf, tip.y + sideY * tipHalf)
      c.arc(tip.x, tip.y, tipHalf, Math.atan2(sideY, sideX), Math.atan2(-sideY, -sideX), true)
      c.lineTo(handle.x - sideX * handleHalf, handle.y - sideY * handleHalf)
      c.closePath()
    },
    COLORS.bat,
  )

  // Brilho de um lado e sombra do outro, para dar volume
  const along = (amount, side) => [
    handle.x + dirX * length * amount + sideX * side,
    handle.y + dirY * length * amount + sideY * side,
  ]
  strokeLine(ctx, [along(0.1, handleHalf * 0.3), along(0.95, tipHalf * 0.45)], COLORS.batLight, 1)
  strokeLine(ctx, [along(0.1, -handleHalf * 0.4), along(0.95, -tipHalf * 0.6)], COLORS.batDark, 1)

  // Pomo na ponta do cabo
  drawShape(ctx, ellipsePath(handle.x - dirX, handle.y - dirY, handleHalf + 1.5, handleHalf + 1.5), COLORS.batKnob)

  for (const spot of bloodSpots) {
    const [x, y] = along(spot.at, spot.side * tipHalf * 0.8)
    rect(ctx, COLORS.blood, Math.round(x), Math.round(y), spot.size, spot.size)
  }
}
