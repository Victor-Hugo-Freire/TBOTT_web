// Obstáculos da sala, portados do protótipo da issue #18 (docs/referencias/prototipo-salas-issue-18/lib.js, OB e ob()).
// Cada obstáculo é desenhado numa grade de 20x20 e depois escalado para OBSTACLE_SIZE unidades da sala.
// Peças da grade:
//   retângulo: [x, y, largura, altura, cor, transparência?]
//   elipse:    ['e', centroX, centroY, raioX, raioY, cor, transparência?]
// Peça sem transparência ganha contorno escuro (se não for fina) e chanfro de luz em cima e sombra embaixo.
// Peça preta ('#000') é sombra: vai por baixo de tudo e sem contorno.

import { CONVEYOR_SPEED } from '../../../utils/roomObstacles.js'

const GRID = 20
const OBSTACLE_SIZE = 92 // tamanho do desenho, em unidades da sala (o protótipo usava 84 px num quadro menor)
const FLOOR_OBSTACLE_SIZE = 104 // os de piso ficam um pouco maiores, para cobrir a casa
const OUTLINE = '#140806'
const OUTLINE_WIDTH = 0.6 // em unidades da grade

// Sombra no chão, embaixo do obstáculo
const SHADOW = ['e', 10, 18.3, 8.5, 1.8, '#000', 0.3]

// Rede de pesca: um fundo claro e 5 fios em cada direção
const NET = [[2, 5, 16, 12, '#8a7a50', 0.18]]
for (let k = 0; k < 5; k++) NET.push([2, 5 + k * 3, 16, 1, '#8a7a50'], [2 + k * 4, 5, 1, 13, '#8a7a50'])

// Setas amarelas da esteira, apontando para a direita (o lado para onde ela empurra). Não ficam na lista de
// peças do desenho porque andam: drawConveyorArrows as desenha por cima, recortadas dentro da lona.
// CONVEYOR_ARROW_FIRST_X é o x (na grade) da ponta de trás da 1ª seta; no desenho parado as três ficam em 4,5, 9,5 e 14,5.
const CONVEYOR_ARROW_COLOR = '#e0b040'
const CONVEYOR_ARROW_SPACING = 5 // casas da grade entre uma seta e a seguinte
const CONVEYOR_ARROW_FIRST_X = 4.5
const CONVEYOR_BELT_CLIP = { x: 3.5, y: 9.5, width: 13.5, height: 4 } // a lona entre os rolos (não passa por cima deles)

// Quanto as setas já andaram (em casas da grade, de 0 até o espaçamento) depois de timeMs.
// Andam na velocidade da esteira (CONVEYOR_SPEED), então mostram o empurrão de verdade: 130 u/s são 25 casas por
// segundo, ou seja, o desenho se repete 5 vezes por segundo. Com reduzir movimento ficam paradas (e visíveis).
export function getConveyorShift(timeMs, reduceMotion = false) {
  if (reduceMotion) return 0
  const gridPerSecond = CONVEYOR_SPEED / (FLOOR_OBSTACLE_SIZE / GRID)
  return ((timeMs / 1000) * gridPerSecond) % CONVEYOR_ARROW_SPACING
}

