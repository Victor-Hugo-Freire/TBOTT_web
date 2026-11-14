import { ellipse, polygon, rect } from '../../../utils/canvas.js'
import { getCellRect } from '../../../utils/roomLayout.js'
import { getSharkFinPosition, PUDDLE } from '../../../utils/roomInteractions.js'
import { drawSharkFin } from './drawShark.js'

// Cenário das 9 salas especiais, portado do especial() e de SALAS do protótipo da issue #18
// (docs/referencias/prototipo-salas-issue-18/salas.js). Tudo em unidades da sala (1600x853).
// Regras:
// - As peças que bloqueiam (balcão, mesa, piscina...) cobrem as casas X do layout do mesmo tipo
//   (src/data/roomLayouts.json). Por isso elas são posicionadas com getCellRect: se a casa X mudar, o desenho vai junto.
// - Nada é desenhado nas casas de porta (6,0), (6,6), (0,3) e (12,3), além do piso.
// - Peças de parede ficam na faixa de parede (y 134..226) e nos painéis de cima, longe da porta de cima
//   (x 690..910) e do contador de tempo (alto do meio, y < 70).
// - Sem pedestal, item, preço ou texto: isso vem quando cada sala ganhar a sua função.

const OUTLINE = '#140806'
const OUTLINE_WIDTH = 5 // contorno dos móveis (é traçado em cima da peça: metade para dentro, metade para fora)

// Ícones 8x8 do protótipo (ICON de lib.js). Cada letra é uma cor de pal; '.' é transparente.
const ICONS = {
  boss: { pal: { 1: '#e84a3a', 2: '#f4c040' }, rows: ['1..11..1', '1.1111.1', '11111111', '11111111', '22222222', '22222222', '........', '........'] },
  bola: { pal: { 1: '#e04848', 2: '#f4f0e8' }, rows: ['..1111..', '.111111.', '11122111', '11222211', '11222211', '11122111', '.111111.', '..1111..'] },
  mascara: { pal: { 1: '#e8c860', 2: '#2a1810' }, rows: ['.111111.', '11111111', '12211221', '12211221', '11111111', '12222221', '.122221.', '..1111..'] },
}

const SCENERY = {
  chefe: drawBossRoom,
  tesouro: drawTreasureRoom,
  loja: drawShop,
  pacto: drawPactRoom,
  god: drawGodRoom,
  fliperama: drawArcade,
  palco: drawStage,
  adega: drawCellar,
  descanso: drawRestRoom,
}

// Desenha o cenário da sala especial, por cima do piso e por baixo das portas e do jogador.
// type = tipo da sala ('chefe', 'loja'...). Sala inicial e comum não têm cenário.
// options = { finMs, hideFin }: o relógio da barbatana do pacto (run.finMs, o mesmo da lógica do perigo) e se a
// barbatana parada some (quando o Tralalero está puxando o Tung, drawSharkGrab desenha a dele).
export function drawRoomScenery(ctx, type, options = {}) {
  const draw = SCENERY[type]
  if (!draw) return
  ctx.save()
  draw(ctx, options)
  ctx.restore()
}

// ---------- ajudantes ----------

// Retângulo que cobre as casas de (col0, row0) até (col1, row1), inclusive
function getCellsArea(col0, row0, col1, row1) {
  const first = getCellRect(col0, row0)
  const last = getCellRect(col1, row1)
  return { x: first.x, y: first.y, width: last.x + last.width - first.x, height: last.y + last.height - first.y }
}

function strokeEllipse(ctx, color, lineWidth, x, y, radiusX, radiusY) {
  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth
  ctx.beginPath()
  ctx.ellipse(x, y, radiusX, radiusY, 0, 0, Math.PI * 2)
  ctx.stroke()
}

// Contorno escuro, como o dos obstáculos, para os móveis se destacarem do piso
function outline(ctx, x, y, width, height) {
  ctx.strokeStyle = OUTLINE
  ctx.lineWidth = OUTLINE_WIDTH
  ctx.strokeRect(x, y, width, height)
}

// Contorno de um polígono (o mesmo traço do outline)
function outlinePolygon(ctx, points) {
  ctx.beginPath()
  points.forEach(([x, y], index) => (index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)))
  ctx.closePath()
  ctx.strokeStyle = OUTLINE
  ctx.lineWidth = OUTLINE_WIDTH
  ctx.lineJoin = 'round'
  ctx.stroke()
  ctx.lineJoin = 'miter'
}

function roundRect(ctx, color, x, y, width, height, radius) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.roundRect(x, y, width, height, radius)
  ctx.fill()
}

// Luz que some do centro para fora (chama, vela, abajur)
function glow(ctx, x, y, radius, rgb, alpha) {
  const light = ctx.createRadialGradient(x, y, 0, x, y, radius)
  light.addColorStop(0, `rgba(${rgb}, ${alpha})`)
  light.addColorStop(1, `rgba(${rgb}, 0)`)
  rect(ctx, light, x - radius, y - radius, radius * 2, radius * 2)
}

// Sombra achatada no chão, embaixo de um móvel
function floorShadow(ctx, x, y, radiusX, radiusY) {
  ellipse(ctx, 'rgba(0, 0, 0, 0.3)', x, y, radiusX, radiusY)
}

// Ícone 8x8 com contorno escuro (o BM do protótipo): primeiro o desenho em escuro deslocado
// meio pixel para os 4 lados, depois o desenho de verdade por cima
function drawIcon(ctx, icon, pixel, x, y) {
  const shift = pixel / 2
  for (const [dx, dy] of [[-shift, 0], [shift, 0], [0, -shift], [0, shift]]) paintIcon(ctx, icon, pixel, x + dx, y + dy, OUTLINE)
  paintIcon(ctx, icon, pixel, x, y)
}

// Pinta cada sequência de pixels iguais de uma linha como um retângulo só (evita frestas entre os pixels)
function paintIcon(ctx, icon, pixel, x, y, onlyColor) {
  icon.rows.forEach((row, j) => {
    for (let i = 0; i < row.length;) {
      const letter = row[i]
      let end = i
      while (end < row.length && row[end] === letter) end++
      if (letter !== '.') rect(ctx, onlyColor ?? icon.pal[letter], x + i * pixel, y + j * pixel, (end - i) * pixel, pixel)
      i = end
    }
  })
}

