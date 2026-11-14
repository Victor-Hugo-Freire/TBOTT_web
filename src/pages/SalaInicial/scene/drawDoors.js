import { CONSUMABLE_SPRITES } from '../../../data/itemSprites.js'
import { noise, polygon } from '../../../utils/canvas.js'
import { FORK_KNOT_MS, FORK_LEAVES_MS } from '../../../utils/doors.js'
import { getTimedFrame } from '../../../utils/spriteAnimation.js'

// Portas da sala, portadas do protótipo da issue #18 (docs/referencias/prototipo-salas-issue-18/lib.js: door(), enfeite(), ICON e BM).
// Cada porta é desenhada uma vez, como a porta de cima, e girada para os outros lados.
// No desenho, u vai de 0 a DOOR_WIDTH ao longo da parede e v vai da borda da sala (v = 0) até o piso (v = depth).
// Só o ícone fica fora da rotação, sempre em pé.

const DOOR_WIDTH = 150
const FRAME = 14 // largura do batente de cada lado: o vão fica com 150 - 2 x 14 = 122 u
const LINTEL = 26 // altura da verga, acima do vão
const OPENING_WIDTH = DOOR_WIDTH - FRAME * 2
const HALF_LEAF = OPENING_WIDTH / 2
const OUTLINE = '#140806'
const DARK = '#050302'

// center = meio da porta ao longo da parede; edge = borda da sala onde a porta começa; depth = até a borda do piso.
// Em cima ela vai de y 127 até 265, embaixo de 786 até 853 (só o rodapé) e nas laterais de x 23 até 118 (e espelhada).
const DOOR_GEOMETRY = {
  up: { center: 800, edge: 127, depth: 138 },
  down: { center: 800, edge: 853, depth: 67 },
  left: { center: 525.5, edge: 23, depth: 95 },
  right: { center: 525.5, edge: 1577, depth: 95 },
}
const DOOR_ROTATION = { up: 0, down: Math.PI, left: -Math.PI / 2, right: Math.PI / 2 }

// Cores próprias de cada tipo de porta. O que faltar vem da paleta da sala (doorFrame, doorTrim, doorLeaf).
// noBands = folhas sem as faixas de ferro e a fechadura.
const DOOR_STYLES = {
  comum: {},
  chefe: { frame: '#6a1c18', trim: '#2a0c0a', leaf: '#3b3033', icon: 'boss' },
  tesouro: { frame: '#b88a50', trim: '#e8c860', leaf: '#8a6238', icon: 'cloche' },
  loja: { frame: '#4a3020', trim: '#2a1a10', leaf: '#7a5a38', awning: true },
  pacto: { frame: '#14202a', trim: '#2a6a8a', leaf: '#1a2a3a', icon: 'tubarao', noBands: true },
  mamae: { frame: '#d8c890', trim: '#f0e0a0', leaf: '#c8b078', icon: 'bem', noBands: true },
  fliperama: { frame: '#6a4a28', trim: '#d8a030', leaf: '#8a6a40', icon: 'bola' },
  palco: { frame: '#4a1a2a', trim: '#e0b040', leaf: '#3a1420', icon: 'mascara', noBands: true },
  descanso: { frame: '#6a5a48', trim: '#3a2e24', leaf: '#8a7458', icon: 'zz' },
}

// Ícones 8x8 da pedra-chave. Cada letra é uma cor de pal; '.' é transparente.
const ICONS = {
  boss: { pal: { 1: '#e84a3a', 2: '#f4c040' }, rows: ['1..11..1', '1.1111.1', '11111111', '11111111', '22222222', '22222222', '........', '........'] },
  cloche: { pal: { 1: '#f0c040', 2: '#ffe890', 3: '#c8c8c8' }, rows: ['...22...', '..1111..', '.111111.', '11111111', '11111111', '33333333', '........', '........'] },
  tubarao: { pal: { 1: '#8ab8d8', 2: '#4a88b8' }, rows: ['...1....', '...11...', '..111...', '..1111..', '.11111..', '.111111.', '22222222', '........'] },
  bem: { pal: { 1: '#ff7090', 3: '#ffe070' }, rows: ['..3333..', '........', '.11..11.', '11111111', '11111111', '.111111.', '..1111..', '...11...'] },
  bola: { pal: { 1: '#e04848', 2: '#f4f0e8' }, rows: ['..1111..', '.111111.', '11122111', '11222211', '11222211', '11122111', '.111111.', '..1111..'] },
  mascara: { pal: { 1: '#e8c860', 2: '#2a1810' }, rows: ['.111111.', '11111111', '12211221', '12211221', '11111111', '12222221', '.122221.', '..1111..'] },
  zz: { pal: { 1: '#aac0f0', 2: '#7e98d0' }, rows: ['..11111.', '....11..', '...11...', '..11111.', '........', '.222....', '..2.....', '.222....'] },
}
const ICON_PIXEL = 2.6

