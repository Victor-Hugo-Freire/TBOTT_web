// Sombra sob os pés: uma elipse fixa. Só desenho, não participa da colisão.
// Valores em unidades da sala; ajuste aqui se ficar grande ou escura demais.
export const SHADOW = { width: 52, height: 14, color: 'rgba(0, 0, 0, 0.35)' }

export function drawShadow(ctx, feet) {
  ctx.fillStyle = SHADOW.color
  ctx.beginPath()
  ctx.ellipse(feet.x, feet.y, SHADOW.width / 2, SHADOW.height / 2, 0, 0, Math.PI * 2)
  ctx.fill()
}