// ---------- Sala do Chefe: aro e coroa no piso, estandartes na parede e braseiros nos 4 cantos ----------

const BANNER_XS = [400, 588, 1012, 1200]
const BRAZIER_CELLS = [[0, 0], [12, 0], [0, 6], [12, 6]]
const FLOOR_CROWN = [[705, 460], [705, 365], [752, 412], [800, 351], [847, 412], [894, 365], [894, 460]]

function drawBossRoom(ctx) {
  // Pintura no piso: não bloqueia. O aro passa longe das casas de porta.
  strokeEllipse(ctx, 'rgba(138, 42, 32, 0.55)', 8, 800, 530, 500, 170)
  strokeEllipse(ctx, 'rgba(138, 42, 32, 0.4)', 3, 800, 530, 384, 130)
  polygon(ctx, 'rgba(138, 42, 32, 0.35)', FLOOR_CROWN)
  rect(ctx, 'rgba(168, 80, 30, 0.35)', 705, 441, 189, 19)

  for (const x of BANNER_XS) drawBanner(ctx, x)
  for (const [col, row] of BRAZIER_CELLS) drawBrazier(ctx, getCellRect(col, row))
}

// Estandarte vermelho pendurado na viga, com a coroa do chefe
function drawBanner(ctx, x) {
  rect(ctx, '#2a0c0a', x - 36, 96, 72, 6)
  rect(ctx, '#8a1a18', x - 30, 100, 60, 100)
  polygon(ctx, '#8a1a18', [[x - 30, 200], [x, 222], [x + 30, 200]])
  rect(ctx, 'rgba(0, 0, 0, 0.25)', x + 18, 102, 12, 98)
  drawIcon(ctx, ICONS.boss, 3.5, x - 14, 128)
}

// Braseiro de ferro sobre um bloco de pedra que ocupa a casa inteira
function drawBrazier(ctx, cell) {
  const centerX = cell.x + cell.width / 2
  const bottom = cell.y + cell.height - 2
  const left = cell.x + 4
  const width = cell.width - 8

  floorShadow(ctx, centerX + 6, bottom, width / 2, 8)
  rect(ctx, '#4a3e44', left, bottom - 40, width, 26)
  rect(ctx, '#2a2226', left, bottom - 14, width, 14)
  rect(ctx, 'rgba(255, 255, 255, 0.12)', left, bottom - 40, width, 3)
  outline(ctx, left, bottom - 40, width, 40)

  const feet = bottom - 26
  rect(ctx, '#2a2a2e', centerX - 26, feet - 8, 52, 8)
  rect(ctx, '#2a2a2e', centerX - 6, feet - 36, 12, 28)
  rect(ctx, '#3a3a40', centerX - 24, feet - 52, 48, 16)
  rect(ctx, '#2a2a2e', centerX - 34, feet - 66, 68, 14)
  outline(ctx, centerX - 34, feet - 66, 68, 14)
  ellipse(ctx, '#e05a20', centerX, feet - 66, 30, 5)

  // Chama por cima do braseiro
  const flameBase = feet - 64
  glow(ctx, centerX, flameBase - 20, 120, '255, 150, 50', 0.35)
  rect(ctx, '#e05a20', centerX - 17, flameBase - 34, 34, 34)
  rect(ctx, '#f0a030', centerX - 10, flameBase - 48, 20, 31)
  rect(ctx, '#ffe080', centerX - 4, flameBase - 39, 8, 20)
}

// ---------- Sala do Tesouro: duas prateleiras de potes de cada lado da porta de cima ----------

const JAR_COLORS = ['#c04030', '#d8a030', '#4a8a40', '#8a3a6a']
const TREASURE_SHELF_WIDTH = 236

function drawTreasureRoom(ctx) {
  const shelves = [[247, 176], [247, 218], [1117, 176], [1117, 218]]
  shelves.forEach(([x, y], index) => drawJarShelf(ctx, x, y, index))
}

function drawJarShelf(ctx, x, y, colorOffset) {
  for (let k = 0; k < 6; k++) {
    const jarX = x + 12 + k * 37
    rect(ctx, JAR_COLORS[(k + colorOffset) % JAR_COLORS.length], jarX, y - 24, 26, 24)
    rect(ctx, '#e8e0d0', jarX - 1, y - 28, 28, 4)
    rect(ctx, 'rgba(255, 255, 255, 0.25)', jarX + 4, y - 20, 3, 14)
  }
  rect(ctx, '#4a3018', x, y, TREASURE_SHELF_WIDTH, 8)
  rect(ctx, '#6a4a2a', x, y, TREASURE_SHELF_WIDTH, 2)
}

// ---------- Loja: toldo listrado, dois balcões (vão na porta de cima) e sacas de grãos nos cantos ----------

const AWNING_COLORS = ['#2f7a4a', '#e8e4d8', '#b03030']
const AWNING_STRIPE = 39

function drawShop(ctx) {
  drawAwning(ctx, 300, 690)
  drawAwning(ctx, 910, 1300)
  drawCounter(ctx, getCellsArea(3, 0, 5, 1))
  drawCounter(ctx, getCellsArea(7, 0, 9, 1))
  drawGrainSack(ctx, getCellRect(0, 6))
  drawGrainSack(ctx, getCellRect(12, 6))
}

// Toldo na faixa de parede: listras com a ponta redonda
function drawAwning(ctx, x0, x1) {
  rect(ctx, 'rgba(0, 0, 0, 0.25)', x0, 186, x1 - x0, 14)
  for (let k = 0, x = x0; x < x1; k++, x += AWNING_STRIPE) {
    const color = AWNING_COLORS[k % AWNING_COLORS.length]
    rect(ctx, color, x, 138, AWNING_STRIPE, 44)
    ellipse(ctx, color, x + AWNING_STRIPE / 2, 182, AWNING_STRIPE / 2, 10)
  }
  rect(ctx, '#3a2210', x0 - 4, 134, x1 - x0 + 8, 6)
}