// Porta trancada: a chapa com o nó de espaguete (folha garfo-porta-trancada, 9 quadros de 64x64, @1x).
// Parada, mostra o quadro idleFrame (só a chapa e o nó, sem o garfo); abrindo, os quadros 0 a 7 (o garfo aparece,
// enrola e tira o nó). Tamanho em u por pixel da arte: na porta de baixo só aparece o rodapé, então a chapa é menor.
const FORK_LOCK = CONSUMABLE_SPRITES.garfo.variants['porta-trancada']
const FORK_LOCK_DURATIONS = FORK_LOCK.animations['porta-trancada'].durations
const FORK_LOCK_SCALE = { up: 2, left: 2, right: 2, down: 1.25 }
let forkLockImage = null // carregada na primeira porta trancada que aparecer

// Desenha as portas da sala. doors vem de getRoomDoors ({ side, kind, state }), com applyUnlocking para a porta
// que está abrindo ({ state: 'unlocking', unlockMs }); palette é uma paleta de ROOM_THEMES.
export function drawDoors(ctx, doors, palette) {
  for (const door of doors) drawDoor(ctx, door, palette)
}

// Marca da parede secreta, vista de perto: 3 riscos de giz (os 3 golpes), um tijolo solto, poeira e um fio de rachadura.
// É o estado "Escondida" da adega no protótipo; a porta escondida em si não desenha nada.
export function drawSecretMark(ctx, side) {
  const middle = DOOR_WIDTH / 2
  // Na porta de baixo (só 67 u de rodapé) os riscos sairiam da tela; o mínimo de 32 u os mantém dentro
  const v = Math.max(DOOR_GEOMETRY[side].depth * 0.42, 32)
  ctx.save()
  moveToDoor(ctx, side)
  for (const u of [-10, 0, 10]) {
    paintRect(ctx, '#f4ecd4', middle + u - 1.5, v - 30, 3, 22, 0.9)
    paintRect(ctx, '#fff', middle + u - 1.5, v - 30, 1, 22, 0.5)
  }
  // Tijolo solto: um pouco mais claro e com a junta funda em volta
  paintRect(ctx, '#fff', middle - 26, v, 52, 26, 0.2)
  paintRect(ctx, '#000', middle - 26, v, 52, 3, 0.6)
  paintRect(ctx, '#000', middle - 26, v + 23, 52, 3, 0.6)
  paintRect(ctx, '#000', middle - 28, v, 3, 26, 0.6)
  paintRect(ctx, '#000', middle + 25, v, 3, 26, 0.6)
  // Fio de rachadura ao lado
  paintRect(ctx, '#000', middle + 31, v - 26, 2, 24, 0.4)
  paintRect(ctx, '#000', middle + 33, v - 6, 2, 14, 0.4)
  // Poeira caída embaixo do tijolo
  for (const [du, dv, width] of [[-20, 31, 6], [6, 34, 7], [-5, 29, 4], [20, 33, 6]]) {
    paintRect(ctx, '#b0aaa0', middle + du, v + dv, width, 4)
  }
  ctx.restore()
}

