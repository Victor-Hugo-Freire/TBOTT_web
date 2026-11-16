import { ellipse, polygon, rect } from '../../../utils/canvas.js'

// Enfeites da parede de cima, um conjunto por andar. Portados do DECOR do protótipo da issue #18.
// No protótipo a parede tinha 217 px de altura e duas fileiras de enfeites; aqui ficam numa fileira só,
// divididos entre os painéis de cima (y 12..85) e a faixa de parede (y 134..226).
// Duas áreas ficam sempre livres: x 690..910 (a porta de cima e o enfeite dela) e o alto do meio
// (y < 70, x 600..1000), onde fica o contador de tempo.
// A Cantina e as salas especiais não têm enfeites.

const SHELF_Y = 212 // tábua das prateleiras da faixa de parede

const JAR_COLORS = ['#c03a2a', '#6a8a30', '#d8a030', '#8a3a6a']
const CLOTHES_COLORS = ['#c03a3a', '#3a6ab0', '#e8e4d8', '#d8a030', '#3a8a4a', '#c03a3a', '#e8e4d8']
const PENNANT_COLORS = ['#c03a3a', '#e8e4d8', '#2f7a4a'] // vermelho, branco e verde, como a bandeira da Itália
const POT_SIZES = [20, 16, 22, 15, 19]

const DECOR = { cucina: drawCucina, piazza: drawPiazza, pastificio: drawPastificio, porto: drawPorto }

// themeKey é a chave do tema (ex.: 'cucina'); palette é o objeto dele em ROOM_THEMES
export function drawWallDecor(ctx, themeKey, palette) {
  DECOR[themeKey]?.(ctx, palette)
}

// ---------- peças pequenas, usadas pelos andares ----------

function strokeEllipse(ctx, color, lineWidth, x, y, radiusX, radiusY) {
  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth
  ctx.beginPath()
  ctx.ellipse(x, y, radiusX, radiusY, 0, 0, Math.PI * 2)
  ctx.stroke()
}

// Prateleira de madeira com dois apoios
function drawShelf(ctx, x, y, width) {
  rect(ctx, '#3a2414', x, y, width, 7)
  rect(ctx, '#6a4a2a', x, y, width, 2)
  rect(ctx, '#2a1a10', x + 10, y + 7, 6, 7)
  rect(ctx, '#2a1a10', x + width - 16, y + 7, 6, 7)
}

// Pote de conserva com tampa branca e rótulo, com a base em y
function drawJar(ctx, x, y, color) {
  rect(ctx, color, x - 11, y - 26, 22, 26)
  rect(ctx, '#e8e0d0', x - 12, y - 30, 24, 5)
  rect(ctx, 'rgba(255, 255, 255, 0.3)', x - 8, y - 22, 3, 16)
  rect(ctx, 'rgba(244, 236, 216, 0.7)', x - 6, y - 14, 12, 6)
}

// Ponto de um fio que cai em curva entre x0 e x1 (t de 0 a 1); sag é quanto o meio desce
function pointOnLine(x0, x1, y, sag, t) {
  return [x0 + (x1 - x0) * t, y + 4 * sag * t * (1 - t)]
}

function drawHangingLine(ctx, x0, x1, y, sag, color) {
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(x0, y)
  ctx.quadraticCurveTo((x0 + x1) / 2, y + 2 * sag, x1, y)
  ctx.stroke()
}

// Cano de metal deitado, com brilho em cima e sombra embaixo
function drawPipe(ctx, x, y, width, height = 14) {
  rect(ctx, '#5a5e64', x, y, width, height)
  rect(ctx, '#9aa0a8', x, y, width, 3)
  rect(ctx, '#3a3e44', x, y + height - 3, width, 3)
}

// Cano de metal em pé
function drawVerticalPipe(ctx, x, y, height) {
  rect(ctx, '#5a5e64', x, y, 14, height)
  rect(ctx, '#9aa0a8', x, y, 3, height)
  rect(ctx, '#3a3e44', x + 11, y, 3, height)
}

// Anel que junta dois pedaços do cano
function drawFlange(ctx, x, y, height = 14) {
  rect(ctx, '#44484e', x - 3, y - 4, 8, height + 8)
  rect(ctx, 'rgba(138, 144, 152, 0.6)', x - 3, y - 4, 2, height + 8)
}