// Balcão de madeira encostado na parede: o tampo cobre a primeira fileira e a frente cobre a segunda
function drawCounter(ctx, area) {
  const bottom = area.y + area.height
  const frontTop = bottom - 84
  rect(ctx, '#8a5a30', area.x, area.y, area.width, frontTop - area.y)
  rect(ctx, 'rgba(0, 0, 0, 0.15)', area.x, area.y, area.width, 12)
  rect(ctx, '#a87444', area.x, frontTop - 5, area.width, 5)
  rect(ctx, '#6a4220', area.x, frontTop, area.width, 84)
  for (let x = area.x + 52; x < area.x + area.width - 20; x += 52) rect(ctx, '#4a2e16', x, frontTop + 6, 3, 72)
  rect(ctx, '#3a2210', area.x, bottom - 5, area.width, 5)
  outline(ctx, area.x + 1.5, area.y + 1.5, area.width - 3, area.height - 3)

  // Dois potes de grãos de café em cima do tampo
  for (const x of [area.x + 70, area.x + area.width - 70]) drawBeanJar(ctx, x, frontTop - 8)
}

function drawBeanJar(ctx, x, bottom) {
  rect(ctx, 'rgba(220, 235, 240, 0.35)', x - 18, bottom - 34, 36, 34)
  rect(ctx, '#5a3018', x - 15, bottom - 22, 30, 20)
  for (let k = 0; k < 4; k++) ellipse(ctx, '#8a4a22', x - 10 + k * 7, bottom - 20 + (k % 2) * 6, 3.5, 2.5)
  rect(ctx, '#c09060', x - 19, bottom - 38, 38, 6)
  outline(ctx, x - 18, bottom - 34, 36, 34)
}

// Saca de grãos de café aberta, ocupando a casa
function drawGrainSack(ctx, cell) {
  const centerX = cell.x + cell.width / 2
  const bottom = cell.y + cell.height - 2
  floorShadow(ctx, centerX + 6, bottom - 2, 44, 8)
  roundRect(ctx, '#a8946a', cell.x + 10, cell.y + 6, cell.width - 20, cell.height - 8, 16)
  ctx.strokeStyle = OUTLINE
  ctx.lineWidth = OUTLINE_WIDTH
  ctx.stroke()
  rect(ctx, 'rgba(255, 255, 255, 0.15)', cell.x + 18, cell.y + 22, 6, cell.height - 34)
  rect(ctx, '#8a7650', cell.x + 18, cell.y + 2, cell.width - 36, 14)
  ellipse(ctx, '#4a2810', centerX, cell.y + 9, 30, 6)
  for (let k = 0; k < 5; k++) {
    const x = centerX - 20 + k * 10
    const y = cell.y + 6 + (k % 2) * 4
    ellipse(ctx, '#8a4a22', x, y, 5, 3.5)
    rect(ctx, '#3a1c0c', x - 0.5, y - 3, 1, 6)
  }
}

// ---------- Sala do Pacto: poça escura do Tralalero, com a barbatana contornando a borda, tênis de oferenda e bolhas ----------

const SNEAKER_XS = [470, 523, 576]
const BUBBLES = [[600, 330, 5], [1010, 350, 7], [700, 680, 6], [930, 660, 4]]

function drawPactRoom(ctx, { finMs = 0, hideFin = false }) {
  const { x, y, radiusX, radiusY } = PUDDLE

  // Poça oval (como no protótipo): contorno escuro, borda clara, água escura e anéis na água
  ellipse(ctx, OUTLINE, x, y, radiusX + OUTLINE_WIDTH, radiusY + OUTLINE_WIDTH)
  ellipse(ctx, '#2a6a8a', x, y, radiusX, radiusY)
  ellipse(ctx, '#0c2a40', x, y + 3, radiusX - 9, radiusY - 8)
  strokeEllipse(ctx, 'rgba(74, 138, 168, 0.5)', 2, x, y + 3, radiusX * 0.72, radiusY * 0.64)
  strokeEllipse(ctx, 'rgba(74, 138, 168, 0.4)', 2, x, y + 3, radiusX * 0.41, radiusY * 0.36)

  // Barbatana do Tralalero dando voltas na poça
  if (!hideFin) drawSharkFin(ctx, getSharkFinPosition(finMs), finMs)

  for (const [bubbleX, bubbleY, radius] of BUBBLES) strokeEllipse(ctx, 'rgba(90, 154, 192, 0.6)', 2, bubbleX, bubbleY, radius, radius)
  SNEAKER_XS.forEach((sneakerX, index) => drawSneaker(ctx, sneakerX, 610 + index * 2))

  glow(ctx, x, y, 420, '60, 140, 180', 0.18)
}

// Tênis azul do Tralalero, deixado de oferenda perto da poça
function drawSneaker(ctx, x, y) {
  rect(ctx, '#f0f0f0', x, y + 10, 38, 12)
  rect(ctx, '#2a6ac0', x + 4, y, 24, 12)
  rect(ctx, '#2a6ac0', x + 26, y + 6, 12, 8)
  rect(ctx, '#ffffff', x + 6, y + 6, 18, 2)
}

// ---------- Sala do Tung Tung God (tipo 'god'): céu, colunas de mármore, nuvens e a estátua dele ----------
// Substituiu a Sala da Mamãe em 2026-11-14. A estátua é só visual: não tem função.
// Ela é desenhada junto com o jogador (drawScene.js), na ordem dos pés, para o Tung passar por trás dela.
// As casas X do layout 'god' (colunas 5 a 7, fileiras 3 e 4) ficam embaixo do pedestal.

const COLUMN_GOLD = '#e8c860'
const COLUMN_GOLD_DARK = '#b89030'

// A estátua é toda de mármore (é isso que mostra que é uma estátua); o dourado gasto fica na auréola e no cetro
const MARBLE = '#f4f0e6'
const MARBLE_LIGHT = '#fffdf6'
const MARBLE_SHADE = '#d6cfbc'
const MARBLE_DARK = '#b4ab96'
const CARVE = '#a39a84' // linhas esculpidas: penas, olhos, boca
const STATUE_GOLD = '#d8b860'

const STATUE_AREA = getCellsArea(5, 3, 7, 4)
export const GOD_STATUE_FEET_Y = STATUE_AREA.y + STATUE_AREA.height // o desenho da estátua entra na lista pelos pés

const COLUMN_XS = [300, 500, 1100, 1300] // longe da porta de cima (x 690 a 910)
// Nuvens: [x, y, tamanho, transparência]. As de cima ficam nos painéis (longe do contador); as de baixo, nos cantos do piso.
const CLOUDS = [
  [220, 50, 70, 0.9],
  [470, 38, 55, 0.9],
  [1130, 44, 60, 0.9],
  [1380, 56, 72, 0.9],
  [230, 730, 120, 0.5],
  [1370, 735, 130, 0.5],
  [150, 520, 80, 0.4],
  [1450, 480, 85, 0.4],
]

