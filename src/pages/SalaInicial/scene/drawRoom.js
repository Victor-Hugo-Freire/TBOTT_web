import { noise, rect } from '../../Inicial/scene/draw.js'
import { COLORS, FLOOR_LIGHT } from './colors.js'
import { ROOM_SIZE } from '../../../utils/roomMovement.js'

// A sala é desenhada em unidades da sala (1080x768), de cima para baixo.
// As faixas (y) foram medidas na imagem de referência.
const TOP_WALL_END = 72
const BEAM_TOP = 84
const BRICKS_TOP = 116
const BRICKS_END = 201
const FLOOR_TOP = 235
const FLOOR_END = 662
const BASEBOARD_END = 715

const BRICK_ROW_HEIGHT = 24
const BRICK_WIDTH = 76
const PLANK_WIDTH = 85.8
const FIRST_JOINT_X = 66

const BRICK_COLORS = [COLORS.brickA, COLORS.brickB, COLORS.brickC]
const FLOOR_COLORS = [COLORS.floorA, COLORS.floorB, COLORS.floorC]

function pick(colors, seed) {
  return colors[Math.floor(noise(seed) * colors.length)]
}

// Desenha a sala inteira. O ctx já vem com a escala e o deslocamento da tela.
export function drawRoom(ctx) {
  const { width, height } = ROOM_SIZE
  // Tijolos e tábuas começam um pouco fora da sala; o recorte evita que vazem para a faixa
  ctx.save()
  ctx.beginPath()
  ctx.rect(0, 0, width, height)
  ctx.clip()
  drawTopWall(ctx, width)
  drawBricks(ctx, width)
  drawLowerBeam(ctx, width)
  drawFloor(ctx, width)
  drawBaseboard(ctx, width)
  ctx.restore()
}

// Parede escura de cima, com painéis, e a viga que separa dos tijolos
function drawTopWall(ctx, width) {
  rect(ctx, COLORS.topWall, 0, 0, width, TOP_WALL_END)
  for (let i = 0, x = 20; x < width; i++, x += 68) {
    rect(ctx, i % 2 ? COLORS.topPanelB : COLORS.topPanelA, x, 12, 46, TOP_WALL_END - 12)
  }
  rect(ctx, COLORS.beam, 0, TOP_WALL_END, width, BRICKS_TOP - TOP_WALL_END)
  rect(ctx, COLORS.beamLight, 0, BEAM_TOP, width, 3)
}

// Parede de tijolos: fiadas de 24 px, cada uma deslocada meio tijolo
function drawBricks(ctx, width) {
  rect(ctx, COLORS.brickC, 0, BRICKS_TOP, width, BRICKS_END - BRICKS_TOP)
  for (let row = 0, y = BRICKS_TOP + 13 - BRICK_ROW_HEIGHT; y < BRICKS_END; row++, y += BRICK_ROW_HEIGHT) {
    const top = Math.max(y, BRICKS_TOP)
    const height = Math.min(y + BRICK_ROW_HEIGHT, BRICKS_END) - top
    const shift = (row % 2) * (BRICK_WIDTH / 2)
    for (let x = -shift, col = 0; x < width; x += BRICK_WIDTH, col++) {
      rect(ctx, pick(BRICK_COLORS, row * 31 + col + 1), x + 1, top + 1, BRICK_WIDTH - 2, height - 2)
    }
    rect(ctx, COLORS.mortar, 0, y + BRICK_ROW_HEIGHT - 2, width, 3)
  }
}

function drawLowerBeam(ctx, width) {
  rect(ctx, COLORS.beamBase, 0, BRICKS_END, width, FLOOR_TOP - BRICKS_END)
  rect(ctx, COLORS.beamShadow, 0, 209, width, 5)
}

// Piso de tábuas verticais com juntas escuras e uma luz quente no meio
function drawFloor(ctx, width) {
  const height = FLOOR_END - FLOOR_TOP
  for (let plank = -1; ; plank++) {
    const x = FIRST_JOINT_X + plank * PLANK_WIDTH
    if (x > width) break
    const left = Math.round(x)
    rect(ctx, pick(FLOOR_COLORS, plank + 40), left, FLOOR_TOP, Math.round(x + PLANK_WIDTH) - left, height)
    // Uma emenda horizontal por tábua, em alturas diferentes
    rect(ctx, COLORS.floorJoint, left, FLOOR_TOP + 60 + Math.floor(noise(plank + 7) * 300), Math.round(PLANK_WIDTH), 2)
    rect(ctx, COLORS.floorJoint, left, FLOOR_TOP, 3, height)
  }

  ctx.save()
  ctx.beginPath()
  ctx.rect(0, FLOOR_TOP, width, height)
  ctx.clip()

  const light = ctx.createRadialGradient(FLOOR_LIGHT.x, FLOOR_LIGHT.y, 10, FLOOR_LIGHT.x, FLOOR_LIGHT.y, FLOOR_LIGHT.radius)
  light.addColorStop(0, 'rgba(170, 118, 70, 0.30)')
  light.addColorStop(1, 'rgba(170, 118, 70, 0)')
  ctx.fillStyle = light
  ctx.fillRect(0, FLOOR_TOP, width, height)

  const shade = ctx.createRadialGradient(width / 2, 430, 220, width / 2, 430, 720)
  shade.addColorStop(0, 'rgba(0, 0, 0, 0)')
  shade.addColorStop(1, 'rgba(0, 0, 0, 0.40)')
  ctx.fillStyle = shade
  ctx.fillRect(0, FLOOR_TOP, width, height)
  ctx.restore()
}

// Rodapé de lajotas e a faixa escura da base
function drawBaseboard(ctx, width) {
  rect(ctx, COLORS.baseboard, 0, FLOOR_END, width, BASEBOARD_END - FLOOR_END)
  for (let x = 0; x < width; x += 80) {
    rect(ctx, COLORS.baseboardLine, x, FLOOR_END, 2, BASEBOARD_END - FLOOR_END)
  }
  rect(ctx, COLORS.beamShadow, 0, FLOOR_END, width, 3)
  rect(ctx, COLORS.baseWall, 0, BASEBOARD_END, width, ROOM_SIZE.height - BASEBOARD_END)
}
