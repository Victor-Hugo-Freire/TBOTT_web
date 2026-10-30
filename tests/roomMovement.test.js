import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import {
  getRoomMovement,
  moveRoomPlayer,
  ROOM_PLAYER_BOUNDS,
  ROOM_PLAYER_SPEED,
  shouldReturnToMenu,
} from '../src/utils/roomMovement.js'

describe('shouldReturnToMenu (tecla de retorno provisório)', () => {
  test('reconhece Escape sem diferenciar maiúsculas de minúsculas', () => {
    assert.equal(shouldReturnToMenu('Escape'), true)
    assert.equal(shouldReturnToMenu('escape'), true)
  })

  test('não confunde a tecla Esc com outras teclas', () => {
    assert.equal(shouldReturnToMenu('Esc'), false)
    assert.equal(shouldReturnToMenu('Enter'), false)
    assert.equal(shouldReturnToMenu(undefined), false)
  })
})

describe('getRoomMovement (controles da sala)', () => {
  test('WASD produzem o movimento nas quatro direções', () => {
    assert.deepEqual(getRoomMovement(new Set(['w'])), { x: 0, y: -1 })
    assert.deepEqual(getRoomMovement(new Set(['a'])), { x: -1, y: 0 })
    assert.deepEqual(getRoomMovement(new Set(['s'])), { x: 0, y: 1 })
    assert.deepEqual(getRoomMovement(new Set(['d'])), { x: 1, y: 0 })
  })

  test('as setas não movem o personagem', () => {
    assert.deepEqual(getRoomMovement(new Set(['arrowup', 'arrowleft'])), { x: 0, y: 0 })
    assert.deepEqual(getRoomMovement(new Set(['arrowdown', 'arrowright'])), { x: 0, y: 0 })
  })

  test('combina teclas diagonais sem aumentar a velocidade', () => {
    const movement = getRoomMovement(new Set(['w', 'd']))
    assert.ok(Math.abs(Math.hypot(movement.x, movement.y) - 1) < 0.000001)
    assert.ok(movement.x > 0)
    assert.ok(movement.y < 0)
  })

  test('teclas opostas se anulam', () => {
    assert.deepEqual(getRoomMovement(new Set(['w', 's'])), { x: 0, y: 0 })
    assert.deepEqual(getRoomMovement(new Set(['a', 'd'])), { x: 0, y: 0 })
  })
})

describe('moveRoomPlayer (colisão com as bordas)', () => {
  test('mantém o personagem dentro do piso sem entrar nas paredes laterais ou no rodapé', () => {
    assert.deepEqual(ROOM_PLAYER_BOUNDS, {
      minX: 25,
      maxX: 1050,
      minY: 200,
      maxY: 570,
    })
  })

  test('move respeitando velocidade e tempo transcorrido', () => {
    const next = moveRoomPlayer({ x: 500, y: 400 }, { x: 1, y: 0 }, 0.02)
    assert.deepEqual(next, { x: 500 + ROOM_PLAYER_SPEED * 0.02, y: 400 })
  })

  test('não atravessa os limites laterais ou as paredes', () => {
    const left = moveRoomPlayer(
      { x: ROOM_PLAYER_BOUNDS.minX, y: 400 },
      { x: -1, y: 0 },
      0.05,
    )
    const right = moveRoomPlayer(
      { x: ROOM_PLAYER_BOUNDS.maxX, y: 400 },
      { x: 1, y: 0 },
      0.05,
    )
    const top = moveRoomPlayer(
      { x: 500, y: ROOM_PLAYER_BOUNDS.minY },
      { x: 0, y: -1 },
      0.05,
    )
    const bottom = moveRoomPlayer(
      { x: 500, y: ROOM_PLAYER_BOUNDS.maxY },
      { x: 0, y: 1 },
      0.05,
    )

    assert.equal(left.x, ROOM_PLAYER_BOUNDS.minX)
    assert.equal(right.x, ROOM_PLAYER_BOUNDS.maxX)
    assert.equal(top.y, ROOM_PLAYER_BOUNDS.minY)
    assert.equal(bottom.y, ROOM_PLAYER_BOUNDS.maxY)
  })

  test('limita deltas longos para evitar saltos após uma pausa', () => {
    const next = moveRoomPlayer({ x: 500, y: 400 }, { x: 1, y: 0 }, 1)
    assert.equal(next.x, 500 + ROOM_PLAYER_SPEED * 0.05)
  })
})
