import { BOSS_BRANCH_TYPES, getRoomDoors } from '../../../utils/doors.js'

const ROOM_ICONS = {
  chefe: 'boss',
  tesouro: 'cloche',
  loja: 'grao',
  pacto: 'tubarao',
  god: 'bem',
  fliperama: 'bola',
  palco: 'mascara',
  adega: 'garrafa',
  descanso: 'zz',
}

const ICONS = {
  boss: { colors: { 1: '#e84a3a', 2: '#f4c040' }, rows: ['1..11..1', '1.1111.1', '11111111', '11111111', '22222222', '22222222', '........', '........'] },
  cloche: { colors: { 1: '#f0c040', 2: '#ffe890', 3: '#c8c8c8' }, rows: ['...22...', '..1111..', '.111111.', '11111111', '11111111', '33333333', '........', '........'] },
  grao: { colors: { 1: '#d09050', 2: '#4a2810' }, rows: ['..1111..', '.111121.', '11112111', '11121111', '11211111', '.121111.', '..1111..', '........'] },
  tubarao: { colors: { 1: '#8ab8d8', 2: '#4a88b8' }, rows: ['...1....', '...11...', '..111...', '..1111..', '.11111..', '.111111.', '22222222', '........'] },
  bem: { colors: { 1: '#ff7090', 3: '#ffe070' }, rows: ['..3333..', '........', '.11..11.', '11111111', '11111111', '.111111.', '..1111..', '...11...'] },
  bola: { colors: { 1: '#e04848', 2: '#f4f0e8' }, rows: ['..1111..', '.111111.', '11122111', '11222211', '11222211', '11122111', '.111111.', '..1111..'] },
  mascara: { colors: { 1: '#e8c860', 2: '#2a1810' }, rows: ['.111111.', '11111111', '12211221', '12211221', '11111111', '12222221', '.122221.', '..1111..'] },
  garrafa: { colors: { 1: '#5ab070', 2: '#d8b888', 3: '#f0e8c8' }, rows: ['...22...', '...11...', '...11...', '..1111..', '.111111.', '.133331.', '.111111.', '.111111.'] },
  zz: { colors: { 1: '#aac0f0', 2: '#7e98d0' }, rows: ['..11111.', '....11..', '...11...', '..11111.', '........', '.222....', '..2.....', '.222....'] },
  garfo: { colors: { 1: '#e0e4ec', 2: '#aab0bc' }, rows: ['.1.1.1..', '.1.1.1..', '.1.1.1..', '.11111..', '..111...', '...2....', '...2....', '...2....'] },
}

const ROOM_FILL = {
  current: '#f2eee4',
  visited: '#8f8a84',
  seen: '#1a1614',
}

export function getMinimapRoomState(floor, room, currentRoomId) {
  if (!room) return 'hidden'
  if (room.id === currentRoomId) return 'current'
  if (room.visited) return 'visited'
  if (room.type === 'adega') return 'hidden'
  // A sala do Pacto/God só aparece com o chefe vencido: a porta dela também, e o tipo só é decidido na morte dele
  if (BOSS_BRANCH_TYPES.includes(room.type)) {
    const bossRoom = floor.rooms.find((other) => other.type === 'chefe')
    if (!bossRoom || !bossRoom.cleared) return 'hidden'
  }

  const adjacentToVisited = Object.values(room.neighbors).some((neighborId) => {
    if (!neighborId) return false
    const neighbor = floor.rooms.find((item) => item.id === neighborId)
    return neighbor?.visited || neighborId === currentRoomId
  })
  return adjacentToVisited ? 'seen' : 'hidden'
}

export function getMinimapConnections(floor, currentRoomId) {
  const connections = []
  const seenConnections = new Set()
  const rooms = new Map(floor.rooms.map((room) => [room.id, room]))

  for (const room of floor.rooms) {
    const state = getMinimapRoomState(floor, room, currentRoomId)
    if (state === 'hidden') continue

    for (const neighborId of Object.values(room.neighbors)) {
      if (!neighborId) continue
      const neighbor = rooms.get(neighborId)
      if (!neighbor) continue
      const connectionId = [room.id, neighbor.id].sort().join(':')
      if (seenConnections.has(connectionId)) continue
      seenConnections.add(connectionId)
      if (getMinimapRoomState(floor, neighbor, currentRoomId) === 'hidden') continue

      const from = room.col < neighbor.col || (room.col === neighbor.col && room.row < neighbor.row) ? room : neighbor
      const to = from === room ? neighbor : room
      const fromVisited = from.visited || from.id === currentRoomId
      const toVisited = to.visited || to.id === currentRoomId
      if (!fromVisited && !toVisited) continue
      // Porta trancada entre as duas salas: lock diz o que abre ('garfo' ou 'grao', o Fliperama), ou null
      let lock = null
      for (const source of [from, to]) {
        const otherId = source === from ? to.id : from.id
        const door = getRoomDoors(floor, source).find((item) => item.targetId === otherId && item.state === 'locked')
        if (door) lock = door.lock
      }

      connections.push({
        from,
        to,
        visited: fromVisited && toVisited,
        lock,
      })
    }
  }

  return connections
}

