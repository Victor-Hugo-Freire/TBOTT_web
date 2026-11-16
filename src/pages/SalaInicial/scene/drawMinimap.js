import { FLOOR_COLS, FLOOR_ROWS, getRoomId, SPECIAL_ROOM_TYPES } from '../../../utils/floorGenerator.js'

const ROOM_LETTERS = {
  inicial: 'I',
  comum: '.',
  chefe: 'C',
  tesouro: 'T',
  loja: 'L',
  palco: 'P',
  fliperama: 'F',
  descanso: 'D',
  adega: 'A',
  pacto: 'X',
  god: 'G',
}

const SPECIAL_ROOM_COLORS = {
  chefe: { fill: '#f0a0a0', stroke: '#c83e49', text: '#49151a' },
  tesouro: { fill: '#ffe28a', stroke: '#d49a16', text: '#503900' },
  loja: { fill: '#9ed5ff', stroke: '#3685c4', text: '#123b5b' },
  palco: { fill: '#d4a9ff', stroke: '#8b52c5', text: '#351854' },
  fliperama: { fill: '#99e8d0', stroke: '#269b7e', text: '#104a3c' },
  descanso: { fill: '#ffb8d2', stroke: '#cf5c8b', text: '#581d37' },
  adega: { fill: '#c4b8a5', stroke: '#77634b', text: '#35291c' },
  pacto: { fill: '#b5a5ff', stroke: '#6752c4', text: '#251a56' },
  god: { fill: '#fff2a8', stroke: '#d3b52c', text: '#51450b' },
}

export function getMinimapRoomState(floor, room, currentRoomId) {
  if (!room) return 'hidden'
  if (room.id === currentRoomId) return 'current'
  if (room.visited) return 'visited'
  if (room.type === 'adega') return 'hidden'

  const adjacentToVisited = Object.values(room.neighbors).some((neighborId) => {
    if (!neighborId) return false
    const neighbor = floor.rooms.find((item) => item.id === neighborId)
    return neighbor?.visited
  })

  if (!adjacentToVisited) return 'hidden'
  return SPECIAL_ROOM_TYPES.includes(room.type) ? 'special' : 'silhouette'
}

export function drawMinimap(ctx, floor, currentRoom, { left, top, cell, padding = 0 }) {
  const mapWidth = FLOOR_COLS * cell
  const mapHeight = FLOOR_ROWS * cell
  const rectWidth = mapWidth + padding * 2
  const rectHeight = mapHeight + padding * 2

  ctx.save()
  ctx.fillStyle = 'rgba(6, 9, 12, 0.75)'
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)'
  ctx.fillRect(left, top, rectWidth, rectHeight)
  ctx.strokeRect(left, top, rectWidth, rectHeight)

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  for (let row = 0; row < FLOOR_ROWS; row++) {
    for (let col = 0; col < FLOOR_COLS; col++) {
      const room = floor.rooms.find((item) => item.id === getRoomId(col, row))
      const state = getMinimapRoomState(floor, room, currentRoom?.id)
      if (state === 'hidden') continue

      const x = left + padding + col * cell
      const y = top + padding + row * cell
      const inset = 1

      if (state === 'silhouette') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.16)'
        ctx.fillRect(x + inset, y + inset, cell - inset * 2, cell - inset * 2)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.32)'
        ctx.strokeRect(x + inset, y + inset, cell - inset * 2, cell - inset * 2)
        continue
      }

      const specialColors = SPECIAL_ROOM_COLORS[room.type]
      if (specialColors && state !== 'silhouette') {
        ctx.fillStyle = specialColors.fill
        ctx.fillRect(x + inset, y + inset, cell - inset * 2, cell - inset * 2)
        ctx.strokeStyle = specialColors.stroke
        ctx.lineWidth = Math.max(1, Math.round(cell * 0.08))
        ctx.strokeRect(x + inset, y + inset, cell - inset * 2, cell - inset * 2)
      } else {
        ctx.fillStyle = state === 'current' ? '#e7c14d' : 'rgba(255, 255, 255, 0.96)'
        ctx.fillRect(x + inset, y + inset, cell - inset * 2, cell - inset * 2)
      }

      if (state === 'current' && !specialColors) {
        ctx.fillStyle = '#0a0d12'
      } else if (specialColors) {
        ctx.fillStyle = specialColors.text
      } else {
        ctx.fillStyle = '#40464f'
      }
      ctx.font = `${Math.max(8, Math.round(cell * 0.55))}px monospace`
      ctx.fillText(ROOM_LETTERS[room.type] ?? '', x + cell / 2, y + cell / 2)
      if (state === 'current') {
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = Math.max(1, Math.round(cell * 0.1))
        ctx.strokeRect(x + inset, y + inset, cell - inset * 2, cell - inset * 2)
      }
    }
  }

  ctx.restore()
}