function drawGodRoom(ctx) {
  // Névoa clara por cima do piso: a sombra do piso o deixaria cinza, e o céu tem de ficar claro
  const floor = getCellsArea(0, 0, 12, 6)
  const mist = ctx.createLinearGradient(0, floor.y, 0, floor.y + floor.height)
  mist.addColorStop(0, 'rgba(235, 245, 255, 0.05)')
  mist.addColorStop(1, 'rgba(235, 245, 255, 0.55)')
  rect(ctx, mist, floor.x, floor.y, floor.width, floor.height)

  drawLightRays(ctx)
  for (const x of COLUMN_XS) drawColumn(ctx, x)
  for (const [x, y, size, alpha] of CLOUDS) drawCloud(ctx, x, y, size, alpha)
  glow(ctx, 800, 470, 430, '255, 244, 200', 0.25)
}

// Raios de luz que descem do alto e vão sumindo no piso
function drawLightRays(ctx) {
  const rays = ctx.createLinearGradient(0, 90, 0, 660)
  rays.addColorStop(0, 'rgba(255, 248, 210, 0.28)')
  rays.addColorStop(1, 'rgba(255, 248, 210, 0)')
  polygon(ctx, rays, [[740, 90], [860, 90], [1080, 660], [520, 660]])
}

// Coluna de mármore na faixa de parede, com capitel e base dourados
function drawColumn(ctx, x) {
  rect(ctx, MARBLE, x - 22, 114, 44, 92)
  rect(ctx, MARBLE_SHADE, x + 8, 114, 14, 92)
  for (const flute of [-10, 0, 10]) rect(ctx, 'rgba(120, 110, 90, 0.35)', x + flute, 114, 2, 92)
  outline(ctx, x - 22, 114, 44, 92)

  rect(ctx, COLUMN_GOLD, x - 32, 94, 64, 20)
  rect(ctx, COLUMN_GOLD_DARK, x - 32, 108, 64, 6)
  outline(ctx, x - 32, 94, 64, 20)
  rect(ctx, COLUMN_GOLD, x - 30, 206, 60, 20)
  rect(ctx, COLUMN_GOLD_DARK, x - 30, 220, 60, 6)
  outline(ctx, x - 30, 206, 60, 20)
}

// Nuvem de três bolas brancas com uma sombra azulada embaixo
function drawCloud(ctx, x, y, size, alpha) {
  ctx.globalAlpha = alpha
  ellipse(ctx, '#ffffff', x, y, size, size * 0.35)
  ellipse(ctx, '#ffffff', x - size * 0.5, y + size * 0.08, size * 0.6, size * 0.28)
  ellipse(ctx, '#ffffff', x + size * 0.55, y + size * 0.1, size * 0.55, size * 0.26)
  ellipse(ctx, 'rgba(170, 195, 225, 0.5)', x, y + size * 0.24, size * 0.9, size * 0.1)
  ctx.globalAlpha = 1
}

// Elipse com contorno escuro (o contorno é uma elipse maior por baixo)
function outlinedEllipse(ctx, color, x, y, radiusX, radiusY) {
  ellipse(ctx, OUTLINE, x, y, radiusX + 3, radiusY + 3)
  ellipse(ctx, color, x, y, radiusX, radiusY)
}

// Perna, braço ou cabo: um traço grosso com pontas redondas, com o contorno por baixo
function drawLimb(ctx, x0, y0, x1, y1, width, color = MARBLE) {
  ctx.lineCap = 'round'
  for (const [stroke, lineWidth] of [[OUTLINE, width + 6], [color, width]]) {
    ctx.strokeStyle = stroke
    ctx.lineWidth = lineWidth
    ctx.beginPath()
    ctx.moveTo(x0, y0)
    ctx.lineTo(x1, y1)
    ctx.stroke()
  }
  ctx.lineCap = 'butt'
}

// Linha esculpida (um traço cinza na pedra)
function carveLine(ctx, x0, y0, x1, y1) {
  ctx.strokeStyle = CARVE
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.moveTo(x0, y0)
  ctx.lineTo(x1, y1)
  ctx.stroke()
}

// Arco esculpido (sobrancelha, pálpebra, sorriso)
function carveArc(ctx, x, y, radius, start, end, lineWidth = 2.5) {
  ctx.strokeStyle = CARVE
  ctx.lineWidth = lineWidth
  ctx.beginPath()
  ctx.arc(x, y, radius, start, end)
  ctx.stroke()
}

// Estátua do Tung Tung God, de frente, igual à foto: um tronco reto de topo chato com o rosto grande em cima,
// braços e pernas finos e longos, asas abertas, auréola e o cetro dourado com o aro na ponta de baixo.
// Fica num pedestal de pedra, como a estátua do anjo do Isaac. Medidas a partir do chão (feet) e de onde os pés pisam (base).
export function drawGodStatue(ctx) {
  const x = 800
  const feet = GOD_STATUE_FEET_Y - 6
  const base = feet - 30 // os pés da estátua pisam no meio do tampo do pedestal
  const top = base - 250 // topo do tronco
  const hem = top + 150 // ponta de baixo do tronco, onde começam as pernas
  const shoulders = top + 98

  glow(ctx, x, base - 120, 230, '255, 250, 225', 0.35)
  drawPedestal(ctx, x, feet)
  for (const side of [-1, 1]) drawWing(ctx, x + side * 28, shoulders, side)

  // Pernas longas e finas, com os pés virados um pouco para fora
  for (const side of [-1, 1]) {
    drawLimb(ctx, x + side * 13, hem - 4, x + side * 15, base - 8, 9)
    outlinedEllipse(ctx, MARBLE, x + side * 21, base - 4, 15, 6)
  }

  drawStatueBody(ctx, x, top, hem)
  drawStatueFace(ctx, x, top)

  // Braços finos caindo dos lados do tronco. A mão da esquerda segura o cetro; a da direita fica aberta.
  drawScepter(ctx, x - 50, top + 168)
  drawLimb(ctx, x - 31, shoulders, x - 46, top + 160, 8)
  outlinedEllipse(ctx, MARBLE, x - 49, top + 167, 7, 8)
  drawLimb(ctx, x + 31, shoulders, x + 43, top + 163, 8)
  outlinedEllipse(ctx, MARBLE, x + 45, top + 170, 6, 9)

  drawHalo(ctx, x, top - 16)
}

