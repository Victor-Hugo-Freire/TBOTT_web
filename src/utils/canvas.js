// Funções básicas de canvas usadas pelas cenas das telas.

// Pinta um retângulo de uma cor: a base da pixel art.
export function rect(ctx, color, x, y, width, height) {
  ctx.fillStyle = color
  ctx.fillRect(x, y, width, height)
}

// Pinta uma elipse cheia com centro em (x, y) e raios radiusX e radiusY.
export function ellipse(ctx, color, x, y, radiusX, radiusY) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.ellipse(x, y, radiusX, radiusY, 0, 0, Math.PI * 2)
  ctx.fill()
}

// Pinta um polígono cheio. points é uma lista de pontos [x, y].
export function polygon(ctx, color, points) {
  ctx.fillStyle = color
  ctx.beginPath()
  points.forEach(([x, y], index) => (index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)))
  ctx.closePath()
  ctx.fill()
}

// Número entre 0 e 1 que parece aleatório, mas é sempre o mesmo para a mesma
// semente. Assim a textura do chão e das letras não muda a cada quadro.
export function noise(seed) {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return value - Math.floor(value)
}
