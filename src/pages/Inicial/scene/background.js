import { drawPixelText, SMALL_FONT } from '../../../utils/pixelFont.js'
import { COLORS } from './colors.js'
import { noise, rect } from '../../../utils/canvas.js'
import { drawShape, ellipsePath, polygonPath, strokeLine } from './draw.js'

// Linha onde o chão encontra as casas
const HORIZON_Y = 172

// Palmeiras: x é a base do tronco e lean é quanto o topo se inclina
const PALMS = [
  { x: -84, height: 92, lean: 10 },
  { x: -34, height: 78, lean: -6 },
  { x: 20, height: 110, lean: 9 },
  { x: 56, height: 82, lean: -6 },
  { x: 238, height: 72, lean: -5 },
  { x: 266, height: 80, lean: 6 },
  { x: 412, height: 100, lean: -9 },
  { x: 464, height: 86, lean: 7 },
]

// Direção de cada folha da palmeira, em radianos (da esquerda para a direita)
const LEAF_ANGLES = [-2.9, -2.4, -1.9, -1.3, -0.75, -0.25, 0.25]

// Casas da vila: parede, altura do telhado e janelas acesas
const BACK_HOUSE = { x: 96, y: 140, width: 58, height: 32, roofHeight: 16, windows: [{ x: 128, y: 149, light: 0.55 }] }
const LEFT_HOUSE = {
  x: -44,
  y: 128,
  width: 108,
  height: 44,
  roofHeight: 24,
  windows: [
    { x: 26, y: 136, light: 1 },
    { x: -18, y: 140, light: 0.7 },
  ],
}
const MIDDLE_HOUSE = { x: 226, y: 128, width: 76, height: 44, roofHeight: 20, windows: [{ x: 280, y: 138, light: 0.9 }] }

// Riscos claros e escuros da terra, sorteados uma vez só
const GROUND_MARKS = Array.from({ length: 1400 }, (_, i) => ({
  x: Math.floor(-180 + noise(i * 3 + 1) * 720),
  y: Math.floor(HORIZON_Y + 2 + noise(i * 3 + 2) * 340),
  width: 2 + Math.floor(noise(i * 3 + 3) * 5),
  light: noise(i * 5 + 7) > 0.55,
}))

// Fundo da cena, de trás para a frente.
// bounds: limites da parte visível (em telas largas ou altas ela passa da área segura).
export function drawBackground(ctx, time, bounds) {
  drawSky(ctx, bounds)
  drawTreeLine(ctx, bounds)
  drawPalms(ctx, time)
  drawHouse(ctx, BACK_HOUSE, time)
  drawHouse(ctx, LEFT_HOUSE, time)
  drawHouse(ctx, MIDDLE_HOUSE, time)
  drawGround(ctx, bounds)
  drawPostoRonda(ctx, bounds)
  drawFence(ctx, bounds)
  drawStreetLamp(ctx, time)
}