// Pedestal de pedra baixo, com um painel entalhado na frente
function drawPedestal(ctx, x, feet) {
  floorShadow(ctx, x + 10, feet + 2, 125, 12)
  rect(ctx, MARBLE_LIGHT, x - 104, feet - 36, 208, 12)
  rect(ctx, MARBLE_SHADE, x - 104, feet - 24, 208, 24)
  rect(ctx, CARVE, x - 104, feet - 25, 208, 2)
  ctx.strokeStyle = CARVE
  ctx.lineWidth = 2
  ctx.strokeRect(x - 84, feet - 19, 168, 14)
  outline(ctx, x - 104, feet - 36, 208, 36)
}

// Tronco: um tubo reto de mármore com o topo chato (cantos só um pouco arredondados), claro na esquerda e na sombra na direita
function drawStatueBody(ctx, x, top, hem) {
  const width = 68
  const left = x - width / 2
  const shade = ctx.createLinearGradient(left, 0, left + width, 0)
  shade.addColorStop(0.1, MARBLE_LIGHT)
  shade.addColorStop(0.45, MARBLE)
  shade.addColorStop(0.8, MARBLE_SHADE)
  shade.addColorStop(1, MARBLE_DARK)
  ctx.beginPath()
  ctx.roundRect(left, top, width, hem - top, [9, 9, 3, 3])
  ctx.fillStyle = shade
  ctx.fill()
  ctx.strokeStyle = OUTLINE
  ctx.lineWidth = OUTLINE_WIDTH
  ctx.stroke()
  // Borda do topo chato, vista um pouco de cima
  carveLine(ctx, left + 6, top + 7, left + width - 6, top + 7)
}

// Rosto esculpido como o da foto: olhos grandes e redondos quase encostados, com pálpebra pesada e olheira,
// nariz comprido e um sorriso largo. Sem cor: tudo em tons de pedra.
function drawStatueFace(ctx, x, top) {
  const eyeY = top + 46
  for (const side of [-1, 1]) {
    const eyeX = x + side * 16
    ellipse(ctx, MARBLE_SHADE, eyeX, eyeY, 15, 14)
    ellipse(ctx, MARBLE_LIGHT, eyeX, eyeY + 1, 12.5, 12)
    ellipse(ctx, MARBLE_SHADE, eyeX, eyeY + 2, 6.5, 6.5)
    ellipse(ctx, CARVE, eyeX, eyeY + 2, 2.6, 2.6)
    carveArc(ctx, eyeX, eyeY + 3, 13, Math.PI * 1.1, Math.PI * 1.9, 3) // pálpebra pesada
    carveArc(ctx, eyeX, eyeY - 2, 14, Math.PI * 0.3, Math.PI * 0.7, 2) // olheira
    carveArc(ctx, eyeX, eyeY + 4, 18, Math.PI * 1.25, Math.PI * 1.75, 2) // sobrancelha
  }
  // Nariz comprido descendo entre os olhos
  ellipse(ctx, MARBLE_SHADE, x + 2, eyeY + 20, 4.5, 12)
  carveArc(ctx, x, eyeY + 30, 5, Math.PI * 0.1, Math.PI * 0.9, 2)
  // Sorriso largo, com as covinhas nas pontas
  carveArc(ctx, x, eyeY + 18, 24, Math.PI * 0.22, Math.PI * 0.78, 3)
  carveArc(ctx, x - 22, eyeY + 30, 4, Math.PI * 0.6, Math.PI * 1.3, 2)
  carveArc(ctx, x + 22, eyeY + 30, 4, Math.PI * 1.7, Math.PI * 2.4, 2)
}

// Auréola de dourado gasto flutuando sobre o topo, com um brilho fraco atrás
function drawHalo(ctx, x, y) {
  glow(ctx, x, y, 60, '255, 240, 170', 0.35)
  for (const [color, lineWidth] of [[OUTLINE, 9], [STATUE_GOLD, 4]]) {
    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth
    ctx.beginPath()
    ctx.ellipse(x, y, 34, 7, 0, 0, Math.PI * 2)
    ctx.stroke()
  }
}

// Asa aberta de pedra, subindo do ombro para fora (como na foto), com a borda de baixo recortada em penas longas.
// Desenhada como a asa da direita a partir do ombro (x cresce para fora, y negativo para cima), em WING_SCALE;
// side = -1 espelha para a esquerda.
const WING_SCALE = 0.8
const WING_FEATHERS = [
  // [ponta da pena (controle da curva), vale entre esta pena e a próxima]
  [[128, 20], [106, -6]],
  [[108, 34], [86, 6]],
  [[86, 42], [64, 12]],
  [[64, 44], [42, 14]],
  [[42, 40], [22, 12]],
  [[22, 32], [2, 8]],
]

function traceWing(ctx) {
  ctx.beginPath()
  ctx.moveTo(0, -12)
  ctx.bezierCurveTo(20, -60, 60, -110, 112, -128) // borda de cima, até a ponta
  ctx.quadraticCurveTo(134, -134, 130, -110) // ponta arredondada
  ctx.quadraticCurveTo(138, -60, 124, -20) // borda de fora, descendo
  for (const [[tipX, tipY], [valleyX, valleyY]] of WING_FEATHERS) ctx.quadraticCurveTo(tipX, tipY, valleyX, valleyY)
  ctx.closePath()
}

