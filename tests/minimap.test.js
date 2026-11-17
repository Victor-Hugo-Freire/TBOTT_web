import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { drawMinimap, getMinimapBounds, getMinimapConnections, getMinimapLayout, getMinimapRoomState } from '../src/pages/SalaInicial/scene/drawMinimap.js'

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

  test('a caixa do painel cobre as salas dadas, sem sobra', () => {
    const rooms = [makeRoom('4-3', 4, 3), makeRoom('5-3', 5, 3), makeRoom('5-5', 5, 5)]

    assert.deepEqual(getMinimapBounds(rooms), { cols: 2, rows: 3, minCol: 4, minRow: 3 })
  })

  // Desenha com um canvas de mentira e devolve o tamanho do painel (o 2º roundRect é o painel por dentro)
  function getPanelSize(floor, currentRoom, options) {
    const panels = []
    const noop = () => {}
    const ctx = {
      save: noop, restore: noop, beginPath: noop, fill: noop, stroke: noop, fillRect: noop, strokeRect: noop, rect: noop, clip: noop,
      roundRect: (x, y, width, height) => panels.push({ width, height }),
    }
    drawMinimap(ctx, floor, currentRoom, { right: 1000, top: 0, scale: 1, ...options })
    return panels[1]
  }

  test('o quadro normal acompanha o mapa conhecido (de 3 x 3 a 7 x 7) e o Tab fica justo nas salas', () => {
    const start = makeRoom('4-3', 4, 3, 'inicial', true, { right: '5-3' })
    const next = makeRoom('5-3', 5, 3, 'comum', false, { left: start.id, right: '6-3' })
    const far = makeRoom('6-3', 6, 3, 'comum', false, { left: next.id, down: '6-4' })
    const farDown = makeRoom('6-4', 6, 4, 'comum', false, { up: far.id })
    const floor = { rooms: [start, next, far, farDown] }

    // Começo do andar: mapa pequeno, quadro mínimo de 3 x 3 (3 * 30 + 2 * 4 + 2 * 8 por 3 * 24 + 2 * 4 + 2 * 8)
    const small = { width: 114, height: 96 }
    assert.deepEqual(getPanelSize(floor, start, {}), small)
    next.visited = true
    far.visited = true
    assert.deepEqual(getPanelSize(floor, far, {}), small)

    // Tab: só as salas conhecidas, 3 x 2 (a de baixo ainda é vizinha de uma visitada, então aparece)
    assert.deepEqual(getPanelSize(floor, far, { expanded: true }), { width: 114, height: 68 })
    farDown.type = 'adega' // adega ainda não visitada: fica oculta e não conta
    assert.deepEqual(getPanelSize(floor, far, { expanded: true }), { width: 114, height: 40 })
    assert.deepEqual(getPanelSize(floor, far, {}), small)

    // Mapa comprido: o quadro para em 7 colunas (7 * 30 + 6 * 4 + 2 * 8)
    const wide = [0, 1, 2, 3, 4, 5, 6, 7, 8].map((col) => makeRoom(`${col}-3`, col, 3, 'comum', true))
    assert.deepEqual(getPanelSize({ rooms: wide }, wide[0], {}), { width: 250, height: 96 })
  })

  test('no quadro normal as salas conhecidas ficam centralizadas; mapa comprido demais segue a sala atual', () => {
    const known = [makeRoom('4-3', 4, 3), makeRoom('5-3', 5, 3), makeRoom('6-3', 6, 3)]

    // 3 colunas cabem certinho; 1 linha num quadro de 3: sobra uma em cima e uma embaixo
    assert.deepEqual(getMinimapLayout(known, known[0], false), { cols: 3, rows: 3, startCol: 4, startRow: 2 })

    const square = [makeRoom('2-1', 2, 1), makeRoom('6-5', 6, 5)]
    assert.deepEqual(getMinimapLayout(square, square[0], false), { cols: 5, rows: 5, startCol: 2, startRow: 1 })

    const wide = [0, 1, 2, 3, 4, 5, 6, 7, 8].map((col) => makeRoom(`${col}-3`, col, 3))
    assert.equal(getMinimapLayout(wide, wide[8], false).startCol, 5) // a sala atual (coluna 8) no meio
    assert.deepEqual(getMinimapLayout(known, known[0], true), { cols: 3, rows: 1, startCol: 4, startRow: 3 })
  })

  test('o painel nunca passa de maxWidth e maxHeight', () => {
    const room = makeRoom('4-3', 4, 3, 'inicial', true)
    const size = getPanelSize({ rooms: [room] }, room, { scale: 10, maxWidth: 100, maxHeight: 100 })

    assert.ok(size.width <= 100 && size.height <= 100)
  })

  test('não desenha ligação entre duas salas conhecidas mas ainda não visitadas', () => {
    const start = makeRoom('4-3', 4, 3, 'inicial', true, { right: '5-3' })
    const first = makeRoom('5-3', 5, 3, 'comum', false, { left: start.id, right: '6-3' })
    const second = makeRoom('6-3', 6, 3, 'comum', false, { left: first.id })
    const floor = { rooms: [start, first, second] }

    assert.deepEqual(getMinimapConnections(floor, start.id).map(({ from, to }) => [from.id, to.id]), [['4-3', '5-3']])
  })
})
