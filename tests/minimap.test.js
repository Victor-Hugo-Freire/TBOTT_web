import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { getMinimapConnections, getMinimapRoomState } from '../src/pages/SalaInicial/scene/drawMinimap.js'

const makeRoom = (id, col, row, type = 'comum', visited = false, neighbors = {}) => ({
  id,
  col,
  row,
  type,
  visited,
  cleared: true,
  unlocked: false,
  neighbors: { up: null, right: null, down: null, left: null, ...neighbors },
})

describe('minimapa do andar', () => {
  test('salas desconhecidas ficam ocultas e as vizinhas de uma visitada aparecem só com contorno', () => {
    const start = makeRoom('4-3', 4, 3, 'inicial', true, { right: '5-3' })
    const seen = makeRoom('5-3', 5, 3, 'chefe', false, { left: start.id })
    const hidden = makeRoom('6-3', 6, 3)
    const floor = { rooms: [start, seen, hidden] }

    assert.equal(getMinimapRoomState(floor, seen, start.id), 'seen')
    assert.equal(getMinimapRoomState(floor, hidden, start.id), 'hidden')
  })

  test('a sala atual e as salas visitadas têm estados próprios', () => {
    const current = makeRoom('4-3', 4, 3, 'inicial')
    const visited = makeRoom('5-3', 5, 3, 'comum', true)
    const floor = { rooms: [current, visited] }

    assert.equal(getMinimapRoomState(floor, current, current.id), 'current')
    assert.equal(getMinimapRoomState(floor, visited, current.id), 'visited')
  })

  test('a adega secreta permanece oculta até ser visitada', () => {
    const origin = makeRoom('4-3', 4, 3, 'comum', true)
    const cellar = makeRoom('5-3', 5, 3, 'adega', false, { left: origin.id })
    const floor = { rooms: [origin, cellar] }

    assert.equal(getMinimapRoomState(floor, cellar, origin.id), 'hidden')
    cellar.visited = true
    assert.equal(getMinimapRoomState(floor, cellar, origin.id), 'visited')
  })

  test('a adega descoberta aparece ligada à sala de origem', () => {
    const origin = makeRoom('4-3', 4, 3, 'comum', true)
    const cellar = makeRoom('5-3', 5, 3, 'adega', true, { left: origin.id })
    const floor = { rooms: [origin, cellar] }

    assert.deepEqual(
      getMinimapConnections(floor, origin.id).map(({ from, to }) => [from.id, to.id]),
      [['4-3', '5-3']],
    )
  })

  test('liga salas conhecidas, clareia as já visitadas e marca portas trancadas com garfo', () => {
    const common = makeRoom('4-3', 4, 3, 'inicial', true, { right: '5-3' })
    const treasure = makeRoom('5-3', 5, 3, 'tesouro', false, { left: common.id })
    const floor = { number: 2, rooms: [common, treasure] }
    const [connection] = getMinimapConnections(floor, common.id)

    assert.equal(connection.visited, false)
    assert.equal(connection.locked, true)

    treasure.visited = true
    const [visitedConnection] = getMinimapConnections(floor, common.id)
    assert.equal(visitedConnection.visited, true)
  })

  test('não desenha ligação entre duas salas conhecidas mas ainda não visitadas', () => {
    const start = makeRoom('4-3', 4, 3, 'inicial', true, { right: '5-3' })
    const first = makeRoom('5-3', 5, 3, 'comum', false, { left: start.id, right: '6-3' })
    const second = makeRoom('6-3', 6, 3, 'comum', false, { left: first.id })
    const floor = { rooms: [start, first, second] }

    assert.deepEqual(getMinimapConnections(floor, start.id).map(({ from, to }) => [from.id, to.id]), [['4-3', '5-3']])
  })
})
