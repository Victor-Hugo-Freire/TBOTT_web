import { noise, rect } from '../../../utils/canvas.js'
import { COLORS, FLOOR_LIGHT } from './colors.js'
import { ROOM_SIZE } from '../../../utils/roomMovement.js'

// A sala é desenhada em unidades da sala (1080x768), de cima para baixo.
// As faixas (y) foram medidas na imagem de referência.
const TOP_WALL_END = 72
const BEAM_TOP = 84
const BRICKS_TOP = 116
const BRICKS_END = 201
const FLOOR_TOP = 235
const FLOOR_END = 747 // o piso é mais fundo que na imagem de referência (662): a sala é maior

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
// visible = parte da sala que aparece na tela (veja getVisibleRoom): em tela mais larga ou mais alta
// que a sala, as paredes, o piso e o chão se estendem até a borda da tela, sem faixa vazia.
export function drawRoom(ctx, visible = { left: 0, top: 0, right: ROOM_SIZE.width, bottom: ROOM_SIZE.height }) {
  // Nunca menor que a sala, e com 1 unidade de folga para não aparecer fresta na borda da tela
  const area = {
    left: Math.min(0, visible.left) - 1,
    top: Math.min(0, visible.top) - 1,
    right: Math.max(ROOM_SIZE.width, visible.right) + 1,
    bottom: Math.max(ROOM_SIZE.height, visible.bottom) + 1,
  }
  // Tijolos e tábuas começam um pouco fora da área; o recorte evita que vazem
  ctx.save()
  ctx.beginPath()
  ctx.rect(area.left, area.top, area.right - area.left, area.bottom - area.top)
  ctx.clip()
  drawTopWall(ctx, area)
  drawBricks(ctx, area)
  drawLowerBeam(ctx, area)
  drawFloor(ctx, area)
  drawBaseboard(ctx, area)
  ctx.restore()
}

// Parede escura de cima, com painéis, e a viga que separa dos tijolos
function drawTopWall(ctx, { left, top, right }) {
  const width = right - left
  rect(ctx, COLORS.topWall, left, top, width, TOP_WALL_END - top)
  for (let i = Math.floor((left - 20) / 68), x = 20 + i * 68; x < right; i++, x += 68) {
    rect(ctx, i % 2 ? COLORS.topPanelB : COLORS.topPanelA, x, 12, 46, TOP_WALL_END - 12)
  }
  rect(ctx, COLORS.beam, left, TOP_WALL_END, width, BRICKS_TOP - TOP_WALL_END)
  rect(ctx, COLORS.beamLight, left, BEAM_TOP, width, 3)
}

// Parede de tijolos: fiadas de 24 px, cada uma deslocada meio tijolo
function drawBricks(ctx, { left, right }) {
  const width = right - left
  rect(ctx, COLORS.brickC, left, BRICKS_TOP, width, BRICKS_END - BRICKS_TOP)
  for (let row = 0, y = BRICKS_TOP + 13 - BRICK_ROW_HEIGHT; y < BRICKS_END; row++, y += BRICK_ROW_HEIGHT) {
    const top = Math.max(y, BRICKS_TOP)
    const height = Math.min(y + BRICK_ROW_HEIGHT, BRICKS_END) - top
    const shift = (row % 2) * (BRICK_WIDTH / 2)
    // col pode ser negativo (tijolos à esquerda da sala): só serve de semente da cor
    for (let col = Math.floor((left + shift) / BRICK_WIDTH), x = col * BRICK_WIDTH - shift; x < right; x += BRICK_WIDTH, col++) {
      rect(ctx, pick(BRICK_COLORS, row * 31 + col + 1), x + 1, top + 1, BRICK_WIDTH - 2, height - 2)
    }
    rect(ctx, COLORS.mortar, left, y + BRICK_ROW_HEIGHT - 2, width, 3)
  }
}

function drawLowerBeam(ctx, { left, right }) {
  rect(ctx, COLORS.beamBase, left, BRICKS_END, right - left, FLOOR_TOP - BRICKS_END)
  rect(ctx, COLORS.beamShadow, left, 209, right - left, 5)
}

// Piso de tábuas verticais com juntas escuras e uma luz quente no meio
function drawFloor(ctx, { left: areaLeft, right }) {
  const width = right - areaLeft
  const height = FLOOR_END - FLOOR_TOP
  for (let plank = Math.floor((areaLeft - FIRST_JOINT_X) / PLANK_WIDTH) - 1; ; plank++) {
    const x = FIRST_JOINT_X + plank * PLANK_WIDTH
    if (x > right) break
    const left = Math.round(x)
    rect(ctx, pick(FLOOR_COLORS, plank + 40), left, FLOOR_TOP, Math.round(x + PLANK_WIDTH) - left, height)
    // Uma emenda horizontal por tábua, em alturas diferentes
    rect(ctx, COLORS.floorJoint, left, FLOOR_TOP + 60 + Math.floor(noise(plank + 7) * 300), Math.round(PLANK_WIDTH), 2)
    rect(ctx, COLORS.floorJoint, left, FLOOR_TOP, 3, height)
  }

  ctx.save()
  ctx.beginPath()
  ctx.rect(areaLeft, FLOOR_TOP, width, height)
  ctx.clip()

  // A luz e a sombra continuam centradas na sala, e não na tela
  const light = ctx.createRadialGradient(FLOOR_LIGHT.x, FLOOR_LIGHT.y, 10, FLOOR_LIGHT.x, FLOOR_LIGHT.y, FLOOR_LIGHT.radius)
  light.addColorStop(0, 'rgba(170, 118, 70, 0.30)')
  light.addColorStop(1, 'rgba(170, 118, 70, 0)')
  ctx.fillStyle = light
  ctx.fillRect(areaLeft, FLOOR_TOP, width, height)

  const shade = ctx.createRadialGradient(ROOM_SIZE.width / 2, 475, 245, ROOM_SIZE.width / 2, 475, 800)
  shade.addColorStop(0, 'rgba(0, 0, 0, 0)')
  shade.addColorStop(1, 'rgba(0, 0, 0, 0.40)')
  ctx.fillStyle = shade
  ctx.fillRect(areaLeft, FLOOR_TOP, width, height)
  ctx.restore()
}

// Rodapé de lajotas, que desce até a borda da tela (sem faixa escura embaixo)
function drawBaseboard(ctx, { left, right, bottom }) {
  const width = right - left
  rect(ctx, COLORS.baseboard, left, FLOOR_END, width, bottom - FLOOR_END)
  for (let x = Math.floor(left / 80) * 80; x < right; x += 80) {
    rect(ctx, COLORS.baseboardLine, x, FLOOR_END, 2, bottom - FLOOR_END)
  }
  rect(ctx, COLORS.beamShadow, left, FLOOR_END, width, 3)
}
