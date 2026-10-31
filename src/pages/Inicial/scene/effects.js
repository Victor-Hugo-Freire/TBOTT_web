import { COLORS } from './colors.js'
import { noise } from '../../../utils/canvas.js'

// Vaga-lumes: cada um passeia em volta de um ponto e acende e apaga devagar
const FIREFLIES = Array.from({ length: 12 }, (_, i) => ({
  x: 20 + noise(i + 40) * 320,
  y: 100 + noise(i + 80) * 85,
  rangeX: 6 + noise(i + 120) * 14,
  rangeY: 3 + noise(i + 160) * 8,
  speed: 0.25 + noise(i + 200) * 0.35,
  phase: noise(i + 240) * Math.PI * 2,
}))

export function drawFireflies(ctx, time) {
  for (const fly of FIREFLIES) {
    const glow = 0.5 + 0.5 * Math.sin(time * 2.1 + fly.phase * 3)
    if (glow < 0.15) continue

    const x = Math.round(fly.x + Math.cos(time * fly.speed + fly.phase) * fly.rangeX)
    const y = Math.round(fly.y + Math.sin(time * fly.speed * 1.3 + fly.phase) * fly.rangeY)
    ctx.fillStyle = `rgba(255, 200, 110, ${0.25 * glow})`
    ctx.fillRect(x - 1, y - 1, 3, 3)
    ctx.fillStyle = `rgba(255, 238, 170, ${glow})`
    ctx.fillRect(x, y, 1, 1)
  }
}

// Escurece as bordas da tela e desenha a moldura irregular de cima e de baixo
export function drawFrame(ctx, bounds) {
  const width = bounds.right - bounds.left
  const height = bounds.bottom - bounds.top

  const vignette = ctx.createRadialGradient(180, 128, 110, 180, 128, Math.max(width, height) * 0.75)
  vignette.addColorStop(0, 'rgba(4, 2, 2, 0)')
  vignette.addColorStop(1, 'rgba(4, 2, 2, 0.8)')
  ctx.fillStyle = vignette
  ctx.fillRect(bounds.left, bounds.top, width, height)

  ctx.fillStyle = COLORS.border
  for (let x = Math.floor(bounds.left / 2) * 2; x < bounds.right; x += 2) {
    ctx.fillRect(x, bounds.top, 2, 3 + Math.floor(noise(x) * 5))
    const bottomHeight = 3 + Math.floor(noise(x + 999) * 5)
    ctx.fillRect(x, bounds.bottom - bottomHeight, 2, bottomHeight)
  }
}