function drawWing(ctx, shoulderX, shoulderY, side) {
  ctx.save()
  ctx.translate(shoulderX, shoulderY)
  ctx.scale(side * WING_SCALE, WING_SCALE)

  const shade = ctx.createLinearGradient(0, -130, 110, 30)
  shade.addColorStop(0, MARBLE_LIGHT)
  shade.addColorStop(1, MARBLE_SHADE)
  traceWing(ctx)
  ctx.fillStyle = shade
  ctx.fill()

  // Penas esculpidas, só dentro da asa: as longas (do vale até perto da borda de cima) e duas fileiras de penas curtas
  ctx.save()
  traceWing(ctx)
  ctx.clip()
  const longFeathers = [[106, -6, 92, -72], [86, 6, 70, -60], [64, 12, 50, -48], [42, 14, 30, -38], [22, 12, 14, -26]]
  for (const [x0, y0, x1, y1] of longFeathers) carveLine(ctx, x0, y0, x1, y1)
  for (let k = 0; k <= 5; k++) carveArc(ctx, 12 + k * 18, -36 - k * 13, 12, Math.PI * 0.1, Math.PI * 0.9)
  for (let k = 0; k <= 4; k++) carveArc(ctx, 22 + k * 20, -64 - k * 12, 9, Math.PI * 0.1, Math.PI * 0.9)
  ctx.restore()

  traceWing(ctx)
  ctx.strokeStyle = OUTLINE
  ctx.lineWidth = OUTLINE_WIDTH / WING_SCALE
  ctx.lineJoin = 'round'
  ctx.stroke()
  ctx.lineJoin = 'miter'
  ctx.restore()
}

// Cetro da foto, segurado pela mão (handX, handY): uma bolinha dourada logo acima da mão, a haste descendo na
// diagonal para fora e, na ponta de baixo, o aro dourado com uma barra no meio e uma bolinha embaixo
function drawScepter(ctx, handX, handY) {
  const knobX = handX + 6
  const knobY = handY - 12
  const ringX = handX - 36
  const ringY = handY + 56
  drawLimb(ctx, knobX, knobY, ringX + 9, ringY - 14, 6)
  for (const band of [0.3, 0.65]) {
    const bandX = knobX + (ringX - knobX) * band
    const bandY = knobY + (ringY - knobY) * band
    ellipse(ctx, STATUE_GOLD, bandX, bandY, 4, 4)
  }
  outlinedEllipse(ctx, STATUE_GOLD, knobX, knobY, 5, 5)
  // Aro com a barra no meio (como uma cruz dentro do círculo)
  for (const [color, lineWidth] of [[OUTLINE, 9], [STATUE_GOLD, 4]]) {
    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth
    ctx.beginPath()
    ctx.ellipse(ringX, ringY, 17, 18, 0, 0, Math.PI * 2)
    ctx.moveTo(ringX, ringY - 18)
    ctx.lineTo(ringX, ringY + 18)
    ctx.stroke()
  }
  outlinedEllipse(ctx, STATUE_GOLD, ringX, ringY + 22, 4, 4)
}

// ---------- Fliperama: tambor de bingo entre duas torres, funil e lâmpadas de festa ----------

const BALL_COLORS = ['#e04848', '#f0c040', '#4a8ad0', '#4aa860']
const LIGHT_COLORS = ['#ffd860', '#ff6080']
const LIGHT_RGB = ['255, 216, 96', '255, 96, 128']

function drawArcade(ctx) {
  drawPartyLights(ctx, 130, 680)
  drawPartyLights(ctx, 920, 1470)

  // Torres de madeira nas casas X das colunas 5 e 7, do alto do tambor até os pés na fileira 3
  const leftTower = getCellsArea(5, 1, 5, 3)
  const rightTower = getCellsArea(7, 1, 7, 3)
  for (const tower of [leftTower, rightTower]) drawArcadeTower(ctx, tower)

  // Tambor na casa X do meio (coluna 6, fileiras 1 e 2), preso às torres pelo eixo
  const middle = getCellsArea(6, 1, 6, 2)
  const centerX = middle.x + middle.width / 2
  const centerY = middle.y + middle.height / 2
  // Eixo por trás do tambor, de uma torre à outra, com a manivela na torre da direita
  rect(ctx, '#e8c040', leftTower.x + 52, centerY - 4, rightTower.x - leftTower.x, 8)
  ellipse(ctx, '#e8c040', rightTower.x + 52, centerY, 11, 11)
  drawFunnel(ctx, centerX, middle.y + middle.height)
  drawBingoWheel(ctx, centerX, centerY, 70)
}

// Fio com lâmpadas coloridas nos painéis de cima (abaixo do contador de tempo)
function drawPartyLights(ctx, x0, x1) {
  ctx.strokeStyle = '#1a0e1e'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(x0, 72)
  ctx.quadraticCurveTo((x0 + x1) / 2, 84, x1, 72)
  ctx.stroke()
  for (let k = 0, x = x0 + 14; x < x1; k++, x += 50) {
    const t = (x - x0) / (x1 - x0)
    const y = 72 + 12 * t * (1 - t) + 7
    glow(ctx, x, y, 30, LIGHT_RGB[k % 2], 0.3)
    ellipse(ctx, LIGHT_COLORS[k % 2], x, y, 7, 8)
  }
}

// Torre de madeira com a caixa da bolinha na frente e uma bola dourada no topo
function drawArcadeTower(ctx, area) {
  const left = area.x + 6
  const width = area.width - 12
  const top = area.y + 12
  const bottom = area.y + area.height - 2
  floorShadow(ctx, left + width / 2 + 6, bottom, width / 2 + 6, 8)
  rect(ctx, '#6a4a28', left, top, width, bottom - top)
  rect(ctx, '#8a6a40', left, top, width, 10)
  rect(ctx, 'rgba(0, 0, 0, 0.25)', left + width - 14, top + 10, 14, bottom - top - 10)
  rect(ctx, '#e8c040', left, top + 10, width, 3)
  rect(ctx, '#e8c040', left, bottom - 16, width, 3)
  outline(ctx, left, top, width, bottom - top)
  ellipse(ctx, '#e8c040', left + width / 2, top - 2, 9, 9)

  // Caixa da bolinha na frente da torre (as duas caixas do protótipo)
  roundRect(ctx, '#8a2a3a', left + width / 2 - 30, bottom - 92, 60, 70, 10)
  ctx.strokeStyle = OUTLINE
  ctx.lineWidth = OUTLINE_WIDTH
  ctx.stroke()
  drawIcon(ctx, ICONS.bola, 5, left + width / 2 - 20, bottom - 77)
}

// Funil de café embaixo do tambor, por onde a bolinha cai
function drawFunnel(ctx, centerX, top) {
  polygon(ctx, '#9a6a30', [[centerX - 30, top - 6], [centerX + 30, top - 6], [centerX + 12, top + 22], [centerX - 12, top + 22]])
  polygon(ctx, '#c89050', [[centerX - 30, top - 6], [centerX - 22, top - 6], [centerX - 8, top + 22], [centerX - 12, top + 22]])
  outlinePolygon(ctx, [[centerX - 30, top - 6], [centerX + 30, top - 6], [centerX + 12, top + 22], [centerX - 12, top + 22]])
}