function drawDoor(ctx, { side, kind, state, unlockMs = 0 }, palette) {
  // A adega escondida não tem porta: de perto aparece só a marca (drawSecretMark)
  if (kind === 'adega' && state === 'hidden') return
  const style = DOOR_STYLES[kind] || DOOR_STYLES.comum
  const { depth } = DOOR_GEOMETRY[side]
  ctx.save()
  moveToDoor(ctx, side)
  paintRect(ctx, '#0a0604', -3, -3, DOOR_WIDTH + 6, depth + 3) // contorno escuro em volta da porta
  if (kind === 'adega') drawCellarDoor(ctx, side, state, palette, depth)
  else drawFramedDoor(ctx, kind, state, style, palette, depth, unlockMs)
  ctx.restore()
  if (style.icon) drawDoorIcon(ctx, side, ICONS[style.icon])
  // A chapa do garfo fica fora da rotação, sempre em pé; some quando as folhas começam a abrir
  if (state === 'locked') drawForkLock(ctx, side, FORK_LOCK.idleFrame)
  if (state === 'unlocking' && unlockMs < FORK_KNOT_MS) drawForkLock(ctx, side, getTimedFrame(FORK_LOCK_DURATIONS, unlockMs))
}

// Chapa do garfo no meio do vão (quadro `frame` da folha)
function drawForkLock(ctx, side, frame) {
  if (!forkLockImage) {
    forkLockImage = new Image()
    forkLockImage.src = FORK_LOCK.path
  }
  if (!forkLockImage.complete || !forkLockImage.naturalWidth || frame < 0) return
  const { center, edge, depth } = DOOR_GEOMETRY[side]
  const v = LINTEL + (depth - LINTEL) / 2 // meio do vão, da borda da sala para dentro
  const [x, y] = { up: [center, edge + v], down: [center, edge - v], left: [edge + v, center], right: [edge - v, center] }[side]
  const scale = FORK_LOCK_SCALE[side]
  const { frameWidth: width, frameHeight: height } = FORK_LOCK
  ctx.save()
  ctx.imageSmoothingEnabled = false // pixel art: sem borrar
  ctx.drawImage(forkLockImage, frame * width, 0, width, height, x - (width * scale) / 2, y - (height * scale) / 2, width * scale, height * scale)
  ctx.restore()
}

// Leva a origem para o canto da porta e gira, para desenhar todas como se fossem a de cima
function moveToDoor(ctx, side) {
  const { center, edge } = DOOR_GEOMETRY[side]
  const sideways = side === 'left' || side === 'right'
  ctx.translate(sideways ? edge : center, sideways ? center : edge)
  ctx.rotate(DOOR_ROTATION[side])
  ctx.translate(-DOOR_WIDTH / 2, 0)
}

// Porta com batente de pedra, verga e duas folhas. Trancada ('locked') ela é desenhada fechada (a chapa do garfo
// vai por cima, em drawDoor); abrindo ('unlocking'), as folhas se abrem depois que o garfo tira o nó.
function drawFramedDoor(ctx, kind, state, style, palette, depth, unlockMs) {
  const frame = style.frame || palette.doorFrame
  const leaf = style.leaf || palette.doorLeaf
  const trim = style.trim || palette.doorTrim
  const opening = depth - LINTEL // altura do vão

  paintRect(ctx, frame, 0, 0, DOOR_WIDTH, depth)
  // Juntas das pedras do batente
  for (let v = 8; v < depth; v += 16) {
    paintRect(ctx, '#000', 0, v, FRAME, 1, 0.35)
    paintRect(ctx, '#000', DOOR_WIDTH - FRAME, v + 8, FRAME, 1, 0.35)
  }
  // Chanfro: luz em cima e à esquerda, sombra à direita
  paintRect(ctx, '#fff', 0, 0, DOOR_WIDTH, 4, 0.16)
  paintRect(ctx, '#fff', 0, 0, 4, depth, 0.1)
  paintRect(ctx, '#000', DOOR_WIDTH - 4, 0, 4, depth, 0.25)

  // Fundo do vão: escuro, com a luz quente da mamãe e a água do pacto quando aberta
  let inside = DARK
  if (state === 'open' && kind === 'mamae') inside = '#3a2a14'
  if (state === 'open' && kind === 'pacto') inside = '#04101a'
  paintRect(ctx, inside, FRAME, LINTEL, OPENING_WIDTH, opening)

  if (state === 'open') drawOpenLeaves(ctx, kind, leaf, opening)
  else if (state === 'unlocking' && unlockMs >= FORK_KNOT_MS) {
    drawOpeningLeaves(ctx, leaf, opening, Math.min(1, (unlockMs - FORK_KNOT_MS) / FORK_LEAVES_MS))
  } else if (kind === 'chefe') drawBossGate(ctx, opening)
  else drawClosedLeaves(ctx, style, leaf, opening)

  // Cantos do vão chanfrados (um arco quadradinho) e a sombra da verga
  for (const [width, v] of [[10, 0], [6, 3], [3, 6]]) {
    paintRect(ctx, frame, FRAME, LINTEL + v, width, 3)
    paintRect(ctx, frame, DOOR_WIDTH - FRAME - width, LINTEL + v, width, 3)
  }
  paintRect(ctx, '#000', FRAME, LINTEL, OPENING_WIDTH, 6, 0.35)
  paintRect(ctx, '#fff', FRAME, depth - 4, OPENING_WIDTH, 4, 0.1) // soleira
  if (style.awning) drawAwning(ctx)
  // Pedra-chave mais clara, onde fica o ícone
  if (style.icon) {
    paintRect(ctx, '#fff', DOOR_WIDTH / 2 - 16, 0, 32, LINTEL, 0.14)
    paintRect(ctx, '#000', DOOR_WIDTH / 2 - 16, 0, 1, LINTEL, 0.35)
    paintRect(ctx, '#000', DOOR_WIDTH / 2 + 15, 0, 1, LINTEL, 0.35)
  }
  paintRect(ctx, trim, 0, 0, DOOR_WIDTH, 3)
  paintRect(ctx, trim, 0, 0, 3, depth)
  paintRect(ctx, trim, DOOR_WIDTH - 3, 0, 3, depth)
  drawOrnament(ctx, kind)
}