// Os 20 obstáculos, 4 por andar. flat = fica no piso (sem sombra projetada nem contorno).
const OBSTACLE_SHAPES = {
  // Cantina
  barril: {
    parts: [SHADOW, ['e', 10, 16.4, 7, 2.3, '#4a2a14'], [3, 5, 14, 11.4, '#6b4226'], [3, 8.2, 14, 1.3, '#2a1a10'], [3, 13, 14, 1.3, '#2a1a10'],
      [6, 5, 0.8, 11, '#8f5f33'], [10, 5, 0.8, 11, '#55341c'], [13.5, 5, 0.8, 11, '#8f5f33'], [4.5, 7, 1.2, 8, '#fff', 0.12],
      ['e', 10, 5, 7, 2.6, '#a87444'], ['e', 10, 5, 5, 1.7, '#8a5a30'], ['e', 10, 5, 1.2, 0.6, '#2a1a10']],
  },
  garrafao: {
    parts: [SHADOW, ['e', 10, 16.3, 6.8, 2.5, '#a88a50'], ['e', 10, 12.5, 6.2, 5.6, '#3d6b3a'], [8.4, 4.5, 3.2, 5, '#3d6b3a'], [8, 3.2, 4, 1.6, '#4d7b48'], [8.6, 1.4, 2.8, 2, '#c09060'],
      ['e', 10, 14.6, 5.2, 3.3, '#5a1a2a'], [4.6, 16, 10.8, 0.6, '#6a5028'], [6.2, 9.5, 1.3, 4.5, '#9ac898', 0.6], [9.3, 5.5, 0.8, 3, '#9ac898', 0.5]],
  },
  'barril-deitado': {
    parts: [SHADOW, [3, 17, 3, 1.4, '#3a2410'], [14, 17, 3, 1.4, '#3a2410'], [4, 7, 12, 10, '#6b4226'],
      ['e', 4, 12, 2, 5, '#8a5a30'], ['e', 16, 12, 2, 5, '#4a2a14'], [7, 7, 1, 10, '#2a1a10'], [12, 7, 1, 10, '#2a1a10'], [4, 8.2, 12, 0.9, '#8f5f33'],
      ['e', 4, 12, 0.9, 0.9, '#2a1a10'], [18.2, 10, 1.8, 0.6, '#fff', 0.35], [18.2, 13, 1.8, 0.6, '#fff', 0.35]],
  },
  vinho: {
    flat: true,
    parts: [['e', 10, 12.5, 8.2, 3.6, '#6a1530'], ['e', 6, 11, 3.5, 1.9, '#6a1530'], ['e', 14.5, 14.2, 3.6, 1.6, '#6a1530'],
      ['e', 7.5, 11.6, 2.4, 0.8, '#c04060'], ['e', 13, 13.4, 1.5, 0.5, '#a02848'], ['e', 11, 10.5, 1.2, 0.5, '#8a2040'], ['e', 3, 16, 0.9, 0.9, '#6a1530']],
  },
  // Cucina
  balcao: {
    parts: [SHADOW, [1, 9, 18, 9, '#6a5a4a'], [3, 11, 6, 5, '#7a6a5a'], [11, 11, 6, 5, '#7a6a5a'], [9.5, 11, 1, 5, '#3a2a1a'], [1, 16.5, 18, 1.5, '#3a2a1a'],
      [12, 2.5, 5, 1.6, '#a87848'], ['e', 5, 3.4, 2, 1, '#e8e0d0'], [1, 4, 18, 5.2, '#d8d0c4'], [1, 8.4, 18, 0.9, '#a8a098'], [3, 5.6, 4, 0.5, '#a8a098'], [8, 6.8, 5, 0.5, '#b8b0a4'], [14, 5.5, 3, 0.5, '#a8a098']],
  },
  saco: {
    parts: [SHADOW, ['e', 10, 14.8, 5.8, 3.4, '#d8ccb0'], [4.2, 6.5, 11.6, 8.3, '#d8ccb0'], ['e', 10, 6.4, 5.8, 1.7, '#e4d8bc'], [8, 3.6, 4, 3, '#c0b090'], [7.4, 5.2, 5.2, 1, '#8a2a20'],
      [6.5, 9, 7, 4.2, '#a03020'], [7.4, 10.2, 5.2, 0.7, '#f4e8d0'], [7.9, 11.6, 4.2, 0.7, '#f4e8d0'], [5.4, 7.5, 1.2, 6.5, '#efe4c8', 0.7], ['e', 15.5, 16.8, 2.1, 0.8, '#efe4c8', 0.8]],
  },
  chapa: {
    parts: [SHADOW, [2, 5, 16, 12.5, '#2a2a2e'], [2, 5, 16, 8, '#3c3c42'], ['e', 6.5, 9, 3.2, 2.3, '#e05020'], ['e', 13.5, 9, 3.2, 2.3, '#e05020'],
      ['e', 6.5, 9, 1.9, 1.3, '#ffb040'], ['e', 13.5, 9, 1.9, 1.3, '#ffb040'], [2, 13.2, 16, 4.3, '#1c1c20'], ['e', 5, 15.3, 1.1, 1.1, '#9a9aa0'], ['e', 10, 15.3, 1.1, 1.1, '#9a9aa0'], ['e', 15, 15.3, 1.1, 1.1, '#9a9aa0'],
      ['e', 6.5, 4.2, 1.2, 1.6, '#fff', 0.28], ['e', 13.5, 3.2, 1.2, 1.8, '#fff', 0.25]],
  },
  azeite: {
    flat: true,
    parts: [['e', 10, 12.5, 8.2, 3.6, '#b89a20'], ['e', 6, 11, 3.5, 1.9, '#b89a20'], ['e', 14.5, 14.2, 3.6, 1.6, '#b89a20'],
      ['e', 7.5, 11.6, 2.4, 0.8, '#f0e070'], ['e', 13, 13.4, 1.5, 0.5, '#d8b830'], ['e', 11, 10.5, 1.2, 0.5, '#e0c840'], ['e', 3, 16, 0.9, 0.9, '#b89a20']],
  },
  // Piazza
  vespa: {
    parts: [SHADOW, ['e', 5, 15, 2.8, 2.8, '#111'], ['e', 14.5, 15, 2.8, 2.8, '#111'], [13.2, 5, 3, 9, '#4a7a8a'], [12, 3, 5.5, 1.5, '#2a2a2a'],
      ['e', 8.5, 11, 6, 3.6, '#4a7a8a'], [3.5, 7.2, 7, 2, '#2a1a1a'], [5, 11.2, 8, 0.8, '#e8e4d8'], ['e', 5, 15, 1.1, 1.1, '#888'], ['e', 14.5, 15, 1.1, 1.1, '#888'], [16.4, 6.2, 1.3, 2, '#f0e0a0'], [17.5, 3.2, 1.2, 1, '#c0c0c8']],
  },
  mesa: {
    parts: [SHADOW, ['e', 10, 16.6, 4.4, 1.4, '#4a3a28'], [9, 9, 2, 7.6, '#4a3a28'], ['e', 10, 7.2, 7.8, 3.1, '#6a4a28'], ['e', 10, 6.5, 7.2, 2.6, '#8a6a40'], ['e', 9, 6, 5, 1.6, '#a88458', 0.5],
      ['e', 8.2, 6.2, 2.6, 0.8, '#d8d0c0'], [6.6, 3.9, 3.2, 2.4, '#e8e0d0'], ['e', 8.2, 3.9, 1.6, 0.6, '#3a2010'], [9.8, 4.4, 1, 1.4, '#e8e0d0'], [8, 1.3, 0.6, 1.8, '#fff', 0.45], [9.2, 0.8, 0.6, 1.8, '#fff', 0.35]],
  },
  'caixote-tomate': {
    parts: [SHADOW, ['e', 6.5, 7.2, 2.4, 2.3, '#c03020'], ['e', 10.5, 6.2, 2.7, 2.5, '#d83a28'], ['e', 14, 7.2, 2.3, 2.2, '#b02818'], ['e', 8.5, 8.4, 2.2, 1.6, '#d04030'],
      ['e', 5.8, 6.4, 0.8, 0.5, '#ff9080', 0.7], ['e', 9.8, 5.3, 0.9, 0.5, '#ff9080', 0.7], [5.8, 4.4, 1.8, 0.9, '#3a7a30'], [10, 3.5, 1.8, 0.9, '#3a7a30'],
      [3, 8.6, 14, 9.6, '#8a6a40'], [3, 11.8, 14, 0.7, '#5a4220'], [3, 14.8, 14, 0.7, '#5a4220'], [3, 8.6, 1.5, 9.6, '#a88458'], [15.5, 8.6, 1.5, 9.6, '#6a4a28'], [3, 8.6, 14, 0.9, '#b89462']],
  },
  sorvete: {
    flat: true,
    parts: [['e', 10, 12.8, 8, 3.4, '#e8a0b8'], ['e', 5.5, 11, 3.2, 1.8, '#e8a0b8'], ['e', 15, 14.4, 3.2, 1.5, '#e8a0b8'],
      ['e', 7.5, 12, 2.3, 0.8, '#fff0f4', 0.9], ['e', 12.5, 13.6, 1.4, 0.5, '#fbd0dc'], ['e', 13.2, 8.3, 3.2, 2.6, '#f0c0d0'], ['e', 12.3, 7.6, 1.2, 0.8, '#fff0f4', 0.8], ['e', 13.2, 5.4, 1.3, 1.3, '#c03050'], [13, 3.3, 0.6, 2, '#6a3a20']],
  },
  // Pastificio
  maquina: {
    parts: [SHADOW, [3, 17, 3, 1.6, '#3a3e44'], [14, 17, 3, 1.6, '#3a3e44'], [2, 6, 16, 11.2, '#5a6068'], [5, 2.4, 10, 3.8, '#7a8088'], [6.5, 3.4, 7, 1, '#4a5058'], [5.5, 9, 9, 4.6, '#2a2e32'],
      [6.8, 12.8, 0.6, 3, '#e8d8a0'], [8.4, 12.8, 0.6, 3.6, '#e8d8a0'], [10, 12.8, 0.6, 3, '#e8d8a0'], [11.6, 12.8, 0.6, 3.5, '#e8d8a0'], [13, 12.8, 0.6, 2.8, '#e8d8a0'],
      ['e', 15.8, 7.8, 0.9, 0.9, '#e0b040'], ['e', 15.8, 10.2, 0.9, 0.9, '#60c060'], [2, 6.4, 16, 0.8, '#8a9098']],
  },
  esteira: {
    parts: [SHADOW, [1, 14.6, 18, 2.4, '#4a4e54'], [3, 16.4, 2, 1.8, '#3a3e44'], [15, 16.4, 2, 1.8, '#3a3e44'], [1, 7.8, 18, 7.4, '#2a2a2e'], [1, 7.8, 18, 1.2, '#7a8088'], [1, 13.8, 18, 1.2, '#7a8088'],
      ['e', 2, 11.4, 1.5, 3.7, '#9aa0a8'], ['e', 18, 11.4, 1.5, 3.7, '#9aa0a8']],
  },
  massa: {
    flat: true,
    parts: [['e', 10, 15, 7, 1, '#c8b880', 0.7], ['e', 10, 12, 7.5, 3.8, '#e8d8a0'], ['e', 5.5, 11.5, 3, 2, '#e8d8a0'], ['e', 14.8, 12.6, 3, 2.2, '#e8d8a0'],
      ['e', 8, 10.4, 3, 0.9, '#fff8d8', 0.85], ['e', 14, 11.4, 1.2, 0.5, '#fff8d8', 0.8], ['e', 4, 15.6, 0.7, 0.5, '#efe4c8'], ['e', 16, 15.4, 0.8, 0.5, '#efe4c8']],
  },
  parmesao: {
    parts: [SHADOW, ['e', 10, 14.6, 7.2, 3.2, '#c8a040'], [2.8, 8.8, 14.4, 5.8, '#c8a040'], [2.8, 11.9, 14.4, 0.6, '#a08030'], [6, 12.6, 0.8, 0.8, '#8a6a20'], [11, 13.2, 0.8, 0.8, '#8a6a20'],
      ['e', 10, 8.8, 7.2, 3.2, '#f0d070'], ['e', 8, 8, 2.5, 0.8, '#fff0a0', 0.7], ['e', 12.5, 9.6, 0.9, 0.5, '#c8a040']],
  },
  // Porto
  'caixote-peixe': {
    parts: [SHADOW, ['e', 8, 6.4, 4.3, 2.1, '#a8b8c0'], [12, 4.8, 2.6, 3.2, '#a8b8c0'], ['e', 13, 7.4, 3, 1.5, '#8a9aa8'], [5.6, 5.5, 0.9, 0.9, '#111'], ['e', 4.5, 8.2, 1.6, 0.8, '#fff', 0.7],
      [3, 8.6, 14, 9.6, '#6a7a82'], [3, 12, 14, 0.7, '#4a5a62'], [3, 15, 14, 0.7, '#4a5a62'], [3, 8.6, 1.5, 9.6, '#8a9aa2'], [15.5, 8.6, 1.5, 9.6, '#4a5a62'], [3, 8.6, 14, 0.9, '#9aaab2']],
  },
  rede: {
    flat: true,
    parts: [...NET, ['e', 3, 4.2, 1.5, 1.5, '#e06020'], ['e', 9.5, 4.2, 1.5, 1.5, '#e06020'], ['e', 16, 4.2, 1.5, 1.5, '#e06020'], [2, 4.8, 16, 0.8, '#6a5a38']],
  },
  lagosta: {
    parts: [SHADOW, [3, 8, 14, 9.6, '#7a5a30'], ['e', 10, 8, 7, 2.6, '#8a6a3a'], [4.8, 10, 10.4, 5.6, '#1a0e08'], [4.8, 12.8, 10.4, 0.6, '#7a5a30'], [8.3, 10, 0.6, 5.6, '#7a5a30'], [11.8, 10, 0.6, 5.6, '#7a5a30'],
      ['e', 10, 13.2, 2.8, 1.3, '#d04030'], ['e', 7, 12.2, 1.1, 0.8, '#d04030'], ['e', 13, 12.2, 1.1, 0.8, '#d04030'], [3, 15.4, 14, 0.7, '#a08050'],
      [9.7, 3.6, 0.7, 3.5, '#c8b070'], ['e', 10, 3, 1.7, 1.9, '#e8e4d8'], [8.4, 3.2, 3.2, 0.9, '#c03030']],
  },
  poca: {
    flat: true,
    parts: [['e', 10, 12.5, 8.2, 3.6, '#3a6a8a'], ['e', 6, 11, 3.5, 1.9, '#3a6a8a'], ['e', 14.5, 14.2, 3.6, 1.6, '#3a6a8a'],
      ['e', 7.5, 11.6, 2.4, 0.8, '#8ac0e0'], ['e', 13, 13.4, 1.5, 0.5, '#5a8aaa'], ['e', 11, 10.5, 1.2, 0.5, '#6aa0c8'], ['e', 3, 16, 0.9, 0.9, '#3a6a8a']],
  },
}

