import { PLAYER_SCALE } from '../../../utils/roomMovement.js'

// Sombra sob os pés: uma elipse fixa. Só desenho, não participa da colisão.
// Valores em unidades da sala (52 x 14 vezes PLAYER_SCALE); ajuste aqui se ficar grande ou escura demais.
const SHADOW = { width: Math.round(52 * PLAYER_SCALE), height: Math.round(14 * PLAYER_SCALE), color: 'rgba(0, 0, 0, 0.35)' }

export function drawShadow(ctx, feet) {
  ctx.fillStyle = SHADOW.color
  ctx.beginPath()
  ctx.ellipse(feet.x, feet.y, SHADOW.width / 2, SHADOW.height / 2, 0, 0, Math.PI * 2)
  ctx.fill()
}
