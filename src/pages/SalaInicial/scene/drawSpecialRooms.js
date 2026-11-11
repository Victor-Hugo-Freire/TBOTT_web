import { ellipse, polygon, rect } from '../../../utils/canvas.js'
import { getCellRect } from '../../../utils/roomLayout.js'

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
  mamae: drawMomRoom,
  fliperama: drawArcade,
  palco: drawStage,
  adega: drawCellar,
  descanso: drawRestRoom,
}

// Desenha o cenário da sala especial, por cima do piso e por baixo das portas e do jogador.
// type = tipo da sala ('chefe', 'loja'...). Sala inicial e comum não têm cenário.
export function drawRoomScenery(ctx, type) {
  const draw = SCENERY[type]
  if (!draw) return
  ctx.save()
  draw(ctx)
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
  ctx.lineWidth = 3
  ctx.strokeRect(x, y, width, height)
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
  ctx.lineWidth = 3
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

// ---------- Sala do Pacto: piscina escura com a barbatana, tênis de oferenda e bolhas ----------

const SNEAKER_XS = [545, 598, 651]
const BUBBLES = [[560, 372, 5], [1040, 382, 7], [690, 396, 4], [930, 360, 6]]

function drawPactRoom(ctx) {
  const pool = getCellsArea(3, 1, 9, 1)
  const centerX = pool.x + pool.width / 2
  const centerY = pool.y + pool.height / 2

  // A piscina cobre a fileira 1 e não sobe para a casa da porta de cima
  roundRect(ctx, '#2a6a8a', pool.x - 4, pool.y, pool.width + 8, pool.height + 4, 12)
  roundRect(ctx, '#0c2a40', pool.x + 4, pool.y + 6, pool.width - 8, pool.height - 10, 8)
  strokeEllipse(ctx, 'rgba(74, 138, 168, 0.5)', 2, centerX, centerY + 4, 250, 20)
  strokeEllipse(ctx, 'rgba(74, 138, 168, 0.4)', 2, centerX, centerY + 4, 140, 11)
  ctx.strokeStyle = OUTLINE
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.roundRect(pool.x - 2.5, pool.y + 1.5, pool.width + 5, pool.height + 1, 12)
  ctx.stroke()

  // Barbatana do Tralalero saindo da água (a ponta fica abaixo da casa da porta)
  polygon(ctx, '#3a6a8a', [[centerX - 32, centerY + 22], [centerX, centerY - 28], [centerX + 34, centerY + 22]])
  polygon(ctx, '#2a5a7a', [[centerX, centerY - 28], [centerX + 34, centerY + 22], [centerX + 14, centerY + 22]])
  rect(ctx, 'rgba(138, 184, 216, 0.5)', centerX - 12, centerY - 4, 3, 18)
  strokeEllipse(ctx, 'rgba(138, 184, 216, 0.6)', 2, centerX + 1, centerY + 22, 42, 5)

  for (const [x, y, radius] of BUBBLES) strokeEllipse(ctx, 'rgba(90, 154, 192, 0.6)', 2, x, y, radius, radius)
  SNEAKER_XS.forEach((x, index) => drawSneaker(ctx, x, 432 + index * 2))

  glow(ctx, centerX, centerY, 400, '60, 140, 180', 0.18)
}

// Tênis azul do Tralalero, deixado de oferenda na frente da piscina
function drawSneaker(ctx, x, y) {
  rect(ctx, '#f0f0f0', x, y + 10, 38, 12)
  rect(ctx, '#2a6ac0', x + 4, y, 24, 12)
  rect(ctx, '#2a6ac0', x + 26, y + 6, 12, 8)
  rect(ctx, '#ffffff', x + 6, y + 6, 18, 2)
}

// ---------- Sala da Mamãe: mesa com toalha xadrez e prato, velas, quadro e réstias de alho ----------

const CHECK_WIDTH = 24
const CHECK_HEIGHT = 21

function drawMomRoom(ctx) {
  drawGarlicString(ctx, 247)
  drawGarlicString(ctx, 1235)
  drawPicture(ctx, 400, 148)
  drawDinnerTable(ctx, getCellsArea(4, 1, 8, 2))
  glow(ctx, 800, 400, 420, '255, 220, 150', 0.18)
}

// Réstia pendurada na parede: alho e pimenta alternados
function drawGarlicString(ctx, x) {
  rect(ctx, '#6a4a2a', x, 138, 3, 76)
  for (let k = 0; k < 4; k++) {
    ellipse(ctx, k % 2 ? '#f0e8d0' : '#c03020', x + 1.5 + (k % 2 ? 7 : -7), 158 + k * 17, 8, 10)
  }
}

// Quadro de moldura dourada com a lua e a mamãe
function drawPicture(ctx, x, y) {
  rect(ctx, '#c8a040', x, y, 82, 58)
  rect(ctx, '#3a2a4a', x + 7, y + 7, 68, 44)
  ellipse(ctx, '#f0d060', x + 41, y + 20, 10, 10)
  rect(ctx, '#c8a8d0', x + 32, y + 28, 18, 23)
  outline(ctx, x, y, 82, 58)
}

// Mesa comprida coberta pela toalha, com uma cadeira em cada ponta, prato de macarrão e duas velas
function drawDinnerTable(ctx, area) {
  const right = area.x + area.width
  const bottom = area.y + area.height
  const clothTop = area.y + 14
  const clothBottom = area.y + 98

  floorShadow(ctx, area.x + area.width / 2 + 8, bottom - 4, area.width / 2 - 10, 10)

  // Cadeiras: o encosto aparece nas pontas da mesa
  for (const x of [area.x + 2, right - 28]) {
    rect(ctx, '#7a4a24', x, area.y + 24, 26, bottom - area.y - 26)
    rect(ctx, '#5a3418', x, area.y + 24, 26, 6)
    outline(ctx, x, area.y + 24, 26, bottom - area.y - 26)
  }

  // Pés e borda da mesa
  const tableLeft = area.x + 24
  const tableWidth = area.width - 48
  rect(ctx, '#6a4220', tableLeft + 16, clothBottom, 14, bottom - clothBottom - 2)
  rect(ctx, '#6a4220', tableLeft + tableWidth - 30, clothBottom, 14, bottom - clothBottom - 2)
  rect(ctx, '#6a4220', tableLeft, clothBottom - 4, tableWidth, 10)

  // Toalha xadrez branca e vermelha
  rect(ctx, '#e8e0d0', tableLeft, clothTop, tableWidth, clothBottom - clothTop)
  for (let row = 0; row * CHECK_HEIGHT < clothBottom - clothTop; row++) {
    for (let col = 0; col * CHECK_WIDTH < tableWidth; col++) {
      if ((row + col) % 2 === 0) continue
      const width = Math.min(CHECK_WIDTH, tableWidth - col * CHECK_WIDTH)
      const height = Math.min(CHECK_HEIGHT, clothBottom - clothTop - row * CHECK_HEIGHT)
      rect(ctx, '#c03a2a', tableLeft + col * CHECK_WIDTH, clothTop + row * CHECK_HEIGHT, width, height)
    }
  }
  outline(ctx, tableLeft, clothTop, tableWidth, clothBottom - clothTop + 6)

  // Prato de macarrão com queijo e manjericão
  const plateX = area.x + area.width / 2
  const plateY = clothTop + 40
  ellipse(ctx, '#f4f0e8', plateX, plateY, 64, 20)
  ellipse(ctx, '#c03020', plateX, plateY - 2, 44, 13)
  for (let k = 0; k < 9; k++) rect(ctx, '#e8c860', plateX - 28 + k * 6, plateY - 10 + (k % 2) * 6, 5, 3)
  rect(ctx, '#3a8a3a', plateX - 4, plateY - 10, 8, 4)

  for (const x of [plateX - 150, plateX + 150]) drawCandle(ctx, x, clothTop + 30)
}

// Vela em cima da mesa; bottom é a base
function drawCandle(ctx, x, bottom) {
  rect(ctx, '#f4ecd0', x - 6, bottom - 34, 12, 34)
  rect(ctx, '#d8cca8', x - 6, bottom - 34, 12, 4)
  glow(ctx, x, bottom - 42, 110, '255, 200, 100', 0.35)
  ellipse(ctx, '#ffd060', x, bottom - 41, 5, 9)
  ellipse(ctx, '#fff4c0', x, bottom - 39, 2.5, 4.5)
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
  drawIcon(ctx, ICONS.bola, 5, left + width / 2 - 20, bottom - 77)
}

// Funil de café embaixo do tambor, por onde a bolinha cai
function drawFunnel(ctx, centerX, top) {
  polygon(ctx, '#9a6a30', [[centerX - 30, top - 6], [centerX + 30, top - 6], [centerX + 12, top + 22], [centerX - 12, top + 22]])
  polygon(ctx, '#c89050', [[centerX - 30, top - 6], [centerX - 22, top - 6], [centerX - 8, top + 22], [centerX - 12, top + 22]])
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
  strokeEllipse(ctx, OUTLINE, 2, x, y, radius + 4, radius + 4)
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

// ---------- Descanso: tapete, rede entre os postes, mesinha com abajur e chinelos ----------

function drawRestRoom(ctx) {
  // Tapete oval no meio do piso, longe da casa da porta de baixo
  ellipse(ctx, '#5a3a50', 800, 605, 400, 100)
  strokeEllipse(ctx, '#c8a060', 5, 800, 605, 318, 75)
  strokeEllipse(ctx, 'rgba(200, 160, 96, 0.6)', 2, 800, 605, 224, 50)

  drawHammock(ctx, getCellsArea(1, 1, 5, 2))
  drawLampTable(ctx, getCellRect(10, 1))

  // Chinelos ao lado do tapete
  rect(ctx, '#c03a4a', 680, 690, 22, 10)
  rect(ctx, '#c03a4a', 708, 694, 22, 10)
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
  ctx.strokeStyle = '#a89878'
  ctx.lineWidth = 2
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