// Tambor de bingo: roda escura com aro dourado, raios e bolinhas coloridas dentro
function drawBingoWheel(ctx, x, y, radius) {
  ellipse(ctx, 'rgba(26, 18, 32, 0.92)', x, y, radius, radius)
  ctx.strokeStyle = 'rgba(232, 192, 64, 0.55)'
  ctx.lineWidth = 2
  for (let k = 0; k < 8; k++) {
    const angle = (k * Math.PI) / 4
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + Math.cos(angle) * radius * 0.95, y + Math.sin(angle) * radius * 0.95)
    ctx.stroke()
  }
  // Posições fixas (ângulo, distância do centro em fração do raio), para o desenho não mudar a cada quadro
  const balls = [[0.3, 0.2], [1.2, 0.55], [2.0, 0.35], [2.7, 0.6], [3.4, 0.25], [4.1, 0.58], [4.8, 0.4], [5.5, 0.62], [6.0, 0.1], [0.8, 0.62], [3.9, 0.05]]
  balls.forEach(([angle, distance], index) => {
    const ballX = x + Math.cos(angle) * distance * radius
    const ballY = y + Math.sin(angle) * distance * radius
    ellipse(ctx, BALL_COLORS[index % BALL_COLORS.length], ballX, ballY, 10, 10)
    ellipse(ctx, '#f4f0e8', ballX, ballY, 3.5, 3.5)
  })
  strokeEllipse(ctx, '#e8c040', 6, x, y, radius, radius)
  strokeEllipse(ctx, OUTLINE, OUTLINE_WIDTH, x, y, radius + 5, radius + 5)
  ellipse(ctx, '#e8c040', x, y, 6, 6)
}

// ---------- Palco: dois tablados (vão na porta de cima), cortinas de veludo, máscara no piso e refletor ----------

function drawStage(ctx) {
  const left = getCellsArea(2, 0, 5, 0)
  const right = getCellsArea(7, 0, 10, 0)
  const rightEdge = right.x + right.width
  // As cortinas ficam alinhadas com as pontas de fora do palco, para não sobrar pano no piso
  drawCurtain(ctx, left.x)
  drawCurtain(ctx, rightEdge - CURTAIN_WIDTH)
  drawValance(ctx, left.x, 690)
  drawValance(ctx, 910, rightEdge)
  drawStageHalf(ctx, left)
  drawStageHalf(ctx, right)

  // Luz do refletor no piso, na frente do palco, e a máscara pintada no chão
  ellipse(ctx, 'rgba(255, 232, 160, 0.1)', 800, 470, 200, 74)
  ellipse(ctx, 'rgba(255, 232, 160, 0.08)', 800, 470, 130, 48)
  drawIcon(ctx, ICONS.mascara, 8, 768, 380)
}

const CURTAIN_WIDTH = 132

// Cortina de veludo, da viga até o palco (o tablado cobre a barra de baixo)
function drawCurtain(ctx, x) {
  rect(ctx, '#8a1a2a', x, 96, CURTAIN_WIDTH, 170)
  for (let k = 0; k < CURTAIN_WIDTH; k += 16) rect(ctx, 'rgba(176, 42, 58, 0.6)', x + k, 96, 8, 170)
}

// Bandô de cima da cortina, com a borda em ondas e o friso dourado
function drawValance(ctx, x0, x1) {
  rect(ctx, '#6a1424', x0, 92, x1 - x0, 26)
  for (let x = x0; x + 52 <= x1; x += 52) ellipse(ctx, '#6a1424', x + 26, 118, 26, 12)
  rect(ctx, '#e0b040', x0, 116, x1 - x0, 4)
}

// Metade do palco: tablado de madeira e a frente com as luzes da ribalta
function drawStageHalf(ctx, area) {
  const top = area.y - 6
  const bottom = area.y + area.height
  const frontTop = bottom - 28
  rect(ctx, '#8a5a30', area.x, top, area.width, frontTop - top)
  for (let x = area.x + 55; x < area.x + area.width; x += 55) rect(ctx, 'rgba(0, 0, 0, 0.25)', x, top, 2, frontTop - top)
  rect(ctx, '#a87444', area.x, frontTop - 4, area.width, 4)
  rect(ctx, '#4a2e18', area.x, frontTop, area.width, 28)
  for (let x = area.x + 12; x < area.x + area.width - 20; x += 40) rect(ctx, '#ffe070', x, frontTop + 9, 14, 8)
  outline(ctx, area.x + 1.5, top, area.width - 3, bottom - top - 1.5)
}

// ---------- Adega: estantes de garrafas na parede, baú com a lanterna em cima ----------

const BOTTLE_COLORS = ['#2a4a2a', '#4a2a1a', '#3a5a3a']

function drawCellar(ctx) {
  drawBottleRack(ctx, 170)
  drawBottleRack(ctx, 970)
  const chest = getCellsArea(10, 5, 11, 5)
  drawChest(ctx, chest)
  drawLantern(ctx, chest.x + 34, chest.y + 6)
}

// Estante com 3 fileiras de 10 garrafas deitadas (só o fundo redondo aparece)
function drawBottleRack(ctx, x0) {
  rect(ctx, '#3a2414', x0, 136, 460, 90)
  rect(ctx, '#5a3a1e', x0, 136, 460, 4)
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 10; col++) {
      const x = x0 + 23 + col * 46
      const y = 156 + row * 28
      ellipse(ctx, BOTTLE_COLORS[(col + row * 2) % BOTTLE_COLORS.length], x, y, 12, 12)
      ellipse(ctx, '#0a0604', x, y, 5, 5)
    }
  }
}