// Placa de perigo com listras amarelas e pretas na diagonal
function drawHazardPlate(ctx, x, y, width, height) {
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, width, height)
  ctx.clip()
  rect(ctx, '#c8a020', x, y, width, height)
  for (let k = -height; k < width; k += 28) {
    polygon(ctx, '#1a1a1a', [[x + k, y + height], [x + k + 14, y + height], [x + k + 14 + height, y], [x + k + height, y]])
  }
  ctx.restore()
  ctx.strokeStyle = '#1a1a1a'
  ctx.lineWidth = 3
  ctx.strokeRect(x, y, width, height)
}

// Boia salva-vidas branca com quatro faixas vermelhas
function drawLifebuoy(ctx, palette, x, y, radius) {
  ellipse(ctx, '#8a7a50', x, y, radius + 3, radius + 3)
  ellipse(ctx, '#e8e4d8', x, y, radius, radius)
  ctx.strokeStyle = '#c03030'
  ctx.lineWidth = radius * 0.5
  for (let quarter = 0; quarter < 4; quarter += 2) {
    ctx.beginPath()
    ctx.arc(x, y, radius * 0.75, (quarter * Math.PI) / 2 + 0.2, ((quarter + 1) * Math.PI) / 2 - 0.2)
    ctx.stroke()
  }
  // O furo do meio mostra a parede de tábuas atrás
  ellipse(ctx, palette.wallCols[1], x, y, radius * 0.48, radius * 0.48)
  strokeEllipse(ctx, '#140806', 2, x, y, radius + 3, radius + 3)
}

// Escotilha redonda de navio: aro de latão com parafusos e vidro escuro com reflexo
function drawPorthole(ctx, x, y, radius) {
  ellipse(ctx, '#8a6a30', x, y, radius + 7, radius + 7)
  strokeEllipse(ctx, '#140806', 3, x, y, radius + 7, radius + 7)
  ellipse(ctx, '#0c2a40', x, y, radius, radius)
  ellipse(ctx, 'rgba(138, 192, 224, 0.5)', x - radius * 0.3, y - radius * 0.3, radius * 0.3, radius * 0.2)
  for (let bolt = 0; bolt < 8; bolt++) {
    const angle = (bolt * Math.PI) / 4
    ellipse(ctx, '#d8b860', x + Math.cos(angle) * (radius + 3.5), y + Math.sin(angle) * (radius + 3.5), 2, 2)
  }
}

// ---------- andares ----------

// Cucina: panelas de cobre num varão, pratos e potes nas prateleiras e uma réstia de alho
function drawCucina(ctx) {
  // Varão com as panelas (painéis de cima, à esquerda)
  rect(ctx, '#8a8a8a', 170, 26, 360, 4)
  rect(ctx, '#cfcfcf', 170, 26, 360, 1.5)
  POT_SIZES.forEach((size, index) => {
    const x = 210 + index * 72
    rect(ctx, '#6a6a6a', x - 1, 30, 2, 12)
    ctx.fillStyle = '#b8662e'
    ctx.beginPath()
    ctx.roundRect(x - size, 42, 2 * size, size * 1.4, 4)
    ctx.fill()
    rect(ctx, '#d88a4a', x - size - 2, 42, 2 * size + 4, 4)
    rect(ctx, 'rgba(240, 176, 112, 0.5)', x - size + 3, 48, 3, size)
    rect(ctx, '#5a3a20', x + size, 46, 10, 4)
  })

  // Prateleira de pratos em pé (faixa de parede, à esquerda)
  for (let plate = 0; plate < 9; plate++) {
    const x = 214 + plate * 30
    ellipse(ctx, '#e8e4d8', x, SHELF_Y - 18, 9, 17)
    strokeEllipse(ctx, '#a8a498', 1.5, x, SHELF_Y - 18, 9, 17)
  }
  drawShelf(ctx, 190, SHELF_Y, 290)

  // Prateleira de potes (faixa de parede, à direita)
  for (let jar = 0; jar < 6; jar++) drawJar(ctx, 1036 + jar * 46, SHELF_Y, JAR_COLORS[(jar + 2) % JAR_COLORS.length])
  drawShelf(ctx, 1006, SHELF_Y, 290)

  // Réstia de alho pendurada (painéis de cima, à direita)
  rect(ctx, '#8a7a50', 1379, 14, 2, 70)
  for (let bulb = 0; bulb < 5; bulb++) {
    const side = bulb % 2 ? 6 : -6
    rect(ctx, '#c8b890', 1379 + (bulb % 2 ? 4 : -8), 24 + bulb * 12, 4, 6)
    ellipse(ctx, '#efe8d8', 1380 + side, 34 + bulb * 12, 9, 8)
  }
}

