import { noise, rect } from '../../../utils/canvas.js'
import { COLORS, FLOOR_LIGHT } from './colors.js'
import { ROOM_FLOOR, ROOM_SIZE } from '../../../utils/roomMovement.js'

// Desenho da sala inicial, igual ao protótipo do Figma. As outras salas do andar terão desenho próprio (issue #18).
// A sala é desenhada em unidades da sala (1600x853), de cima para baixo. As faixas (y) foram medidas no protótipo.
const W = ROOM_SIZE.width
const H = ROOM_SIZE.height
const TOP_WALL_END = 85
const BEAM_TOP = 91
const BRICKS_TOP = 134
const BRICKS_END = 226
const LOWER_BEAM_END = ROOM_FLOOR.top
const FLOOR_END = ROOM_FLOOR.bottom

const SIDE_STONE = 75 // largura da pedra, da borda da sala até a coluna (que vai até ROOM_FLOOR.left)
const STONE_WIDTH = 75
const STONE_HEIGHT = 85
const BRICK_ROW_HEIGHT = 23
const BRICK_WIDTH = 56
const PLANK_WIDTH = 85.8
const FIRST_JOINT_X = 66
const EDGE_DARKNESS = 0.55 // escurecimento na borda da tela: nunca chega ao preto
const WALL_SHADOW = 0.4 // sombra que a parede projeta no piso, encostada nas paredes laterais
const WALL_SHADOW_WIDTH = 45 // até onde essa sombra vai, a partir da parede
const TOP_SHADOW = 0.4 // sombra que a parede de cima projeta no piso
const TOP_SHADOW_HEIGHT = 45
const VIGNETTE = 0.4 // escurecimento do piso nos cantos, para o centro parecer iluminado
const STONE_SHADE = 0.45 // quanto da sombra do piso (de cima para baixo) a pedra recebe: embaixo fica ×0,62, como no protótipo

const BRICK_COLORS = [COLORS.brickA, COLORS.brickB, COLORS.brickC]
const STONE_COLORS = [COLORS.stoneA, COLORS.stoneB]
const FLOOR_COLORS = [COLORS.floorA, COLORS.floorB, COLORS.floorC]

function pick(colors, seed) {
  return colors[Math.floor(noise(seed) * colors.length)]
}

// Desenha a sala inteira. O ctx já vem com a escala e o deslocamento da tela.
// extraX = sobra da tela de cada lado, em unidades da sala: as paredes laterais continuam até a borda da tela.
export function drawRoom(ctx, extraX = 0) {
  const area = { left: -extraX, right: W + extraX }
  // Tijolos e tábuas começam um pouco fora da área; o recorte evita que vazem
  ctx.save()
  ctx.beginPath()
  ctx.rect(area.left, 0, area.right - area.left, H)
  ctx.clip()
  drawTopWall(ctx, area)
  drawInnerWall(ctx)
  drawBaseboard(ctx, area)
  drawSideWalls(ctx, area)
  ctx.restore()
}

// Parede escura de cima, com painéis, e a viga que separa dos tijolos
function drawTopWall(ctx, { left, right }) {
  const width = right - left
  rect(ctx, COLORS.topWall, left, 0, width, TOP_WALL_END)
  for (let i = Math.floor((left - 20) / 68), x = 20 + i * 68; x < right; i++, x += 68) {
    rect(ctx, i % 2 ? COLORS.topPanelB : COLORS.topPanelA, x, 12, 46, TOP_WALL_END - 12)
  }
  rect(ctx, COLORS.beam, left, TOP_WALL_END, width, BEAM_TOP + 40 - TOP_WALL_END)
  rect(ctx, COLORS.beamLight, left, BEAM_TOP, width, 3)
}

// Entre as colunas laterais: tijolos, viga de baixo e piso
function drawInnerWall(ctx) {
  ctx.save()
  ctx.beginPath()
  ctx.rect(ROOM_FLOOR.left, 0, ROOM_FLOOR.right - ROOM_FLOOR.left, H)
  ctx.clip()
  drawBricks(ctx)
  drawLowerBeam(ctx)
  drawFloor(ctx)
  ctx.restore()
}