// Aberta: as folhas encostadas nos lados do vão
function drawOpenLeaves(ctx, kind, leaf, opening) {
  paintRect(ctx, leaf, FRAME, LINTEL, 9, opening - 6)
  paintRect(ctx, leaf, DOOR_WIDTH - FRAME - 9, LINTEL, 9, opening - 6)
  paintRect(ctx, '#000', FRAME + 9, LINTEL, 2, opening - 6, 0.4)
  paintRect(ctx, '#000', DOOR_WIDTH - FRAME - 11, LINTEL, 2, opening - 6, 0.4)
  paintRect(ctx, '#000', FRAME + 14, LINTEL, OPENING_WIDTH - 28, 3, 0.5)
  if (kind === 'mamae') drawMomCurtains(ctx, opening)
  if (kind === 'pacto') {
    // Bolhas na água escura
    paintRect(ctx, '#5a9ac0', FRAME + 24, LINTEL + 14, 5, 5, 0.7)
    paintRect(ctx, '#5a9ac0', DOOR_WIDTH / 2 + 10, LINTEL + 30, 4, 4, 0.7)
    paintRect(ctx, '#5a9ac0', DOOR_WIDTH - FRAME - 36, LINTEL + 12, 6, 6, 0.7)
  }
}

// Folhas abrindo (progress de 0 a 1): cada folha encolhe para o seu lado do vão até a largura da porta aberta.
// Começa e termina devagar.
function drawOpeningLeaves(ctx, leaf, opening, progress) {
  const eased = progress * progress * (3 - 2 * progress)
  const width = HALF_LEAF - 1 - (HALF_LEAF - 10) * eased // de meia porta (fechada) até 9 u (aberta)
  paintRect(ctx, leaf, FRAME, LINTEL, width, opening)
  paintRect(ctx, leaf, DOOR_WIDTH - FRAME - width, LINTEL, width, opening)
  paintRect(ctx, '#000', FRAME + width, LINTEL, 2, opening, 0.4)
  paintRect(ctx, '#000', DOOR_WIDTH - FRAME - width - 2, LINTEL, 2, opening, 0.4)
}

