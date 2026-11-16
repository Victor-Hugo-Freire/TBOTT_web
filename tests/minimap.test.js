import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { getMinimapRoomState } from '../src/pages/SalaInicial/scene/drawMinimap.js'

describe('minimapa do andar', () => {
  test('salas não visitadas fora da área explorada ficam ocultas', () => {
    const floor = {
      rooms: [
        { id: '4-3', type: 'inicial', visited: true, neighbors: { up: null, right: '5-3', down: null, left: null } },
        { id: '5-3', type: 'comum', visited: false, neighbors: { up: null, right: null, down: null, left: '4-3' } },
        { id: '6-3', type: 'comum', visited: false, neighbors: { up: null, right: null, down: null, left: null } },
      ],
    }

    assert.equal(getMinimapRoomState(floor, floor.rooms[2], floor.rooms[0].id), 'hidden')
  })

  test('uma sala vizinha de uma visitada aparece em silhueta', () => {
    const floor = {
      rooms: [
        { id: '4-3', type: 'inicial', visited: true, neighbors: { up: null, right: '5-3', down: null, left: null } },
        { id: '5-3', type: 'comum', visited: false, neighbors: { up: null, right: null, down: null, left: '4-3' } },
      ],
    }

    assert.equal(getMinimapRoomState(floor, floor.rooms[1], floor.rooms[0].id), 'silhouette')
  })

  test('salas especiais vizinhas ficam demarcadas por tipo', () => {
    const floor = {
      rooms: [
        { id: '4-3', type: 'inicial', visited: true, neighbors: { up: null, right: '5-3', down: null, left: null } },
        { id: '5-3', type: 'chefe', visited: false, neighbors: { up: null, right: null, down: null, left: '4-3' } },
      ],
    }

    assert.equal(getMinimapRoomState(floor, floor.rooms[1], floor.rooms[0].id), 'special')
  })

  test('a adega secreta permanece oculta mesmo ao lado de uma sala visitada', () => {
    const floor = {
      rooms: [
        { id: '4-3', type: 'comum', visited: true, neighbors: { up: null, right: null, down: null, left: null } },
        { id: '5-3', type: 'adega', visited: false, neighbors: { up: null, right: null, down: null, left: '4-3' } },
      ],
    }

    assert.equal(getMinimapRoomState(floor, floor.rooms[1], floor.rooms[0].id), 'hidden')
  })
})