// Piazza: varal de roupas e bandeirinhas nos painéis de cima; as janelas são o padrão da parede (drawWallPattern)
function drawPiazza(ctx) {
  drawHangingLine(ctx, 130, 590, 18, 16, '#d8d0b8')
  CLOTHES_COLORS.forEach((color, index) => {
    const [x, y] = pointOnLine(130, 590, 18, 16, (index + 0.7) / 7.6)
    if (index % 2) {
      // calça: duas pernas
      rect(ctx, color, x - 8, y, 7, 30)
      rect(ctx, color, x + 1, y, 7, 30)
    } else {
      // camisa: corpo e mangas
      rect(ctx, color, x - 9, y, 18, 26)
      rect(ctx, color, x - 15, y, 6, 12)
      rect(ctx, color, x + 9, y, 6, 12)
    }
    rect(ctx, '#6a5a3a', x - 1, y - 3, 2, 5) // pregador
  })

  drawHangingLine(ctx, 1010, 1460, 20, 12, '#d8d0b8')
  for (let flag = 0; flag < 16; flag++) {
    const [x, y] = pointOnLine(1010, 1460, 20, 12, (flag + 0.5) / 16)
    polygon(ctx, PENNANT_COLORS[flag % 3], [[x - 10, y], [x + 10, y], [x, y + 20]])
  }
}

// Pastificio: canos com válvula, manômetro, canos descendo pela parede e placas de perigo
function drawPastificio(ctx) {
  // Cano da esquerda (painéis de cima), com a válvula de roda vermelha
  drawPipe(ctx, 118, 40, 482)
  for (const x of [200, 340, 480]) drawFlange(ctx, x, 40)
  rect(ctx, '#44484e', 418, 28, 4, 12)
  strokeEllipse(ctx, '#c03a2a', 4, 420, 22, 13, 13)
  rect(ctx, '#c03a2a', 406, 21, 28, 3)
  rect(ctx, '#c03a2a', 419, 8, 3, 28)
  drawVerticalPipe(ctx, 150, 54, 172)

  // Cano da direita (painéis de cima), descendo pela parede até a viga de baixo
  drawPipe(ctx, 1010, 40, 472)
  for (const x of [1090, 1250]) drawFlange(ctx, x, 40)
  drawVerticalPipe(ctx, 1400, 54, 172)
  rect(ctx, '#44484e', 1396, 150, 22, 8) // anel do cano em pé
  rect(ctx, '#44484e', 146, 150, 22, 8)

  // Manômetro na parede
  ellipse(ctx, '#d8d4c8', 520, 178, 20, 20)
  strokeEllipse(ctx, '#3a3e44', 4, 520, 178, 20, 20)
  ctx.strokeStyle = '#c03a2a'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(520, 178)
  ctx.lineTo(533, 166)
  ctx.stroke()
  ellipse(ctx, '#3a3e44', 520, 178, 3, 3)

  drawHazardPlate(ctx, 240, 190, 170, 28)
  drawHazardPlate(ctx, 1120, 190, 170, 28)
}

// Porto: boias, rolo de corda, escotilhas na parede e uma rede de pesca com flutuadores nos painéis
function drawPorto(ctx, palette) {
  drawLifebuoy(ctx, palette, 224, 180, 30)
  drawLifebuoy(ctx, palette, 1290, 180, 30)
  for (let turn = 0; turn < 4; turn++) strokeEllipse(ctx, '#c8b070', 4, 447, 190, 38 - turn * 8, 20 - turn * 4)
  drawPorthole(ctx, 610, 180, 22)
  drawPorthole(ctx, 1000, 180, 22)

  // Rede de pesca (painéis de cima, à direita)
  rect(ctx, '#8a7a50', 1040, 18, 210, 4)
  for (let line = 0; line <= 7; line++) rect(ctx, 'rgba(168, 154, 104, 0.8)', 1040 + line * 30, 20, 2, 62)
  for (let line = 1; line < 4; line++) rect(ctx, 'rgba(168, 154, 104, 0.8)', 1040, 20 + line * 16, 210, 2)
  for (let line = 0; line <= 7; line++) ellipse(ctx, '#e06020', 1041 + line * 30, 20, 4, 4)
}