// Parede de tijolos: fiadas deslocadas meio tijolo
function drawBricks(ctx) {
  const left = ROOM_FLOOR.left
  const right = ROOM_FLOOR.right
  rect(ctx, COLORS.brickC, left, BRICKS_TOP, right - left, BRICKS_END - BRICKS_TOP)
  for (let row = 0, y = BRICKS_TOP; y < BRICKS_END; row++, y += BRICK_ROW_HEIGHT) {
    const height = Math.min(BRICK_ROW_HEIGHT, BRICKS_END - y)
    const shift = (row % 2) * (BRICK_WIDTH / 2)
    for (let col = Math.floor((left + shift) / BRICK_WIDTH), x = col * BRICK_WIDTH - shift; x < right; x += BRICK_WIDTH, col++) {
      rect(ctx, pick(BRICK_COLORS, row * 31 + col + 1), x + 1, y + 1, BRICK_WIDTH - 2, height - 2)
    }
    rect(ctx, COLORS.mortar, left, y + height - 2, right - left, 3)
  }
}

function drawLowerBeam(ctx) {
  const { left, right } = ROOM_FLOOR
  rect(ctx, COLORS.beamBase, left, BRICKS_END, right - left, LOWER_BEAM_END - BRICKS_END)
  rect(ctx, COLORS.beamShadow, left, BRICKS_END + 8, right - left, 5)
}

// Piso de tábuas verticais com juntas escuras, uma luz quente no alto, sombras das paredes e escuro nos cantos e embaixo
function drawFloor(ctx) {
  const { left: floorLeft, right, top } = ROOM_FLOOR
  const width = right - floorLeft
  const height = FLOOR_END - top
  for (let plank = Math.floor((floorLeft - FIRST_JOINT_X) / PLANK_WIDTH) - 1; ; plank++) {
    const x = FIRST_JOINT_X + plank * PLANK_WIDTH
    if (x > right) break
    const left = Math.round(x)
    rect(ctx, pick(FLOOR_COLORS, plank + 40), left, top, Math.round(x + PLANK_WIDTH) - left, height)
    // Uma emenda horizontal por tábua, em alturas diferentes
    rect(ctx, COLORS.floorJoint, left, top + 60 + Math.floor(noise(plank + 7) * 300), Math.round(PLANK_WIDTH), 2)
    rect(ctx, COLORS.floorJoint, left, top, 3, height)
  }

  const light = ctx.createRadialGradient(FLOOR_LIGHT.x, FLOOR_LIGHT.y, 10, FLOOR_LIGHT.x, FLOOR_LIGHT.y, FLOOR_LIGHT.radius)
  light.addColorStop(0, 'rgba(170, 118, 70, 0.30)')
  light.addColorStop(1, 'rgba(170, 118, 70, 0)')
  rect(ctx, light, floorLeft, top, width, height)

  // Sombra suave junto das paredes laterais, dos dois lados
  const fade = WALL_SHADOW_WIDTH / width
  const sides = ctx.createLinearGradient(floorLeft, 0, right, 0)
  sides.addColorStop(0, `rgba(0, 0, 0, ${WALL_SHADOW})`)
  sides.addColorStop(fade, 'rgba(0, 0, 0, 0)')
  sides.addColorStop(1 - fade, 'rgba(0, 0, 0, 0)')
  sides.addColorStop(1, `rgba(0, 0, 0, ${WALL_SHADOW})`)
  rect(ctx, sides, floorLeft, top, width, height)

  // Sombra da parede de cima, que cai sobre o piso logo abaixo da viga
  const topShadow = ctx.createLinearGradient(0, top, 0, top + TOP_SHADOW_HEIGHT)
  topShadow.addColorStop(0, `rgba(0, 0, 0, ${TOP_SHADOW})`)
  topShadow.addColorStop(1, 'rgba(0, 0, 0, 0)')
  rect(ctx, topShadow, floorLeft, top, width, TOP_SHADOW_HEIGHT)

  // Vinheta: o centro do piso fica iluminado e os cantos escurecem
  const centerX = (floorLeft + right) / 2
  const centerY = (top + FLOOR_END) / 2
  const vignette = ctx.createRadialGradient(centerX, centerY, 300, centerX, centerY, 780)
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)')
  vignette.addColorStop(1, `rgba(0, 0, 0, ${VIGNETTE})`)
  rect(ctx, vignette, floorLeft, top, width, height)

  rect(ctx, getFloorShade(ctx), floorLeft, top, width, height)
}