function drawSky(ctx, bounds) {
  const width = bounds.right - bounds.left
  const height = HORIZON_Y - bounds.top

  const sky = ctx.createLinearGradient(0, 0, 0, HORIZON_Y)
  sky.addColorStop(0, COLORS.skyTop)
  sky.addColorStop(1, COLORS.skyBottom)
  ctx.fillStyle = sky
  ctx.fillRect(bounds.left, bounds.top, width, height)

  // Brilho quente das luzes da vila no meio da cena
  const glow = ctx.createRadialGradient(160, 125, 10, 160, 125, 180)
  glow.addColorStop(0, 'rgba(95, 48, 26, 0.4)')
  glow.addColorStop(1, 'rgba(95, 48, 26, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(bounds.left, bounds.top, width, height)
}

// Mata escura no horizonte, atrás das casas
function drawTreeLine(ctx, bounds) {
  ctx.fillStyle = COLORS.treeLine
  for (let x = Math.floor(bounds.left / 3) * 3; x < bounds.right; x += 3) {
    const height = Math.round(36 + Math.sin(x * 0.045) * 10 + Math.sin(x * 0.13 + 1) * 5 + noise(x) * 4)
    ctx.fillRect(x, HORIZON_Y - height, 3, height)
  }
}

function drawPalms(ctx, time) {
  for (const palm of PALMS) {
    // Tronco: blocos empilhados que se inclinam aos poucos
    ctx.fillStyle = COLORS.palm
    for (let i = 0; i < palm.height; i += 2) {
      const progress = i / palm.height
      ctx.fillRect(Math.round(palm.x + palm.lean * progress * progress), HORIZON_Y - i - 2, 3, 2)
    }

    // Folhas: sobem e caem para os lados, balançando com o vento
    const topX = palm.x + palm.lean + 1
    const topY = HORIZON_Y - palm.height
    const sway = Math.sin(time * 0.8 + palm.x) * 0.06
    for (const angle of LEAF_ANGLES) {
      const cos = Math.cos(angle + sway)
      const sin = Math.sin(angle + sway)
      const middle = [topX + cos * 10, topY + sin * 7 - 2]
      const end = [topX + cos * 18, topY + sin * 9 + 6]
      strokeLine(ctx, [[topX, topY], middle, end], COLORS.palm, 2.5)
    }
  }
}

function drawHouse(ctx, house, time) {
  const { x, y, width, height, roofHeight } = house

  // Telhado em degraus, com uma fileira mais clara a cada três
  for (let row = 0; row < roofHeight; row++) {
    const half = Math.round(((width / 2 + 5) * (row + 1)) / roofHeight)
    const color = row % 3 === 0 ? COLORS.roofLine : COLORS.houseRoof
    rect(ctx, color, Math.round(x + width / 2 - half), y - roofHeight + row, half * 2, 1)
  }

  // Parede de tábuas
  rect(ctx, COLORS.houseWall, x, y, width, height)
  for (let plank = x + 5; plank < x + width; plank += 6) rect(ctx, COLORS.wallLine, plank, y, 1, height)

  // Janelas com luz de vela, oscilando de leve
  for (const glass of house.windows) {
    const flicker = 0.9 + Math.sin(time * 3 + glass.x) * 0.1
    drawWindow(ctx, glass.x, glass.y, glass.light * flicker)
  }
}

function drawWindow(ctx, x, y, light) {
  rect(ctx, COLORS.windowFrame, x - 1, y - 1, 10, 12)
  rect(ctx, `rgba(214, 120, 40, ${light})`, x, y, 8, 10)
  rect(ctx, COLORS.windowFrame, x + 4, y, 1, 10)
  rect(ctx, COLORS.windowFrame, x, y + 5, 8, 1)

  // Brilho da janela na parede
  const glow = ctx.createRadialGradient(x + 4, y + 5, 2, x + 4, y + 5, 16)
  glow.addColorStop(0, `rgba(230, 130, 50, ${0.25 * light})`)
  glow.addColorStop(1, 'rgba(230, 130, 50, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(x - 12, y - 11, 32, 32)
}

function drawGround(ctx, bounds) {
  const width = bounds.right - bounds.left
  const height = bounds.bottom - HORIZON_Y
  rect(ctx, COLORS.groundDark, bounds.left, HORIZON_Y, width, height)

  // Rua iluminada pelo poste e pelas janelas
  const light = ctx.createRadialGradient(165, 196, 8, 165, 196, 160)
  light.addColorStop(0, 'rgba(126, 66, 32, 0.95)')
  light.addColorStop(0.45, 'rgba(92, 47, 24, 0.55)')
  light.addColorStop(1, 'rgba(60, 30, 18, 0)')
  ctx.fillStyle = light
  ctx.fillRect(bounds.left, HORIZON_Y, width, height)

  // Textura da terra
  for (const mark of GROUND_MARKS) {
    if (mark.y > bounds.bottom || mark.x > bounds.right || mark.x + mark.width < bounds.left) continue
    rect(ctx, mark.light ? 'rgba(150, 84, 44, 0.35)' : 'rgba(12, 5, 4, 0.45)', mark.x, mark.y, mark.width, 1)
  }

  // Sombra onde o chão encontra as casas
  rect(ctx, COLORS.groundEdge, bounds.left, HORIZON_Y, width, 2)
}

// Prédio da direita, com varanda e a placa "POS RONDA"
function drawPostoRonda(ctx, bounds) {
  const right = Math.max(bounds.right, 480)
  const roofY = (x) => 120 - (x - 256) * 0.36

  // Parede de tábuas
  rect(ctx, COLORS.woodDark, 318, 96, right - 318, HORIZON_Y - 96)
  for (let plank = 324; plank < right; plank += 7) rect(ctx, COLORS.wallLine, plank, 96, 1, HORIZON_Y - 96)

  // Telhado inclinado da varanda
  drawShape(
    ctx,
    polygonPath([
      [256, roofY(256)],
      [right, roofY(right)],
      [right, roofY(right) + 12],
      [256, roofY(256) + 12],
    ]),
    COLORS.porchRoof,
  )
  for (const offset of [4, 8]) {
    strokeLine(ctx, [[258, roofY(258) + offset], [right, roofY(right) + offset]], COLORS.porchRoofLine, 1)
  }

  // Colunas da varanda
  for (const x of [316, 372, 430]) {
    const top = Math.round(roofY(x) + 10)
    rect(ctx, COLORS.wood, x, top, 5, HORIZON_Y + 6 - top)
    rect(ctx, COLORS.woodLit, x, top, 1, HORIZON_Y + 6 - top)
  }

  // Placa
  rect(ctx, COLORS.outline, 328, 84, 48, 34)
  rect(ctx, COLORS.signBoard, 330, 86, 44, 30)
  drawPixelText(ctx, SMALL_FONT, 'POS', 343, 90, COLORS.signText)
  drawPixelText(ctx, SMALL_FONT, 'RONDA', 337, 103, COLORS.signText)

  // Corrimão e banco da varanda
  for (const [x, y, height] of [
    [321, 146, 4],
    [298, 165, 5],
  ]) {
    rect(ctx, COLORS.porchBeam, x, y, right - x, height)
    rect(ctx, COLORS.porchBeamLit, x, y, right - x, 1)
  }
  for (const x of [302, 340, 384, 440]) rect(ctx, COLORS.woodDark, x, 170, 3, 14)
}

// Cerca de madeira à esquerda, iluminada pelo poste
function drawFence(ctx, bounds) {
  const left = Math.min(bounds.left, -100)
  for (let x = 76; x > left - 4; x -= 18) {
    rect(ctx, COLORS.woodDark, x, 150, 3, 27)
    rect(ctx, COLORS.wood, x + 2, 150, 1, 27)
  }
  for (const y of [156, 166]) {
    rect(ctx, COLORS.woodDark, left, y, 80 - left, 2)
    rect(ctx, COLORS.wood, left, y, 80 - left, 1)
  }
}

// A lâmpada oscila de leve e às vezes falha, como uma luz velha.
function getLampIntensity(time) {
  const failing = Math.sin(time * 0.9) > 0.985
  if (failing) return Math.sin(time * 45) > 0 ? 0.3 : 0.75
  return 0.9 + Math.sin(time * 11) * 0.05 + Math.sin(time * 23.7) * 0.05
}

function drawStreetLamp(ctx, time) {
  const intensity = getLampIntensity(time)

  // Poste de madeira, iluminado do lado da lâmpada
  rect(ctx, COLORS.woodDark, 85, 92, 5, 86)
  rect(ctx, COLORS.pole, 88, 92, 2, 86)
  rect(ctx, COLORS.woodDark, 82, 174, 11, 5)

  // Braço curvo até a lâmpada
  ctx.strokeStyle = COLORS.woodDark
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(87.5, 96)
  ctx.quadraticCurveTo(87.5, 82.5, 100, 82.5)
  ctx.lineTo(112, 82.5)
  ctx.stroke()

  // Cúpula e lâmpada
  drawShape(
    ctx,
    polygonPath([
      [104, 80],
      [122, 80],
      [125, 87],
      [101, 87],
    ]),
    COLORS.lampShade,
  )
  rect(ctx, COLORS.lampOff, 105, 87, 16, 2)
  rect(ctx, `rgba(255, 226, 168, ${intensity})`, 105, 87, 16, 2)

  // Halo em volta da lâmpada
  const halo = ctx.createRadialGradient(113, 88, 1, 113, 88, 26)
  halo.addColorStop(0, `rgba(255, 220, 160, ${0.55 * intensity})`)
  halo.addColorStop(1, 'rgba(255, 220, 160, 0)')
  ctx.fillStyle = halo
  ctx.fillRect(87, 62, 52, 52)

  // Cone de luz até o chão
  const cone = ctx.createLinearGradient(0, 88, 0, 180)
  cone.addColorStop(0, `rgba(255, 205, 140, ${0.3 * intensity})`)
  cone.addColorStop(1, `rgba(255, 170, 90, ${0.07 * intensity})`)
  drawShape(
    ctx,
    polygonPath([
      [105, 89],
      [121, 89],
      [156, 180],
      [72, 180],
    ]),
    cone,
    null,
  )

  // Poça de luz no chão
  drawShape(ctx, ellipsePath(114, 181, 46, 9), `rgba(255, 190, 120, ${0.18 * intensity})`, null)
}
