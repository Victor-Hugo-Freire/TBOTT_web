import { COLORS } from './colors.js'

// Formas e linhas usadas pelas partes da cena inicial (rect e noise ficam em utils/canvas.js).

// Desenha uma forma com contorno escuro, no estilo da arte original.
// buildPath recebe o contexto e monta o caminho (veja ellipsePath e polygonPath).
// Use outline = null para desenhar sem contorno.
export function drawShape(ctx, buildPath, fill, outline = COLORS.outline, lineWidth = 2) {
  ctx.beginPath()
  buildPath(ctx)
  if (outline) {
    ctx.strokeStyle = outline
    ctx.lineWidth = lineWidth
    ctx.lineJoin = 'round'
    ctx.stroke()
  }
  ctx.fillStyle = fill
  ctx.fill()
}

export function ellipsePath(x, y, radiusX, radiusY) {
  return (ctx) => ctx.ellipse(x, y, radiusX, radiusY, 0, 0, Math.PI * 2)
}

export function polygonPath(points) {
  return (ctx) => {
    ctx.moveTo(points[0][0], points[0][1])
    for (const [x, y] of points.slice(1)) ctx.lineTo(x, y)
    ctx.closePath()
  }
}

// Desenha uma linha passando por vários pontos (braços, folhas, veios).
export function strokeLine(ctx, points, color, lineWidth) {
  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(points[0][0], points[0][1])
  for (const [x, y] of points.slice(1)) ctx.lineTo(x, y)
  ctx.stroke()
}