// Mamãe aberta: luz quente lá dentro e uma cortina de renda presa dos dois lados
function drawMomCurtains(ctx, opening) {
  paintEllipse(ctx, '#f0c870', DOOR_WIDTH / 2, LINTEL + opening * 0.6, 34, 26, 0.25)
  paintEllipse(ctx, '#fff0c0', DOOR_WIDTH / 2, LINTEL + opening * 0.6, 18, 14, 0.25)
  for (const [start, direction] of [[FRAME, 1], [DOOR_WIDTH - FRAME, -1]]) {
    polygon(ctx, '#f0e8d0', [
      [start, LINTEL],
      [start + direction * 30, LINTEL],
      [start + direction * 12, LINTEL + opening * 0.55],
      [start + direction * 16, LINTEL + opening],
      [start, LINTEL + opening],
    ])
    for (let j = 0; j < opening - 8; j += 9) {
      paintRect(ctx, '#fff', start + direction * 4 - (direction < 0 ? 3 : 0), LINTEL + 6 + j, 3, 3, 0.7)
    }
    paintEllipse(ctx, '#c8a040', start + direction * 12, LINTEL + opening * 0.55, 4, 3) // laço que prende a cortina
  }
}

// Chefe fechada: grade de ferro com pontas de lança
function drawBossGate(ctx, opening) {
  for (let u = FRAME + 8; u < DOOR_WIDTH - FRAME - 6; u += 14) {
    paintRect(ctx, '#3a3a3e', u, LINTEL, 6, opening)
    paintRect(ctx, '#7a7a82', u, LINTEL, 1, opening)
    polygon(ctx, '#7a7a82', [[u, LINTEL + opening], [u + 6, LINTEL + opening], [u + 3, LINTEL + opening + 5]])
  }
  paintRect(ctx, '#3a3a3e', FRAME, LINTEL + opening * 0.5, OPENING_WIDTH, 6)
  paintRect(ctx, '#7a7a82', FRAME, LINTEL + opening * 0.5, OPENING_WIDTH, 1)
}

// Fechada: duas folhas de tábuas, com faixas de ferro e fechadura (menos nas portas noBands)
function drawClosedLeaves(ctx, style, leaf, opening) {
  paintRect(ctx, leaf, FRAME, LINTEL, HALF_LEAF - 1, opening)
  paintRect(ctx, leaf, FRAME + HALF_LEAF + 1, LINTEL, HALF_LEAF - 1, opening)
  paintRect(ctx, DARK, FRAME + HALF_LEAF - 1, LINTEL, 2, opening)
  paintRect(ctx, '#fff', FRAME, LINTEL, 2, opening, 0.12)
  paintRect(ctx, '#fff', FRAME + HALF_LEAF + 1, LINTEL, 2, opening, 0.12)
  for (let k = 11; k < HALF_LEAF - 1; k += 11) {
    paintRect(ctx, '#000', FRAME + k, LINTEL, 1, opening, 0.25)
    paintRect(ctx, '#000', FRAME + HALF_LEAF + 1 + k, LINTEL, 1, opening, 0.25)
  }
  if (style.noBands) return
  for (const fraction of [0.28, 0.7]) {
    const v = LINTEL + fraction * opening
    paintRect(ctx, '#1c1a1c', FRAME, v, OPENING_WIDTH, 5)
    paintRect(ctx, '#fff', FRAME, v, OPENING_WIDTH, 1, 0.15)
    for (let u = FRAME + 6; u < DOOR_WIDTH - FRAME - 4; u += 24) paintEllipse(ctx, '#8a8a92', u + 1.5, v + 2.5, 2.2, 2.2) // rebites
  }
  const lockTop = LINTEL + opening * 0.45
  paintRect(ctx, '#1c1a1c', DOOR_WIDTH / 2 - 9, lockTop, 18, 14)
  paintEllipse(ctx, '#c0a060', DOOR_WIDTH / 2, lockTop + 7, 5.5, 5.5)
  paintEllipse(ctx, '#1c1a1c', DOOR_WIDTH / 2, lockTop + 7, 2.4, 2.4)
}

// Toldo listrado e recortado da loja, por cima da verga
function drawAwning(ctx) {
  for (let k = 0; k < 10; k++) {
    const color = ['#2f7a4a', '#e8e4d8', '#b03030'][k % 3]
    paintRect(ctx, color, k * 15, 0, 15, LINTEL)
    paintEllipse(ctx, color, k * 15 + 7.5, LINTEL, 7.5, 7)
    paintRect(ctx, '#fff', k * 15, 0, 15, 3, 0.15)
  }
}

