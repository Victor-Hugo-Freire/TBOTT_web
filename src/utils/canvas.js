// Funções básicas de canvas usadas pelas cenas das telas.

// Pinta um retângulo de uma cor: a base da pixel art.
export function rect(ctx, color, x, y, width, height) {
  ctx.fillStyle = color
  ctx.fillRect(x, y, width, height)
}

// Número entre 0 e 1 que parece aleatório, mas é sempre o mesmo para a mesma
// semente. Assim a textura do chão e das letras não muda a cada quadro.
export function noise(seed) {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return value - Math.floor(value)
}
