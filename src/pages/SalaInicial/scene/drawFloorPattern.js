import { noise, rect } from '../../../utils/canvas.js'

// Padrão do piso, um por tema. Portado do floorFill() do protótipo da issue #18 e esticado para o piso da sala
// (no protótipo o piso tem 1160×548 px; aqui tem 1364×521 u). A luz e as sombras vêm depois, em drawRoom.js.
// floor = { left, right, top, bottom }: o piso, em unidades da sala.

const PLANK_WIDTH = 85.8
const FIRST_JOINT_X = 66
const CHECKER_COLUMNS = 20
const CHECKER_ROWS = 10
const COBBLE_ROW_HEIGHT = 32
const CONCRETE_SLAB = { width: 170, height: 130 }
const HAZARD_STRIPE = { length: 36, thickness: 12 }
const DOCK_BOARD_HEIGHT = 36
const DOCK_NAIL_GAP = 223
const SLAB = { width: 136, height: 87 }

function pick(colors, seed) {
  return colors[Math.floor(noise(seed) * colors.length)]
}

export function drawFloorPattern(ctx, theme, floor) {
  const draw = { planks: drawPlanks, checker: drawChecker, cobble: drawCobble, concrete: drawConcrete, dock: drawDock, slabs: drawSlabs }
  ctx.save()
  ctx.beginPath()
  ctx.rect(floor.left, floor.top, floor.right - floor.left, floor.bottom - floor.top)
  ctx.clip()
  draw[theme.floor](ctx, theme, floor)
  ctx.restore()
}

// Tábuas verticais com juntas escuras e uma emenda horizontal por tábua, em alturas diferentes (o piso da Cantina)
function drawPlanks(ctx, theme, { left: floorLeft, right, top, bottom }) {
  const height = bottom - top
  for (let plank = Math.floor((floorLeft - FIRST_JOINT_X) / PLANK_WIDTH) - 1; ; plank++) {
    const x = FIRST_JOINT_X + plank * PLANK_WIDTH
    if (x > right) break
    const left = Math.round(x)
    rect(ctx, pick(theme.floorCols, plank + 40), left, top, Math.round(x + PLANK_WIDTH) - left, height)
    rect(ctx, theme.joint, left, top + 60 + Math.floor(noise(plank + 7) * 300), Math.round(PLANK_WIDTH), 2)
    rect(ctx, theme.joint, left, top, 3, height)
  }
}

// Xadrez de duas cores, com uma variação leve em cada casa e linhas finas entre elas
function drawChecker(ctx, theme, { left, right, top, bottom }) {
  const width = right - left
  const height = bottom - top
  const tileWidth = width / CHECKER_COLUMNS
  const tileHeight = height / CHECKER_ROWS
  rect(ctx, theme.floorCols[0], left, top, width, height)
  for (let row = 0; row < CHECKER_ROWS; row++) {
    for (let col = 0; col < CHECKER_COLUMNS; col++) {
      const x = left + col * tileWidth
      const y = top + row * tileHeight
      if ((col + row) % 2) rect(ctx, theme.floorCols[1], x, y, tileWidth, tileHeight)
      const tint = noise(col * 13 + row * 7) > 0.5 ? 'rgba(255, 255, 255, 0.035)' : 'rgba(0, 0, 0, 0.035)'
      rect(ctx, tint, x, y, tileWidth, tileHeight)
    }
  }
  for (let col = 0; col <= CHECKER_COLUMNS; col++) rect(ctx, 'rgba(0, 0, 0, 0.18)', left + col * tileWidth - 1, top, 2, height)
  for (let row = 0; row <= CHECKER_ROWS; row++) rect(ctx, 'rgba(0, 0, 0, 0.18)', left, top + row * tileHeight - 1, width, 2)
}

// Paralelepípedos: fileiras de pedras de larguras sorteadas, cada fileira começando num ponto diferente
function drawCobble(ctx, theme, { left, right, top, bottom }) {
  rect(ctx, theme.joint, left, top, right - left, bottom - top)
  for (let row = 0, y = top; y < bottom; row++, y += COBBLE_ROW_HEIGHT) {
    for (let col = 0, x = left - noise(row) * 47; x < right; col++) {
      const width = 47 + noise(row * 17 + col) * 35
      rect(ctx, pick(theme.floorCols, row * 53 + col), x + 2, y + 2, width - 4, COBBLE_ROW_HEIGHT - 4)
      rect(ctx, 'rgba(255, 255, 255, 0.07)', x + 2, y + 2, width - 4, 3)
      x += width
    }
  }
}

// Concreto de fábrica: placas com juntas, manchas e uma faixa de alerta amarela e preta na borda
function drawConcrete(ctx, theme, { left, right, top, bottom }) {
  const width = right - left
  const height = bottom - top
  rect(ctx, theme.floorCols[0], left, top, width, height)
  for (let x = left + CONCRETE_SLAB.width; x < right; x += CONCRETE_SLAB.width) rect(ctx, theme.joint, x, top, 3, height)
  for (let y = top + CONCRETE_SLAB.height; y < bottom; y += CONCRETE_SLAB.height) rect(ctx, theme.joint, left, y, width, 3)
  ctx.globalAlpha = 0.55
  for (let stain = 0; stain < 14; stain++) {
    rect(ctx, theme.floorCols[1], left + noise(stain) * width, top + noise(stain + 50) * height, 47 + noise(stain + 9) * 106, 17 + noise(stain + 3) * 28)
  }
  ctx.globalAlpha = 1

  const { length, thickness } = HAZARD_STRIPE
  for (let index = 0, x = left; x < right; index++, x += length) {
    const color = index % 2 ? '#c8a020' : '#1a1a1a'
    rect(ctx, color, x, top, length, thickness)
    rect(ctx, color, x, bottom - thickness, length, thickness)
  }
  for (let index = 0, y = top; y < bottom; index++, y += length) {
    const color = index % 2 ? '#c8a020' : '#1a1a1a'
    rect(ctx, color, left, y, thickness, length)
    rect(ctx, color, right - thickness, y, thickness, length)
  }
}

// Doca do porto: tábuas deitadas, cada uma de um tom, com a junta em cima e pregos espaçados
function drawDock(ctx, theme, { left, right, top, bottom }) {
  for (let row = 0, y = top; y < bottom; row++, y += DOCK_BOARD_HEIGHT) {
    rect(ctx, pick(theme.floorCols, row * 7 + 2), left, y, right - left, DOCK_BOARD_HEIGHT)
    rect(ctx, theme.joint, left, y, right - left, 3)
    for (let x = left + noise(row) * DOCK_NAIL_GAP; x < right; x += DOCK_NAIL_GAP) rect(ctx, '#1a1008', x, y + 17, 3, 3)
  }
}

// Lajes de pedra em fileiras deslocadas meia laje, sobre o rejunte
function drawSlabs(ctx, theme, { left, right, top, bottom }) {
  rect(ctx, theme.joint, left, top, right - left, bottom - top)
  for (let row = 0, y = top; y < bottom; row++, y += SLAB.height) {
    for (let col = 0, x = left - (row % 2) * (SLAB.width / 2); x < right; col++, x += SLAB.width) {
      rect(ctx, pick(theme.floorCols, row * 19 + col), x + 2, y + 2, SLAB.width - 4, SLAB.height - 4)
      rect(ctx, 'rgba(255, 255, 255, 0.05)', x + 2, y + 2, SLAB.width - 4, 3)
    }
  }
}