// Adega: a porta é um pedaço da própria parede. Trincada (cracked) ou aberta (open), com entulho no chão.
function drawCellarDoor(ctx, side, state, palette, depth) {
  // A parede da porta acompanha o lado: tijolo em cima, pedra nas laterais, rodapé embaixo
  const block = side === 'up' ? palette.wallCols[0] : side === 'down' ? palette.base : palette.side2
  const joint = side === 'up' ? palette.mortar : palette.baseLine
  // Tijolos de cores variadas, como a parede de verdade, para o remendo não parecer um bloco chapado
  const colors = side === 'up' ? palette.wallCols : side === 'down' ? [palette.base, palette.side] : [palette.side, palette.side2]
  const [brickWidth, brickHeight] = side === 'up' ? [91, 26] : [76, 22]

  ctx.save()
  ctx.beginPath()
  ctx.rect(0, 0, DOOR_WIDTH, depth)
  ctx.clip() // a última fileira de tijolos não vaza para o piso
  paintRect(ctx, joint, 0, 0, DOOR_WIDTH, depth)
  for (let row = 0; row * brickHeight < depth; row++) {
    for (let u = -(row % 2) * brickWidth / 2; u < DOOR_WIDTH; u += brickWidth) {
      const start = Math.max(0, u + 1)
      const end = Math.min(DOOR_WIDTH, u + brickWidth - 1)
      const seed = row * 7 + Math.floor(u / brickWidth) + side.length
      if (end > start) paintRect(ctx, colors[Math.floor(noise(seed) * colors.length)], start, row * brickHeight + 1, end - start, brickHeight - 2)
    }
  }
  ctx.restore()
  paintRect(ctx, '#fff', 0, 0, DOOR_WIDTH, 3, 0.1)
  paintRect(ctx, '#fff', 0, 0, 3, depth, 0.06)

  if (state === 'open') {
    // Buraco aberto na parede, com tijolos soltos nos cantos e entulho no chão
    paintRect(ctx, DARK, 26, 16, DOOR_WIDTH - 52, depth - 16)
    paintRect(ctx, block, 26, 16, 8, 8)
    paintRect(ctx, block, DOOR_WIDTH - 34, 16, 8, 8)
    paintRect(ctx, '#4a4640', 20, depth - 14, 16, 10)
    paintRect(ctx, '#3a3630', DOOR_WIDTH - 42, depth - 12, 18, 8)
    paintRect(ctx, '#5a564e', 52, depth - 8, 12, 6)
    paintRect(ctx, '#4a4640', DOOR_WIDTH / 2, depth - 10, 14, 7)
    return
  }
  // Trincada: uma rachadura em zigue-zague de cima a baixo, com a borda clara
  const pieces = 8
  for (let k = 0; k < pieces; k++) {
    const u = DOOR_WIDTH / 2 + (k % 2 ? 7 : -7) + (k > 4 ? 6 : 0)
    paintRect(ctx, '#0a0604', u, k * (depth / pieces), 4, depth / pieces + 3)
  }
  paintRect(ctx, '#0a0604', DOOR_WIDTH / 2 - 5, depth * 0.35, 3, 12)
  paintRect(ctx, '#0a0604', DOOR_WIDTH / 2 + 9, depth * 0.6, 3, 10)
  paintRect(ctx, '#fff', DOOR_WIDTH / 2 - 3, depth * 0.1, 1, depth * 0.8, 0.1)
}

