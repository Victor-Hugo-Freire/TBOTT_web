import { getAttackArc } from '../../../utils/player.js'

// Arco do golpe: um crescente branco na frente do personagem, dentro da caixa do golpe.
// Só desenho, não participa da colisão. Valores em unidades da sala.
// inner: onde começa o lado de dentro do crescente, como fração da profundidade da caixa do golpe.
// Quanto maior, mais fino o arco e mais longe do personagem (0,5 era grosso e colado nele; 1 some).
const ARC_STYLE = { fill: 'rgba(255, 255, 255, 0.35)', stroke: '#fff', lineWidth: 2, glow: 6, inner: 0.7 }

// Quanto o ângulo gira para cada direção (o arco é desenhado "para a direita" e depois girado)
const ARC_ANGLE = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 }

export function drawAttackArc(ctx, player) {
  const arc = getAttackArc(player)
  if (!arc) return

  // Profundidade (para onde o golpe vai) e abertura (largura do arco) dependem da direção
  const sideways = arc.direction === 'left' || arc.direction === 'right'
  const depth = sideways ? arc.width : arc.height
  const span = sideways ? arc.height : arc.width
  // Meio da borda de trás da caixa: daqui o arco sai em direção ao golpe
  const origin = {
    right: { x: arc.x, y: arc.y + arc.height / 2 },
    left: { x: arc.x + arc.width, y: arc.y + arc.height / 2 },
    down: { x: arc.x + arc.width / 2, y: arc.y },
    up: { x: arc.x + arc.width / 2, y: arc.y + arc.height },
  }[arc.direction]

  ctx.save()
  ctx.globalAlpha = arc.opacity
  ctx.translate(origin.x, origin.y)
  ctx.rotate(ARC_ANGLE[arc.direction])

  // Crescente = meia elipse de fora (profundidade total) menos meia elipse de dentro (ARC_STYLE.inner)
  ctx.beginPath()
  ctx.ellipse(0, 0, depth, span / 2, 0, -Math.PI / 2, Math.PI / 2)
  ctx.ellipse(0, 0, depth * ARC_STYLE.inner, span / 2, 0, Math.PI / 2, -Math.PI / 2, true)
  ctx.closePath()

  ctx.fillStyle = ARC_STYLE.fill
  ctx.strokeStyle = ARC_STYLE.stroke
  ctx.lineWidth = ARC_STYLE.lineWidth
  ctx.shadowColor = ARC_STYLE.stroke
  ctx.shadowBlur = ARC_STYLE.glow
  ctx.fill()
  ctx.stroke()
  ctx.restore()
}