// Desenha um obstáculo que bloqueia (barril, garrafão, chapa...). Quem chama ordena pelo y dos pés, junto com o jogador.
// Os de piso, o cenário e o tambor não são desenhados aqui.
export function drawObstacle(ctx, obstacle) {
  if (obstacle.removed || !obstacle.blocking) return
  drawShapeAtBox(ctx, obstacle, OBSTACLE_SIZE)
}

// Desenha os obstáculos de piso (vinho, massa, esteira...), que ficam sempre por baixo de tudo.
// timeMs (relógio do desenho) e reduceMotion só servem para as setas da esteira andarem.
export function drawFloorObstacles(ctx, obstacles, timeMs = 0, reduceMotion = false) {
  for (const obstacle of obstacles) {
    if (obstacle.removed || obstacle.blocking) continue
    drawShapeAtBox(ctx, obstacle, FLOOR_OBSTACLE_SIZE)
    if (obstacle.kind === 'esteira') drawConveyorArrows(ctx, obstacle, FLOOR_OBSTACLE_SIZE, getConveyorShift(timeMs, reduceMotion))
  }
}

// Centraliza o desenho na caixa do obstáculo, como o place() do protótipo fazia com o centro da casa.
// A caixa acompanha o barril que rola, então o desenho vai junto.
function drawShapeAtBox(ctx, obstacle, size) {
  const shape = OBSTACLE_SHAPES[obstacle.kind]
  if (!shape) return
  const { box } = obstacle
  const centerX = box.x + box.width / 2
  const centerY = box.y + box.height / 2
  drawShape(ctx, shape, centerX - size / 2, centerY - size * 0.55, size)
}