// Baú comprido de madeira, com tampa, cintas de ferro e fechadura dourada
function drawChest(ctx, area) {
  const left = area.x + 6
  const width = area.width - 12
  const lidTop = area.y + 4
  const bodyTop = area.y + 32
  const bottom = area.y + area.height - 2
  floorShadow(ctx, left + width / 2 + 8, bottom, width / 2, 8)
  rect(ctx, '#6a3a1a', left, bodyTop, width, bottom - bodyTop)
  rect(ctx, '#8a4a22', left, lidTop, width, bodyTop - lidTop)
  rect(ctx, '#a8662e', left, lidTop, width, 4)
  rect(ctx, '#3a2010', left, bodyTop - 2, width, 4)
  for (const x of [left + 22, left + width - 31]) rect(ctx, '#2a1a10', x, lidTop, 9, bottom - lidTop)
  rect(ctx, '#e0b040', left + width / 2 - 8, bodyTop - 8, 16, 18)
  rect(ctx, '#2a1a10', left + width / 2 - 2, bodyTop - 2, 4, 7)
  outline(ctx, left, lidTop, width, bottom - lidTop)
}

// Lanterna em cima do baú; bottom é a base
function drawLantern(ctx, x, bottom) {
  glow(ctx, x, bottom - 18, 150, '255, 190, 100', 0.3)
  rect(ctx, '#2a2a2a', x - 3, bottom - 44, 6, 12)
  rect(ctx, '#3a3a3a', x - 13, bottom - 32, 26, 32)
  rect(ctx, '#f0c870', x - 9, bottom - 28, 18, 24)
  outline(ctx, x - 13, bottom - 32, 26, 32)
}

// ---------- Descanso: tapete, rede entre os postes, e mesinha com abajur ----------

function drawRestRoom(ctx) {
  // Tapete oval no meio do piso, longe da casa da porta de baixo
  ellipse(ctx, '#5a3a50', 800, 605, 400, 100)
  strokeEllipse(ctx, '#c8a060', 5, 800, 605, 318, 75)
  strokeEllipse(ctx, 'rgba(200, 160, 96, 0.6)', 2, 800, 605, 224, 50)

  drawHammock(ctx, getCellsArea(1, 1, 5, 2))
  drawLampTable(ctx, getCellRect(10, 1))
}

// Rede de dormir presa a dois postes, nas pontas da área
function drawHammock(ctx, area) {
  const right = area.x + area.width
  const bottom = area.y + area.height
  const postTop = area.y - 40
  const leftPost = area.x + 6
  const rightPost = right - 22
  const fabricLeft = leftPost + 34
  const fabricRight = rightPost - 18
  const fabricY = area.y + 12
  const middle = (fabricLeft + fabricRight) / 2

  floorShadow(ctx, middle + 8, bottom - 8, (fabricRight - fabricLeft) / 2, 14)

  // Postes
  for (const x of [leftPost, rightPost]) {
    rect(ctx, '#4a2e18', x, postTop, 16, bottom - 2 - postTop)
    rect(ctx, 'rgba(255, 255, 255, 0.15)', x, postTop, 16, 4)
    outline(ctx, x, postTop, 16, bottom - 2 - postTop)
  }

  // Cordas do poste até as pontas do tecido
  ctx.strokeStyle = '#e8d8b0'
  ctx.lineWidth = 2
  for (const [postX, endX] of [[leftPost + 16, fabricLeft], [rightPost, fabricRight]]) {
    for (const endY of [fabricY - 8, fabricY, fabricY + 8]) {
      ctx.beginPath()
      ctx.moveTo(postX, postTop + 18)
      ctx.lineTo(endX, endY)
      ctx.stroke()
    }
  }

  // Tecido em forma de barco: a borda de cima cede um pouco, a de baixo bem mais
  const fabric = () => {
    ctx.beginPath()
    ctx.moveTo(fabricLeft, fabricY)
    ctx.quadraticCurveTo(middle, fabricY + 70, fabricRight, fabricY)
    ctx.quadraticCurveTo(middle, fabricY + 210, fabricLeft, fabricY)
    ctx.closePath()
  }
  ctx.lineJoin = 'round'
  fabric()
  ctx.strokeStyle = OUTLINE
  ctx.lineWidth = 8
  ctx.stroke()
  ctx.fillStyle = '#c85a4a'
  ctx.fill()

  // Listras, brilho e sombra só dentro do tecido
  ctx.save()
  fabric()
  ctx.clip()
  for (let x = fabricLeft; x < fabricRight; x += 30) rect(ctx, 'rgba(232, 144, 122, 0.55)', x, fabricY, 15, 120)
  rect(ctx, 'rgba(255, 255, 255, 0.2)', fabricLeft, fabricY, fabricRight - fabricLeft, 6)
  rect(ctx, 'rgba(0, 0, 0, 0.16)', fabricLeft, fabricY + 70, fabricRight - fabricLeft, 60)
  ctx.restore()
  ctx.lineJoin = 'miter'

  // Travesseiro perto da ponta esquerda
  ctx.save()
  ctx.translate(fabricLeft + 70, fabricY + 38)
  ctx.rotate(-0.12)
  roundRect(ctx, '#f0e8d8', -30, -12, 60, 24, 12)
  roundRect(ctx, 'rgba(255, 255, 255, 0.6)', -30, -12, 60, 7, 4)
  ctx.strokeStyle = OUTLINE
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.roundRect(-30, -12, 60, 24, 12)
  ctx.stroke()
  ctx.restore()
}

// Mesinha de cabeceira com abajur aceso, ocupando a casa
function drawLampTable(ctx, cell) {
  const centerX = cell.x + cell.width / 2
  const top = cell.y + 18
  const bottom = cell.y + cell.height - 2
  floorShadow(ctx, centerX + 6, bottom, 46, 7)
  rect(ctx, '#6a4a2a', cell.x + 10, top + 8, cell.width - 20, bottom - top - 8)
  rect(ctx, '#8a6a40', cell.x + 4, top, cell.width - 8, 10)
  rect(ctx, '#4a3018', cell.x + 20, top + 24, cell.width - 40, 3)
  outline(ctx, cell.x + 10, top + 8, cell.width - 20, bottom - top - 8)
  outline(ctx, cell.x + 4, top, cell.width - 8, 10)

  // Abajur: pé e cúpula
  glow(ctx, centerX, top - 40, 190, '255, 220, 140', 0.32)
  rect(ctx, '#3a2a1a', centerX - 5, top - 30, 10, 30)
  polygon(ctx, '#f0d890', [[centerX - 28, top - 26], [centerX + 28, top - 26], [centerX + 20, top - 62], [centerX - 20, top - 62]])
  rect(ctx, '#fff4c8', centerX - 20, top - 62, 40, 5)
}
