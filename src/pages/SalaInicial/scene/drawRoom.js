import { noise, rect } from '../../../utils/canvas.js'
import { FLOOR_LIGHT } from './colors.js'
import { ROOM_THEMES } from './themes.js'
import { drawWallPattern } from './drawWallPattern.js'
import { drawFloorPattern } from './drawFloorPattern.js'
import { drawWallDecor } from './drawWallDecor.js'
import { ROOM_FLOOR, ROOM_SIZE } from '../../../utils/roomMovement.js'
import { ROOM_VIEW_BOTTOM_EXTRA } from './view.js'

// Desenho da sala, igual ao protótipo do Figma. A estrutura é a mesma em todos os andares e salas especiais;
// o tema troca as cores, o padrão da parede e do piso e os enfeites (themes.js).
// A sala é desenhada em unidades da sala (1600x853), de cima para baixo. As faixas (y) foram medidas no protótipo.
const W = ROOM_SIZE.width
// O desenho desce além da sala: o rodapé e as paredes laterais continuam na faixa dos enfeites da porta de baixo
const H = ROOM_SIZE.height + ROOM_VIEW_BOTTOM_EXTRA
const TOP_WALL_END = 85
const BEAM_TOP = 91
const BRICKS_TOP = 134
const BRICKS_END = 226
const LOWER_BEAM_END = ROOM_FLOOR.top
const FLOOR_END = ROOM_FLOOR.bottom

const SIDE_STONE = 75 // largura da pedra, da borda da sala até a coluna (que vai até ROOM_FLOOR.left)
const STONE_WIDTH = 75
const STONE_HEIGHT = 85
const EDGE_DARKNESS = 0.55 // escurecimento na borda da tela: nunca chega ao preto
const WALL_SHADOW = 0.4 // sombra que a parede projeta no piso, encostada nas paredes laterais
const WALL_SHADOW_WIDTH = 45 // até onde essa sombra vai, a partir da parede
const TOP_SHADOW = 0.4 // sombra que a parede de cima projeta no piso
const TOP_SHADOW_HEIGHT = 45
const VIGNETTE = 0.4 // escurecimento do piso nos cantos, para o centro parecer iluminado
const STONE_SHADE = 0.45 // quanto da sombra do piso (de cima para baixo) a pedra recebe: embaixo fica ×0,62, como no protótipo

function pick(colors, seed) {
  return colors[Math.floor(noise(seed) * colors.length)]
}

// Desenha a sala inteira. O ctx já vem com a escala e o deslocamento da tela.
// extraX = sobra da tela de cada lado, em unidades da sala: as paredes laterais continuam até a borda da tela.
// theme = chave de ROOM_THEMES: o andar ('cantina', 'cucina', ...) ou o tipo da sala especial ('chefe', 'loja', ...).
export function drawRoom(ctx, extraX = 0, theme = 'cantina') {
  const palette = ROOM_THEMES[theme]
  const area = { left: -extraX, right: W + extraX }
  // Tijolos e tábuas começam um pouco fora da área; o recorte evita que vazem
  ctx.save()
  ctx.beginPath()
  ctx.rect(area.left, 0, area.right - area.left, H)
  ctx.clip()
  drawTopWall(ctx, area, palette)
  drawInnerWall(ctx, palette)
  drawWallDecor(ctx, theme, palette)
  drawBaseboard(ctx, area, palette)
  drawSideWalls(ctx, area, palette)
  ctx.restore()
}

// Parede escura de cima, com painéis, e a viga que separa da faixa de parede
function drawTopWall(ctx, { left, right }, palette) {
  const width = right - left
  rect(ctx, palette.top, left, 0, width, TOP_WALL_END)
  for (let i = Math.floor((left - 20) / 68), x = 20 + i * 68; x < right; i++, x += 68) {
    rect(ctx, i % 2 ? palette.panelB : palette.panelA, x, 12, 46, TOP_WALL_END - 12)
  }
  rect(ctx, palette.beam, left, TOP_WALL_END, width, BEAM_TOP + 40 - TOP_WALL_END)
  rect(ctx, palette.beamLight, left, BEAM_TOP, width, 3)
}