// Setas da esteira: três setas andando para a direita, na mesma posição e escala do desenho da esteira.
// Uma seta que sai pela direita é a mesma que entra pela esquerda (o desenho se repete a cada espaçamento).
function drawConveyorArrows(ctx, obstacle, size, shift) {
  const { box } = obstacle
  ctx.save()
  ctx.translate(box.x + box.width / 2 - size / 2, box.y + box.height / 2 - size * 0.55)
  ctx.scale(size / GRID, size / GRID)
  const { x, y, width, height } = CONVEYOR_BELT_CLIP
  ctx.beginPath()
  ctx.rect(x, y, width, height)
  ctx.clip()
  for (let k = -1; k <= 2; k++) {
    const left = CONVEYOR_ARROW_FIRST_X + k * CONVEYOR_ARROW_SPACING + shift
    paintRect(ctx, CONVEYOR_ARROW_COLOR, left, 10, 0.9, 3, 1)
    paintRect(ctx, CONVEYOR_ARROW_COLOR, left + 0.9, 10.7, 0.9, 1.6, 1)
    paintRect(ctx, CONVEYOR_ARROW_COLOR, left + 1.8, 11.3, 0.7, 0.5, 1)
  }
  ctx.restore()
}

// Porta do ob() do protótipo: sombra projetada, sombras das peças, contorno escuro, peças e chanfro de luz.
function drawShape(ctx, shape, x, y, size) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(size / GRID, size / GRID)
  // Luz de cima e da esquerda (como nos sprites): a sombra cai para baixo e para a direita
  if (!shape.flat) paintPart(ctx, ['e', 12, 18.9, 9.4, 2.3, '#000', 0.2])
  for (const part of shape.parts) {
    if (getColor(part) === '#000') paintPart(ctx, part)
  }
  if (!shape.flat) {
    for (const part of shape.parts) {
      if (getAlpha(part) === undefined && getColor(part) !== '#000' && isThick(part)) paintPart(ctx, part, OUTLINE_WIDTH, OUTLINE)
    }
  }
  for (const part of shape.parts) {
    if (getColor(part) === '#000') continue
    paintPart(ctx, part)
    if (!shape.flat && hasBevel(part)) {
      const [left, top, width, height] = part
      paintRect(ctx, '#fff', left, top, width, 0.8, 0.16)
      paintRect(ctx, '#000', left, top + height - 0.8, width, 0.8, 0.2)
    }
  }
  ctx.restore()
}

