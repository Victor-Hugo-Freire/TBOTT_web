import { ellipse, polygon } from '../../../utils/canvas.js'
import { HITS_TO_OPEN } from '../../../utils/doors.js'
import { forEachTextPixel, getTextWidth, SMALL_FONT } from '../../../utils/pixelFont.js'

// Tambor do Tung, que aparece no centro da sala do chefe. É desenho novo (não existe na pesquisa),
// no estilo dos obstáculos do protótipo: cores quentes da cantina e contorno escuro.
// Tudo em unidades da sala. Os pés do tambor ficam no meio da borda de baixo da caixa sólida (box).
const OUTLINE = '#140806'
const OUTLINE_WIDTH = 3

const DRUM_RADIUS_X = 40 // meia largura do corpo
const DRUM_RADIUS_Y = 11 // achatamento das bocas (o tambor é visto um pouco de cima)
const DRUM_TOP = 100 // altura da boca de cima, acima dos pés
const DRUM_BOTTOM = 38 // altura da boca de baixo, acima dos pés (abaixo dela só o suporte)
const HOOP_HEIGHT = 9 // altura dos aros de cima e de baixo
const CORD_COUNT = 8 // quantas cordas cruzadas na frente do corpo

const COLORS = {
  shell: '#8a4424',
  shellLight: '#b0663a',
  shellDark: '#5a2a16',
  hoop: '#3a2010',
  stud: '#d8a848',
  cord: '#e8d8b0',
  skin: '#ead6a8',
  skinDark: '#c8aa76',
  leg: '#4a2c16',
  legBack: '#2e1a0c',
}

const TEXT_PIXEL = 4 // tamanho do pixel da fonte do "TUNG", em unidades da sala
const TEXT_GAP = 14 // espaço entre a pele do tambor e o texto

// Desenha o tambor (sem o texto: o "TUNG" vem depois do jogador, com drawDrumText).
export function drawDrum(ctx, box) {
  const centerX = box.x + box.width / 2
  const feetY = box.y + box.height
  drawShadow(ctx, centerX, feetY)
  drawStand(ctx, centerX, feetY)
  drawBody(ctx, centerX, feetY)
}

// "TUNG" repetido hits vezes acima do tambor. Desenhado por último, por cima do jogador.
export function drawDrumText(ctx, box, hits) {
  if (hits <= 0) return
  const text = Array(Math.min(hits, HITS_TO_OPEN)).fill('TUNG').join(' ')
  const textHeight = 7 * TEXT_PIXEL
  const top = Math.round(box.y + box.height - DRUM_TOP - DRUM_RADIUS_Y - TEXT_GAP - textHeight)
  const left = Math.round(box.x + box.width / 2 - (getTextWidth(SMALL_FONT, text) * TEXT_PIXEL) / 2)
  // Igual ao contador de tempo (contorno escuro e branco por cima), mas cada camada vira um caminho só:
  // com a escala da tela quebrada, quadradinhos pintados um a um deixariam riscos entre eles.
  fillTextPixels(ctx, text, left, top, TEXT_PIXEL, 'rgba(20, 12, 8, 0.9)')
  fillTextPixels(ctx, text, left, top, 0, '#f4ece4')
}

// grow = quanto cada pixel cresce para cada lado (o contorno usa um pixel inteiro)
function fillTextPixels(ctx, text, left, top, grow, color) {
  ctx.beginPath()
  forEachTextPixel(SMALL_FONT, text, (col, row) => {
    ctx.rect(left + col * TEXT_PIXEL - grow, top + row * TEXT_PIXEL - grow, TEXT_PIXEL + grow * 2, TEXT_PIXEL + grow * 2)
  })
  ctx.fillStyle = color
  ctx.fill()
}

// Sombra no chão, puxada para a direita como a dos obstáculos (luz de cima e da esquerda)
function drawShadow(ctx, centerX, feetY) {
  ctx.globalAlpha = 0.3
  ellipse(ctx, '#000', centerX + 6, feetY - 2, 54, 10)
  ctx.globalAlpha = 1
}

// Suporte de três pés: um atrás (mais escuro) e dois abertos na frente
function drawStand(ctx, centerX, feetY) {
  const legTop = feetY - DRUM_BOTTOM
  fillWithOutline(ctx, COLORS.legBack, () => ctx.rect(centerX - 3, legTop, 6, DRUM_BOTTOM - 10))
  for (const direction of [-1, 1]) {
    const points = [
      [centerX + direction * 22, legTop],
      [centerX + direction * 30, legTop],
      [centerX + direction * 46, feetY],
      [centerX + direction * 38, feetY],
    ]
    fillWithOutline(ctx, COLORS.leg, () => tracePolygon(ctx, points))
    // Ponteira de metal no pé
    polygon(ctx, COLORS.stud, [
      [centerX + direction * 37, feetY - 4],
      [centerX + direction * 46, feetY - 4],
      [centerX + direction * 47, feetY],
      [centerX + direction * 37, feetY],
    ])
  }
}