// Medidas com escala 1, como no Isaac: salas coladas, só com uma fresta entre elas
const ROOM_WIDTH = 30
const ROOM_HEIGHT = 24
const GAP = 4
const PADDING = 8
// O quadro normal acompanha o mapa conhecido: no mínimo 3 x 3 salas (não fica minúsculo no começo do andar)
// e no máximo 7 x 7 (cabe quase todo andar gerado, que costuma ter de 4 x 4 a 7 x 7)
const MIN_VIEW = 3
const MAX_VIEW = 7

// A caixa que cobre as salas dadas (colunas e linhas ocupadas, sem sobra)
export function getMinimapBounds(rooms) {
  const minCol = Math.min(...rooms.map((room) => room.col))
  const minRow = Math.min(...rooms.map((room) => room.row))
  const cols = Math.max(...rooms.map((room) => room.col)) - minCol + 1
  const rows = Math.max(...rooms.map((room) => room.row)) - minRow + 1
  return { cols, rows, minCol, minRow }
}

// Quantas salas cabem no quadro e qual coluna/linha fica no canto de cima à esquerda (pode ser fracionária).
// Normal: o quadro tem o tamanho do mapa conhecido, entre 3 x 3 e 7 x 7 salas, com o mapa centralizado;
// se o mapa passar de 7 (andar muito comprido), centraliza a sala atual, como no Isaac, e o resto fica
// cortado pela borda.
// Ampliado (Tab): o quadro é do tamanho exato das salas conhecidas, sem espaço sobrando.
export function getMinimapLayout(knownRooms, currentRoom, expanded) {
  const bounds = getMinimapBounds(knownRooms)
  if (expanded) return { cols: bounds.cols, rows: bounds.rows, startCol: bounds.minCol, startRow: bounds.minRow }

  const cols = Math.min(MAX_VIEW, Math.max(MIN_VIEW, bounds.cols))
  const rows = Math.min(MAX_VIEW, Math.max(MIN_VIEW, bounds.rows))
  const startCol = bounds.cols <= cols ? bounds.minCol - (cols - bounds.cols) / 2 : currentRoom.col - (cols - 1) / 2
  const startRow = bounds.rows <= rows ? bounds.minRow - (rows - bounds.rows) / 2 : currentRoom.row - (rows - 1) / 2
  return { cols, rows, startCol, startRow }
}

// Sempre no canto superior direito: `right` e `top` são a margem até a borda do canvas.
// A Adega Secreta não conta antes de visitada (está oculta), então não dá pista do lugar dela.
// maxWidth e maxHeight: o painel nunca passa disso, mesmo em janela pequena (a escala diminui).
// Devolve a altura (em pixels da tela) onde o painel termina.
export function drawMinimap(ctx, floor, currentRoom, { top, right, scale = 1, expanded = false, maxWidth = Infinity, maxHeight = Infinity }) {
  if (!currentRoom) return top
  const knownRooms = floor.rooms.filter((room) => getMinimapRoomState(floor, room, currentRoom.id) !== 'hidden')
  const { cols, rows, startCol, startRow } = getMinimapLayout(knownRooms, currentRoom, expanded)

  const fit = Math.min(
    maxWidth / (cols * (ROOM_WIDTH + GAP) - GAP + PADDING * 2),
    maxHeight / (rows * (ROOM_HEIGHT + GAP) - GAP + PADDING * 2),
  )
  scale = Math.min(scale, fit)
  // tudo em pixels inteiros, para a pixel art não borrar
  const unit = Math.max(1, Math.round(scale))
  const roomWidth = Math.round(ROOM_WIDTH * scale)
  const roomHeight = Math.round(ROOM_HEIGHT * scale)
  const gap = Math.max(1, Math.round(GAP * scale))
  const padding = Math.round(PADDING * scale)
  const width = cols * (roomWidth + gap) - gap + padding * 2
  const height = rows * (roomHeight + gap) - gap + padding * 2
  const panelLeft = Math.round(right - width)
  const panelTop = Math.round(top)
  const position = (room) => ({
    x: panelLeft + padding + Math.round((room.col - startCol) * (roomWidth + gap)),
    y: panelTop + padding + Math.round((room.row - startRow) * (roomHeight + gap)),
  })

  ctx.save()
  drawPanel(ctx, panelLeft, panelTop, width, height, unit)
  ctx.beginPath()
  ctx.rect(panelLeft, panelTop, width, height)
  ctx.clip()
  const connections = getMinimapConnections(floor, currentRoom.id)
  drawConnections(ctx, connections, position, roomWidth, roomHeight, gap)

  const iconPixel = Math.max(1, Math.round(roomHeight / 11)) // o ícone (8 x 8) ocupa quase a altura da sala
  for (const room of knownRooms) {
    const state = getMinimapRoomState(floor, room, currentRoom.id)
    const { x, y } = position(room)
    drawRoomTile(ctx, x, y, roomWidth, roomHeight, state, unit)

    const icon = ROOM_ICONS[room.type]
    const iconSize = 8 * iconPixel
    if (icon) drawBitmap(ctx, ICONS[icon], iconPixel, x + Math.round((roomWidth - iconSize) / 2), y + Math.round((roomHeight - iconSize) / 2))
  }

  // Tranca no meio da ligação: o garfo, ou o grão na porta do Fliperama
  const lockPixel = Math.max(1, Math.round(roomHeight / 16))
  for (const connection of connections) {
    if (!connection.lock) continue
    const from = position(connection.from)
    const to = position(connection.to)
    const x = Math.round((from.x + to.x + roomWidth) / 2 - 4 * lockPixel)
    const y = Math.round((from.y + to.y + roomHeight) / 2 - 4 * lockPixel)
    drawBitmap(ctx, ICONS[connection.lock], lockPixel, x, y, true)
  }

  ctx.restore()
  // Onde o painel termina (com a moldura): a lista de itens pegos fica logo abaixo
  return panelTop + height + 2 * unit
}