// Enfeite acima da verga (v < 0), que dá a cada tipo de porta uma silhueta própria, ligada ao ícone.
// A porta comum não tem enfeite.
function drawOrnament(ctx, kind) {
  const middle = DOOR_WIDTH / 2
  if (kind === 'chefe') {
    // Ameias de castelo e duas pontas de ferro, como uma coroa
    for (const u of [0, 34, 98, 132]) {
      paintRect(ctx, OUTLINE, u - 2, -20, 22, 22)
      paintRect(ctx, '#8a1c18', u, -18, 18, 20)
      paintRect(ctx, '#c04a32', u, -18, 18, 3)
      paintRect(ctx, '#000', u + 15, -18, 3, 20, 0.3)
    }
    for (const u of [62, 88]) {
      polygon(ctx, OUTLINE, [[u - 7, 0], [u + 7, 0], [u, -30]])
      polygon(ctx, '#8a8a92', [[u - 4.5, -1], [u + 4.5, -1], [u, -25]])
      polygon(ctx, '#b0b0b8', [[u - 4.5, -1], [u, -1], [u, -25]])
    }
  } else if (kind === 'tesouro') {
    // Cúpula de cloche dourada
    clipAboveDoor(ctx, () => {
      paintEllipse(ctx, OUTLINE, middle, 2, 46, 34)
      paintEllipse(ctx, '#d8a830', middle, 2, 42, 30)
      paintEllipse(ctx, '#ffe890', middle - 12, -12, 14, 8, 0.6)
    })
    paintRect(ctx, OUTLINE, middle - 50, -3, 100, 5)
    paintRect(ctx, '#c8c8c8', middle - 48, -2, 96, 3)
    paintEllipse(ctx, OUTLINE, middle, -33, 7, 6)
    paintEllipse(ctx, '#f0d060', middle, -33, 5, 4)
  } else if (kind === 'loja') {
    // Placa redonda com o grão de café
    paintRect(ctx, '#1a1410', middle - 1, -44, 2, 8)
    paintEllipse(ctx, OUTLINE, middle, -22, 19, 17)
    paintEllipse(ctx, '#e8dcc0', middle, -22, 16, 14)
    paintEllipse(ctx, '#8a5a30', middle, -22, 9, 6.5)
    paintRect(ctx, '#3a2210', middle - 1, -27, 2, 10)
  } else if (kind === 'pacto') {
    // Barbatana do tubarão em cima e dentes na boca da porta
    polygon(ctx, OUTLINE, [[middle - 30, 0], [middle + 26, 0], [middle + 8, -42]])
    polygon(ctx, '#2a5a7a', [[middle - 25, -1], [middle + 21, -1], [middle + 7, -37]])
    polygon(ctx, '#3a7a9a', [[middle - 25, -1], [middle + 1, -1], [middle + 7, -37]])
    for (let u = FRAME + 2; u + 10 <= DOOR_WIDTH - FRAME; u += 12) {
      polygon(ctx, OUTLINE, [[u - 1, LINTEL], [u + 11, LINTEL], [u + 5, LINTEL + 13]])
      polygon(ctx, '#f0f0f0', [[u, LINTEL], [u + 10, LINTEL], [u + 5, LINTEL + 11]])
    }
  } else if (kind === 'mamae') {
    // Coração e renda
    paintEllipse(ctx, OUTLINE, middle - 9, -26, 11.5, 11.5)
    paintEllipse(ctx, OUTLINE, middle + 9, -26, 11.5, 11.5)
    polygon(ctx, OUTLINE, [[middle - 21, -22], [middle + 21, -22], [middle, 1]])
    paintEllipse(ctx, '#ff7090', middle - 9, -26, 9, 9)
    paintEllipse(ctx, '#ff7090', middle + 9, -26, 9, 9)
    polygon(ctx, '#ff7090', [[middle - 18, -23], [middle + 18, -23], [middle, -3]])
    paintEllipse(ctx, '#fff', middle - 11, -29, 3, 2, 0.6)
    for (let u = 6; u < DOOR_WIDTH; u += 12) paintEllipse(ctx, '#f4ecd8', u, 1, 6, 4)
  } else if (kind === 'fliperama') {
    // Letreiro de arcade com lâmpadas
    clipAboveDoor(ctx, () => {
      paintEllipse(ctx, OUTLINE, middle, 0, 68, 32)
      paintEllipse(ctx, '#6a3a20', middle, 0, 64, 28)
      paintEllipse(ctx, '#3a1e10', middle, 0, 46, 15)
    })
    for (let k = 0; k <= 8; k++) {
      const angle = Math.PI + (k * Math.PI) / 8
      const x = middle + Math.cos(angle) * 55
      const y = Math.sin(angle) * 21
      paintEllipse(ctx, OUTLINE, x, y, 4.6, 4.6)
      paintEllipse(ctx, k % 2 ? '#ffd860' : '#ff6080', x, y, 3.3, 3.3)
    }
  } else if (kind === 'palco') {
    // Frontão dourado e cortinas presas nos cantos
    polygon(ctx, OUTLINE, [[-4, 0], [DOOR_WIDTH + 4, 0], [middle, -32]])
    polygon(ctx, '#e0b040', [[2, -2], [DOOR_WIDTH - 2, -2], [middle, -27]])
    polygon(ctx, '#8a1a2a', [[18, -4], [DOOR_WIDTH - 18, -4], [middle, -20]])
    for (const u of [FRAME + 8, DOOR_WIDTH - FRAME - 8]) {
      paintEllipse(ctx, OUTLINE, u, LINTEL + 2, 20, 12)
      paintEllipse(ctx, '#8a1a2a', u, LINTEL + 2, 17, 10)
    }
  } else if (kind === 'descanso') {
    // Lua crescente: um círculo com outro recortado de lado
    drawMoon(ctx, middle, 16, 10.5, OUTLINE)
    drawMoon(ctx, middle, 13.5, 13, '#aac0f0')
    paintEllipse(ctx, '#dce8ff', middle + 21, -14, 2.2, 2.2)
  }
}