// Entre as colunas laterais: faixa de parede, viga de baixo e piso
function drawInnerWall(ctx, palette) {
  const { left, right, top } = ROOM_FLOOR
  ctx.save()
  ctx.beginPath()
  ctx.rect(left, 0, right - left, H)
  ctx.clip()
  drawWallPattern(ctx, palette, { left, right, top: BRICKS_TOP, bottom: BRICKS_END })
  drawLowerBeam(ctx, palette)
  drawFloorPattern(ctx, palette, { left, right, top, bottom: FLOOR_END })
  drawFloorLight(ctx, palette)
  ctx.restore()
}

function drawLowerBeam(ctx, palette) {
  const { left, right } = ROOM_FLOOR
  rect(ctx, palette.beamBase, left, BRICKS_END, right - left, LOWER_BEAM_END - BRICKS_END)
  rect(ctx, palette.beamShadow, left, BRICKS_END + 8, right - left, 5)
}

// Por cima do padrão do piso: a luz do tema no alto, sombras das paredes e escuro nos cantos e embaixo
function drawFloorLight(ctx, palette) {
  const { left: floorLeft, right, top } = ROOM_FLOOR
  const width = right - floorLeft
  const height = FLOOR_END - top

  const light = ctx.createRadialGradient(FLOOR_LIGHT.x, FLOOR_LIGHT.y, 10, FLOOR_LIGHT.x, FLOOR_LIGHT.y, FLOOR_LIGHT.radius)
  light.addColorStop(0, `rgba(${palette.glow}, 0.30)`)
  light.addColorStop(1, `rgba(${palette.glow}, 0)`)
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

// Rodapé de lajotas em duas fiadas: a da sala (até a borda dela) e a de baixo, com as juntas desencontradas,
// que desce até a borda da tela (sem faixa escura embaixo). A porta de baixo e o enfeite dela ficam sobre ele.
function drawBaseboard(ctx, { left, right }, palette) {
  const width = right - left
  const roomEnd = ROOM_SIZE.height
  rect(ctx, palette.base, left, FLOOR_END, width, H - FLOOR_END)
  for (let x = Math.floor(left / 80) * 80; x < right; x += 80) {
    rect(ctx, palette.baseLine, x, FLOOR_END, 2, roomEnd - FLOOR_END)
    rect(ctx, palette.baseLine, x + 40, roomEnd, 2, H - roomEnd)
  }
  rect(ctx, palette.baseLine, left, roomEnd, width, 2)
  rect(ctx, palette.beamShadow, left, FLOOR_END, width, 3)
}

// Paredes laterais: blocos de pedra em fiadas deslocadas e uma coluna junto do piso.
// Escurecem em direção à borda da tela, mas só até EDGE_DARKNESS (não chegam ao preto).
function drawSideWalls(ctx, area, palette) {
  for (const side of ['left', 'right']) {
    // Desenha a esquerda e espelha para a direita
    ctx.save()
    if (side === 'right') ctx.transform(-1, 0, 0, 1, W, 0)
    const edge = side === 'left' ? area.left : W - area.right // x da borda da tela, já espelhado

    drawStone(ctx, edge, side === 'left' ? 0 : 50, palette)
    drawPost(ctx, palette)

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
function drawStone(ctx, edge, seedOffset, palette) {
  const stoneColors = [palette.stoneA, palette.stoneB]
  rect(ctx, palette.mortar, edge, 0, SIDE_STONE - edge, H)
  for (let row = 0, y = 0; y < H; row++, y += STONE_HEIGHT) {
    const shift = (row % 2) * (STONE_WIDTH / 2)
    // col pode ser negativo (blocos além da borda da sala): só serve de semente da cor
    for (let col = Math.floor((edge + shift) / STONE_WIDTH), x = col * STONE_WIDTH - shift; x < SIDE_STONE; x += STONE_WIDTH, col++) {
      const left = Math.max(x, edge)
      const right = Math.min(x + STONE_WIDTH, SIDE_STONE)
      rect(ctx, pick(stoneColors, row * 17 + col + seedOffset + 100), left + 1, y + 1, right - left - 2, Math.min(STONE_HEIGHT, H - y) - 2)
    }
  }
}

// Coluna entre a pedra e o piso: um degradê do tom da pedra até o do piso, sem degrau nas bordas
function drawPost(ctx, palette) {
  const top = BEAM_TOP + 40
  const post = ctx.createLinearGradient(SIDE_STONE, 0, ROOM_FLOOR.left, 0)
  post.addColorStop(0, palette.post)
  post.addColorStop(1, palette.postLight)
  rect(ctx, post, SIDE_STONE, top, ROOM_FLOOR.left - SIDE_STONE, FLOOR_END - top)
}