function drawPanel(ctx, left, top, width, height, unit) {
  ctx.fillStyle = `rgba(20, 8, 6, 0.9)`
  ctx.beginPath()
  ctx.roundRect(left - 2 * unit, top - 2 * unit, width + 4 * unit, height + 4 * unit, 6 * unit)
  ctx.fill()
  ctx.fillStyle = 'rgba(12, 8, 6, 0.78)'
  ctx.beginPath()
  ctx.roundRect(left, top, width, height, 5 * unit)
  ctx.fill()
  ctx.strokeStyle = '#5a4636'
  ctx.lineWidth = unit
  ctx.beginPath()
  ctx.roundRect(left + unit / 2, top + unit / 2, width - unit, height - unit, 5 * unit)
  ctx.stroke()
}

// A ligação é uma pontezinha na fresta entre duas salas: mostra que a sala especial liga a uma vizinha só
function drawConnections(ctx, connections, position, roomWidth, roomHeight, gap) {
  for (const { from, to, visited } of connections) {
    const first = position(from)
    const second = position(to)
    const horizontal = first.y === second.y
    const thickness = Math.max(2, Math.round(roomHeight / 4))
    const line = horizontal
      ? { x: first.x + roomWidth, y: first.y + Math.round((roomHeight - thickness) / 2), width: gap, height: thickness }
      : { x: first.x + Math.round((roomWidth - thickness) / 2), y: first.y + roomHeight, width: thickness, height: gap }

    ctx.fillStyle = visited ? '#8f8a84' : '#4a443e'
    ctx.fillRect(line.x, line.y, line.width, line.height)
  }
}

function drawRoomTile(ctx, x, y, width, height, state, unit) {
  if (state === 'seen') {
    ctx.fillStyle = ROOM_FILL.seen
    ctx.fillRect(x, y, width, height)
    ctx.strokeStyle = '#8a847c'
    ctx.lineWidth = unit
    ctx.strokeRect(x + unit / 2, y + unit / 2, width - unit, height - unit)
    return
  }

  ctx.fillStyle = ROOM_FILL[state]
  ctx.fillRect(x, y, width, height)
  ctx.fillStyle = state === 'current' ? '#fff' : '#aaa59e'
  ctx.fillRect(x, y, width, unit)
  ctx.fillStyle = state === 'current' ? '#c8c2b6' : '#6e6a64'
  ctx.fillRect(x, y + height - 2 * unit, width, 2 * unit)
}

function drawBitmap(ctx, icon, pixelSize, left, top, outlined = true) {
  if (outlined) {
    const outline = Math.max(1, pixelSize / 2)
    for (const [dx, dy] of [[-outline, 0], [outline, 0], [0, -outline], [0, outline]]) {
      drawBitmapRows(ctx, icon, pixelSize, left + dx, top + dy, '#140806')
    }
  }
  drawBitmapRows(ctx, icon, pixelSize, left, top)
}

function drawBitmapRows(ctx, icon, pixelSize, left, top, outlineColor) {
  icon.rows.forEach((row, y) => {
    for (let x = 0; x < row.length;) {
      const colorCode = row[x]
      if (colorCode === '.') {
        x++
        continue
      }

      let end = x + 1
      while (end < row.length && row[end] === colorCode) end++
      ctx.fillStyle = outlineColor ?? icon.colors[colorCode]
      ctx.fillRect(left + x * pixelSize, top + y * pixelSize, (end - x) * pixelSize, pixelSize)
      x = end
    }
  })
}