// Recorta o desenho para a parede acima da porta (os enfeites redondos não descem sobre o vão)
function clipAboveDoor(ctx, draw) {
  ctx.save()
  ctx.beginPath()
  ctx.rect(-30, -90, DOOR_WIDTH + 60, 90)
  ctx.clip()
  draw()
  ctx.restore()
}

// Lua da porta do descanso. A regra 'evenodd' tira do recorte o círculo de corte, e sobra a lua crescente.
function drawMoon(ctx, middle, radius, cutRadius, color) {
  ctx.save()
  ctx.beginPath()
  ctx.rect(-40, -80, DOOR_WIDTH + 80, 80)
  ctx.arc(middle + 33, -26, cutRadius, 0, Math.PI * 2)
  ctx.clip('evenodd')
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(middle + 26, -20, radius, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

// Ícone na pedra-chave, desenhado fora da rotação para ficar sempre em pé
function drawDoorIcon(ctx, side, icon) {
  const { center, edge } = DOOR_GEOMETRY[side]
  const position = {
    up: [center, edge + LINTEL / 2],
    down: [center, edge - LINTEL / 2],
    left: [edge + LINTEL / 2, center],
    right: [edge - LINTEL / 2, center],
  }[side]
  const half = (8 * ICON_PIXEL) / 2
  drawBitmap(ctx, icon, ICON_PIXEL, position[0] - half, position[1] - half)
}

// Pinta um ícone 8x8 com contorno escuro: primeiro o ícone todo deslocado nos 4 lados, depois as cores
function drawBitmap(ctx, icon, pixel, x, y) {
  const offset = Math.max(1, pixel / 2)
  for (const [dx, dy] of [[-offset, 0], [offset, 0], [0, -offset], [0, offset]]) paintBitmap(ctx, icon, pixel, x + dx, y + dy, OUTLINE)
  paintBitmap(ctx, icon, pixel, x, y)
}

// Junta os pixels iguais vizinhos de cada linha num retângulo só. onlyColor pinta tudo de uma cor (o contorno).
function paintBitmap(ctx, icon, pixel, x, y, onlyColor) {
  icon.rows.forEach((row, rowIndex) => {
    for (let start = 0; start < row.length;) {
      const letter = row[start]
      let end = start + 1
      while (end < row.length && row[end] === letter) end++
      if (letter !== '.') paintRect(ctx, onlyColor || icon.pal[letter], x + start * pixel, y + rowIndex * pixel, (end - start) * pixel, pixel)
      start = end
    }
  })
}

function paintRect(ctx, color, x, y, width, height, alpha = 1) {
  ctx.globalAlpha = alpha
  ctx.fillStyle = color
  ctx.fillRect(x, y, width, height)
  ctx.globalAlpha = 1
}

function paintEllipse(ctx, color, x, y, radiusX, radiusY, alpha = 1) {
  ctx.globalAlpha = alpha
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.ellipse(x, y, radiusX, radiusY, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1
}
