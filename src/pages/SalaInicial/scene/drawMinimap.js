import { getRoomDoors } from '../../../utils/doors.js'

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
      const locked = [from, to].some((source) =>
        getRoomDoors(floor, source).some((door) => door.targetId === (source === from ? to.id : from.id) && door.state === 'locked'),
      )

      connections.push({
        from,
        to,
        visited: fromVisited && toVisited,
        locked,
      })
    }
  }

  return connections
}

export function drawMinimap(ctx, floor, currentRoom, { top, scale = 1, right, centerX, centerY, left = 0 }) {
  const roomWidth = 30 * scale
  const roomHeight = 24 * scale
  const gap = 10 * scale
  const padding = 10 * scale
  const knownRooms = floor.rooms.filter((room) => getMinimapRoomState(floor, room, currentRoom?.id) !== 'hidden')
  if (knownRooms.length === 0) return

  const minCol = Math.min(...knownRooms.map((room) => room.col))
  const maxCol = Math.max(...knownRooms.map((room) => room.col))
  const minRow = Math.min(...knownRooms.map((room) => room.row))
  const maxRow = Math.max(...knownRooms.map((room) => room.row))
  const width = (maxCol - minCol + 1) * roomWidth + (maxCol - minCol) * gap + padding * 2
  const height = (maxRow - minRow + 1) * roomHeight + (maxRow - minRow) * gap + padding * 2
  const panelLeft = right !== undefined ? right - width : centerX !== undefined ? centerX - width / 2 : left
  const panelTop = centerY !== undefined ? centerY - height / 2 : top ?? 0
  const position = (room) => ({
    x: panelLeft + padding + (room.col - minCol) * (roomWidth + gap),
    y: panelTop + padding + (room.row - minRow) * (roomHeight + gap),
  })

  ctx.save()
  drawPanel(ctx, panelLeft, panelTop, width, height, scale)
  const connections = getMinimapConnections(floor, currentRoom?.id)
  drawConnections(ctx, connections, position, roomWidth, roomHeight, gap, scale)

  for (const room of knownRooms) {
    const state = getMinimapRoomState(floor, room, currentRoom?.id)
    const { x, y } = position(room)
    drawRoomTile(ctx, x, y, roomWidth, roomHeight, state, scale)

    const icon = ROOM_ICONS[room.type]
    if (icon) drawBitmap(ctx, ICONS[icon], 2 * scale, x + (roomWidth - 16 * scale) / 2, y + (roomHeight - 16 * scale) / 2)
  }

  for (const connection of connections) {
    if (!connection.locked) continue
    const from = position(connection.from)
    const to = position(connection.to)
    const x = (from.x + to.x + roomWidth) / 2
    const y = (from.y + to.y + roomHeight) / 2
    drawBitmap(ctx, ICONS.garfo, 1.5 * scale, x - 6 * scale, y - 6 * scale, true)
  }

  ctx.restore()
}

function drawPanel(ctx, left, top, width, height, scale) {
  ctx.fillStyle = `rgba(20, 8, 6, 0.9)`
  ctx.beginPath()
  ctx.roundRect(left - 2 * scale, top - 2 * scale, width + 4 * scale, height + 4 * scale, 9 * scale)
  ctx.fill()
  ctx.fillStyle = 'rgba(12, 8, 6, 0.78)'
  ctx.beginPath()
  ctx.roundRect(left, top, width, height, 8 * scale)
  ctx.fill()
  ctx.strokeStyle = '#5a4636'
  ctx.lineWidth = Math.max(1, 2 * scale)
  ctx.beginPath()
  ctx.roundRect(left + scale, top + scale, width - 2 * scale, height - 2 * scale, 8 * scale)
  ctx.stroke()
}

function drawConnections(ctx, connections, position, roomWidth, roomHeight, gap, scale) {
  for (const { from, to, visited } of connections) {
    const first = position(from)
    const second = position(to)
    const horizontal = first.y === second.y
    const line = horizontal
      ? { x: first.x + roomWidth, y: first.y + roomHeight / 2 - 3 * scale, width: gap, height: 6 * scale }
      : { x: first.x + roomWidth / 2 - 3 * scale, y: first.y + roomHeight, width: 6 * scale, height: gap }

    ctx.fillStyle = '#140806'
    ctx.fillRect(line.x, line.y, line.width, line.height)
    ctx.fillStyle = visited ? '#8f8a84' : '#4a443e'
    ctx.fillRect(
      line.x + (horizontal ? 0 : scale),
      line.y + (horizontal ? scale : 0),
      line.width - (horizontal ? 0 : 2 * scale),
      line.height - (horizontal ? 2 * scale : 0),
    )
  }
}

function drawRoomTile(ctx, x, y, width, height, state, scale) {
  ctx.fillStyle = '#140806'
  ctx.fillRect(x - scale, y - scale, width + 2 * scale, height + 2 * scale)

  if (state === 'seen') {
    ctx.fillStyle = ROOM_FILL.seen
    ctx.globalAlpha = 0.6
    ctx.fillRect(x, y, width, height)
    ctx.globalAlpha = 1
    ctx.strokeStyle = '#8a847c'
    ctx.lineWidth = Math.max(1, 2 * scale)
    ctx.strokeRect(x + scale, y + scale, width - 2 * scale, height - 2 * scale)
    return
  }

  ctx.fillStyle = ROOM_FILL[state]
  ctx.fillRect(x, y, width, height)
  ctx.fillStyle = state === 'current' ? '#fff' : '#aaa59e'
  ctx.fillRect(x, y, width, scale)
  ctx.fillStyle = state === 'current' ? '#c8c2b6' : '#6e6a64'
  ctx.fillRect(x, y + height - 2 * scale, width, 2 * scale)
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