// Corpo de madeira, aros, cordas cruzadas e a pele de couro em cima
function drawBody(ctx, centerX, feetY) {
  const topY = feetY - DRUM_TOP
  const bottomY = feetY - DRUM_BOTTOM

  // Corpo: a frente do cilindro, com luz na esquerda e sombra na direita
  fillWithOutline(ctx, COLORS.shell, () => traceFrontBand(ctx, centerX, topY, bottomY))
  ctx.save()
  traceFrontBand(ctx, centerX, topY, bottomY)
  ctx.clip()
  const shade = ctx.createLinearGradient(centerX - DRUM_RADIUS_X, 0, centerX + DRUM_RADIUS_X, 0)
  shade.addColorStop(0, COLORS.shellDark)
  shade.addColorStop(0.18, COLORS.shellLight)
  shade.addColorStop(0.45, COLORS.shell)
  shade.addColorStop(1, COLORS.shellDark)
  ctx.fillStyle = shade
  ctx.fillRect(centerX - DRUM_RADIUS_X, topY - DRUM_RADIUS_Y, DRUM_RADIUS_X * 2, bottomY - topY + DRUM_RADIUS_Y * 2)
  ctx.restore()

  drawCords(ctx, centerX, topY + HOOP_HEIGHT, bottomY - HOOP_HEIGHT)
  fillWithOutline(ctx, COLORS.hoop, () => traceFrontBand(ctx, centerX, bottomY - HOOP_HEIGHT, bottomY))
  fillWithOutline(ctx, COLORS.hoop, () => traceFrontBand(ctx, centerX, topY, topY + HOOP_HEIGHT))
  drawStuds(ctx, centerX, topY + HOOP_HEIGHT / 2)
  drawStuds(ctx, centerX, bottomY - HOOP_HEIGHT / 2)

  // Boca de cima: aro escuro e a pele clara, com a marca gasta no meio (onde o bastão bate)
  fillWithOutline(ctx, COLORS.hoop, () => ctx.ellipse(centerX, topY, DRUM_RADIUS_X, DRUM_RADIUS_Y, 0, 0, Math.PI * 2))
  ellipse(ctx, COLORS.skinDark, centerX, topY + 1, DRUM_RADIUS_X - 4, DRUM_RADIUS_Y - 3)
  ellipse(ctx, COLORS.skin, centerX - 1, topY, DRUM_RADIUS_X - 6, DRUM_RADIUS_Y - 4)
  ellipse(ctx, COLORS.skinDark, centerX + 2, topY + 1, 11, 3)
}

// Cordas em zigue-zague entre os aros. Os pontos seguem a curva da frente do cilindro.
function drawCords(ctx, centerX, topY, bottomY) {
  const points = []
  for (let i = 0; i <= CORD_COUNT; i++) {
    const angle = Math.PI * (1 - i / CORD_COUNT) // da esquerda (π) para a direita (0), passando pela frente
    const x = centerX + Math.cos(angle) * DRUM_RADIUS_X
    const curve = Math.sin(angle) * DRUM_RADIUS_Y
    points.push([x, (i % 2 === 0 ? topY : bottomY) + curve])
  }
  ctx.lineJoin = 'round'
  strokePath(ctx, points, OUTLINE, 5)
  strokePath(ctx, points, COLORS.cord, 2.5)
}

// Pregos de metal nos aros, nos mesmos ângulos das cordas
function drawStuds(ctx, centerX, y) {
  for (let i = 1; i < CORD_COUNT; i++) {
    const angle = Math.PI * (1 - i / CORD_COUNT)
    ellipse(ctx, COLORS.stud, centerX + Math.cos(angle) * DRUM_RADIUS_X, y + Math.sin(angle) * DRUM_RADIUS_Y, 2, 2)
  }
}

// Faixa da frente do cilindro entre as alturas topY e bottomY: as duas bordas são a metade de baixo das bocas
function traceFrontBand(ctx, centerX, topY, bottomY) {
  ctx.beginPath()
  ctx.ellipse(centerX, topY, DRUM_RADIUS_X, DRUM_RADIUS_Y, 0, Math.PI, 0, true)
  ctx.lineTo(centerX + DRUM_RADIUS_X, bottomY)
  ctx.ellipse(centerX, bottomY, DRUM_RADIUS_X, DRUM_RADIUS_Y, 0, 0, Math.PI)
  ctx.closePath()
}

function tracePolygon(ctx, points) {
  points.forEach(([x, y], index) => (index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)))
  ctx.closePath()
}

// Monta o caminho com trace, pinta o contorno escuro e depois o preenchimento por cima
function fillWithOutline(ctx, color, trace) {
  ctx.beginPath()
  trace()
  ctx.lineWidth = OUTLINE_WIDTH * 2
  ctx.lineJoin = 'round'
  ctx.strokeStyle = OUTLINE
  ctx.stroke()
  ctx.fillStyle = color
  ctx.fill()
}

function strokePath(ctx, points, color, width) {
  ctx.beginPath()
  points.forEach(([x, y], index) => (index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)))
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.stroke()
}