const isEllipse = (part) => part[0] === 'e'
const getColor = (part) => (isEllipse(part) ? part[5] : part[4])
const getAlpha = (part) => (isEllipse(part) ? part[6] : part[5])

// Peças finas (menos de 2 de largura ou altura) ficam sem contorno, senão viram só contorno
function isThick(part) {
  if (isEllipse(part)) return part[3] >= 1.5 || part[4] >= 1.5
  return part[2] >= 2 && part[3] >= 2
}

// Só os retângulos opacos e grandes ganham o chanfro
function hasBevel(part) {
  return !isEllipse(part) && getAlpha(part) === undefined && part[2] >= 5 && part[3] >= 4
}

// Pinta uma peça. grow aumenta a peça para todos os lados (usado no contorno); color troca a cor dela.
function paintPart(ctx, part, grow = 0, color = getColor(part)) {
  const alpha = grow ? 1 : (getAlpha(part) ?? 1)
  if (isEllipse(part)) {
    const [, centerX, centerY, radiusX, radiusY] = part
    ctx.globalAlpha = alpha
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.ellipse(centerX, centerY, radiusX + grow, radiusY + grow, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
    return
  }
  const [left, top, width, height] = part
  paintRect(ctx, color, left - grow, top - grow, width + grow * 2, height + grow * 2, alpha)
}

function paintRect(ctx, color, x, y, width, height, alpha) {
  ctx.globalAlpha = alpha
  ctx.fillStyle = color
  ctx.fillRect(x, y, width, height)
  ctx.globalAlpha = 1
}