// Escuro de cima para baixo no piso. As paredes laterais usam a mesma sombra, para escurecer junto com o piso.
function getFloorShade(ctx) {
  const shade = ctx.createLinearGradient(0, ROOM_FLOOR.top, 0, FLOOR_END)
  shade.addColorStop(0, 'rgba(0, 0, 0, 0)')
  shade.addColorStop(0.3, 'rgba(0, 0, 0, 0.1)')
  shade.addColorStop(0.65, 'rgba(0, 0, 0, 0.5)')
  shade.addColorStop(1, 'rgba(0, 0, 0, 0.85)')
  return shade
}

// Rodapé de lajotas, que desce até a borda da tela (sem faixa escura embaixo)
function drawBaseboard(ctx, { left, right }) {
  const width = right - left
  rect(ctx, COLORS.baseboard, left, FLOOR_END, width, H - FLOOR_END)
  for (let x = Math.floor(left / 80) * 80; x < right; x += 80) {
    rect(ctx, COLORS.baseboardLine, x, FLOOR_END, 2, H - FLOOR_END)
  }
  rect(ctx, COLORS.beamShadow, left, FLOOR_END, width, 3)
}

// Paredes laterais: blocos de pedra em fiadas deslocadas e uma coluna junto do piso.
// Escurecem em direção à borda da tela, mas só até EDGE_DARKNESS (não chegam ao preto).
function drawSideWalls(ctx, area) {
  for (const side of ['left', 'right']) {
    // Desenha a esquerda e espelha para a direita
    ctx.save()
    if (side === 'right') ctx.transform(-1, 0, 0, 1, W, 0)
    const edge = side === 'left' ? area.left : W - area.right // x da borda da tela, já espelhado

    drawStone(ctx, edge, side === 'left' ? 0 : 50)
    drawPost(ctx)

    // Escurecem para baixo junto com o piso: a coluna igual ao piso e a pedra só em parte.
    // Abaixo do piso, a sombra fica no último tom (a pedra não clareia de novo no rodapé).
    const shade = getFloorShade(ctx)
    rect(ctx, shade, SIDE_STONE, ROOM_FLOOR.top, ROOM_FLOOR.left - SIDE_STONE, FLOOR_END - ROOM_FLOOR.top)
    ctx.globalAlpha = STONE_SHADE
    rect(ctx, shade, edge, ROOM_FLOOR.top, SIDE_STONE - edge, H - ROOM_FLOOR.top)
    ctx.globalAlpha = 1

    const dark = ctx.createLinearGradient(SIDE_STONE, 0, edge, 0)
    dark.addColorStop(0, 'rgba(0, 0, 0, 0)')
    dark.addColorStop(1, `rgba(0, 0, 0, ${EDGE_DARKNESS})`)
    ctx.fillStyle = dark
    ctx.fillRect(edge, 0, ROOM_FLOOR.left - edge, H)
    ctx.restore()
  }
}

// Blocos de pedra da borda da tela até SIDE_STONE, na altura toda
function drawStone(ctx, edge, seedOffset) {
  rect(ctx, COLORS.mortar, edge, 0, SIDE_STONE - edge, H)
  for (let row = 0, y = 0; y < H; row++, y += STONE_HEIGHT) {
    const shift = (row % 2) * (STONE_WIDTH / 2)
    // col pode ser negativo (blocos além da borda da sala): só serve de semente da cor
    for (let col = Math.floor((edge + shift) / STONE_WIDTH), x = col * STONE_WIDTH - shift; x < SIDE_STONE; x += STONE_WIDTH, col++) {
      const left = Math.max(x, edge)
      const right = Math.min(x + STONE_WIDTH, SIDE_STONE)
      rect(ctx, pick(STONE_COLORS, row * 17 + col + seedOffset + 100), left + 1, y + 1, right - left - 2, Math.min(STONE_HEIGHT, H - y) - 2)
    }
  }
}

// Coluna entre a pedra e o piso: um degradê do tom da pedra até o do piso, sem degrau nas bordas
function drawPost(ctx) {
  const top = BEAM_TOP + 40
  const post = ctx.createLinearGradient(SIDE_STONE, 0, ROOM_FLOOR.left, 0)
  post.addColorStop(0, COLORS.post)
  post.addColorStop(1, COLORS.postLight)
  rect(ctx, post, SIDE_STONE, top, ROOM_FLOOR.left - SIDE_STONE, FLOOR_END - top)
}
