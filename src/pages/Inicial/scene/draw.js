import { COLORS } from './colors.js'

// Funções básicas de desenho usadas pelas partes da cena.

// Pinta um retângulo de uma cor: a base da pixel art.
export function rect(ctx, color, x, y, width, height) {
  ctx.fillStyle = color
  ctx.fillRect(x, y, width, height)
}

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

// Número entre 0 e 1 que parece aleatório, mas é sempre o mesmo para a mesma
// semente. Assim a textura do chão e das letras não muda a cada quadro.
export function noise(seed) {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return value - Math.floor(value)
}
